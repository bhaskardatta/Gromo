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
exports.NotificationWorker = void 0;
var bullmq_1 = require("bullmq");
var notificationService_1 = require("../services/notificationService");
var logger_1 = require("../utils/logger");
var ioredis_1 = require("ioredis");
var NotificationWorker = /** @class */ (function () {
    function NotificationWorker() {
        // Initialize Redis connection
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: 3,
            lazyConnect: true
        });
        // Initialize BullMQ queue
        this.queue = new bullmq_1.Queue('notifications', {
            connection: this.redis,
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 50,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            }
        });
        // Initialize worker
        this.worker = new bullmq_1.Worker('notifications', this.processJob.bind(this), {
            connection: this.redis,
            concurrency: 5,
            limiter: {
                max: 10,
                duration: 1000 // 10 jobs per second
            }
        });
        this.setupEventHandlers();
    }
    /**
     * Process notification job
     */
    NotificationWorker.prototype.processJob = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, type, recipient, claimId, data, _b, priority, result, _c, error_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = job.data, type = _a.type, recipient = _a.recipient, claimId = _a.claimId, data = _a.data, _b = _a.priority, priority = _b === void 0 ? 'medium' : _b;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 16, , 18]);
                        logger_1.logger.info("Processing notification job ".concat(job.id, ": ").concat(type, " for claim ").concat(claimId));
                        result = void 0;
                        _c = type;
                        switch (_c) {
                            case 'claim_confirmation': return [3 /*break*/, 2];
                            case 'escalation_alert': return [3 /*break*/, 4];
                            case 'fraud_alert': return [3 /*break*/, 6];
                            case 'status_update': return [3 /*break*/, 8];
                            case 'payout_notification': return [3 /*break*/, 10];
                        }
                        return [3 /*break*/, 12];
                    case 2: return [4 /*yield*/, notificationService_1.NotificationService.sendClaimConfirmation(recipient, claimId, data.claimType, data.estimatedAmount)];
                    case 3:
                        result = _d.sent();
                        return [3 /*break*/, 13];
                    case 4: return [4 /*yield*/, notificationService_1.NotificationService.sendEscalationNotification(recipient, claimId, data.escalationLevel, data.urgency, data.reason)];
                    case 5:
                        result = _d.sent();
                        return [3 /*break*/, 13];
                    case 6: return [4 /*yield*/, notificationService_1.NotificationService.sendFraudAlert(recipient, claimId, data.fraudScore, data.riskFactors)];
                    case 7:
                        result = _d.sent();
                        return [3 /*break*/, 13];
                    case 8: return [4 /*yield*/, notificationService_1.NotificationService.sendStatusUpdate(recipient, claimId, data.status, data.additionalInfo)];
                    case 9:
                        result = _d.sent();
                        return [3 /*break*/, 13];
                    case 10: return [4 /*yield*/, notificationService_1.NotificationService.sendPayoutNotification(recipient, claimId, data.payoutAmount, data.paymentMethod)];
                    case 11:
                        result = _d.sent();
                        return [3 /*break*/, 13];
                    case 12: throw new Error("Unknown notification type: ".concat(type));
                    case 13:
                        if (!result.success) {
                            throw new Error("Notification failed: ".concat(result.error));
                        }
                        logger_1.logger.info("Notification job ".concat(job.id, " completed successfully: ").concat(result.messageId));
                        // Update job progress
                        return [4 /*yield*/, job.updateProgress(100)];
                    case 14:
                        // Update job progress
                        _d.sent();
                        // Store result for tracking
                        return [4 /*yield*/, job.updateData(__assign(__assign({}, job.data), { result: {
                                    success: true,
                                    messageId: result.messageId,
                                    timestamp: result.timestamp
                                } }))];
                    case 15:
                        // Store result for tracking
                        _d.sent();
                        return [3 /*break*/, 18];
                    case 16:
                        error_1 = _d.sent();
                        logger_1.logger.error("Notification job ".concat(job.id, " failed:"), error_1);
                        // Update job data with error info
                        return [4 /*yield*/, job.updateData(__assign(__assign({}, job.data), { result: {
                                    success: false,
                                    error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                                    timestamp: new Date()
                                } }))];
                    case 17:
                        // Update job data with error info
                        _d.sent();
                        throw error_1; // Re-throw to trigger retry mechanism
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add notification job to queue
     */
    NotificationWorker.prototype.addNotificationJob = function (jobData, options) {
        return __awaiter(this, void 0, void 0, function () {
            var priority, job, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        priority = 0;
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
                        // Special handling for critical notification types
                        if (jobData.type === 'fraud_alert') {
                            priority = Math.max(priority, 90);
                        }
                        else if (jobData.type === 'escalation_alert') {
                            priority = Math.max(priority, 80);
                        }
                        return [4 /*yield*/, this.queue.add('notification', jobData, {
                                priority: priority,
                                delay: (options === null || options === void 0 ? void 0 : options.delay) || 0,
                                jobId: options === null || options === void 0 ? void 0 : options.jobId,
                                attempts: jobData.retries || 3
                            })];
                    case 1:
                        job = _a.sent();
                        logger_1.logger.info("Notification job added to queue: ".concat(job.id, " (").concat(jobData.type, ")"));
                        return [2 /*return*/, job];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('Error adding notification job to queue:', error_2);
                        throw new Error('Failed to queue notification');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add bulk notification jobs
     */
    NotificationWorker.prototype.addBulkNotificationJobs = function (jobs) {
        return __awaiter(this, void 0, void 0, function () {
            var jobsWithOptions, bullJobs, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        jobsWithOptions = jobs.map(function (jobData) { return ({
                            name: 'notification',
                            data: jobData,
                            opts: {
                                priority: _this.getPriorityScore(jobData),
                                attempts: jobData.retries || 3
                            }
                        }); });
                        return [4 /*yield*/, this.queue.addBulk(jobsWithOptions)];
                    case 1:
                        bullJobs = _a.sent();
                        logger_1.logger.info("".concat(bullJobs.length, " notification jobs added to queue"));
                        return [2 /*return*/, bullJobs];
                    case 2:
                        error_3 = _a.sent();
                        logger_1.logger.error('Error adding bulk notification jobs:', error_3);
                        throw new Error('Failed to queue bulk notifications');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Schedule delayed notification
     */
    NotificationWorker.prototype.scheduleNotification = function (jobData, delayMs) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.addNotificationJob(jobData, { delay: delayMs })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Cancel notification job
     */
    NotificationWorker.prototype.cancelNotification = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var job, error_4;
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
                        logger_1.logger.info("Notification job ".concat(jobId, " cancelled"));
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        error_4 = _a.sent();
                        logger_1.logger.error("Error cancelling notification job ".concat(jobId, ":"), error_4);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get queue statistics
     */
    NotificationWorker.prototype.getQueueStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, waiting, active, completed, failed, delayed, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
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
                    case 2:
                        error_5 = _b.sent();
                        logger_1.logger.error('Error getting queue stats:', error_5);
                        throw new Error('Failed to get queue statistics');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up old jobs
     */
    NotificationWorker.prototype.cleanQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Clean completed jobs older than 24 hours
                        return [4 /*yield*/, this.queue.clean(24 * 60 * 60 * 1000, 100, 'completed')];
                    case 1:
                        // Clean completed jobs older than 24 hours
                        _a.sent();
                        // Clean failed jobs older than 7 days
                        return [4 /*yield*/, this.queue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed')];
                    case 2:
                        // Clean failed jobs older than 7 days
                        _a.sent();
                        logger_1.logger.info('Queue cleanup completed');
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        logger_1.logger.error('Error cleaning queue:', error_6);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Setup event handlers for worker
     */
    NotificationWorker.prototype.setupEventHandlers = function () {
        this.worker.on('completed', function (job) {
            logger_1.logger.info("Notification job completed: ".concat(job.id));
        });
        this.worker.on('failed', function (job, err) {
            logger_1.logger.error("Notification job failed: ".concat(job === null || job === void 0 ? void 0 : job.id), err);
        });
        this.worker.on('progress', function (job, progress) {
            logger_1.logger.debug("Notification job progress: ".concat(job.id, " - ").concat(progress, "%"));
        });
        this.worker.on('stalled', function (jobId) {
            logger_1.logger.warn("Notification job stalled: ".concat(jobId));
        });
        this.worker.on('error', function (err) {
            logger_1.logger.error('Notification worker error:', err);
        });
        // Queue events
        this.queue.on('error', function (err) {
            logger_1.logger.error('Notification queue error:', err);
        });
    };
    /**
     * Get priority score for job
     */
    NotificationWorker.prototype.getPriorityScore = function (jobData) {
        var priority = 0;
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
        // Boost priority for critical notification types
        if (jobData.type === 'fraud_alert') {
            priority = Math.max(priority, 90);
        }
        else if (jobData.type === 'escalation_alert') {
            priority = Math.max(priority, 80);
        }
        return priority;
    };
    /**
     * Graceful shutdown
     */
    NotificationWorker.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        logger_1.logger.info('Shutting down notification worker...');
                        return [4 /*yield*/, this.worker.close()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.queue.close()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.redis.disconnect()];
                    case 3:
                        _a.sent();
                        logger_1.logger.info('Notification worker shutdown complete');
                        return [3 /*break*/, 5];
                    case 4:
                        error_7 = _a.sent();
                        logger_1.logger.error('Error during notification worker shutdown:', error_7);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start the worker
     */
    NotificationWorker.prototype.start = function () {
        logger_1.logger.info('Notification worker started');
    };
    /**
     * Pause the worker
     */
    NotificationWorker.prototype.pause = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.worker.pause()];
                    case 1:
                        _a.sent();
                        logger_1.logger.info('Notification worker paused');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Resume the worker
     */
    NotificationWorker.prototype.resume = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.worker.resume()];
                    case 1:
                        _a.sent();
                        logger_1.logger.info('Notification worker resumed');
                        return [2 /*return*/];
                }
            });
        });
    };
    return NotificationWorker;
}());
exports.NotificationWorker = NotificationWorker;
