import crypto from 'crypto';
import { logger } from '../utils/logger';
import { EnhancedCacheService } from './enhancedCacheService';

interface ApiKeyRecord {
    key: string;
    id: string;
    created: Date;
    expires: Date;
    isActive: boolean;
    lastUsed?: Date;
    usageCount: number;
    metadata?: {
        createdBy?: string;
        purpose?: string;
        service?: string;
    };
}

interface RotationConfig {
    rotationInterval: number; // milliseconds
    keyLifetime: number; // milliseconds
    maxActiveKeys: number;
    gracePeriod: number; // milliseconds for old keys to remain valid
}

class ApiKeyRotationService {
    private rotationConfig: RotationConfig;
    private rotationTimer?: ReturnType<typeof setTimeout>;
    private readonly CACHE_NAMESPACE = 'api_keys';
    private readonly ROTATION_CACHE_KEY = 'rotation_config';
    private readonly ACTIVE_KEYS_KEY = 'active_keys';

    constructor() {
        this.rotationConfig = {
            rotationInterval: 24 * 60 * 60 * 1000, // 24 hours
            keyLifetime: 7 * 24 * 60 * 60 * 1000, // 7 days
            maxActiveKeys: 5,
            gracePeriod: 60 * 60 * 1000 // 1 hour
        };
    }

    /**
     * Initialize the API key rotation service
     */
    async initialize(): Promise<void> {
        try {
            logger.info('Initializing API Key Rotation Service');

            // Load configuration from cache or use defaults
            await this.loadRotationConfig();

            // Initialize with default keys if none exist
            const activeKeys = await this.getActiveKeys();
            if (activeKeys.length === 0) {
                await this.generateInitialKeys();
            }

            // Start rotation timer
            this.startRotationTimer();

            logger.info('API Key Rotation Service initialized successfully', {
                rotationInterval: this.rotationConfig.rotationInterval,
                maxActiveKeys: this.rotationConfig.maxActiveKeys,
                activeKeysCount: activeKeys.length
            });
        } catch (error) {
            logger.error('Failed to initialize API Key Rotation Service', error);
            throw error;
        }
    }

    /**
     * Generate a new API key
     */
    generateApiKey(): string {
        const prefix = 'gromo_';
        const randomBytes = crypto.randomBytes(32);
        const key = prefix + randomBytes.toString('base64url');
        return key;
    }

    /**
     * Create a new API key record
     */
    async createApiKey(metadata?: ApiKeyRecord['metadata']): Promise<ApiKeyRecord> {
        const now = new Date();
        const apiKey: ApiKeyRecord = {
            key: this.generateApiKey(),
            id: crypto.randomUUID(),
            created: now,
            expires: new Date(now.getTime() + this.rotationConfig.keyLifetime),
            isActive: true,
            usageCount: 0,
            metadata
        };

        await this.storeApiKey(apiKey);
        logger.info('New API key created', {
            keyId: apiKey.id,
            expires: apiKey.expires,
            metadata: apiKey.metadata
        });

        return apiKey;
    }

    /**
     * Rotate API keys
     */
    async rotateKeys(): Promise<{newKey: ApiKeyRecord, deactivatedKeys: string[]}> {
        try {
            logger.info('Starting API key rotation');

            // Get current active keys
            const activeKeys = await this.getActiveKeys();

            // Create new key
            const newKey = await this.createApiKey({
                createdBy: 'system',
                purpose: 'automatic_rotation'
            });

            // Deactivate old keys if we exceed max count
            const deactivatedKeys: string[] = [];
            if (activeKeys.length >= this.rotationConfig.maxActiveKeys) {
                // Sort by creation date and deactivate oldest
                activeKeys.sort((a, b) => a.created.getTime() - b.created.getTime());
                const keysToDeactivate = activeKeys.slice(0, activeKeys.length - this.rotationConfig.maxActiveKeys + 1);
                
                for (const keyToDeactivate of keysToDeactivate) {
                    await this.deactivateApiKey(keyToDeactivate.id);
                    deactivatedKeys.push(keyToDeactivate.id);
                }
            }

            // Clean up expired keys
            await this.cleanupExpiredKeys();

            logger.info('API key rotation completed', {
                newKeyId: newKey.id,
                deactivatedCount: deactivatedKeys.length,
                totalActiveKeys: (await this.getActiveKeys()).length
            });

            return { newKey, deactivatedKeys };
        } catch (error) {
            logger.error('API key rotation failed', error);
            throw error;
        }
    }

    /**
     * Validate an API key
     */
    async validateApiKey(key: string): Promise<{isValid: boolean, keyRecord?: ApiKeyRecord}> {
        try {
            const keyRecord = await this.getApiKeyByValue(key);
            
            if (!keyRecord) {
                return { isValid: false };
            }

            // Check if key is active
            if (!keyRecord.isActive) {
                return { isValid: false };
            }

            // Check if key is expired
            if (new Date() > keyRecord.expires) {
                await this.deactivateApiKey(keyRecord.id);
                return { isValid: false };
            }

            // Update usage stats
            await this.updateKeyUsage(keyRecord.id);

            return { isValid: true, keyRecord };
        } catch (error) {
            logger.error('API key validation error', error);
            return { isValid: false };
        }
    }

    /**
     * Get all active API keys
     */
    async getActiveKeys(): Promise<ApiKeyRecord[]> {
        try {
            const keys = await EnhancedCacheService.get<ApiKeyRecord[]>(
                this.ACTIVE_KEYS_KEY,
                { namespace: this.CACHE_NAMESPACE }
            );
            return keys || [];
        } catch (error) {
            logger.error('Failed to get active keys', error);
            return [];
        }
    }

    /**
     * Get API key statistics
     */
    async getKeyStatistics(): Promise<{
        totalActive: number;
        totalUsage: number;
        oldestKey: Date | null;
        newestKey: Date | null;
        nextRotation: Date;
    }> {
        const activeKeys = await this.getActiveKeys();
        
        return {
            totalActive: activeKeys.length,
            totalUsage: activeKeys.reduce((sum, key) => sum + key.usageCount, 0),
            oldestKey: activeKeys.length > 0 ? 
                new Date(Math.min(...activeKeys.map(k => k.created.getTime()))) : null,
            newestKey: activeKeys.length > 0 ? 
                new Date(Math.max(...activeKeys.map(k => k.created.getTime()))) : null,
            nextRotation: new Date(Date.now() + this.rotationConfig.rotationInterval)
        };
    }

    /**
     * Manually trigger key rotation
     */
    async manualRotation(metadata?: ApiKeyRecord['metadata']): Promise<ApiKeyRecord> {
        const newKey = await this.createApiKey({
            ...metadata,
            createdBy: metadata?.createdBy || 'manual',
            purpose: 'manual_rotation'
        });

        logger.info('Manual API key rotation triggered', {
            keyId: newKey.id,
            triggeredBy: metadata?.createdBy
        });

        return newKey;
    }

    /**
     * Deactivate an API key
     */
    async deactivateApiKey(keyId: string): Promise<boolean> {
        try {
            const activeKeys = await this.getActiveKeys();
            const keyIndex = activeKeys.findIndex(k => k.id === keyId);
            
            if (keyIndex === -1) {
                return false;
            }

            activeKeys[keyIndex].isActive = false;
            await this.storeActiveKeys(activeKeys);

            logger.info('API key deactivated', { keyId });
            return true;
        } catch (error) {
            logger.error('Failed to deactivate API key', error);
            return false;
        }
    }

    /**
     * Update rotation configuration
     */
    async updateRotationConfig(newConfig: Partial<RotationConfig>): Promise<void> {
        this.rotationConfig = { ...this.rotationConfig, ...newConfig };
        
        await EnhancedCacheService.set(
            this.ROTATION_CACHE_KEY,
            this.rotationConfig,
            { 
                ttl: 24 * 60 * 60, // 24 hours TTL in seconds
                namespace: this.CACHE_NAMESPACE,
                tags: ['config', 'rotation']
            }
        );

        // Restart timer with new interval
        if (newConfig.rotationInterval) {
            this.stopRotationTimer();
            this.startRotationTimer();
        }

        logger.info('Rotation configuration updated', newConfig);
    }

    /**
     * Stop the rotation service
     */
    stop(): void {
        this.stopRotationTimer();
        logger.info('API Key Rotation Service stopped');
    }

    // Private methods

    private async loadRotationConfig(): Promise<void> {
        try {
            const savedConfig = await EnhancedCacheService.get<RotationConfig>(
                this.ROTATION_CACHE_KEY,
                { namespace: this.CACHE_NAMESPACE }
            );

            if (savedConfig) {
                this.rotationConfig = { ...this.rotationConfig, ...savedConfig };
            }
        } catch (error) {
            logger.warn('Could not load saved rotation config, using defaults', error);
        }
    }

    private async generateInitialKeys(): Promise<void> {
        logger.info('Generating initial API keys');
        
        // Generate 2 initial keys
        const key1 = await this.createApiKey({
            createdBy: 'system',
            purpose: 'initial_setup',
            service: 'primary'
        });

        const key2 = await this.createApiKey({
            createdBy: 'system',
            purpose: 'initial_setup',
            service: 'backup'
        });

        logger.info('Initial API keys generated', {
            primaryKey: key1.id,
            backupKey: key2.id
        });
    }

    private async storeApiKey(apiKey: ApiKeyRecord): Promise<void> {
        const activeKeys = await this.getActiveKeys();
        activeKeys.push(apiKey);
        await this.storeActiveKeys(activeKeys);
    }

    private async storeActiveKeys(keys: ApiKeyRecord[]): Promise<void> {
        await EnhancedCacheService.set(
            this.ACTIVE_KEYS_KEY,
            keys,
            { 
                ttl: this.rotationConfig.keyLifetime,
                namespace: this.CACHE_NAMESPACE,
                tags: ['api_keys', 'active']
            }
        );
    }

    private async getApiKeyByValue(key: string): Promise<ApiKeyRecord | null> {
        const activeKeys = await this.getActiveKeys();
        return activeKeys.find(k => k.key === key) || null;
    }

    private async updateKeyUsage(keyId: string): Promise<void> {
        const activeKeys = await this.getActiveKeys();
        const keyIndex = activeKeys.findIndex(k => k.id === keyId);
        
        if (keyIndex !== -1) {
            activeKeys[keyIndex].usageCount++;
            activeKeys[keyIndex].lastUsed = new Date();
            await this.storeActiveKeys(activeKeys);
        }
    }

    private async cleanupExpiredKeys(): Promise<void> {
        const activeKeys = await this.getActiveKeys();
        const now = new Date();
        const validKeys = activeKeys.filter(key => now <= key.expires);
        
        if (validKeys.length !== activeKeys.length) {
            await this.storeActiveKeys(validKeys);
            logger.info('Cleaned up expired API keys', {
                removed: activeKeys.length - validKeys.length,
                remaining: validKeys.length
            });
        }
    }

    private startRotationTimer(): void {
        this.rotationTimer = setInterval(async () => {
            try {
                await this.rotateKeys();
            } catch (error) {
                logger.error('Scheduled API key rotation failed', error);
            }
        }, this.rotationConfig.rotationInterval);

        logger.info('API key rotation timer started', {
            interval: this.rotationConfig.rotationInterval
        });
    }

    private stopRotationTimer(): void {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
            this.rotationTimer = undefined;
            logger.info('API key rotation timer stopped');
        }
    }
}

// Export singleton instance
export const apiKeyRotationService = new ApiKeyRotationService();
export { ApiKeyRotationService, ApiKeyRecord, RotationConfig };
