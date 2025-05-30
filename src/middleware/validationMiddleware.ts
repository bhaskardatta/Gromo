import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

/**
 * Express validator middleware to handle validation errors
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            logger.warn('Validation errors detected', {
                url: req.url,
                method: req.method,
                errors: errors.array()
            });
            
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array(),
                code: 'VALIDATION_ERROR'
            });
            return;
        }
        
        next();
    } catch (error) {
        logger.error('Validation middleware error', error);
        res.status(500).json({
            success: false,
            error: 'Validation processing error',
            code: 'VALIDATION_PROCESSING_ERROR'
        });
    }
};

/**
 * Custom validation middleware for specific business rules
 */
export const validateClaimId = (req: Request, res: Response, next: NextFunction): void => {
    const claimId = req.params.claimId || req.body.claimId;
    
    if (!claimId) {
        res.status(400).json({
            success: false,
            error: 'Claim ID is required',
            code: 'CLAIM_ID_REQUIRED'
        });
        return;
    }
    
    const claimIdPattern = /^CLM\d{6}$/;
    if (!claimIdPattern.test(claimId)) {
        res.status(400).json({
            success: false,
            error: 'Invalid claim ID format. Expected format: CLM123456',
            code: 'INVALID_CLAIM_ID_FORMAT'
        });
        return;
    }
    
    next();
};

/**
 * Validate policy number format
 */
export const validatePolicyNumber = (req: Request, res: Response, next: NextFunction): void => {
    const policyNumber = req.params.policyNumber || req.body.policyNumber;
    
    if (!policyNumber) {
        res.status(400).json({
            success: false,
            error: 'Policy number is required',
            code: 'POLICY_NUMBER_REQUIRED'
        });
        return;
    }
    
    const policyPattern = /^POL\d{6}$/;
    if (!policyPattern.test(policyNumber)) {
        res.status(400).json({
            success: false,
            error: 'Invalid policy number format. Expected format: POL123456',
            code: 'INVALID_POLICY_NUMBER_FORMAT'
        });
        return;
    }
    
    next();
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (req: Request, res: Response, next: NextFunction): void => {
    const phoneNumber = req.body.phoneNumber || req.body.to;
    
    if (!phoneNumber) {
        res.status(400).json({
            success: false,
            error: 'Phone number is required',
            code: 'PHONE_NUMBER_REQUIRED'
        });
        return;
    }
    
    const phonePattern = /^\+[1-9]\d{1,14}$/;
    if (!phonePattern.test(phoneNumber)) {
        res.status(400).json({
            success: false,
            error: 'Invalid phone number format. Expected E.164 format: +1234567890',
            code: 'INVALID_PHONE_NUMBER_FORMAT'
        });
        return;
    }
    
    next();
};

/**
 * Validate file upload
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file && !req.files) {
        res.status(400).json({
            success: false,
            error: 'File upload is required',
            code: 'FILE_REQUIRED'
        });
        return;
    }
    
    const file = req.file || (Array.isArray(req.files) ? req.files[0] : Object.values(req.files || {})[0]);
    
    if (!file) {
        res.status(400).json({
            success: false,
            error: 'No file found in request',
            code: 'NO_FILE_FOUND'
        });
        return;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if ((file as any).size > maxSize) {
        res.status(400).json({
            success: false,
            error: 'File size exceeds 10MB limit',
            code: 'FILE_TOO_LARGE'
        });
        return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes((file as any).mimetype)) {
        res.status(400).json({
            success: false,
            error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed',
            code: 'INVALID_FILE_TYPE'
        });
        return;
    }
    
    next();
};
