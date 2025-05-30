import { IClaim } from '../models/Claim';
import { FraudService } from './fraudService';

export class FraudDetectionService {
    private fraudService: FraudService;

    constructor() {
        this.fraudService = new FraudService();
    }

    /**
     * Simulate claim processing with fraud detection
     */
    async simulateClaim(claimData: Partial<IClaim>): Promise<{
        approved: boolean;
        approvedAmount: number;
        gaps: string[];
        rulesTriggered: string[];
        fraudScore: number;
        autoApproved: boolean;
        recommendations: string[];
    }> {
        try {
            // Create a temporary claim object for simulation
            const mockClaim = {
                ...claimData,
                _id: 'simulation',
                user: claimData.user || 'simulation_user',
                createdAt: new Date(),
                updatedAt: new Date()
            } as IClaim;

            // Run fraud detection
            const fraudResult = await FraudService.analyzeFraud(mockClaim);
            
            // Calculate approved amount based on fraud score
            const baseAmount = claimData.estimatedAmount || claimData.amount || 0;
            const fraudScore = fraudResult.fraudScore;
            
            let approvedAmount = 0;
            let approved = false;
            let autoApproved = false;
            const gaps: string[] = [];
            const rulesTriggered: string[] = [];
            const recommendations: string[] = [];

            // Determine approval based on fraud score and rules
            if (fraudScore < 30) {
                approved = true;
                autoApproved = true;
                approvedAmount = baseAmount;
                recommendations.push('Low risk claim - auto-approved');
            } else if (fraudScore < 60) {
                approved = true;
                autoApproved = false;
                approvedAmount = Math.floor(baseAmount * 0.8); // 80% of claimed amount
                recommendations.push('Medium risk - manual review recommended');
                rulesTriggered.push('MEDIUM_RISK_REVIEW');
            } else {
                approved = false;
                autoApproved = false;
                approvedAmount = 0;
                recommendations.push('High risk claim - requires investigation');
                rulesTriggered.push('HIGH_RISK_REJECTION');
            }

            // Check for documentation gaps
            if (!claimData.documents || claimData.documents.length === 0) {
                gaps.push('Missing supporting documents');
                rulesTriggered.push('MISSING_DOCUMENTS');
            }

            if (!claimData.description || claimData.description.length < 20) {
                gaps.push('Insufficient claim description');
                rulesTriggered.push('INSUFFICIENT_DESCRIPTION');
            }

            if (!claimData.claimDetails?.incidentDate) {
                gaps.push('Missing incident date');
                rulesTriggered.push('MISSING_INCIDENT_DATE');
            }

            // Voice data analysis
            if (claimData.voiceData) {
                if (claimData.voiceData.confidence < 0.7) {
                    gaps.push('Low voice recognition confidence');
                    rulesTriggered.push('LOW_VOICE_CONFIDENCE');
                }
            } else {
                gaps.push('No voice data provided');
            }

            // Amount validation
            if (baseAmount > 50000) {
                rulesTriggered.push('HIGH_AMOUNT_REVIEW');
                recommendations.push('High amount claim requires senior review');
            }

            // Add recommendations based on gaps
            if (gaps.length > 0) {
                recommendations.push(`Address ${gaps.length} documentation gap(s)`);
            }

            if (fraudResult.riskFactors.length > 0) {
                recommendations.push(`Review ${fraudResult.riskFactors.length} risk factor(s)`);
            }

            return {
                approved,
                approvedAmount,
                gaps,
                rulesTriggered,
                fraudScore,
                autoApproved,
                recommendations
            };

        } catch (error) {
            console.error('Error in claim simulation:', error);
            return {
                approved: false,
                approvedAmount: 0,
                gaps: ['Simulation error occurred'],
                rulesTriggered: ['SYSTEM_ERROR'],
                fraudScore: 100,
                autoApproved: false,
                recommendations: ['Manual review required due to system error']
            };
        }
    }

    /**
     * Quick fraud check for real-time validation
     */
    async quickFraudCheck(claimData: Partial<IClaim>): Promise<{
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        score: number;
        flags: string[];
    }> {
        const flags: string[] = [];
        let score = 0;

        // Quick checks
        const amount = claimData.estimatedAmount || claimData.amount || 0;
        
        if (amount > 100000) {
            score += 40;
            flags.push('VERY_HIGH_AMOUNT');
        } else if (amount > 25000) {
            score += 20;
            flags.push('HIGH_AMOUNT');
        }

        if (!claimData.description || claimData.description.length < 10) {
            score += 15;
            flags.push('POOR_DESCRIPTION');
        }

        if (!claimData.documents || claimData.documents.length === 0) {
            score += 25;
            flags.push('NO_DOCUMENTS');
        }

        if (claimData.voiceData && claimData.voiceData.confidence < 0.6) {
            score += 10;
            flags.push('LOW_VOICE_QUALITY');
        }

        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        if (score < 25) {
            riskLevel = 'LOW';
        } else if (score < 50) {
            riskLevel = 'MEDIUM';
        } else {
            riskLevel = 'HIGH';
        }

        return {
            riskLevel,
            score,
            flags
        };
    }
}

// Export singleton instance
export const fraudDetectionService = new FraudDetectionService();

// Export the simulateClaim function for direct import
export const simulateClaim = (claimData: Partial<IClaim>) => 
    fraudDetectionService.simulateClaim(claimData);
