import express from 'express';
import { Claim } from '../models/Claim';
import { triggerAgentEscalation } from '../services/escalationService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/v1/escalation/request-agent
 * Request agent escalation with confirmation levels
 */
router.post('/request-agent', async (req, res, next) => {
    try {
        const { claimId, reason, confirmationLevel = 1 } = req.body;

        if (!claimId) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_CLAIM_ID',
                    message: 'Claim ID is required'
                }
            });
        }

        const claim = await Claim.findById(claimId).populate('user');
        if (!claim) {
            return res.status(404).json({
                error: {
                    code: 'CLAIM_NOT_FOUND',
                    message: 'Claim not found'
                }
            });
        }

        // Update escalation tracking
        if (!claim.escalation) {
            claim.escalation = {
                requestedAt: new Date(),
                confirmationLevel: 1,
                transferReason: reason || 'User requested assistance'
            };
        }

        claim.escalation.confirmationLevel = confirmationLevel;

        // Handle confirmation levels
        let responseMessage = '';
        let nextAction = '';

        switch (confirmationLevel) {
            case 1:
                responseMessage = 'I understand you need help. Let me try to assist you first with AI support.';
                nextAction = 'ai_assistance';
                break;
                
            case 2:
                responseMessage = 'If AI assistance wasn\'t helpful, I can connect you to a human agent. This may take 5-7 minutes. Would you like to proceed?';
                nextAction = 'agent_confirmation';
                break;
                
                        case 3: {
                responseMessage = 'Connecting you to a human agent now. Please note that you\'ll lose the current AI context.';
                nextAction = 'agent_transfer';
                
                // Trigger actual agent escalation
                const _populatedUser = claim.user as any; // User is populated
                await triggerAgentEscalation((claim._id as string).toString(), claim.escalation.transferReason, 'critical');
                
                claim.escalation.confirmedAt = new Date();
                break;
            }
                
            default:
                return res.status(400).json({
                    error: {
                        code: 'INVALID_CONFIRMATION_LEVEL',
                        message: 'Confirmation level must be 1, 2, or 3'
                    }
                });
        }

        claim.processingSteps.push({
            step: `escalation_level_${confirmationLevel}`,
            completedAt: new Date(),
            success: true,
            details: { reason, confirmationLevel }
        });

        await claim.save();

        logger.info(`Escalation level ${confirmationLevel} for claim: ${claimId}`);

        res.json({
            status: 'success',
            data: {
                claimId: claim._id,
                confirmationLevel,
                message: responseMessage,
                nextAction,
                escalationStatus: claim.escalation,
                estimatedWaitTime: confirmationLevel === 3 ? '5-7 minutes' : null
            }
        });

    } catch (error) {
        logger.error('Escalation request error:', error);
        next(error);
    }
});

/**
 * POST /api/v1/escalation/ai-chat
 * Handle AI chatbot interactions before agent escalation
 */
router.post('/ai-chat', async (req, res, next) => {
    try {
        const { claimId, message, chatHistory = [] } = req.body;

        if (!claimId || !message) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'Claim ID and message are required'
                }
            });
        }

        const claim = await Claim.findById(claimId);
        if (!claim) {
            return res.status(404).json({
                error: {
                    code: 'CLAIM_NOT_FOUND',
                    message: 'Claim not found'
                }
            });
        }

        // Simple AI response logic (in production, this would integrate with Dialogflow)
        const aiResponse = generateAIResponse(message, claim, chatHistory);

        res.json({
            status: 'success',
            data: {
                response: aiResponse,
                suggestions: [
                    'Check claim status',
                    'Upload additional documents',
                    'Speak to human agent',
                    'Update claim details'
                ],
                canEscalate: true
            }
        });

    } catch (error) {
        logger.error('AI chat error:', error);
        next(error);
    }
});

/**
 * GET /api/v1/escalation/agent-availability
 * Check current agent availability
 */
router.get('/agent-availability', async (req, res) => {
    try {
        // Mock agent availability (in production, this would check real agent status)
        const currentHour = new Date().getHours();
        const isBusinessHours = currentHour >= 9 && currentHour <= 18;
        
        const availability = {
            available: isBusinessHours,
            estimatedWaitTime: isBusinessHours ? '5-7 minutes' : '2-4 hours',
            nextAvailableSlot: isBusinessHours ? 
                'Now' : 
                new Date(new Date().setHours(9, 0, 0, 0) + 24 * 60 * 60 * 1000).toISOString(),
            businessHours: '9:00 AM - 6:00 PM IST'
        };

        res.json({
            status: 'success',
            data: availability
        });

    } catch (error) {
        logger.error('Agent availability check error:', error);
        res.status(500).json({
            error: {
                code: 'AVAILABILITY_CHECK_FAILED',
                message: 'Unable to check agent availability'
            }
        });
    }
});

// Helper function to generate AI responses
function generateAIResponse(message: string, claim: any, _chatHistory: any[]): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('status')) {
        return `Your claim ${claim._id} is currently ${claim.status}. ${getStatusDescription(claim.status)}`;
    }
    
    if (lowerMessage.includes('document') || lowerMessage.includes('upload')) {
        return 'You can upload additional documents through the claim portal. Supported formats are JPG, PNG, and PDF up to 10MB.';
    }
    
    if (lowerMessage.includes('amount') || lowerMessage.includes('payout')) {
        return claim.simulation ? 
            `Based on our analysis, your approved amount would be ₹${claim.simulation.approvedAmount}. ${claim.simulation.gaps.length > 0 ? 'Some gaps were identified that may affect the final amount.' : ''}` :
            'Let me run a quick analysis on your claim amount and get back to you.';
    }
    
    if (lowerMessage.includes('time') || lowerMessage.includes('how long')) {
        return 'Most claims are processed within 3-5 business days. Complex cases may take up to 7 days.';
    }
    
    return 'I understand your concern. Let me help you with that. Could you please provide more details about what specifically you need assistance with?';
}

function getStatusDescription(status: string): string {
    const descriptions: { [key: string]: string } = {
        'PENDING': 'We are currently reviewing your claim.',
        'APPROVED': 'Congratulations! Your claim has been approved.',
        'REJECTED': 'Unfortunately, your claim has been rejected. You can appeal this decision.',
        'FRAUD_REVIEW': 'Your claim is under additional review for verification.',
        'MANUAL_REVIEW': 'Your claim requires manual review by our team.'
    };
    
    return descriptions[status] || 'Status information is being updated.';
}

export default router;
