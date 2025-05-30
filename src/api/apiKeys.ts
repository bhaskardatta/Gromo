import express from 'express';
import { logger } from '../utils/logger';
import { apiKeyRotationService } from '../services/apiKeyRotationService';
import { authenticateToken, adminOnly } from '../middleware/authMiddleware';
import { strictRateLimit } from '../middleware/securityMiddleware';

const router = express.Router();

/**
 * Get API key statistics
 * GET /api/admin/api-keys/stats
 */
router.get('/stats', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    try {
        const stats = await apiKeyRotationService.getKeyStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Failed to get API key statistics', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve API key statistics',
            code: 'API_KEY_STATS_ERROR'
        });
    }
});

/**
 * Get all active API keys (minimal info for security)
 * GET /api/admin/api-keys
 */
router.get('/', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    try {
        const activeKeys = await apiKeyRotationService.getActiveKeys();
        
        // Return minimal info for security
        const keysInfo = activeKeys.map(key => ({
            id: key.id,
            created: key.created,
            expires: key.expires,
            isActive: key.isActive,
            lastUsed: key.lastUsed,
            usageCount: key.usageCount,
            metadata: key.metadata,
            // Mask the actual key for security
            keyPreview: key.key.substring(0, 12) + '...'
        }));

        res.json({
            success: true,
            data: {
                keys: keysInfo,
                total: keysInfo.length
            }
        });
    } catch (error) {
        logger.error('Failed to get active API keys', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve API keys',
            code: 'API_KEY_LIST_ERROR'
        });
    }
});

/**
 * Manually rotate API keys
 * POST /api/admin/api-keys/rotate
 */
router.post('/rotate', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    try {
        const { metadata } = req.body;
        const user = (req as any).user;

        const newKey = await apiKeyRotationService.manualRotation({
            createdBy: user.id,
            purpose: 'manual_admin_rotation',
            ...metadata
        });

        logger.info('Manual API key rotation triggered by admin', {
            adminId: user.id,
            newKeyId: newKey.id
        });

        res.json({
            success: true,
            data: {
                keyId: newKey.id,
                created: newKey.created,
                expires: newKey.expires,
                // Return the actual key only once for the admin to copy
                apiKey: newKey.key,
                message: 'New API key generated. Please save this key securely as it will not be shown again.'
            }
        });
    } catch (error) {
        logger.error('Manual API key rotation failed', error);
        res.status(500).json({
            success: false,
            error: 'Failed to rotate API key',
            code: 'API_KEY_ROTATION_ERROR'
        });
    }
});

/**
 * Deactivate an API key
 * DELETE /api/admin/api-keys/:keyId
 */
router.delete('/:keyId', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    try {
        const { keyId } = req.params;
        const user = (req as any).user;

        const success = await apiKeyRotationService.deactivateApiKey(keyId);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'API key not found',
                code: 'API_KEY_NOT_FOUND'
            });
        }

        logger.info('API key deactivated by admin', {
            adminId: user.id,
            deactivatedKeyId: keyId
        });

        res.json({
            success: true,
            message: 'API key deactivated successfully'
        });
    } catch (error) {
        logger.error('Failed to deactivate API key', error);
        res.status(500).json({
            success: false,
            error: 'Failed to deactivate API key',
            code: 'API_KEY_DEACTIVATION_ERROR'
        });
    }
});

/**
 * Update rotation configuration
 * PUT /api/admin/api-keys/config
 */
router.put('/config', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    try {
        const { rotationInterval, keyLifetime, maxActiveKeys, gracePeriod } = req.body;
        const user = (req as any).user;

        // Validate input ranges
        const updates: any = {};
        
        if (rotationInterval !== undefined) {
            if (rotationInterval < 60 * 60 * 1000 || rotationInterval > 30 * 24 * 60 * 60 * 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Rotation interval must be between 1 hour and 30 days',
                    code: 'INVALID_ROTATION_INTERVAL'
                });
            }
            updates.rotationInterval = rotationInterval;
        }

        if (keyLifetime !== undefined) {
            if (keyLifetime < 24 * 60 * 60 * 1000 || keyLifetime > 365 * 24 * 60 * 60 * 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Key lifetime must be between 1 day and 1 year',
                    code: 'INVALID_KEY_LIFETIME'
                });
            }
            updates.keyLifetime = keyLifetime;
        }

        if (maxActiveKeys !== undefined) {
            if (maxActiveKeys < 2 || maxActiveKeys > 20) {
                return res.status(400).json({
                    success: false,
                    error: 'Max active keys must be between 2 and 20',
                    code: 'INVALID_MAX_ACTIVE_KEYS'
                });
            }
            updates.maxActiveKeys = maxActiveKeys;
        }

        if (gracePeriod !== undefined) {
            if (gracePeriod < 0 || gracePeriod > 24 * 60 * 60 * 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Grace period must be between 0 and 24 hours',
                    code: 'INVALID_GRACE_PERIOD'
                });
            }
            updates.gracePeriod = gracePeriod;
        }

        await apiKeyRotationService.updateRotationConfig(updates);

        logger.info('API key rotation configuration updated by admin', {
            adminId: user.id,
            updates
        });

        res.json({
            success: true,
            message: 'Rotation configuration updated successfully',
            data: updates
        });
    } catch (error) {
        logger.error('Failed to update rotation configuration', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update rotation configuration',
            code: 'CONFIG_UPDATE_ERROR'
        });
    }
});

/**
 * Force system-wide key rotation
 * POST /api/admin/api-keys/force-rotate
 */
router.post('/force-rotate', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    try {
        const user = (req as any).user;

        const result = await apiKeyRotationService.rotateKeys();

        logger.warn('Force rotation triggered by admin', {
            adminId: user.id,
            newKeyId: result.newKey.id,
            deactivatedCount: result.deactivatedKeys.length
        });

        res.json({
            success: true,
            data: {
                newKey: {
                    id: result.newKey.id,
                    created: result.newKey.created,
                    expires: result.newKey.expires,
                    // Return the actual key only once
                    apiKey: result.newKey.key
                },
                deactivatedKeys: result.deactivatedKeys,
                message: 'System-wide key rotation completed. Please save the new key securely.'
            }
        });
    } catch (error) {
        logger.error('Force rotation failed', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform force rotation',
            code: 'FORCE_ROTATION_ERROR'
        });
    }
});

export default router;
