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
exports.triggerAgentEscalation = exports.EscalationService = void 0;
var logger_1 = require("../utils/logger");
var EscalationService = /** @class */ (function () {
    function EscalationService() {
    }
    /**
     * Determines if a claim should be escalated based on various factors
     */
    EscalationService.shouldEscalate = function (claim, fraudScore) {
        var _a, _b;
        try {
            // High-value claims
            if (claim.estimatedAmount && claim.estimatedAmount > 25000) {
                return {
                    shouldEscalate: true,
                    reason: 'High-value claim requires agent review',
                    level: 2
                };
            }
            // High fraud risk
            if (fraudScore && fraudScore >= 50) {
                return {
                    shouldEscalate: true,
                    reason: 'High fraud risk detected',
                    level: 3
                };
            }
            // Medium fraud risk with additional factors
            if (fraudScore && fraudScore >= 25) {
                var docCount = ((_a = claim.documents) === null || _a === void 0 ? void 0 : _a.length) || 0;
                if (docCount < 2) {
                    return {
                        shouldEscalate: true,
                        reason: 'Medium fraud risk with insufficient documentation',
                        level: 2
                    };
                }
            }
            // Complex claim types
            if (claim.type === 'accident' && claim.estimatedAmount && claim.estimatedAmount > 10000) {
                return {
                    shouldEscalate: true,
                    reason: 'Complex accident claim requires investigation',
                    level: 2
                };
            }
            // Multiple previous escalations
            if (claim.escalationHistory && claim.escalationHistory.length > 1) {
                return {
                    shouldEscalate: true,
                    reason: 'Repeated escalations indicate complex case',
                    level: 3
                };
            }
            // Low voice confidence with high claim amount
            if (((_b = claim.voiceData) === null || _b === void 0 ? void 0 : _b.confidence) && claim.voiceData.confidence < 0.6 &&
                claim.estimatedAmount && claim.estimatedAmount > 5000) {
                return {
                    shouldEscalate: true,
                    reason: 'Low voice confidence on significant claim',
                    level: 2
                };
            }
            return {
                shouldEscalate: false,
                reason: 'Claim meets automated processing criteria',
                level: 1
            };
        }
        catch (error) {
            logger_1.logger.error('Error determining escalation need:', error);
            return {
                shouldEscalate: true,
                reason: 'Error in automated processing',
                level: 2
            };
        }
    };
    /**
     * Creates an escalation request
     */
    EscalationService.createEscalation = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var targetLevel_1, escalationLevel, confirmationDeadline, escalationStatus;
            return __generator(this, function (_a) {
                try {
                    logger_1.logger.info("Creating escalation for claim ".concat(request.claimId));
                    targetLevel_1 = 2;
                    if (request.urgency === 'critical') {
                        targetLevel_1 = 4;
                    }
                    else if (request.urgency === 'high') {
                        targetLevel_1 = 3;
                    }
                    else if (request.urgency === 'medium') {
                        targetLevel_1 = 2;
                    }
                    escalationLevel = this.ESCALATION_LEVELS.find(function (level) { return level.level === targetLevel_1; });
                    if (!escalationLevel) {
                        throw new Error("Invalid escalation level: ".concat(targetLevel_1));
                    }
                    confirmationDeadline = void 0;
                    if (escalationLevel.confirmationRequired) {
                        confirmationDeadline = new Date();
                        confirmationDeadline.setHours(confirmationDeadline.getHours() + escalationLevel.maxResponseTime);
                    }
                    escalationStatus = {
                        currentLevel: targetLevel_1,
                        status: 'pending',
                        estimatedResponseTime: escalationLevel.maxResponseTime,
                        confirmationDeadline: confirmationDeadline,
                        escalationHistory: [
                            {
                                level: targetLevel_1,
                                timestamp: new Date(),
                                reason: request.reason
                            }
                        ]
                    };
                    // Assign agent based on level (mock implementation)
                    if (targetLevel_1 >= 2) {
                        escalationStatus.assignedAgent = this.assignAgent(targetLevel_1, request.urgency);
                    }
                    logger_1.logger.info("Escalation created for claim ".concat(request.claimId, " at level ").concat(targetLevel_1));
                    return [2 /*return*/, escalationStatus];
                }
                catch (error) {
                    logger_1.logger.error('Error creating escalation:', error);
                    throw new Error('Failed to create escalation request');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Processes agent confirmation for escalated claims
     */
    EscalationService.processConfirmation = function (claimId, agentId, action, notes) {
        return __awaiter(this, void 0, void 0, function () {
            var currentTime, nextLevel;
            return __generator(this, function (_a) {
                try {
                    logger_1.logger.info("Processing confirmation for claim ".concat(claimId, " by agent ").concat(agentId, ": ").concat(action));
                    currentTime = new Date();
                    if (action === 'confirm') {
                        return [2 /*return*/, {
                                currentLevel: 2,
                                status: 'confirmed',
                                assignedAgent: agentId,
                                estimatedResponseTime: 2,
                                escalationHistory: [
                                    {
                                        level: 2,
                                        timestamp: currentTime,
                                        reason: 'Agent confirmed claim for processing',
                                        agent: agentId
                                    }
                                ]
                            }];
                    }
                    else if (action === 'escalate') {
                        nextLevel = 3;
                        return [2 /*return*/, {
                                currentLevel: nextLevel,
                                status: 'escalated',
                                assignedAgent: this.assignAgent(nextLevel, 'high'),
                                estimatedResponseTime: 1,
                                confirmationDeadline: new Date(currentTime.getTime() + 60 * 60 * 1000), // 1 hour
                                escalationHistory: [
                                    {
                                        level: 2,
                                        timestamp: new Date(currentTime.getTime() - 60 * 60 * 1000),
                                        reason: 'Initial escalation',
                                        agent: agentId
                                    },
                                    {
                                        level: nextLevel,
                                        timestamp: currentTime,
                                        reason: notes || 'Escalated for further investigation',
                                        agent: agentId
                                    }
                                ]
                            }];
                    }
                    else if (action === 'resolve') {
                        return [2 /*return*/, {
                                currentLevel: 2,
                                status: 'resolved',
                                assignedAgent: agentId,
                                estimatedResponseTime: 0,
                                escalationHistory: [
                                    {
                                        level: 2,
                                        timestamp: currentTime,
                                        reason: notes || 'Claim resolved by agent',
                                        agent: agentId
                                    }
                                ]
                            }];
                    }
                    throw new Error("Invalid action: ".concat(action));
                }
                catch (error) {
                    logger_1.logger.error('Error processing confirmation:', error);
                    throw new Error('Failed to process agent confirmation');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets escalation requirements for a specific level
     */
    EscalationService.getEscalationRequirements = function (level) {
        return this.ESCALATION_LEVELS.find(function (l) { return l.level === level; }) || null;
    };
    /**
     * Checks if escalation confirmation has expired
     */
    EscalationService.isConfirmationExpired = function (escalationStatus) {
        if (!escalationStatus.confirmationDeadline) {
            return false;
        }
        return new Date() > escalationStatus.confirmationDeadline;
    };
    /**
     * Gets next escalation level
     */
    EscalationService.getNextEscalationLevel = function (currentLevel) {
        var nextLevel = currentLevel + 1;
        return this.ESCALATION_LEVELS.find(function (level) { return level.level === nextLevel; }) || null;
    };
    /**
     * Calculates priority score for agent assignment
     */
    EscalationService.calculatePriorityScore = function (urgency, claimAmount, waitTime) {
        var score = 0;
        // Base urgency score
        switch (urgency) {
            case 'critical':
                score += 100;
                break;
            case 'high':
                score += 75;
                break;
            case 'medium':
                score += 50;
                break;
            case 'low':
                score += 25;
                break;
        }
        // Claim amount factor
        if (claimAmount) {
            if (claimAmount > 50000)
                score += 30;
            else if (claimAmount > 25000)
                score += 20;
            else if (claimAmount > 10000)
                score += 10;
        }
        // Wait time factor (increase priority for longer waits)
        if (waitTime) {
            score += Math.min(25, waitTime * 5); // Max 25 points for wait time
        }
        return score;
    };
    /**
     * Mock agent assignment based on level and urgency
     */
    EscalationService.assignAgent = function (level, urgency) {
        var agents = {
            2: ['agent_t1_001', 'agent_t1_002', 'agent_t1_003'],
            3: ['agent_senior_001', 'agent_senior_002'],
            4: ['specialist_001', 'specialist_002']
        };
        var availableAgents = agents[level] || ['agent_default'];
        // Simple round-robin assignment (in real implementation, this would check availability)
        var agentIndex = Math.floor(Math.random() * availableAgents.length);
        return availableAgents[agentIndex];
    };
    /**
     * Formats escalation status for client response
     */
    EscalationService.formatEscalationResponse = function (status) {
        var _this = this;
        var currentLevel = this.ESCALATION_LEVELS.find(function (level) { return level.level === status.currentLevel; });
        return {
            level: status.currentLevel,
            levelName: (currentLevel === null || currentLevel === void 0 ? void 0 : currentLevel.name) || 'Unknown',
            status: status.status,
            estimatedResponseTime: status.estimatedResponseTime,
            assignedAgent: status.assignedAgent,
            confirmationDeadline: status.confirmationDeadline,
            requiresConfirmation: (currentLevel === null || currentLevel === void 0 ? void 0 : currentLevel.confirmationRequired) || false,
            history: status.escalationHistory.map(function (entry) {
                var _a;
                return ({
                    level: entry.level,
                    levelName: ((_a = _this.ESCALATION_LEVELS.find(function (l) { return l.level === entry.level; })) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                    timestamp: entry.timestamp,
                    reason: entry.reason,
                    agent: entry.agent
                });
            })
        };
    };
    /**
     * Trigger agent escalation for urgent cases
     */
    EscalationService.triggerAgentEscalation = function (claimId_1, reason_1) {
        return __awaiter(this, arguments, void 0, function (claimId, reason, urgency) {
            var escalationRequest, targetLevel, error_1;
            if (urgency === void 0) { urgency = 'high'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.logger.info("Triggering agent escalation for claim ".concat(claimId));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        escalationRequest = {
                            claimId: claimId,
                            userId: 'system',
                            reason: reason,
                            urgency: urgency
                        };
                        targetLevel = urgency === 'critical' ? 4 : 3;
                        return [4 /*yield*/, this.processEscalation(escalationRequest, targetLevel)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        logger_1.logger.error('Error triggering agent escalation:', error_1);
                        throw new Error('Failed to trigger agent escalation');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process escalation to a specific level
     */
    EscalationService.processEscalation = function (request, targetLevel) {
        return __awaiter(this, void 0, void 0, function () {
            var escalationLevel, confirmationDeadline, escalationStatus;
            return __generator(this, function (_a) {
                logger_1.logger.info("Processing escalation for claim ".concat(request.claimId, " to level ").concat(targetLevel));
                escalationLevel = this.ESCALATION_LEVELS.find(function (level) { return level.level === targetLevel; });
                if (!escalationLevel) {
                    throw new Error("Invalid escalation level: ".concat(targetLevel));
                }
                if (escalationLevel.confirmationRequired) {
                    confirmationDeadline = new Date();
                    confirmationDeadline.setHours(confirmationDeadline.getHours() + escalationLevel.maxResponseTime);
                }
                escalationStatus = {
                    currentLevel: targetLevel,
                    status: 'pending',
                    estimatedResponseTime: escalationLevel.maxResponseTime,
                    confirmationDeadline: confirmationDeadline,
                    escalationHistory: [
                        {
                            level: targetLevel,
                            timestamp: new Date(),
                            reason: request.reason
                        }
                    ]
                };
                // Assign agent based on level
                if (targetLevel >= 2) {
                    escalationStatus.assignedAgent = this.assignAgent(targetLevel, request.urgency);
                }
                logger_1.logger.info("Escalation processed for claim ".concat(request.claimId, " at level ").concat(targetLevel));
                return [2 /*return*/, escalationStatus];
            });
        });
    };
    EscalationService.ESCALATION_LEVELS = [
        {
            level: 1,
            name: 'Automated Processing',
            description: 'Standard automated claim processing',
            maxResponseTime: 24,
            confirmationRequired: false
        },
        {
            level: 2,
            name: 'Tier 1 Agent Review',
            description: 'Basic agent review and verification',
            maxResponseTime: 4,
            confirmationRequired: true
        },
        {
            level: 3,
            name: 'Senior Agent Investigation',
            description: 'Detailed investigation by senior agent',
            maxResponseTime: 2,
            confirmationRequired: true
        },
        {
            level: 4,
            name: 'Specialist Review',
            description: 'Expert specialist review for complex cases',
            maxResponseTime: 1,
            confirmationRequired: true
        }
    ];
    return EscalationService;
}());
exports.EscalationService = EscalationService;
// Export the main function for external use
exports.triggerAgentEscalation = EscalationService.triggerAgentEscalation;
