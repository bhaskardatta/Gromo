import express from 'express';
import { DialogflowCopilotService } from '../services/dialogflowCopilotService';
import { authMiddleware } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';
import { validateRequest } from '../middleware/validationMiddleware';
import { body, param } from 'express-validator';

const router = express.Router();

/**
 * @route POST /api/copilot/chat
 * @desc Process user message through AI copilot
 * @access Private
 */
router.post('/chat',
    authMiddleware,
    [
        body('message').notEmpty().withMessage('Message is required'),
        body('sessionId').optional().isString(),
        body('languageCode').optional().isIn(['en', 'hi', 'te', 'ta']).withMessage('Invalid language code'),
        body('claimContext').optional().isObject()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { message, sessionId, languageCode = 'en', claimContext } = req.body;
            const userId = req.user?.id;

            logger.info(`Processing copilot chat for user ${userId}: ${message}`);

            // Get existing conversation context
            const existingContext = DialogflowCopilotService.getConversationContext(userId);

            // Prepare Dialogflow configuration
            const dialogflowConfig = {
                projectId: process.env.GOOGLE_PROJECT_ID || 'gromo-copilot',
                sessionId: sessionId || existingContext?.sessionId || `session_${userId}_${Date.now()}`,
                languageCode
            };

            // Process query through Dialogflow
            const dialogflowResponse = await DialogflowCopilotService.processQuery(
                message,
                dialogflowConfig,
                existingContext
            );

            // Update conversation context
            await DialogflowCopilotService.updateConversationContext(
                userId,
                message,
                dialogflowResponse.fulfillmentText,
                dialogflowResponse.intentName,
                dialogflowResponse.confidence,
                claimContext
            );

            // Get updated context for suggestions
            const updatedContext = DialogflowCopilotService.getConversationContext(userId);
            const suggestions = updatedContext ? 
                DialogflowCopilotService.generateSmartSuggestions(updatedContext) : [];

            res.json({
                success: true,
                data: {
                    response: dialogflowResponse.fulfillmentText,
                    intent: dialogflowResponse.intentName,
                    confidence: dialogflowResponse.confidence,
                    suggestions,
                    sessionId: dialogflowConfig.sessionId,
                    contexts: dialogflowResponse.contexts,
                    followupIntents: dialogflowResponse.followupIntents,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Error processing copilot chat:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process chat message'
            });
        }
    }
);

/**
 * @route GET /api/copilot/conversation/:sessionId
 * @desc Get conversation history
 * @access Private
 */
router.get('/conversation/:sessionId',
    authMiddleware,
    [
        param('sessionId').notEmpty().withMessage('Session ID is required')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const userId = req.user?.id;
            const context = DialogflowCopilotService.getConversationContext(userId);

            if (!context) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversation not found'
                });
            }

            res.json({
                success: true,
                data: {
                    sessionId: context.sessionId,
                    userId: context.userId,
                    conversationHistory: context.conversationHistory,
                    userPreferences: context.userPreferences,
                    claimContext: context.claimContext
                }
            });

        } catch (error) {
            logger.error('Error fetching conversation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch conversation'
            });
        }
    }
);

/**
 * @route POST /api/copilot/suggestions
 * @desc Get smart suggestions based on context
 * @access Private
 */
router.post('/suggestions',
    authMiddleware,
    async (req, res) => {
        try {
            const userId = req.user?.id;
            const context = DialogflowCopilotService.getConversationContext(userId);

            if (!context) {
                // Return default suggestions for new users
                return res.json({
                    success: true,
                    data: {
                        suggestions: [
                            'Submit new claim',
                            'Check claim status',
                            'Upload documents',
                            'Get help'
                        ]
                    }
                });
            }

            const suggestions = DialogflowCopilotService.generateSmartSuggestions(context);

            res.json({
                success: true,
                data: { suggestions }
            });

        } catch (error) {
            logger.error('Error generating suggestions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate suggestions'
            });
        }
    }
);

/**
 * @route PUT /api/copilot/preferences
 * @desc Update user preferences for copilot
 * @access Private
 */
router.put('/preferences',
    authMiddleware,
    [
        body('language').optional().isIn(['en', 'hi', 'te', 'ta']),
        body('communicationStyle').optional().isIn(['formal', 'casual', 'technical']),
        body('preferredChannel').optional().isIn(['text', 'voice', 'whatsapp'])
    ],
    validateRequest,
    async (req, res) => {
        try {
            const userId = req.user?.id;
            const { language, communicationStyle, preferredChannel } = req.body;

            let context = DialogflowCopilotService.getConversationContext(userId);

            if (!context) {
                // Create new context if it doesn't exist
                context = {
                    userId,
                    sessionId: `session_${userId}_${Date.now()}`,
                    conversationHistory: [],
                    userPreferences: {
                        language: language || 'en',
                        communicationStyle: communicationStyle || 'casual',
                        preferredChannel: preferredChannel || 'text'
                    }
                };
            } else {
                // Update existing preferences
                if (language) context.userPreferences.language = language;
                if (communicationStyle) context.userPreferences.communicationStyle = communicationStyle;
                if (preferredChannel) context.userPreferences.preferredChannel = preferredChannel;
            }

            // Update the context in store
            await DialogflowCopilotService.updateConversationContext(
                userId,
                'preferences_updated',
                'Preferences updated successfully',
                'system.preferences_update',
                1.0
            );

            res.json({
                success: true,
                data: {
                    message: 'Preferences updated successfully',
                    preferences: context.userPreferences
                }
            });

        } catch (error) {
            logger.error('Error updating preferences:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update preferences'
            });
        }
    }
);

/**
 * @route DELETE /api/copilot/conversation
 * @desc Clear conversation history
 * @access Private
 */
router.delete('/conversation',
    authMiddleware,
    async (req, res) => {
        try {
            const userId = req.user?.id;
            
            // Clear conversation context
            const context = DialogflowCopilotService.getConversationContext(userId);
            if (context) {
                context.conversationHistory = [];
                await DialogflowCopilotService.updateConversationContext(
                    userId,
                    'conversation_cleared',
                    'Conversation history cleared',
                    'system.conversation_clear',
                    1.0
                );
            }

            res.json({
                success: true,
                data: {
                    message: 'Conversation history cleared successfully'
                }
            });

        } catch (error) {
            logger.error('Error clearing conversation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to clear conversation'
            });
        }
    }
);

/**
 * @route POST /api/copilot/escalate
 * @desc Escalate conversation to human agent
 * @access Private
 */
router.post('/escalate',
    authMiddleware,
    [
        body('reason').notEmpty().withMessage('Escalation reason is required'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
        body('sessionId').optional().isString()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const userId = req.user?.id;
            const { reason, priority = 'medium', sessionId } = req.body;

            logger.info(`Escalating conversation for user ${userId}: ${reason}`);

            // Get conversation context
            const context = DialogflowCopilotService.getConversationContext(userId);

            // Create escalation record (this would typically go to a human agent system)
            const escalationData = {
                userId,
                sessionId: sessionId || context?.sessionId,
                reason,
                priority,
                conversationHistory: context?.conversationHistory || [],
                claimContext: context?.claimContext,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };

            // Update conversation context
            await DialogflowCopilotService.updateConversationContext(
                userId,
                `escalate: ${reason}`,
                `Your request has been escalated to our support team. A specialist will contact you within ${priority === 'urgent' ? '1 hour' : priority === 'high' ? '2 hours' : '4 hours'}.`,
                'support.escalate',
                0.95,
                context?.claimContext
            );

            res.json({
                success: true,
                data: {
                    message: 'Your request has been escalated successfully',
                    escalationId: `ESC_${Date.now()}`,
                    expectedContactTime: priority === 'urgent' ? '1 hour' : priority === 'high' ? '2 hours' : '4 hours',
                    escalationData
                }
            });

        } catch (error) {
            logger.error('Error escalating conversation:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to escalate conversation'
            });
        }
    }
);

// Cleanup old contexts periodically
setInterval(() => {
    DialogflowCopilotService.cleanupOldContexts();
}, 60 * 60 * 1000); // Every hour

export default router;
