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
exports.NotificationService = void 0;
var twilio_1 = require("twilio");
var logger_1 = require("../utils/logger");
var NotificationService = /** @class */ (function () {
    function NotificationService() {
    }
    /**
     * Initialize Twilio client
     */
    NotificationService.initializeTwilio = function () {
        if (!this.twilioClient) {
            var accountSid = process.env.TWILIO_ACCOUNT_SID;
            var authToken = process.env.TWILIO_AUTH_TOKEN;
            if (!accountSid || !authToken) {
                throw new Error('Twilio credentials not configured');
            }
            this.twilioClient = (0, twilio_1.default)(accountSid, authToken);
            logger_1.logger.info('Twilio client initialized');
        }
        return this.twilioClient;
    };
    /**
     * Send WhatsApp message using Twilio
     */
    NotificationService.sendWhatsAppMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var client, twilioMessage, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.logger.info("Sending WhatsApp message to ".concat(message.to));
                        client = this.initializeTwilio();
                        return [4 /*yield*/, client.messages.create({
                                body: message.body,
                                from: "whatsapp:".concat(message.from),
                                to: "whatsapp:".concat(message.to),
                                mediaUrl: message.mediaUrl
                            })];
                    case 1:
                        twilioMessage = _a.sent();
                        logger_1.logger.info("WhatsApp message sent successfully: ".concat(twilioMessage.sid));
                        return [2 /*return*/, {
                                success: true,
                                messageId: twilioMessage.sid,
                                timestamp: new Date()
                            }];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.error('Error sending WhatsApp message:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                                timestamp: new Date()
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send SMS message using Twilio
     */
    NotificationService.sendSMSMessage = function (to, body, from) {
        return __awaiter(this, void 0, void 0, function () {
            var client, twilioMessage, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.logger.info("Sending SMS to ".concat(to));
                        client = this.initializeTwilio();
                        return [4 /*yield*/, client.messages.create({
                                body: body,
                                from: from || process.env.TWILIO_PHONE_NUMBER,
                                to: to
                            })];
                    case 1:
                        twilioMessage = _a.sent();
                        logger_1.logger.info("SMS sent successfully: ".concat(twilioMessage.sid));
                        return [2 /*return*/, {
                                success: true,
                                messageId: twilioMessage.sid,
                                timestamp: new Date()
                            }];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('Error sending SMS:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: error_2 instanceof Error ? error_2.message : 'Unknown error',
                                timestamp: new Date()
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send notification based on type
     */
    NotificationService.sendNotification = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        _a = payload.type;
                        switch (_a) {
                            case 'whatsapp': return [3 /*break*/, 1];
                            case 'sms': return [3 /*break*/, 3];
                            case 'email': return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 6];
                    case 1: return [4 /*yield*/, this.sendWhatsAppMessage({
                            to: payload.recipient,
                            from: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
                            body: payload.message
                        })];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.sendSMSMessage(payload.recipient, payload.message)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5:
                        // Email implementation would go here
                        logger_1.logger.info('Email notifications not yet implemented');
                        return [2 /*return*/, {
                                success: false,
                                error: 'Email notifications not implemented',
                                timestamp: new Date()
                            }];
                    case 6: throw new Error("Unsupported notification type: ".concat(payload.type));
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_3 = _b.sent();
                        logger_1.logger.error('Error sending notification:', error_3);
                        return [2 /*return*/, {
                                success: false,
                                error: error_3 instanceof Error ? error_3.message : 'Unknown error',
                                timestamp: new Date()
                            }];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send claim submission confirmation
     */
    NotificationService.sendClaimConfirmation = function (phoneNumber, claimId, claimType, estimatedAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = this.formatClaimConfirmationMessage(claimId, claimType, estimatedAmount);
                        return [4 /*yield*/, this.sendNotification({
                                type: 'whatsapp',
                                recipient: phoneNumber,
                                message: message,
                                priority: 'medium'
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Send escalation notification to agent
     */
    NotificationService.sendEscalationNotification = function (agentContact, claimId, escalationLevel, urgency, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = this.formatEscalationMessage(claimId, escalationLevel, urgency, reason);
                        return [4 /*yield*/, this.sendNotification({
                                type: 'whatsapp',
                                recipient: agentContact,
                                message: message,
                                priority: urgency
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Send fraud alert notification
     */
    NotificationService.sendFraudAlert = function (agentContact, claimId, fraudScore, riskFactors) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = this.formatFraudAlertMessage(claimId, fraudScore, riskFactors);
                        return [4 /*yield*/, this.sendNotification({
                                type: 'whatsapp',
                                recipient: agentContact,
                                message: message,
                                priority: 'urgent'
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Send status update to customer
     */
    NotificationService.sendStatusUpdate = function (phoneNumber, claimId, status, additionalInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = this.formatStatusUpdateMessage(claimId, status, additionalInfo);
                        return [4 /*yield*/, this.sendNotification({
                                type: 'whatsapp',
                                recipient: phoneNumber,
                                message: message,
                                priority: 'medium'
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Send payout notification
     */
    NotificationService.sendPayoutNotification = function (phoneNumber, claimId, payoutAmount, paymentMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = this.formatPayoutMessage(claimId, payoutAmount, paymentMethod);
                        return [4 /*yield*/, this.sendNotification({
                                type: 'whatsapp',
                                recipient: phoneNumber,
                                message: message,
                                priority: 'high'
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Format claim confirmation message
     */
    NotificationService.formatClaimConfirmationMessage = function (claimId, claimType, estimatedAmount) {
        var message = "\uD83D\uDD14 *ClaimAssist Pro - Claim Submitted*\n\n";
        message += "\u2705 Your ".concat(claimType, " claim has been successfully submitted.\n\n");
        message += "\uD83D\uDCCB *Claim ID:* ".concat(claimId, "\n");
        message += "\uD83D\uDCC5 *Submitted:* ".concat(new Date().toLocaleDateString(), "\n");
        if (estimatedAmount) {
            message += "\uD83D\uDCB0 *Estimated Amount:* $".concat(estimatedAmount.toLocaleString(), "\n");
        }
        message += "\n\u23F1\uFE0F *Next Steps:*\n";
        message += "\u2022 We'll review your claim within 24 hours\n";
        message += "\u2022 You'll receive updates via WhatsApp\n";
        message += "\u2022 Additional documents may be requested\n\n";
        message += "\uD83D\uDCDE Need help? Reply to this message or call our support line.\n\n";
        message += "Thank you for choosing ClaimAssist Pro! \uD83E\uDD1D";
        return message;
    };
    /**
     * Format escalation message for agents
     */
    NotificationService.formatEscalationMessage = function (claimId, escalationLevel, urgency, reason) {
        var message = "\uD83D\uDEA8 *ClaimAssist Pro - Escalation Alert*\n\n";
        message += "\u26A0\uFE0F Claim requires Level ".concat(escalationLevel, " attention\n\n");
        message += "\uD83D\uDCCB *Claim ID:* ".concat(claimId, "\n");
        message += "\uD83D\uDD25 *Urgency:* ".concat(urgency.toUpperCase(), "\n");
        message += "\uD83D\uDCDD *Reason:* ".concat(reason, "\n");
        message += "\u23F0 *Escalated:* ".concat(new Date().toLocaleString(), "\n\n");
        message += "\uD83D\uDC46 Please review and take appropriate action.\n";
        message += "\u23F1\uFE0F Response required within designated timeframe.";
        return message;
    };
    /**
     * Format fraud alert message
     */
    NotificationService.formatFraudAlertMessage = function (claimId, fraudScore, riskFactors) {
        var message = "\uD83D\uDEA9 *ClaimAssist Pro - Fraud Alert*\n\n";
        message += "\u26A0\uFE0F HIGH PRIORITY - Potential fraud detected\n\n";
        message += "\uD83D\uDCCB *Claim ID:* ".concat(claimId, "\n");
        message += "\uD83D\uDCCA *Fraud Score:* ".concat(fraudScore, "/100\n");
        message += "\uD83D\uDD0D *Risk Factors:*\n";
        riskFactors.forEach(function (factor) {
            message += "\u2022 ".concat(factor, "\n");
        });
        message += "\n\uD83D\uDD12 *Action Required:*\n";
        message += "\u2022 Immediate investigation needed\n";
        message += "\u2022 Verify all claim details\n";
        message += "\u2022 Contact customer if necessary\n\n";
        message += "\u23F0 Time-sensitive - please respond ASAP";
        return message;
    };
    /**
     * Format status update message
     */
    NotificationService.formatStatusUpdateMessage = function (claimId, status, additionalInfo) {
        var message = "\uD83D\uDCF1 *ClaimAssist Pro - Claim Update*\n\n";
        message += "\uD83D\uDCCB *Claim ID:* ".concat(claimId, "\n");
        message += "\uD83D\uDCCA *Status:* ".concat(status, "\n");
        message += "\u23F0 *Updated:* ".concat(new Date().toLocaleString(), "\n");
        if (additionalInfo) {
            message += "\n\uD83D\uDCDD *Details:*\n".concat(additionalInfo, "\n");
        }
        message += "\n\uD83D\uDCAC Questions? Reply to this message for assistance.";
        return message;
    };
    /**
     * Format payout notification message
     */
    NotificationService.formatPayoutMessage = function (claimId, payoutAmount, paymentMethod) {
        var message = "\uD83C\uDF89 *ClaimAssist Pro - Payout Approved*\n\n";
        message += "\u2705 Great news! Your claim has been approved.\n\n";
        message += "\uD83D\uDCCB *Claim ID:* ".concat(claimId, "\n");
        message += "\uD83D\uDCB0 *Payout Amount:* $".concat(payoutAmount.toLocaleString(), "\n");
        message += "\uD83D\uDCB3 *Payment Method:* ".concat(paymentMethod, "\n");
        message += "\uD83D\uDCC5 *Processing Date:* ".concat(new Date().toLocaleDateString(), "\n\n");
        message += "\u23F1\uFE0F *Expected Timeline:*\n";
        message += "\u2022 Bank transfer: 1-3 business days\n";
        message += "\u2022 Check: 5-7 business days\n\n";
        message += "\uD83D\uDCE7 You'll receive payment confirmation via email.\n\n";
        message += "Thank you for your patience! \uD83D\uDE4F";
        return message;
    };
    /**
     * Validate phone number format
     */
    NotificationService.validatePhoneNumber = function (phoneNumber) {
        // Basic phone number validation (E.164 format)
        var phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    };
    /**
     * Format phone number to E.164 standard
     */
    NotificationService.formatPhoneNumber = function (phoneNumber, countryCode) {
        if (countryCode === void 0) { countryCode = '+1'; }
        // Remove all non-digit characters
        var digits = phoneNumber.replace(/\D/g, '');
        // Add country code if not present
        if (!digits.startsWith(countryCode.replace('+', ''))) {
            return "".concat(countryCode).concat(digits);
        }
        return "+".concat(digits);
    };
    NotificationService.twilioClient = null;
    return NotificationService;
}());
exports.NotificationService = NotificationService;
