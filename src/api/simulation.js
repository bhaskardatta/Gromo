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
var express_1 = require("express");
var fraudDetectionService_1 = require("../services/fraudDetectionService");
var Claim_1 = require("../models/Claim");
var logger_1 = require("../utils/logger");
var router = express_1.default.Router();
/**
 * POST /api/v1/simulation/evaluate-claim
 * Evaluate claim for fraud detection and auto-approval
 */
router.post('/evaluate-claim', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var claimId, claim, simulationResult, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                claimId = req.body.claimId;
                if (!claimId) {
                    return [2 /*return*/, res.status(400).json({
                            error: {
                                code: 'MISSING_CLAIM_ID',
                                message: 'Claim ID is required'
                            }
                        })];
                }
                return [4 /*yield*/, Claim_1.Claim.findById(claimId).populate('user')];
            case 1:
                claim = _a.sent();
                if (!claim) {
                    return [2 /*return*/, res.status(404).json({
                            error: {
                                code: 'CLAIM_NOT_FOUND',
                                message: 'Claim not found'
                            }
                        })];
                }
                logger_1.logger.info("Evaluating claim for fraud: ".concat(claimId));
                return [4 /*yield*/, (0, fraudDetectionService_1.simulateClaim)(claim, claim.user)];
            case 2:
                simulationResult = _a.sent();
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
                return [4 /*yield*/, claim.save()];
            case 3:
                _a.sent();
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
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                logger_1.logger.error('Claim simulation error:', error_1);
                next(error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/v1/simulation/calculate-payout
 * Calculate potential payout amount based on claim data
 */
router.post('/calculate-payout', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, claimData, policyDetails, calculatedAmount, gaps, deductions, deductionPercentage, deductionAmount;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        try {
            _a = req.body, claimData = _a.claimData, policyDetails = _a.policyDetails;
            if (!claimData) {
                return [2 /*return*/, res.status(400).json({
                        error: {
                            code: 'MISSING_CLAIM_DATA',
                            message: 'Claim data is required'
                        }
                    })];
            }
            calculatedAmount = 0;
            gaps = [];
            deductions = [];
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
            if (!((_b = claimData.claimDetails) === null || _b === void 0 ? void 0 : _b.description)) {
                gaps.push('Missing incident description');
            }
            if (!((_c = claimData.documents) === null || _c === void 0 ? void 0 : _c.length)) {
                gaps.push('No supporting documents provided');
            }
            if (!((_d = claimData.claimDetails) === null || _d === void 0 ? void 0 : _d.location)) {
                gaps.push('Incident location not specified');
            }
            // Apply deductions for gaps
            if (gaps.length > 0) {
                deductionPercentage = Math.min(gaps.length * 0.1, 0.3);
                deductionAmount = calculatedAmount * deductionPercentage;
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
                    gaps: gaps,
                    deductions: deductions,
                    recommendation: gaps.length === 0 ?
                        'ready_for_approval' :
                        'requires_additional_information'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Payout calculation error:', error);
            next(error);
        }
        return [2 /*return*/];
    });
}); });
// Helper functions for payout calculations
function calculateMedicalPayout(claimData) {
    var baseAmount = claimData.amount;
    var maxCoverage = 100000; // ₹1 lakh max per claim
    return Math.min(baseAmount * 0.9, maxCoverage); // 90% coverage up to max
}
function calculateAccidentPayout(claimData) {
    var _a;
    var baseAmount = claimData.amount;
    var severity = ((_a = claimData.claimDetails) === null || _a === void 0 ? void 0 : _a.severity) || 'medium';
    var multipliers = {
        low: 0.7,
        medium: 0.8,
        high: 0.95
    };
    return baseAmount * multipliers[severity];
}
function calculatePharmacyPayout(claimData) {
    var baseAmount = claimData.amount;
    var maxCoverage = 25000; // ₹25k max for pharmacy claims
    return Math.min(baseAmount * 0.8, maxCoverage); // 80% coverage up to max
}
exports.default = router;
