"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var express_rate_limit_1 = require("express-rate-limit");
var compression_1 = require("compression");
var morgan_1 = require("morgan");
var errorHandler_1 = require("./middleware/errorHandler");
var notFound_1 = require("./middleware/notFound");
var logger_1 = require("./utils/logger");
var config_1 = require("./config/config");
// Import routes
var voice_1 = require("./api/voice");
var ocr_1 = require("./api/ocr");
var claims_1 = require("./api/claims");
var simulation_1 = require("./api/simulation");
var escalation_1 = require("./api/escalation");
var app = (0, express_1.default)();
// Get configuration
var rateLimitConfig = config_1.config.getRateLimit();
var fileUploadConfig = config_1.config.getFileUpload();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));
// Rate limiting
var limiter = (0, express_rate_limit_1.default)({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.maxRequests,
    message: {
        error: 'Too many requests',
        message: 'Please try again later'
    }
});
app.use(limiter);
// Body parsing middleware
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: "".concat(Math.round(fileUploadConfig.maxFileSize / 1024 / 1024), "mb") }));
app.use(express_1.default.urlencoded({ extended: true, limit: "".concat(Math.round(fileUploadConfig.maxFileSize / 1024 / 1024), "mb") }));
// Logging
app.use((0, morgan_1.default)('combined', { stream: { write: function (message) { return logger_1.logger.info(message.trim()); } } }));
// Health check
app.get('/health', function (req, res) {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'ClaimAssist Pro API'
    });
});
// API routes
app.use('/api/v1/voice', voice_1.default);
app.use('/api/v1/ocr', ocr_1.default);
app.use('/api/v1/claims', claims_1.default);
app.use('/api/v1/simulation', simulation_1.default);
app.use('/api/v1/escalation', escalation_1.default);
// Error handling middleware
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
