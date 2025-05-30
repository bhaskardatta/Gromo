import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface AppError extends Error {
    statusCode?: number;
    name: string;
    details?: any;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    logger.error('Error:', err);

    // Default error response
    let statusCode = err.statusCode || 500;
    let errorResponse: any = {
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
