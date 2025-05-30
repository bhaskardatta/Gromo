"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fraudDetectionService_1 = require("../../src/services/fraudDetectionService");
describe('FraudDetectionService', () => {
    let fraudService;
    beforeEach(() => {
        fraudService = new fraudDetectionService_1.FraudDetectionService();
    });
    describe('analyzeClaim', () => {
        it('should return low risk for normal claims', async () => {
            const claimData = {
                policyNumber: 'POL123456',
                claimAmount: 25000,
                incidentDate: new Date('2023-12-01'),
                reportedDate: new Date('2023-12-02'),
                claimType: 'accident',
                vehicleAge: 3,
                customerHistory: {
                    previousClaims: 1,
                    accountAge: 24 // months
                }
            };
            const result = await fraudService.analyzeClaim(claimData);
            expect(result.riskScore).toBeLessThan(0.3);
            expect(result.riskLevel).toBe('low');
            expect(result.flagged).toBe(false);
        });
        it('should flag high-amount claims', async () => {
            const claimData = {
                policyNumber: 'POL123456',
                claimAmount: 500000, // Very high amount
                incidentDate: new Date('2023-12-01'),
                reportedDate: new Date('2023-12-02'),
                claimType: 'accident',
                vehicleAge: 3,
                customerHistory: {
                    previousClaims: 1,
                    accountAge: 24
                }
            };
            const result = await fraudService.analyzeClaim(claimData);
            expect(result.riskScore).toBeGreaterThan(0.5);
            expect(result.riskLevel).toBe('high');
            expect(result.flagged).toBe(true);
            expect(result.reasons).toContain('High claim amount');
        });
        it('should flag claims with long reporting delays', async () => {
            const incidentDate = new Date('2023-11-01');
            const reportedDate = new Date('2023-12-15'); // 44 days later
            const claimData = {
                policyNumber: 'POL123456',
                claimAmount: 50000,
                incidentDate,
                reportedDate,
                claimType: 'accident',
                vehicleAge: 3,
                customerHistory: {
                    previousClaims: 1,
                    accountAge: 24
                }
            };
            const result = await fraudService.analyzeClaim(claimData);
            expect(result.flagged).toBe(true);
            expect(result.reasons).toContain('Late reporting (44 days)');
        });
        it('should flag customers with multiple recent claims', async () => {
            const claimData = {
                policyNumber: 'POL123456',
                claimAmount: 30000,
                incidentDate: new Date('2023-12-01'),
                reportedDate: new Date('2023-12-02'),
                claimType: 'accident',
                vehicleAge: 3,
                customerHistory: {
                    previousClaims: 5, // Many previous claims
                    accountAge: 24
                }
            };
            const result = await fraudService.analyzeClaim(claimData);
            expect(result.flagged).toBe(true);
            expect(result.reasons).toContain('Multiple previous claims');
        });
        it('should flag new customers with high claims', async () => {
            const claimData = {
                policyNumber: 'POL123456',
                claimAmount: 100000,
                incidentDate: new Date('2023-12-01'),
                reportedDate: new Date('2023-12-02'),
                claimType: 'theft',
                vehicleAge: 1,
                customerHistory: {
                    previousClaims: 0,
                    accountAge: 2 // Very new account
                }
            };
            const result = await fraudService.analyzeClaim(claimData);
            expect(result.flagged).toBe(true);
            expect(result.reasons).toContain('New customer with high claim');
        });
        it('should flag total loss claims for old vehicles', async () => {
            const claimData = {
                policyNumber: 'POL123456',
                claimAmount: 80000,
                incidentDate: new Date('2023-12-01'),
                reportedDate: new Date('2023-12-02'),
                claimType: 'total_loss',
                vehicleAge: 12, // Old vehicle
                customerHistory: {
                    previousClaims: 1,
                    accountAge: 24
                }
            };
            const result = await fraudService.analyzeClaim(claimData);
            expect(result.flagged).toBe(true);
            expect(result.reasons).toContain('Total loss claim for old vehicle');
        });
    });
    describe('validateDocuments', () => {
        it('should validate consistent information across documents', () => {
            const documents = [
                {
                    type: 'police_report',
                    extractedData: {
                        vehicleNumber: 'MH01AB1234',
                        incidentDate: '2023-12-01',
                        location: 'Mumbai'
                    }
                },
                {
                    type: 'estimate',
                    extractedData: {
                        vehicleNumber: 'MH01AB1234',
                        estimatedAmount: '₹50,000'
                    }
                }
            ];
            const result = fraudService.validateDocuments(documents);
            expect(result.consistent).toBe(true);
            expect(result.inconsistencies).toHaveLength(0);
        });
        it('should detect inconsistent vehicle numbers', () => {
            const documents = [
                {
                    type: 'police_report',
                    extractedData: {
                        vehicleNumber: 'MH01AB1234',
                        incidentDate: '2023-12-01'
                    }
                },
                {
                    type: 'estimate',
                    extractedData: {
                        vehicleNumber: 'MH01CD5678', // Different vehicle number
                        estimatedAmount: '₹50,000'
                    }
                }
            ];
            const result = fraudService.validateDocuments(documents);
            expect(result.consistent).toBe(false);
            expect(result.inconsistencies).toContain('Vehicle number mismatch between documents');
        });
        it('should detect inconsistent dates', () => {
            const documents = [
                {
                    type: 'police_report',
                    extractedData: {
                        vehicleNumber: 'MH01AB1234',
                        incidentDate: '2023-12-01'
                    }
                },
                {
                    type: 'medical_bill',
                    extractedData: {
                        incidentDate: '2023-12-05' // Different date
                    }
                }
            ];
            const result = fraudService.validateDocuments(documents);
            expect(result.consistent).toBe(false);
            expect(result.inconsistencies).toContain('Incident date mismatch between documents');
        });
    });
    describe('checkBlacklist', () => {
        it('should flag blacklisted vehicle numbers', async () => {
            const vehicleNumber = 'MH01XY9999'; // Assume this is blacklisted
            const result = await fraudService.checkBlacklist({
                vehicleNumber,
                customerPhone: '+91-9876543210'
            });
            // This would typically check against a real blacklist database
            expect(result).toHaveProperty('vehicleBlacklisted');
            expect(result).toHaveProperty('phoneBlacklisted');
        });
    });
    describe('analyzePatterns', () => {
        it('should detect suspicious patterns in claims', () => {
            const recentClaims = [
                {
                    claimNumber: 'CLM001',
                    incidentDate: new Date('2023-12-01'),
                    location: 'Mumbai',
                    claimAmount: 25000
                },
                {
                    claimNumber: 'CLM002',
                    incidentDate: new Date('2023-12-03'),
                    location: 'Mumbai', // Same location
                    claimAmount: 30000
                },
                {
                    claimNumber: 'CLM003',
                    incidentDate: new Date('2023-12-05'),
                    location: 'Mumbai', // Same location again
                    claimAmount: 35000
                }
            ];
            const result = fraudService.analyzePatterns(recentClaims);
            expect(result.suspiciousPatterns).toContain('Multiple claims in same location');
            expect(result.patternScore).toBeGreaterThan(0.5);
        });
        it('should detect gradually increasing claim amounts', () => {
            const recentClaims = [
                {
                    claimNumber: 'CLM001',
                    incidentDate: new Date('2023-10-01'),
                    claimAmount: 20000
                },
                {
                    claimNumber: 'CLM002',
                    incidentDate: new Date('2023-11-01'),
                    claimAmount: 40000
                },
                {
                    claimNumber: 'CLM003',
                    incidentDate: new Date('2023-12-01'),
                    claimAmount: 80000 // Doubling pattern
                }
            ];
            const result = fraudService.analyzePatterns(recentClaims);
            expect(result.suspiciousPatterns).toContain('Escalating claim amounts');
        });
    });
    describe('generateRiskScore', () => {
        it('should calculate risk score based on multiple factors', () => {
            const factors = {
                amountRisk: 0.3,
                timingRisk: 0.2,
                historyRisk: 0.4,
                documentRisk: 0.1,
                patternRisk: 0.6
            };
            const score = fraudService.generateRiskScore(factors);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(1);
            expect(score).toBeCloseTo(0.32, 2); // Weighted average
        });
        it('should return high score for high-risk factors', () => {
            const factors = {
                amountRisk: 0.9,
                timingRisk: 0.8,
                historyRisk: 0.9,
                documentRisk: 0.7,
                patternRisk: 0.9
            };
            const score = fraudService.generateRiskScore(factors);
            expect(score).toBeGreaterThan(0.8);
        });
    });
    describe('getRiskLevel', () => {
        it('should return correct risk levels', () => {
            expect(fraudService.getRiskLevel(0.1)).toBe('low');
            expect(fraudService.getRiskLevel(0.3)).toBe('low');
            expect(fraudService.getRiskLevel(0.4)).toBe('medium');
            expect(fraudService.getRiskLevel(0.6)).toBe('medium');
            expect(fraudService.getRiskLevel(0.7)).toBe('high');
            expect(fraudService.getRiskLevel(0.9)).toBe('high');
        });
    });
    describe('getRecommendations', () => {
        it('should provide appropriate recommendations for high-risk claims', () => {
            const analysisResult = {
                riskScore: 0.8,
                riskLevel: 'high',
                flagged: true,
                reasons: ['High claim amount', 'Multiple previous claims'],
                documentValidation: { consistent: false },
                patternAnalysis: { suspiciousPatterns: ['Escalating amounts'] }
            };
            const recommendations = fraudService.getRecommendations(analysisResult);
            expect(recommendations).toContain('Manual review required');
            expect(recommendations).toContain('Verify supporting documents');
            expect(recommendations).toContain('Contact customer for additional information');
        });
        it('should provide minimal recommendations for low-risk claims', () => {
            const analysisResult = {
                riskScore: 0.2,
                riskLevel: 'low',
                flagged: false,
                reasons: [],
                documentValidation: { consistent: true },
                patternAnalysis: { suspiciousPatterns: [] }
            };
            const recommendations = fraudService.getRecommendations(analysisResult);
            expect(recommendations).toContain('Standard processing');
            expect(recommendations.length).toBeLessThan(3);
        });
    });
});
//# sourceMappingURL=fraudDetectionService.test.js.map