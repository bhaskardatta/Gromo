"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
var logger_1 = require("../utils/logger");
var errorHandler = function (err, req, res, next) {
    logger_1.logger.error('Error:', err);
    // Default error response
    var statusCode = err.statusCode || 500;
    var errorResponse = {
        error: {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred'
        }
    };
    // Handle specific error types
    switch (err.name) {
        case 'OCRError':
            statusCode = 422;
            errorResponse = {
                error: {
                    code: 'OCR_FAILED',
                    message: 'Text extraction confidence below threshold',
                    details: err.details || {}
                }
            };
            break;
        case 'VoiceProcessingError':
            statusCode = 422;
            errorResponse = {
                error: {
                    code: 'VOICE_PROCESSING_FAILED',
                    message: 'Voice processing failed',
                    details: err.details || {}
                }
            };
            break;
        case 'ValidationError':
            statusCode = 400;
            errorResponse = {
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: err.details || {}
                }
            };
            break;
        case 'CastError':
        case 'JsonWebTokenError':
        case 'TokenExpiredError':
            statusCode = 401;
            errorResponse = {
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication failed'
                }
            };
            break;
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
