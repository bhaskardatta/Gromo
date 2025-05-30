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
exports.workerManager = exports.WorkerManager = void 0;
var notificationWorker_1 = require("./notificationWorker");
var escalationWorker_1 = require("./escalationWorker");
var logger_1 = require("../utils/logger");
var cron = require("node-cron");
var WorkerManager = /** @class */ (function () {
    function WorkerManager() {
        this.isRunning = false;
        this.cronJobs = [];
        this.notificationWorker = new notificationWorker_1.NotificationWorker();
        this.escalationWorker = new escalationWorker_1.EscalationWorker(this.notificationWorker);
    }
    /**
     * Start all workers and scheduled tasks
     */
    WorkerManager.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    logger_1.logger.info('Starting worker manager...');
                    // Start individual workers
                    this.notificationWorker.start();
                    this.escalationWorker.start();
                    // Set up scheduled maintenance tasks
                    this.setupScheduledTasks();
                    this.isRunning = true;
                    logger_1.logger.info('Worker manager started successfully');
                }
                catch (error) {
                    logger_1.logger.error('Error starting worker manager:', error);
                    throw new Error('Failed to start worker manager');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Stop all workers and scheduled tasks
     */
    WorkerManager.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.logger.info('Stopping worker manager...');
                        this.isRunning = false;
                        // Stop scheduled tasks
                        this.cronJobs.forEach(function (job) { return job.stop(); });
                        this.cronJobs = [];
                        // Shutdown workers
                        return [4 /*yield*/, Promise.all([
                                this.notificationWorker.shutdown(),
                                this.escalationWorker.shutdown()
                            ])];
                    case 1:
                        // Shutdown workers
                        _a.sent();
                        logger_1.logger.info('Worker manager stopped successfully');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.error('Error stopping worker manager:', error_1);
                        throw new Error('Failed to stop worker manager');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get worker manager status
     */
    WorkerManager.prototype.getStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, notificationStats, escalationStats, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                this.notificationWorker.getQueueStats(),
                                this.escalationWorker.getQueueStats()
                            ])];
                    case 1:
                        _a = _b.sent(), notificationStats = _a[0], escalationStats = _a[1];
                        return [2 /*return*/, {
                                isRunning: this.isRunning,
                                notificationQueue: notificationStats,
                                escalationQueue: escalationStats,
                                uptime: process.uptime(),
                                scheduledTasks: this.cronJobs.length
                            }];
                    case 2:
                        error_2 = _b.sent();
                        logger_1.logger.error('Error getting worker status:', error_2);
                        throw new Error('Failed to get worker status');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get notification worker instance
     */
    WorkerManager.prototype.getNotificationWorker = function () {
        return this.notificationWorker;
    };
    /**
     * Get escalation worker instance
     */
    WorkerManager.prototype.getEscalationWorker = function () {
        return this.escalationWorker;
    };
    /**
     * Setup scheduled maintenance tasks
     */
    WorkerManager.prototype.setupScheduledTasks = function () {
        var _this = this;
        // Clean up old notification jobs every hour
        var notificationCleanupJob = cron.schedule('0 * * * *', function () { return __awaiter(_this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.logger.info('Running notification queue cleanup...');
                        return [4 /*yield*/, this.notificationWorker.cleanQueue()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        logger_1.logger.error('Error in notification cleanup job:', error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // Monitor queue health every 5 minutes
        var healthCheckJob = cron.schedule('*/5 * * * *', function () { return __awaiter(_this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.performHealthCheck()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.logger.error('Error in health check job:', error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // Generate worker metrics every 15 minutes
        var metricsJob = cron.schedule('*/15 * * * *', function () { return __awaiter(_this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.generateMetrics()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        logger_1.logger.error('Error in metrics job:', error_5);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // Start all scheduled jobs
        notificationCleanupJob.start();
        healthCheckJob.start();
        metricsJob.start();
        this.cronJobs = [notificationCleanupJob, healthCheckJob, metricsJob];
        logger_1.logger.info("".concat(this.cronJobs.length, " scheduled tasks configured"));
    };
    /**
     * Perform health check on all workers
     */
    WorkerManager.prototype.performHealthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status_1, notificationQueue, escalationQueue, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getStatus()];
                    case 1:
                        status_1 = _a.sent();
                        notificationQueue = status_1.notificationQueue;
                        escalationQueue = status_1.escalationQueue;
                        // Alert if too many failed jobs
                        if (notificationQueue.failed > 10) {
                            logger_1.logger.warn("High number of failed notification jobs: ".concat(notificationQueue.failed));
                        }
                        if (escalationQueue.failed > 5) {
                            logger_1.logger.warn("High number of failed escalation jobs: ".concat(escalationQueue.failed));
                        }
                        // Alert if queues are getting too large
                        if (notificationQueue.waiting > 100) {
                            logger_1.logger.warn("High number of waiting notification jobs: ".concat(notificationQueue.waiting));
                        }
                        if (escalationQueue.waiting > 50) {
                            logger_1.logger.warn("High number of waiting escalation jobs: ".concat(escalationQueue.waiting));
                        }
                        logger_1.logger.debug('Worker health check completed', status_1);
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        logger_1.logger.error('Error in worker health check:', error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate worker metrics
     */
    WorkerManager.prototype.generateMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status_2, metrics, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getStatus()];
                    case 1:
                        status_2 = _a.sent();
                        metrics = {
                            timestamp: new Date().toISOString(),
                            uptime: status_2.uptime,
                            queues: {
                                notifications: status_2.notificationQueue,
                                escalations: status_2.escalationQueue
                            },
                            system: {
                                memoryUsage: process.memoryUsage(),
                                cpuUsage: process.cpuUsage()
                            }
                        };
                        // Log metrics (in production, you might send these to a monitoring service)
                        logger_1.logger.info('Worker metrics generated', metrics);
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        logger_1.logger.error('Error generating worker metrics:', error_7);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Pause all workers
     */
    WorkerManager.prototype.pauseWorkers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.logger.info('Pausing all workers...');
                        return [4 /*yield*/, Promise.all([
                                this.notificationWorker.pause(),
                                // escalationWorker doesn't have pause method, so we skip it
                            ])];
                    case 1:
                        _a.sent();
                        logger_1.logger.info('All workers paused');
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        logger_1.logger.error('Error pausing workers:', error_8);
                        throw new Error('Failed to pause workers');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Resume all workers
     */
    WorkerManager.prototype.resumeWorkers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.logger.info('Resuming all workers...');
                        return [4 /*yield*/, Promise.all([
                                this.notificationWorker.resume(),
                                // escalationWorker doesn't have resume method, so we skip it
                            ])];
                    case 1:
                        _a.sent();
                        logger_1.logger.info('All workers resumed');
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        logger_1.logger.error('Error resuming workers:', error_9);
                        throw new Error('Failed to resume workers');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add a notification job (convenience method)
     */
    WorkerManager.prototype.addNotificationJob = function (jobData, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.notificationWorker.addNotificationJob(jobData, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Add an escalation job (convenience method)
     */
    WorkerManager.prototype.addEscalationJob = function (jobData, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.escalationWorker.addEscalationJob(jobData, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Process graceful shutdown with timeout
     */
    WorkerManager.prototype.gracefulShutdown = function () {
        return __awaiter(this, arguments, void 0, function (timeoutMs) {
            var _this = this;
            if (timeoutMs === void 0) { timeoutMs = 30000; }
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var timeout = setTimeout(function () {
                            reject(new Error('Worker shutdown timeout'));
                        }, timeoutMs);
                        _this.stop()
                            .then(function () {
                            clearTimeout(timeout);
                            resolve();
                        })
                            .catch(function (error) {
                            clearTimeout(timeout);
                            reject(error);
                        });
                    })];
            });
        });
    };
    /**
     * Handle process signals for graceful shutdown
     */
    WorkerManager.prototype.setupSignalHandlers = function () {
        var _this = this;
        var gracefulShutdown = function (signal) { return __awaiter(_this, void 0, void 0, function () {
            var error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.logger.info("Received ".concat(signal, ", starting graceful shutdown..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.gracefulShutdown()];
                    case 2:
                        _a.sent();
                        logger_1.logger.info('Graceful shutdown completed');
                        process.exit(0);
                        return [3 /*break*/, 4];
                    case 3:
                        error_10 = _a.sent();
                        logger_1.logger.error('Error during graceful shutdown:', error_10);
                        process.exit(1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        process.on('SIGTERM', function () { return gracefulShutdown('SIGTERM'); });
        process.on('SIGINT', function () { return gracefulShutdown('SIGINT'); });
        // Handle uncaught exceptions
        process.on('uncaughtException', function (error) {
            logger_1.logger.error('Uncaught exception:', error);
            gracefulShutdown('uncaughtException');
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', function (reason, promise) {
            logger_1.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
    };
    return WorkerManager;
}());
exports.WorkerManager = WorkerManager;
// Export singleton instance
exports.workerManager = new WorkerManager();
