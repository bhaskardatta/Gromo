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
exports.EscalationWorker = void 0;
var bullmq_1 = require("bullmq");
var escalationService_1 = require("../services/escalationService");
var logger_1 = require("../utils/logger");
var ioredis_1 = require("ioredis");
var EscalationWorker = /** @class */ (function () {
    function EscalationWorker(notificationWorker) {
        this.notificationWorker = notificationWorker;
        // Initialize Redis connection
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: 3,
            lazyConnect: true
        });
        // Initialize BullMQ queue
        this.queue = new bullmq_1.Queue('escalations', {
            connection: this.redis,
            defaultJobOptions: {
                removeOnComplete: 200,
                removeOnFail: 100,
                attempts: 2,
                backoff: {
                    type: 'exponential',
                    delay: 5000
                }
            }
        });
        // Initialize worker
        this.worker = new bullmq_1.Worker('escalations', this.processJob.bind(this), {
            connection: this.redis,
            concurrency: 3,
            limiter: {
                max: 5,
                duration: 1000 // 5 jobs per second
            }
        });
        this.setupEventHandlers();
    }
    /**
     * Process escalation job
     */
    EscalationWorker.prototype.processJob = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, type, claimId, data, _b, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = job.data, type = _a.type, claimId = _a.claimId, data = _a.data;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 13, , 14]);
                        logger_1.logger.info("Processing escalation job ".concat(job.id, ": ").concat(type, " for claim ").concat(claimId));
                        _b = type;
                        switch (_b) {
                            case 'create_escalation': return [3 /*break*/, 2];
                            case 'check_timeout': return [3 /*break*/, 4];
                            case 'process_confirmation': return [3 /*break*/, 6];
                            case 'auto_escalate': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2: return [4 /*yield*/, this.handleCreateEscalation(claimId, data)];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 11];
                    case 4: return [4 /*yield*/, this.handleTimeoutCheck(claimId, data)];
                    case 5:
                        _c.sent();
                        return [3 /*break*/, 11];
                    case 6: return [4 /*yield*/, this.handleConfirmationProcessing(claimId, data)];
                    case 7:
                        _c.sent();
                        return [3 /*break*/, 11];
                    case 8: return [4 /*yield*/, this.handleAutoEscalation(claimId, data)];
                    case 9:
                        _c.sent();
                        return [3 /*break*/, 11];
                    case 10: throw new Error("Unknown escalation job type: ".concat(type));
                    case 11:
                        logger_1.logger.info("Escalation job ".concat(job.id, " completed successfully"));
                        return [4 /*yield*/, job.updateProgress(100)];
                    case 12:
                        _c.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        error_1 = _c.sent();
                        logger_1.logger.error("Escalation job ".concat(job.id, " failed:"), error_1);
                        throw error_1;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle escalation creation
     */
    EscalationWorker.prototype.handleCreateEscalation = function (claimId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var escalationRequest, escalationStatus, timeoutDelay, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        escalationRequest = {
                            claimId: claimId,
                            userId: data.userId,
                            reason: data.reason,
                            urgency: data.urgency,
                            additionalInfo: data.additionalInfo
                        };
                        return [4 /*yield*/, escalationService_1.EscalationService.createEscalation(escalationRequest)];
                    case 1:
                        escalationStatus = _a.sent();
                        if (!escalationStatus.assignedAgent) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.notificationWorker.addNotificationJob({
                                type: 'escalation_alert',
                                recipient: this.getAgentContact(escalationStatus.assignedAgent),
                                claimId: claimId,
                                data: {
                                    escalationLevel: escalationStatus.currentLevel,
                                    urgency: data.urgency,
                                    reason: data.reason,
                                    assignedAgent: escalationStatus.assignedAgent
                                },
                                priority: data.urgency
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!escalationStatus.confirmationDeadline) return [3 /*break*/, 5];
                        timeoutDelay = escalationStatus.confirmationDeadline.getTime() - Date.now();
                        return [4 /*yield*/, this.addEscalationJob({
                                type: 'check_timeout',
                                claimId: claimId,
                                data: {
                                    escalationLevel: escalationStatus.currentLevel,
                                    confirmationDeadline: escalationStatus.confirmationDeadline
                                }
                            }, { delay: timeoutDelay })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        logger_1.logger.info("Escalation created for claim ".concat(claimId, " at level ").concat(escalationStatus.currentLevel));
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        logger_1.logger.error("Error creating escalation for claim ".concat(claimId, ":"), error_2);
                        throw error_2;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle timeout checking
     */
    EscalationWorker.prototype.handleTimeoutCheck = function (claimId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var escalationLevel, confirmationDeadline, deadline, nextLevel, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        escalationLevel = data.escalationLevel, confirmationDeadline = data.confirmationDeadline;
                        deadline = new Date(confirmationDeadline);
                        if (!(new Date() > deadline)) return [3 /*break*/, 4];
                        logger_1.logger.warn("Escalation timeout for claim ".concat(claimId, " at level ").concat(escalationLevel));
                        nextLevel = escalationService_1.EscalationService.getNextEscalationLevel(escalationLevel);
                        if (!nextLevel) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.addEscalationJob({
                                type: 'auto_escalate',
                                claimId: claimId,
                                data: {
                                    fromLevel: escalationLevel,
                                    toLevel: nextLevel.level,
                                    reason: 'Escalation timeout - no confirmation received'
                                },
                                priority: 'high'
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: 
                    // No more escalation levels - send alert to management
                    return [4 /*yield*/, this.notificationWorker.addNotificationJob({
                            type: 'escalation_alert',
                            recipient: process.env.MANAGEMENT_CONTACT || '+1234567890',
                            claimId: claimId,
                            data: {
                                escalationLevel: escalationLevel,
                                urgency: 'urgent',
                                reason: 'Maximum escalation level reached without resolution',
                                requiresImmediateAttention: true
                            },
                            priority: 'urgent'
                        })];
                    case 3:
                        // No more escalation levels - send alert to management
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        logger_1.logger.error("Error checking timeout for claim ".concat(claimId, ":"), error_3);
                        throw error_3;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle confirmation processing
     */
    EscalationWorker.prototype.handleConfirmationProcessing = function (claimId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var agentId, action, notes, escalationStatus, timeoutDelay, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        agentId = data.agentId, action = data.action, notes = data.notes;
                        return [4 /*yield*/, escalationService_1.EscalationService.processConfirmation(claimId, agentId, action, notes)];
                    case 1:
                        escalationStatus = _a.sent();
                        if (!(action === 'confirm')) return [3 /*break*/, 3];
                        // Notify customer of confirmation
                        return [4 /*yield*/, this.notificationWorker.addNotificationJob({
                                type: 'status_update',
                                recipient: data.customerContact,
                                claimId: claimId,
                                data: {
                                    status: 'Confirmed for Processing',
                                    additionalInfo: 'Your claim has been reviewed and confirmed by our agent.'
                                },
                                priority: 'medium'
                            })];
                    case 2:
                        // Notify customer of confirmation
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 3:
                        if (!(action === 'escalate' && escalationStatus.assignedAgent)) return [3 /*break*/, 7];
                        // Notify new agent of escalation
                        return [4 /*yield*/, this.notificationWorker.addNotificationJob({
                                type: 'escalation_alert',
                                recipient: this.getAgentContact(escalationStatus.assignedAgent),
                                claimId: claimId,
                                data: {
                                    escalationLevel: escalationStatus.currentLevel,
                                    urgency: 'high',
                                    reason: notes || 'Escalated for further investigation',
                                    previousAgent: agentId
                                },
                                priority: 'high'
                            })];
                    case 4:
                        // Notify new agent of escalation
                        _a.sent();
                        if (!escalationStatus.confirmationDeadline) return [3 /*break*/, 6];
                        timeoutDelay = escalationStatus.confirmationDeadline.getTime() - Date.now();
                        return [4 /*yield*/, this.addEscalationJob({
                                type: 'check_timeout',
                                claimId: claimId,
                                data: {
                                    escalationLevel: escalationStatus.currentLevel,
                                    confirmationDeadline: escalationStatus.confirmationDeadline
                                }
                            }, { delay: timeoutDelay })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        if (!(action === 'resolve')) return [3 /*break*/, 9];
                        // Notify customer of resolution
                        return [4 /*yield*/, this.notificationWorker.addNotificationJob({
                                type: 'status_update',
                                recipient: data.customerContact,
                                claimId: claimId,
                                data: {
                                    status: 'Resolved',
                                    additionalInfo: notes || 'Your claim has been resolved by our team.'
                                },
                                priority: 'high'
                            })];
                    case 8:
                        // Notify customer of resolution
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        logger_1.logger.info("Confirmation processed for claim ".concat(claimId, ": ").concat(action, " by agent ").concat(agentId));
                        return [3 /*break*/, 11];
                    case 10:
                        error_4 = _a.sent();
                        logger_1.logger.error("Error processing confirmation for claim ".concat(claimId, ":"), error_4);
                        throw error_4;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle auto-escalation
     */
    EscalationWorker.prototype.handleAutoEscalation = function (claimId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var fromLevel, toLevel, reason, newEscalation, timeoutDelay, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        fromLevel = data.fromLevel, toLevel = data.toLevel, reason = data.reason;
                        return [4 /*yield*/, escalationService_1.EscalationService.createEscalation({
                                claimId: claimId,
                                userId: 'system',
                                reason: reason,
                                urgency: 'high'
                            })];
                    case 1:
                        newEscalation = _a.sent();
                        if (!newEscalation.assignedAgent) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.notificationWorker.addNotificationJob({
                                type: 'escalation_alert',
                                recipient: this.getAgentContact(newEscalation.assignedAgent),
                                claimId: claimId,
                                data: {
                                    escalationLevel: toLevel,
                                    urgency: 'urgent',
                                    reason: "Auto-escalated from Level ".concat(fromLevel, ": ").concat(reason),
                                    isAutoEscalation: true
                                },
                                priority: 'urgent'
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!newEscalation.confirmationDeadline) return [3 /*break*/, 5];
                        timeoutDelay = newEscalation.confirmationDeadline.getTime() - Date.now();
                        return [4 /*yield*/, this.addEscalationJob({
                                type: 'check_timeout',
                                claimId: claimId,
                                data: {
                                    escalationLevel: toLevel,
                                    confirmationDeadline: newEscalation.confirmationDeadline
                                }
                            }, { delay: timeoutDelay })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        logger_1.logger.info("Auto-escalated claim ".concat(claimId, " from level ").concat(fromLevel, " to level ").concat(toLevel));
                        return [3 /*break*/, 7];
                    case 6:
                        error_5 = _a.sent();
                        logger_1.logger.error("Error auto-escalating claim ".concat(claimId, ":"), error_5);
                        throw error_5;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add escalation job to queue
     */
    EscalationWorker.prototype.addEscalationJob = function (jobData, options) {
        return __awaiter(this, void 0, void 0, function () {
            var job, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.queue.add('escalation', jobData, {
                                priority: (options === null || options === void 0 ? void 0 : options.priority) || this.getPriorityScore(jobData),
                                delay: (options === null || options === void 0 ? void 0 : options.delay) || 0,
                                jobId: options === null || options === void 0 ? void 0 : options.jobId
                            })];
                    case 1:
                        job = _a.sent();
                        logger_1.logger.info("Escalation job added to queue: ".concat(job.id, " (").concat(jobData.type, ")"));
                        return [2 /*return*/, job];
                    case 2:
                        error_6 = _a.sent();
                        logger_1.logger.error('Error adding escalation job to queue:', error_6);
                        throw new Error('Failed to queue escalation job');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Schedule escalation timeout check
     */
    EscalationWorker.prototype.scheduleTimeoutCheck = function (claimId, escalationLevel, confirmationDeadline) {
        return __awaiter(this, void 0, void 0, function () {
            var delay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delay = confirmationDeadline.getTime() - Date.now();
                        return [4 /*yield*/, this.addEscalationJob({
                                type: 'check_timeout',
                                claimId: claimId,
                                data: {
                                    escalationLevel: escalationLevel,
                                    confirmationDeadline: confirmationDeadline
                                }
                            }, { delay: delay })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Cancel escalation job
     */
    EscalationWorker.prototype.cancelEscalationJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var job, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.queue.getJob(jobId)];
                    case 1:
                        job = _a.sent();
                        if (!job) return [3 /*break*/, 3];
                        return [4 /*yield*/, job.remove()];
                    case 2:
                        _a.sent();
                        logger_1.logger.info("Escalation job ".concat(jobId, " cancelled"));
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        error_7 = _a.sent();
                        logger_1.logger.error("Error cancelling escalation job ".concat(jobId, ":"), error_7);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get queue statistics
     */
    EscalationWorker.prototype.getQueueStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, waiting, active, completed, failed, delayed;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.queue.getWaiting(),
                            this.queue.getActive(),
                            this.queue.getCompleted(),
                            this.queue.getFailed(),
                            this.queue.getDelayed()
                        ])];
                    case 1:
                        _a = _b.sent(), waiting = _a[0], active = _a[1], completed = _a[2], failed = _a[3], delayed = _a[4];
                        return [2 /*return*/, {
                                waiting: waiting.length,
                                active: active.length,
                                completed: completed.length,
                                failed: failed.length,
                                delayed: delayed.length
                            }];
                }
            });
        });
    };
    /**
     * Get agent contact information (mock implementation)
     */
    EscalationWorker.prototype.getAgentContact = function (agentId) {
        // In real implementation, this would fetch from database
        var agentContacts = {
            'agent_t1_001': '+1234567001',
            'agent_t1_002': '+1234567002',
            'agent_t1_003': '+1234567003',
            'agent_senior_001': '+1234568001',
            'agent_senior_002': '+1234568002',
            'specialist_001': '+1234569001',
            'specialist_002': '+1234569002'
        };
        return agentContacts[agentId] || '+1234567000'; // Default contact
    };
    /**
     * Get priority score for job
     */
    EscalationWorker.prototype.getPriorityScore = function (jobData) {
        var priority = 50; // Default medium priority
        switch (jobData.priority) {
            case 'urgent':
                priority = 100;
                break;
            case 'high':
                priority = 75;
                break;
            case 'medium':
                priority = 50;
                break;
            case 'low':
                priority = 25;
                break;
        }
        // Boost priority for time-sensitive jobs
        if (jobData.type === 'check_timeout') {
            priority = Math.max(priority, 80);
        }
        else if (jobData.type === 'auto_escalate') {
            priority = Math.max(priority, 90);
        }
        return priority;
    };
    /**
     * Setup event handlers
     */
    EscalationWorker.prototype.setupEventHandlers = function () {
        this.worker.on('completed', function (job) {
            logger_1.logger.info("Escalation job completed: ".concat(job.id));
        });
        this.worker.on('failed', function (job, err) {
            logger_1.logger.error("Escalation job failed: ".concat(job === null || job === void 0 ? void 0 : job.id), err);
        });
        this.worker.on('progress', function (job, progress) {
            logger_1.logger.debug("Escalation job progress: ".concat(job.id, " - ").concat(progress, "%"));
        });
        this.worker.on('stalled', function (jobId) {
            logger_1.logger.warn("Escalation job stalled: ".concat(jobId));
        });
        this.worker.on('error', function (err) {
            logger_1.logger.error('Escalation worker error:', err);
        });
    };
    /**
     * Start the worker
     */
    EscalationWorker.prototype.start = function () {
        logger_1.logger.info('Escalation worker started');
    };
    /**
     * Graceful shutdown
     */
    EscalationWorker.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        logger_1.logger.info('Shutting down escalation worker...');
                        return [4 /*yield*/, this.worker.close()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.queue.close()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.redis.disconnect()];
                    case 3:
                        _a.sent();
                        logger_1.logger.info('Escalation worker shutdown complete');
                        return [3 /*break*/, 5];
                    case 4:
                        error_8 = _a.sent();
                        logger_1.logger.error('Error during escalation worker shutdown:', error_8);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return EscalationWorker;
}());
exports.EscalationWorker = EscalationWorker;
