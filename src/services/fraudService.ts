import { IClaim } from '../models/Claim';
import { logger } from '../utils/logger';

interface FraudAnalysisResult {
  fraudScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
}

interface PayoutCalculation {
  baseAmount: number;
  adjustments: Array<{
    type: string;
    amount: number;
    reason: string;
  }>;
  finalAmount: number;
  confidence: number;
}

interface GapAnalysis {
  identifiedGaps: Array<{
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
  completenessScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export class FraudService {
  /**
   * Analyzes a claim for potential fraud indicators
   */
  static async analyzeFraud(claim: IClaim): Promise<FraudAnalysisResult> {
    try {
      logger.info(`Analyzing fraud for claim ${claim._id}`);

      let fraudScore = 0;
      const riskFactors: string[] = [];
      const recommendations: string[] = [];

      // Analyze claim amount
      if (claim.estimatedAmount && claim.estimatedAmount > 50000) {
        fraudScore += 30;
        riskFactors.push('High claim amount');
        recommendations.push('Require additional documentation for high-value claims');
      }

      // Analyze documentation completeness
      const docCount = claim.documents?.length || 0;
      if (docCount < 2) {
        fraudScore += 20;
        riskFactors.push('Insufficient documentation');
        recommendations.push('Request additional supporting documents');
      }

      // Analyze voice data for inconsistencies
      if (claim.voiceData?.confidence && claim.voiceData.confidence < 0.7) {
        fraudScore += 15;
        riskFactors.push('Low voice recognition confidence');
        recommendations.push('Conduct follow-up interview to clarify details');
      }

      // Check for keywords that might indicate fraud
      const fraudKeywords = ['total loss', 'stolen', 'vandalism', 'hit and run'];
      const transcript = claim.voiceData?.transcript?.toLowerCase() || '';
      const keywordMatches = fraudKeywords.filter(keyword => transcript.includes(keyword));
      
      if (keywordMatches.length > 0) {
        fraudScore += keywordMatches.length * 10;
        riskFactors.push(`Fraud-related keywords: ${keywordMatches.join(', ')}`);
        recommendations.push('Investigate claim circumstances thoroughly');
      }

      // Analyze timing patterns
      const submissionHour = new Date(claim.createdAt).getHours();
      if (submissionHour < 6 || submissionHour > 22) {
        fraudScore += 5;
        riskFactors.push('Unusual submission time');
        recommendations.push('Verify claim details during business hours');
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high';
      if (fraudScore >= 50) {
        riskLevel = 'high';
      } else if (fraudScore >= 25) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      // Calculate confidence based on available data
      const dataPoints = [
        claim.estimatedAmount ? 1 : 0,
        docCount > 0 ? 1 : 0,
        claim.voiceData?.transcript ? 1 : 0,
        claim.description ? 1 : 0
      ].reduce((sum, point) => sum + point, 0);
      
      const confidence = Math.min(0.9, dataPoints * 0.2 + 0.1);

      logger.info(`Fraud analysis completed for claim ${claim._id}: ${riskLevel} risk (${fraudScore} score)`);

      return {
        fraudScore,
        riskLevel,
        riskFactors,
        recommendations,
        confidence
      };
    } catch (error) {
      logger.error('Error in fraud analysis:', error);
      throw new Error('Failed to analyze fraud indicators');
    }
  }

  /**
   * Calculates payout amount based on claim details and fraud analysis
   */
  static async calculatePayout(claim: IClaim, fraudAnalysis: FraudAnalysisResult): Promise<PayoutCalculation> {
    try {
      logger.info(`Calculating payout for claim ${claim._id}`);

      const baseAmount = claim.estimatedAmount || 0;
      const adjustments: Array<{ type: string; amount: number; reason: string }> = [];

      // Fraud risk adjustment
      if (fraudAnalysis.riskLevel === 'high') {
        const reduction = baseAmount * 0.5;
        adjustments.push({
          type: 'fraud_risk',
          amount: -reduction,
          reason: 'High fraud risk detected - 50% reduction applied'
        });
      } else if (fraudAnalysis.riskLevel === 'medium') {
        const reduction = baseAmount * 0.2;
        adjustments.push({
          type: 'fraud_risk',
          amount: -reduction,
          reason: 'Medium fraud risk detected - 20% reduction applied'
        });
      }

      // Documentation completeness bonus/penalty
      const docCount = claim.documents?.length || 0;
      if (docCount >= 5) {
        const bonus = baseAmount * 0.05;
        adjustments.push({
          type: 'documentation_bonus',
          amount: bonus,
          reason: 'Complete documentation provided - 5% bonus'
        });
      } else if (docCount < 2) {
        const penalty = baseAmount * 0.1;
        adjustments.push({
          type: 'documentation_penalty',
          amount: -penalty,
          reason: 'Insufficient documentation - 10% penalty'
        });
      }

      // Claim type specific adjustments
      if (claim.type === 'medical') {
        // Medical claims get standard processing
        adjustments.push({
          type: 'medical_standard',
          amount: 0,
          reason: 'Standard medical claim processing'
        });
      } else if (claim.type === 'accident') {
        // Accident claims might need investigation
        const investigationFee = Math.min(1000, baseAmount * 0.05);
        adjustments.push({
          type: 'investigation_fee',
          amount: -investigationFee,
          reason: 'Accident investigation fee'
        });
      }

      // Calculate final amount
      const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
      const finalAmount = Math.max(0, baseAmount + totalAdjustments);

      // Calculate confidence based on fraud analysis and data completeness
      const confidence = Math.min(0.95, fraudAnalysis.confidence * 0.8 + 0.15);

      logger.info(`Payout calculated for claim ${claim._id}: $${finalAmount} (base: $${baseAmount})`);

      return {
        baseAmount,
        adjustments,
        finalAmount,
        confidence
      };
    } catch (error) {
      logger.error('Error calculating payout:', error);
      throw new Error('Failed to calculate payout amount');
    }
  }

  /**
   * Performs gap analysis to identify missing information
   */
  static async performGapAnalysis(claim: IClaim): Promise<GapAnalysis> {
    try {
      logger.info(`Performing gap analysis for claim ${claim._id}`);

      const identifiedGaps: Array<{
        category: string;
        description: string;
        severity: 'low' | 'medium' | 'high';
        recommendation: string;
      }> = [];

      // Check basic claim information
      if (!claim.description || claim.description.length < 50) {
        identifiedGaps.push({
          category: 'claim_details',
          description: 'Insufficient claim description',
          severity: 'high',
          recommendation: 'Provide detailed description of the incident'
        });
      }

      if (!claim.estimatedAmount) {
        identifiedGaps.push({
          category: 'financial',
          description: 'Missing estimated amount',
          severity: 'high',
          recommendation: 'Provide estimated claim amount'
        });
      }

      // Check documentation
      const docCount = claim.documents?.length || 0;
      if (docCount === 0) {
        identifiedGaps.push({
          category: 'documentation',
          description: 'No supporting documents provided',
          severity: 'high',
          recommendation: 'Upload relevant documents (photos, receipts, reports)'
        });
      } else if (docCount < 3) {
        identifiedGaps.push({
          category: 'documentation',
          description: 'Limited supporting documentation',
          severity: 'medium',
          recommendation: 'Consider providing additional supporting documents'
        });
      }

      // Check voice data quality
      if (!claim.voiceData?.transcript) {
        identifiedGaps.push({
          category: 'voice_data',
          description: 'No voice transcript available',
          severity: 'medium',
          recommendation: 'Provide voice recording for claim verification'
        });
      } else if (claim.voiceData.confidence && claim.voiceData.confidence < 0.8) {
        identifiedGaps.push({
          category: 'voice_data',
          description: 'Low quality voice data',
          severity: 'medium',
          recommendation: 'Re-record voice statement in quiet environment'
        });
      }

      // Check claim type specific requirements
      if (claim.type === 'accident') {
        if (!claim.voiceData?.keywords?.includes('accident')) {
          identifiedGaps.push({
            category: 'incident_details',
            description: 'Missing accident details in voice recording',
            severity: 'high',
            recommendation: 'Provide detailed account of accident circumstances'
          });
        }
      } else if (claim.type === 'medical') {
        if (!claim.documents?.some(doc => doc.type?.includes('medical'))) {
          identifiedGaps.push({
            category: 'medical_records',
            description: 'Missing medical documentation',
            severity: 'high',
            recommendation: 'Provide medical reports and bills'
          });
        }
      }

      // Calculate completeness score
      const totalPossiblePoints = 10;
      let completenessPoints = 0;

      if (claim.description && claim.description.length >= 50) completenessPoints += 2;
      if (claim.estimatedAmount) completenessPoints += 2;
      if (docCount >= 3) completenessPoints += 2;
      if (claim.voiceData?.transcript) completenessPoints += 2;
      if (claim.voiceData?.confidence && claim.voiceData.confidence >= 0.8) completenessPoints += 1;
      if (claim.type) completenessPoints += 1;

      const completenessScore = completenessPoints / totalPossiblePoints;

      // Determine overall risk level
      let riskLevel: 'low' | 'medium' | 'high';
      const highSeverityGaps = identifiedGaps.filter(gap => gap.severity === 'high').length;
      
      if (highSeverityGaps >= 2 || completenessScore < 0.4) {
        riskLevel = 'high';
      } else if (highSeverityGaps === 1 || completenessScore < 0.7) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      logger.info(`Gap analysis completed for claim ${claim._id}: ${identifiedGaps.length} gaps identified`);

      return {
        identifiedGaps,
        completenessScore,
        riskLevel
      };
    } catch (error) {
      logger.error('Error in gap analysis:', error);
      throw new Error('Failed to perform gap analysis');
    }
  }
}
