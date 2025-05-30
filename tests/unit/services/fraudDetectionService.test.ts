/// <reference types="jest" />
import { FraudDetectionService } from '../../../src/services/fraudDetectionService';

// Mock the FraudService dependency
jest.mock('../../../src/services/fraudService', () => ({
  FraudService: {
    analyzeFraud: jest.fn().mockResolvedValue({
      fraudScore: 25,
      riskLevel: 'low',
      riskFactors: ['Some test factor'],
      recommendations: ['Test recommendation'],
      confidence: 0.8
    })
  }
}));

describe('FraudDetectionService', () => {
  let fraudService: FraudDetectionService;

  beforeEach(() => {
    fraudService = new FraudDetectionService();
  });

  describe('simulateClaim', () => {
    it('should simulate low risk claim processing', async () => {
      const mockClaimData = {
        amount: 1000,
        estimatedAmount: 1000,
        description: 'Car accident with minor damage requiring repair work',
        type: 'accident' as const,
        documents: [
          { type: 'bill' as const, url: 'damage1.jpg', extractedData: new Map(), confidence: 0.9, ocrMethod: 'google_vision' as const },
          { type: 'bill' as const, url: 'repair_estimate.pdf', extractedData: new Map(), confidence: 0.9, ocrMethod: 'google_vision' as const }
        ],
        claimDetails: {
          incidentDate: new Date('2024-01-15'),
          description: 'Car accident with minor damage'
        },
        voiceData: {
          transcript: 'I had a minor accident yesterday',
          keywords: ['accident', 'minor'],
          language: 'en',
          confidence: 0.85
        }
      };

      const result = await fraudService.simulateClaim(mockClaimData);

      expect(result).toBeDefined();
      expect(result.approved).toBeDefined();
      expect(result.approvedAmount).toBeGreaterThan(0);
      expect(result.fraudScore).toBeGreaterThan(0);
      expect(result.fraudScore).toBeLessThan(100);
      expect(Array.isArray(result.gaps)).toBeTruthy();
      expect(Array.isArray(result.rulesTriggered)).toBeTruthy();
      expect(Array.isArray(result.recommendations)).toBeTruthy();
    });

    it('should detect high risk for suspicious claim', async () => {
      const mockClaimData = {
        amount: 100000, // Very high amount
        estimatedAmount: 100000,
        description: 'Total loss', // Very short description
        type: 'accident' as const,
        documents: [], // No documents
        claimDetails: {
          incidentDate: new Date(),
          description: 'Total loss'
        },
        voiceData: {
          transcript: 'total loss stolen vandalism',
          keywords: ['total', 'loss', 'stolen'],
          language: 'en',
          confidence: 0.3 // Low confidence
        }
      };

      const result = await fraudService.simulateClaim(mockClaimData);

      expect(result).toBeDefined();
      expect(result.fraudScore).toBeGreaterThan(50); // Should be high risk
      expect(result.approved).toBe(false);
      expect(result.autoApproved).toBe(false);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.rulesTriggered).toContain('HIGH_RISK_REJECTION');
    });

    it('should handle missing data gracefully', async () => {
      const mockClaimData = {
        amount: 1000
        // Minimal data
      };

      const result = await fraudService.simulateClaim(mockClaimData);

      expect(result).toBeDefined();
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.gaps).toContain('Missing supporting documents');
      expect(result.gaps).toContain('Insufficient claim description');
    });
  });

  describe('quickFraudCheck', () => {
    it('should perform quick fraud assessment', async () => {
      const mockClaimData = {
        amount: 5000,
        description: 'Minor car damage from parking incident',
        documents: [{ type: 'accident_photo' as const, url: 'damage.jpg', extractedData: new Map(), confidence: 0.9, ocrMethod: 'google_vision' as const }],
        voiceData: {
          transcript: 'Minor parking damage',
          keywords: ['parking', 'damage'],
          language: 'en',
          confidence: 0.9
        }
      };

      const result = await fraudService.quickFraudCheck(mockClaimData);

      expect(result).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.riskLevel);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThan(0);
      expect(Array.isArray(result.flags)).toBeTruthy();
    });

    it('should flag high amount claims', async () => {
      const mockClaimData = {
        amount: 150000, // Very high amount
        description: 'Vehicle total loss',
        documents: []
      };

      const result = await fraudService.quickFraudCheck(mockClaimData);

      expect(result.riskLevel).toBe('HIGH');
      expect(result.flags).toContain('VERY_HIGH_AMOUNT');
      expect(result.flags).toContain('NO_DOCUMENTS');
      expect(result.score).toBeGreaterThan(50);
    });

    it('should flag poor quality submissions', async () => {
      const mockClaimData = {
        amount: 1000,
        description: 'damage', // Very short description
        documents: [],
        voiceData: {
          transcript: 'Accident happened',
          keywords: ['accident'],
          language: 'en',
          confidence: 0.4 // Low confidence
        }
      };

      const result = await fraudService.quickFraudCheck(mockClaimData);

      expect(result.flags).toContain('POOR_DESCRIPTION');
      expect(result.flags).toContain('NO_DOCUMENTS');
      expect(result.flags).toContain('LOW_VOICE_QUALITY');
    });
  });
});
