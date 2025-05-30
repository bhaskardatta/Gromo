import express from 'express';
import { simulateClaim } from '../services/fraudDetectionService';
import { Claim } from '../models/Claim';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/v1/simulation/evaluate-claim
 * Evaluate claim for fraud detection and auto-approval
 */
router.post('/evaluate-claim', async (req, res, next) => {
    try {
        const { claimId } = req.body;

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

        logger.info(`Evaluating claim for fraud: ${claimId}`);

        // Run fraud detection simulation
        const simulationResult = await simulateClaim(claim);

        // Update claim with simulation results
        claim.simulation = simulationResult;
        claim.status = simulationResult.autoApproved ? 'APPROVED' : 
                      simulationResult.fraudScore > 0.7 ? 'FRAUD_REVIEW' : 
                      'MANUAL_REVIEW';

        claim.processingSteps.push({
            step: 'fraud_evaluation',
            completedAt: new Date(),
            success: true,
            details: {
                fraudScore: simulationResult.fraudScore,
                rulesTriggered: simulationResult.rulesTriggered,
                autoApproved: simulationResult.autoApproved
            }
        });

        await claim.save();

        res.json({
            status: 'success',
            data: {
                claimId: claim._id,
                simulation: simulationResult,
                newStatus: claim.status,
                recommendation: simulationResult.autoApproved ? 
                    'auto_approve' : 
                    simulationResult.fraudScore > 0.7 ? 
                        'manual_review_high_risk' : 
                        'manual_review_standard'
            }
        });

    } catch (error) {
        logger.error('Claim simulation error:', error);
        next(error);
    }
});

/**
 * POST /api/v1/simulation/calculate-payout
 * Calculate potential payout amount based on claim data
 */
router.post('/calculate-payout', async (req, res, next) => {
    try {
        const { claimData } = req.body;

        if (!claimData) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_CLAIM_DATA',
                    message: 'Claim data is required'
                }
            });
        }

        // Base payout calculation
        let calculatedAmount = 0;
        const gaps = [];
        const deductions = [];

        // Calculate based on claim type
        switch (claimData.type) {
            case 'medical':
                calculatedAmount = calculateMedicalPayout(claimData);
                break;
            case 'accident':
                calculatedAmount = calculateAccidentPayout(claimData);
                break;
            case 'pharmacy':
                calculatedAmount = calculatePharmacyPayout(claimData);
                break;
            default:
                calculatedAmount = claimData.amount * 0.8; // Default 80% coverage
        }

        // Check for common gaps
        if (!claimData.claimDetails?.description) {
            gaps.push('Missing incident description');
        }
        if (!claimData.documents?.length) {
            gaps.push('No supporting documents provided');
        }
        if (!claimData.claimDetails?.location) {
            gaps.push('Incident location not specified');
        }

        // Apply deductions for gaps
        if (gaps.length > 0) {
            const deductionPercentage = Math.min(gaps.length * 0.1, 0.3); // Max 30% deduction
            const deductionAmount = calculatedAmount * deductionPercentage;
            calculatedAmount -= deductionAmount;
            deductions.push({
                reason: 'Missing information',
                amount: deductionAmount,
                percentage: deductionPercentage * 100
            });
        }

        res.json({
            status: 'success',
            data: {
                originalAmount: claimData.amount,
                calculatedAmount: Math.round(calculatedAmount),
                coverage: Math.round((calculatedAmount / claimData.amount) * 100),
                gaps,
                deductions,
                recommendation: gaps.length === 0 ? 
                    'ready_for_approval' : 
                    'requires_additional_information'
            }
        });

    } catch (error) {
        logger.error('Payout calculation error:', error);
        next(error);
    }
});

// Helper functions for payout calculations
function calculateMedicalPayout(claimData: any): number {
    const baseAmount = claimData.amount;
    const maxCoverage = 100000; // ₹1 lakh max per claim
    
    return Math.min(baseAmount * 0.9, maxCoverage); // 90% coverage up to max
}

function calculateAccidentPayout(claimData: any): number {
    const baseAmount = claimData.amount;
    const severity = claimData.claimDetails?.severity || 'medium';
    
    const multipliers: { [key: string]: number } = {
        low: 0.7,
        medium: 0.8,
        high: 0.95
    };
    
    return baseAmount * (multipliers[severity] || 0.8);
}

function calculatePharmacyPayout(claimData: any): number {
    const baseAmount = claimData.amount;
    const maxCoverage = 25000; // ₹25k max for pharmacy claims
    
    return Math.min(baseAmount * 0.8, maxCoverage); // 80% coverage up to max
}

export default router;
