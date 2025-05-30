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
var Claim_1 = require("../models/Claim");
var escalationService_1 = require("../services/escalationService");
var logger_1 = require("../utils/logger");
var router = express_1.default.Router();
/**
 * POST /api/v1/escalation/request-agent
 * Request agent escalation with confirmation levels
 */
router.post('/request-agent', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, claimId, reason, _b, confirmationLevel, claim, responseMessage, nextAction, _c, populatedUser, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 9, , 10]);
                _a = req.body, claimId = _a.claimId, reason = _a.reason, _b = _a.confirmationLevel, confirmationLevel = _b === void 0 ? 1 : _b;
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
                claim = _d.sent();
                if (!claim) {
                    return [2 /*return*/, res.status(404).json({
                            error: {
                                code: 'CLAIM_NOT_FOUND',
                                message: 'Claim not found'
                            }
                        })];
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
                responseMessage = '';
                nextAction = '';
                _c = confirmationLevel;
                switch (_c) {
                    case 1: return [3 /*break*/, 2];
                    case 2: return [3 /*break*/, 3];
                    case 3: return [3 /*break*/, 4];
                }
                return [3 /*break*/, 6];
            case 2:
                responseMessage = 'I understand you need help. Let me try to assist you first with AI support.';
                nextAction = 'ai_assistance';
                return [3 /*break*/, 7];
            case 3:
                responseMessage = 'If AI assistance wasn\'t helpful, I can connect you to a human agent. This may take 5-7 minutes. Would you like to proceed?';
                nextAction = 'agent_confirmation';
                return [3 /*break*/, 7];
            case 4:
                responseMessage = 'Connecting you to a human agent now. Please note that you\'ll lose the current AI context.';
                nextAction = 'agent_transfer';
                populatedUser = claim.user;
                return [4 /*yield*/, (0, escalationService_1.triggerAgentEscalation)(claim._id.toString(), claim.escalation.transferReason, 'critical')];
            case 5:
                _d.sent();
                claim.escalation.confirmedAt = new Date();
                return [3 /*break*/, 7];
            case 6: return [2 /*return*/, res.status(400).json({
                    error: {
                        code: 'INVALID_CONFIRMATION_LEVEL',
                        message: 'Confirmation level must be 1, 2, or 3'
                    }
                })];
            case 7:
                claim.processingSteps.push({
                    step: "escalation_level_".concat(confirmationLevel),
                    completedAt: new Date(),
                    success: true,
                    details: { reason: reason, confirmationLevel: confirmationLevel }
                });
                return [4 /*yield*/, claim.save()];
            case 8:
                _d.sent();
                logger_1.logger.info("Escalation level ".concat(confirmationLevel, " for claim: ").concat(claimId));
                res.json({
                    status: 'success',
                    data: {
                        claimId: claim._id,
                        confirmationLevel: confirmationLevel,
                        message: responseMessage,
                        nextAction: nextAction,
                        escalationStatus: claim.escalation,
                        estimatedWaitTime: confirmationLevel === 3 ? '5-7 minutes' : null
                    }
                });
                return [3 /*break*/, 10];
            case 9:
                error_1 = _d.sent();
                logger_1.logger.error('Escalation request error:', error_1);
                next(error_1);
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/v1/escalation/ai-chat
 * Handle AI chatbot interactions before agent escalation
 */
router.post('/ai-chat', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, claimId, message, _b, chatHistory, claim, aiResponse, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.body, claimId = _a.claimId, message = _a.message, _b = _a.chatHistory, chatHistory = _b === void 0 ? [] : _b;
                if (!claimId || !message) {
                    return [2 /*return*/, res.status(400).json({
                            error: {
                                code: 'MISSING_PARAMETERS',
                                message: 'Claim ID and message are required'
                            }
                        })];
                }
                return [4 /*yield*/, Claim_1.Claim.findById(claimId)];
            case 1:
                claim = _c.sent();
                if (!claim) {
                    return [2 /*return*/, res.status(404).json({
                            error: {
                                code: 'CLAIM_NOT_FOUND',
                                message: 'Claim not found'
                            }
                        })];
                }
                aiResponse = generateAIResponse(message, claim, chatHistory);
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
                return [3 /*break*/, 3];
            case 2:
                error_2 = _c.sent();
                logger_1.logger.error('AI chat error:', error_2);
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/v1/escalation/agent-availability
 * Check current agent availability
 */
router.get('/agent-availability', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var currentHour, isBusinessHours, availability;
    return __generator(this, function (_a) {
        try {
            currentHour = new Date().getHours();
            isBusinessHours = currentHour >= 9 && currentHour <= 18;
            availability = {
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
        }
        catch (error) {
            logger_1.logger.error('Agent availability check error:', error);
            res.status(500).json({
                error: {
                    code: 'AVAILABILITY_CHECK_FAILED',
                    message: 'Unable to check agent availability'
                }
            });
        }
        return [2 /*return*/];
    });
}); });
// Helper function to generate AI responses
function generateAIResponse(message, claim, chatHistory) {
    var lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('status')) {
        return "Your claim ".concat(claim._id, " is currently ").concat(claim.status, ". ").concat(getStatusDescription(claim.status));
    }
    if (lowerMessage.includes('document') || lowerMessage.includes('upload')) {
        return 'You can upload additional documents through the claim portal. Supported formats are JPG, PNG, and PDF up to 10MB.';
    }
    if (lowerMessage.includes('amount') || lowerMessage.includes('payout')) {
        return claim.simulation ?
            "Based on our analysis, your approved amount would be \u20B9".concat(claim.simulation.approvedAmount, ". ").concat(claim.simulation.gaps.length > 0 ? 'Some gaps were identified that may affect the final amount.' : '') :
            'Let me run a quick analysis on your claim amount and get back to you.';
    }
    if (lowerMessage.includes('time') || lowerMessage.includes('how long')) {
        return 'Most claims are processed within 3-5 business days. Complex cases may take up to 7 days.';
    }
    return 'I understand your concern. Let me help you with that. Could you please provide more details about what specifically you need assistance with?';
}
function getStatusDescription(status) {
    var descriptions = {
        'PENDING': 'We are currently reviewing your claim.',
        'APPROVED': 'Congratulations! Your claim has been approved.',
        'REJECTED': 'Unfortunately, your claim has been rejected. You can appeal this decision.',
        'FRAUD_REVIEW': 'Your claim is under additional review for verification.',
        'MANUAL_REVIEW': 'Your claim requires manual review by our team.'
    };
    return descriptions[status] || 'Status information is being updated.';
}
exports.default = router;
