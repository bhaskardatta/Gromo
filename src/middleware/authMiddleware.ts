import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { apiKeyRotationService } from '../services/apiKeyRotationService';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

interface JWTPayload {
    id: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}

/**
 * JWT Authentication Middleware
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token required',
                code: 'TOKEN_REQUIRED'
            });
            return;
        }

        const jwtSecret = config.getSecurity().jwtSecret;
        if (!jwtSecret) {
            logger.error('JWT secret not configured');
            res.status(500).json({
                success: false,
                error: 'Authentication configuration error',
                code: 'AUTH_CONFIG_ERROR'
            });
            return;
        }

        const decoded = jwt.verify(token, config.getSecurity().jwtSecret) as JwtPayload;

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        logger.info('User authenticated', { userId: req.user.id, role: req.user.role });
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Role-based Authorization Middleware
 */
export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }

            if (!roles.includes(req.user.role)) {
                logger.warn('Access denied - insufficient permissions', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredRoles: roles
                });
                
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
                return;
            }

            next();
        } catch (error) {
            logger.error('Authorization middleware error', error);
            res.status(500).json({
                success: false,
                error: 'Authorization error',
                code: 'AUTH_ERROR'
            });
        }
    };
};

/**
 * Optional Authentication Middleware (for public endpoints with optional auth)
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            // No token provided, continue without authentication
            next();
            return;
        }

        const jwtSecret = config.getSecurity().jwtSecret;
        if (!jwtSecret) {
            // JWT not configured, continue without authentication
            next();
            return;
        }

        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) {
                // Invalid token, continue without authentication
                logger.warn('Optional auth - invalid token', { error: err.message });
                next();
                return;
            }

            const payload = decoded as JWTPayload;
            req.user = {
                id: payload.id,
                email: payload.email,
                role: payload.role
            };

            logger.info('Optional auth - user authenticated', { userId: req.user.id });
            next();
        });
    } catch (error) {
        logger.error('Optional auth middleware error', error);
        // Continue without authentication on error
        next();
    }
};

/**
 * API Key Authentication Middleware (for system-to-system communication)
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
            res.status(401).json({
                success: false,
                error: 'API key required',
                code: 'API_KEY_REQUIRED'
            });
            return;
        }

        // Use rotation service for validation
        const validationResult = await apiKeyRotationService.validateApiKey(apiKey);
        
        if (!validationResult.isValid) {
            logger.warn('Invalid API key attempt', { 
                providedKey: apiKey.substring(0, 8) + '...',
                ip: req.ip 
            });
            
            res.status(403).json({
                success: false,
                error: 'Invalid or expired API key',
                code: 'API_KEY_INVALID'
            });
            return;
        }

        logger.info('API key authenticated', { 
            keyId: validationResult.keyRecord?.id,
            ip: req.ip 
        });
        
        // Add API key metadata to request for potential use
        (req as any).apiKeyRecord = validationResult.keyRecord;
        
        next();
    } catch (error) {
        logger.error('API key authentication error', error);
        res.status(500).json({
            success: false,
            error: 'API key authentication error',
            code: 'API_KEY_ERROR'
        });
    }
};

/**
 * Admin-only middleware
 */
export const adminOnly = authorizeRoles('admin', 'superadmin');

/**
 * Agent or higher middleware
 */
export const agentOrHigher = authorizeRoles('agent', 'supervisor', 'admin', 'superadmin');

/**
 * Customer service middleware
 */
export const customerServiceAccess = authorizeRoles('customer_service', 'agent', 'supervisor', 'admin', 'superadmin');

/**
 * Default auth middleware - alias for authenticateToken
 */
export const authMiddleware = authenticateToken;

export { AuthenticatedRequest };
