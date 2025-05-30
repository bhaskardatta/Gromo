"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudService = void 0;
var logger_1 = require("../utils/logger");
var FraudService = /** @class */ (function () {
    function FraudService() {
    }
    /**
     * Analyzes a claim for potential fraud indicators
     */
    FraudService.analyzeFraud = function (claim) {
        return __awaiter(this, void 0, void 0, function () {
            var fraudScore, riskFactors, recommendations, docCount, fraudKeywords, transcript_1, keywordMatches, submissionHour, riskLevel, dataPoints, confidence;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                try {
                    logger_1.logger.info("Analyzing fraud for claim ".concat(claim._id));
                    fraudScore = 0;
                    riskFactors = [];
                    recommendations = [];
                    // Analyze claim amount
                    if (claim.estimatedAmount && claim.estimatedAmount > 50000) {
                        fraudScore += 30;
                        riskFactors.push('High claim amount');
                        recommendations.push('Require additional documentation for high-value claims');
                    }
                    docCount = ((_a = claim.documents) === null || _a === void 0 ? void 0 : _a.length) || 0;
                    if (docCount < 2) {
                        fraudScore += 20;
                        riskFactors.push('Insufficient documentation');
                        recommendations.push('Request additional supporting documents');
                    }
                    // Analyze voice data for inconsistencies
                    if (((_b = claim.voiceData) === null || _b === void 0 ? void 0 : _b.confidence) && claim.voiceData.confidence < 0.7) {
                        fraudScore += 15;
                        riskFactors.push('Low voice recognition confidence');
                        recommendations.push('Conduct follow-up interview to clarify details');
                    }
                    fraudKeywords = ['total loss', 'stolen', 'vandalism', 'hit and run'];
                    transcript_1 = ((_d = (_c = claim.voiceData) === null || _c === void 0 ? void 0 : _c.transcript) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
                    keywordMatches = fraudKeywords.filter(function (keyword) { return transcript_1.includes(keyword); });
                    if (keywordMatches.length > 0) {
                        fraudScore += keywordMatches.length * 10;
                        riskFactors.push("Fraud-related keywords: ".concat(keywordMatches.join(', ')));
                        recommendations.push('Investigate claim circumstances thoroughly');
                    }
                    submissionHour = new Date(claim.createdAt).getHours();
                    if (submissionHour < 6 || submissionHour > 22) {
                        fraudScore += 5;
                        riskFactors.push('Unusual submission time');
                        recommendations.push('Verify claim details during business hours');
                    }
                    riskLevel = void 0;
                    if (fraudScore >= 50) {
                        riskLevel = 'high';
                    }
                    else if (fraudScore >= 25) {
                        riskLevel = 'medium';
                    }
                    else {
                        riskLevel = 'low';
                    }
                    dataPoints = [
                        claim.estimatedAmount ? 1 : 0,
                        docCount > 0 ? 1 : 0,
                        ((_e = claim.voiceData) === null || _e === void 0 ? void 0 : _e.transcript) ? 1 : 0,
                        claim.description ? 1 : 0
                    ].reduce(function (sum, point) { return sum + point; }, 0);
                    confidence = Math.min(0.9, dataPoints * 0.2 + 0.1);
                    logger_1.logger.info("Fraud analysis completed for claim ".concat(claim._id, ": ").concat(riskLevel, " risk (").concat(fraudScore, " score)"));
                    return [2 /*return*/, {
                            fraudScore: fraudScore,
                            riskLevel: riskLevel,
                            riskFactors: riskFactors,
                            recommendations: recommendations,
                            confidence: confidence
                        }];
                }
                catch (error) {
                    logger_1.logger.error('Error in fraud analysis:', error);
                    throw new Error('Failed to analyze fraud indicators');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Calculates payout amount based on claim details and fraud analysis
     */
    FraudService.calculatePayout = function (claim, fraudAnalysis) {
        return __awaiter(this, void 0, void 0, function () {
            var baseAmount, adjustments, reduction, reduction, docCount, bonus, penalty, investigationFee, totalAdjustments, finalAmount, confidence;
            var _a;
            return __generator(this, function (_b) {
                try {
                    logger_1.logger.info("Calculating payout for claim ".concat(claim._id));
                    baseAmount = claim.estimatedAmount || 0;
                    adjustments = [];
                    // Fraud risk adjustment
                    if (fraudAnalysis.riskLevel === 'high') {
                        reduction = baseAmount * 0.5;
                        adjustments.push({
                            type: 'fraud_risk',
                            amount: -reduction,
                            reason: 'High fraud risk detected - 50% reduction applied'
                        });
                    }
                    else if (fraudAnalysis.riskLevel === 'medium') {
                        reduction = baseAmount * 0.2;
                        adjustments.push({
                            type: 'fraud_risk',
                            amount: -reduction,
                            reason: 'Medium fraud risk detected - 20% reduction applied'
                        });
                    }
                    docCount = ((_a = claim.documents) === null || _a === void 0 ? void 0 : _a.length) || 0;
                    if (docCount >= 5) {
                        bonus = baseAmount * 0.05;
                        adjustments.push({
                            type: 'documentation_bonus',
                            amount: bonus,
                            reason: 'Complete documentation provided - 5% bonus'
                        });
                    }
                    else if (docCount < 2) {
                        penalty = baseAmount * 0.1;
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
                    }
                    else if (claim.type === 'accident') {
                        investigationFee = Math.min(1000, baseAmount * 0.05);
                        adjustments.push({
                            type: 'investigation_fee',
                            amount: -investigationFee,
                            reason: 'Accident investigation fee'
                        });
                    }
                    totalAdjustments = adjustments.reduce(function (sum, adj) { return sum + adj.amount; }, 0);
                    finalAmount = Math.max(0, baseAmount + totalAdjustments);
                    confidence = Math.min(0.95, fraudAnalysis.confidence * 0.8 + 0.15);
                    logger_1.logger.info("Payout calculated for claim ".concat(claim._id, ": $").concat(finalAmount, " (base: $").concat(baseAmount, ")"));
                    return [2 /*return*/, {
                            baseAmount: baseAmount,
                            adjustments: adjustments,
                            finalAmount: finalAmount,
                            confidence: confidence
                        }];
                }
                catch (error) {
                    logger_1.logger.error('Error calculating payout:', error);
                    throw new Error('Failed to calculate payout amount');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Performs gap analysis to identify missing information
     */
    FraudService.performGapAnalysis = function (claim) {
        return __awaiter(this, void 0, void 0, function () {
            var identifiedGaps, docCount, totalPossiblePoints, completenessPoints, completenessScore, riskLevel, highSeverityGaps;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                try {
                    logger_1.logger.info("Performing gap analysis for claim ".concat(claim._id));
                    identifiedGaps = [];
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
                    docCount = ((_a = claim.documents) === null || _a === void 0 ? void 0 : _a.length) || 0;
                    if (docCount === 0) {
                        identifiedGaps.push({
                            category: 'documentation',
                            description: 'No supporting documents provided',
                            severity: 'high',
                            recommendation: 'Upload relevant documents (photos, receipts, reports)'
                        });
                    }
                    else if (docCount < 3) {
                        identifiedGaps.push({
                            category: 'documentation',
                            description: 'Limited supporting documentation',
                            severity: 'medium',
                            recommendation: 'Consider providing additional supporting documents'
                        });
                    }
                    // Check voice data quality
                    if (!((_b = claim.voiceData) === null || _b === void 0 ? void 0 : _b.transcript)) {
                        identifiedGaps.push({
                            category: 'voice_data',
                            description: 'No voice transcript available',
                            severity: 'medium',
                            recommendation: 'Provide voice recording for claim verification'
                        });
                    }
                    else if (claim.voiceData.confidence && claim.voiceData.confidence < 0.8) {
                        identifiedGaps.push({
                            category: 'voice_data',
                            description: 'Low quality voice data',
                            severity: 'medium',
                            recommendation: 'Re-record voice statement in quiet environment'
                        });
                    }
                    // Check claim type specific requirements
                    if (claim.type === 'accident') {
                        if (!((_d = (_c = claim.voiceData) === null || _c === void 0 ? void 0 : _c.extractedKeywords) === null || _d === void 0 ? void 0 : _d.includes('accident'))) {
                            identifiedGaps.push({
                                category: 'incident_details',
                                description: 'Missing accident details in voice recording',
                                severity: 'high',
                                recommendation: 'Provide detailed account of accident circumstances'
                            });
                        }
                    }
                    else if (claim.type === 'medical') {
                        if (!((_e = claim.documents) === null || _e === void 0 ? void 0 : _e.some(function (doc) { var _a; return (_a = doc.type) === null || _a === void 0 ? void 0 : _a.includes('medical'); }))) {
                            identifiedGaps.push({
                                category: 'medical_records',
                                description: 'Missing medical documentation',
                                severity: 'high',
                                recommendation: 'Provide medical reports and bills'
                            });
                        }
                    }
                    totalPossiblePoints = 10;
                    completenessPoints = 0;
                    if (claim.description && claim.description.length >= 50)
                        completenessPoints += 2;
                    if (claim.estimatedAmount)
                        completenessPoints += 2;
                    if (docCount >= 3)
                        completenessPoints += 2;
                    if ((_f = claim.voiceData) === null || _f === void 0 ? void 0 : _f.transcript)
                        completenessPoints += 2;
                    if (((_g = claim.voiceData) === null || _g === void 0 ? void 0 : _g.confidence) && claim.voiceData.confidence >= 0.8)
                        completenessPoints += 1;
                    if (claim.type)
                        completenessPoints += 1;
                    completenessScore = completenessPoints / totalPossiblePoints;
                    riskLevel = void 0;
                    highSeverityGaps = identifiedGaps.filter(function (gap) { return gap.severity === 'high'; }).length;
                    if (highSeverityGaps >= 2 || completenessScore < 0.4) {
                        riskLevel = 'high';
                    }
                    else if (highSeverityGaps === 1 || completenessScore < 0.7) {
                        riskLevel = 'medium';
                    }
                    else {
                        riskLevel = 'low';
                    }
                    logger_1.logger.info("Gap analysis completed for claim ".concat(claim._id, ": ").concat(identifiedGaps.length, " gaps identified"));
                    return [2 /*return*/, {
                            identifiedGaps: identifiedGaps,
                            completenessScore: completenessScore,
                            riskLevel: riskLevel
                        }];
                }
                catch (error) {
                    logger_1.logger.error('Error in gap analysis:', error);
                    throw new Error('Failed to perform gap analysis');
                }
                return [2 /*return*/];
            });
        });
    };
    return FraudService;
}());
exports.FraudService = FraudService;
