"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.simulateClaim = exports.fraudDetectionService = exports.FraudDetectionService = void 0;
var fraudService_1 = require("./fraudService");
var FraudDetectionService = /** @class */ (function () {
    function FraudDetectionService() {
        this.fraudService = new fraudService_1.FraudService();
    }
    /**
     * Simulate claim processing with fraud detection
     */
    FraudDetectionService.prototype.simulateClaim = function (claimData) {
        return __awaiter(this, void 0, void 0, function () {
            var mockClaim, fraudResult, baseAmount, fraudScore, approvedAmount, approved, autoApproved, gaps, rulesTriggered, recommendations, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        mockClaim = __assign(__assign({}, claimData), { _id: 'simulation', user: claimData.user || 'simulation_user', createdAt: new Date(), updatedAt: new Date() });
                        return [4 /*yield*/, this.fraudService.analyzeFraud(mockClaim)];
                    case 1:
                        fraudResult = _b.sent();
                        baseAmount = claimData.estimatedAmount || claimData.amount || 0;
                        fraudScore = fraudResult.riskScore;
                        approvedAmount = 0;
                        approved = false;
                        autoApproved = false;
                        gaps = [];
                        rulesTriggered = [];
                        recommendations = [];
                        // Determine approval based on fraud score and rules
                        if (fraudScore < 30) {
                            approved = true;
                            autoApproved = true;
                            approvedAmount = baseAmount;
                            recommendations.push('Low risk claim - auto-approved');
                        }
                        else if (fraudScore < 60) {
                            approved = true;
                            autoApproved = false;
                            approvedAmount = Math.floor(baseAmount * 0.8); // 80% of claimed amount
                            recommendations.push('Medium risk - manual review recommended');
                            rulesTriggered.push('MEDIUM_RISK_REVIEW');
                        }
                        else {
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
                        if (!((_a = claimData.claimDetails) === null || _a === void 0 ? void 0 : _a.incidentDate)) {
                            gaps.push('Missing incident date');
                            rulesTriggered.push('MISSING_INCIDENT_DATE');
                        }
                        // Voice data analysis
                        if (claimData.voiceData) {
                            if (claimData.voiceData.confidence < 0.7) {
                                gaps.push('Low voice recognition confidence');
                                rulesTriggered.push('LOW_VOICE_CONFIDENCE');
                            }
                        }
                        else {
                            gaps.push('No voice data provided');
                        }
                        // Amount validation
                        if (baseAmount > 50000) {
                            rulesTriggered.push('HIGH_AMOUNT_REVIEW');
                            recommendations.push('High amount claim requires senior review');
                        }
                        // Add recommendations based on gaps
                        if (gaps.length > 0) {
                            recommendations.push("Address ".concat(gaps.length, " documentation gap(s)"));
                        }
                        if (fraudResult.riskFactors.length > 0) {
                            recommendations.push("Review ".concat(fraudResult.riskFactors.length, " risk factor(s)"));
                        }
                        return [2 /*return*/, {
                                approved: approved,
                                approvedAmount: approvedAmount,
                                gaps: gaps,
                                rulesTriggered: rulesTriggered,
                                fraudScore: fraudScore,
                                autoApproved: autoApproved,
                                recommendations: recommendations
                            }];
                    case 2:
                        error_1 = _b.sent();
                        console.error('Error in claim simulation:', error_1);
                        return [2 /*return*/, {
                                approved: false,
                                approvedAmount: 0,
                                gaps: ['Simulation error occurred'],
                                rulesTriggered: ['SYSTEM_ERROR'],
                                fraudScore: 100,
                                autoApproved: false,
                                recommendations: ['Manual review required due to system error']
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Quick fraud check for real-time validation
     */
    FraudDetectionService.prototype.quickFraudCheck = function (claimData) {
        return __awaiter(this, void 0, void 0, function () {
            var flags, score, amount, riskLevel;
            return __generator(this, function (_a) {
                flags = [];
                score = 0;
                amount = claimData.estimatedAmount || claimData.amount || 0;
                if (amount > 100000) {
                    score += 40;
                    flags.push('VERY_HIGH_AMOUNT');
                }
                else if (amount > 25000) {
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
                if (score < 25) {
                    riskLevel = 'LOW';
                }
                else if (score < 50) {
                    riskLevel = 'MEDIUM';
                }
                else {
                    riskLevel = 'HIGH';
                }
                return [2 /*return*/, {
                        riskLevel: riskLevel,
                        score: score,
                        flags: flags
                    }];
            });
        });
    };
    return FraudDetectionService;
}());
exports.FraudDetectionService = FraudDetectionService;
// Export singleton instance
exports.fraudDetectionService = new FraudDetectionService();
// Export the simulateClaim function for direct import
var simulateClaim = function (claimData) {
    return exports.fraudDetectionService.simulateClaim(claimData);
};
exports.simulateClaim = simulateClaim;
