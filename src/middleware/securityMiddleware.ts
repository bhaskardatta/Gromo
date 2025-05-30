import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/config';

/**
 * Configure Helmet for security headers
 */
export const configureHelmet = () => {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    });
};

/**
 * Configure CORS
 */
export const configureCORS = () => {
    const corsOptions = {
        origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
            const allowedOrigins = config.cors?.allowedOrigins || [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://gromo-frontend.vercel.app'
            ];

            // Allow requests with no origin (mobile apps, postman, etc.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn('CORS blocked request', { origin });
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
        exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining']
    };

    return cors(corsOptions);
};

/**
 * General API Rate Limiting
 */
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', { 
            ip: req.ip, 
            userAgent: req.get('User-Agent'),
            path: req.path 
        });
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

/**
 * Strict Rate Limiting for sensitive endpoints
 */
export const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests to sensitive endpoint, please try again later',
        code: 'STRICT_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Strict rate limit exceeded', { 
            ip: req.ip, 
            userAgent: req.get('User-Agent'),
            path: req.path 
        });
        res.status(429).json({
            success: false,
            error: 'Too many requests to sensitive endpoint, please try again later',
            code: 'STRICT_RATE_LIMIT_EXCEEDED'
        });
    }
});

/**
 * Authentication Rate Limiting
 */
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth attempts per windowMs
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', { 
            ip: req.ip, 
            userAgent: req.get('User-Agent'),
            body: req.body?.email ? { email: req.body.email } : {}
        });
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts, please try again later',
            code: 'AUTH_RATE_LIMIT_EXCEEDED'
        });
    }
});

/**
 * File Upload Rate Limiting
 */
export const uploadRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 uploads per hour
    message: {
        success: false,
        error: 'Upload limit exceeded, please try again later',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Upload rate limit exceeded', { 
            ip: req.ip, 
            userAgent: req.get('User-Agent'),
            contentLength: req.get('Content-Length')
        });
        res.status(429).json({
            success: false,
            error: 'Upload limit exceeded, please try again later',
            code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
        });
    }
});

/**
 * Configure Compression
 */
export const configureCompression = () => {
    return compression({
        threshold: 1024, // Only compress responses > 1KB
        level: 6, // Compression level (1-9, 6 is default)
        filter: (req, res) => {
            // Don't compress responses if the request is for an image
            if (req.headers['x-no-compression']) {
                return false;
            }
            
            // Use compression filter function
            return compression.filter(req, res);
        }
    });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    
    // Generate request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Log request
    logger.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: req.get('Content-Length'),
        contentType: req.get('Content-Type')
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completed', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength: res.get('Content-Length')
        });
    });

    next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // Recursively sanitize object
        const sanitizeObject = (obj: any): any => {
            if (typeof obj === 'string') {
                // Basic HTML tag removal and script injection prevention
                return obj
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<[^>]*>/g, '')
                    .trim();
            } else if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            } else if (obj && typeof obj === 'object') {
                const sanitized: any = {};
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        sanitized[key] = sanitizeObject(obj[key]);
                    }
                }
                return sanitized;
            }
            return obj;
        };

        // Sanitize body, query, and params
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }

        next();
    } catch (error) {
        logger.error('Input sanitization error', error);
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            code: 'INVALID_INPUT'
        });
    }
};

/**
 * File upload validation middleware
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
    try {
        if (!req.file && !req.files) {
            next();
            return;
        }

        const maxFileSize = 10 * 1024 * 1024; // 10MB
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'audio/wav',
            'audio/mp3',
            'audio/mpeg',
            'audio/ogg',
            'audio/webm'
        ];

        const validateFile = (file: any) => {
            if (file.size > maxFileSize) {
                throw new Error(`File too large: ${file.originalname}`);
            }

            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new Error(`File type not allowed: ${file.mimetype}`);
            }

            // Check for suspicious file names
            if (file.originalname.includes('../') || file.originalname.includes('..\\')) {
                throw new Error('Invalid file name');
            }
        };

        if (req.file) {
            validateFile(req.file);
        }

        if (req.files) {
            if (Array.isArray(req.files)) {
                req.files.forEach(validateFile);
            } else {
                Object.values(req.files).flat().forEach(validateFile);
            }
        }

        next();
    } catch (error) {
        logger.warn('File upload validation failed', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip 
        });
        
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'File validation failed',
            code: 'FILE_VALIDATION_ERROR'
        });
    }
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
export const ipWhitelist = (allowedIPs: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const clientIP = req.ip || req.connection.remoteAddress || '';
        
        if (!allowedIPs.includes(clientIP)) {
            logger.warn('IP not whitelisted', { 
                clientIP, 
                allowedIPs,
                path: req.path 
            });
            
            res.status(403).json({
                success: false,
                error: 'Access denied from this IP address',
                code: 'IP_NOT_WHITELISTED'
            });
            return;
        }

        next();
    };
};
