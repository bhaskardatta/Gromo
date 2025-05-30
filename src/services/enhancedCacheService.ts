import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { config } from '../config/config';

interface CacheOptions {
    ttl?: number; // Time to live in seconds
    compress?: boolean;
    tags?: string[];
    namespace?: string;
}

interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: string;
}

export class EnhancedCacheService {
    private static client: Redis | null = null;
    private static isConnected: boolean = false;
    private static stats = {
        hits: 0,
        misses: 0
    };

    /**
     * Initialize Redis client with optimized configuration
     */
    static async initialize(): Promise<void> {
        try {
            const redisConfig = {
                host: config.getRedis().host || 'localhost', 
                port: config.getRedis().port || 6379,
                password: config.getRedis().password,
                db: 0,
                retryDelayOnFailover: 100,
                enableReadyCheck: true,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                keepAlive: 30000,
                // Optimized connection pool settings
                family: 4,
                connectTimeout: 10000,
                commandTimeout: 5000,
                // Memory optimization
                keyPrefix: 'gromo:',
                // Compression for large values
                compression: 'gzip'
            };

            this.client = new Redis(redisConfig);

            // Connection event handlers
            this.client.on('connect', () => {
                logger.info('Redis client connected successfully');
                this.isConnected = true;
            });

            this.client.on('error', (error) => {
                logger.error('Redis connection error:', error);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                logger.warn('Redis connection closed');
                this.isConnected = false;
            });

            this.client.on('reconnecting', (delay) => {
                logger.info(`Redis reconnecting in ${delay}ms`);
            });

            // Test connection
            await this.client.ping();
            logger.info('Enhanced cache service initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize cache service:', error);
            this.client = null;
            this.isConnected = false;
        }
    }

    /**
     * Get value from cache with automatic decompression
     */
    static async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
        if (!this.client || !this.isConnected) {
            logger.warn('Cache service not available, skipping get operation');
            this.stats.misses++;
            return null;
        }

        try {
            const fullKey = this.buildKey(key, options.namespace);
            const cached = await this.client.get(fullKey);

            if (cached === null) {
                this.stats.misses++;
                return null;
            }

            this.stats.hits++;

            // Parse JSON and decompress if needed
            let parsed = JSON.parse(cached);
            
            if (parsed._compressed && options.compress !== false) {
                parsed = await this.decompress(parsed.data);
            }

            return parsed;

        } catch (error) {
            logger.error('Cache get error:', error);
            this.stats.misses++;
            return null;
        }
    }

    /**
     * Set value in cache with automatic compression for large values
     */
    static async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            logger.warn('Cache service not available, skipping set operation');
            return false;
        }

        try {
            const fullKey = this.buildKey(key, options.namespace);
            let dataToStore = value;

            // Compress large values automatically
            const serialized = JSON.stringify(value);
            if (serialized.length > 1024 && options.compress !== false) {
                dataToStore = {
                    _compressed: true,
                    data: await this.compress(serialized)
                };
            }

            const ttl = options.ttl || 3600; // Default 1 hour
            const result = await this.client.setex(fullKey, ttl, JSON.stringify(dataToStore));

            // Add tags for cache invalidation
            if (options.tags && options.tags.length > 0) {
                await this.addTags(fullKey, options.tags);
            }

            return result === 'OK';

        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Delete key from cache
     */
    static async delete(key: string, namespace?: string): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            return false;
        }

        try {
            const fullKey = this.buildKey(key, namespace);
            const result = await this.client.del(fullKey);
            return result > 0;

        } catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    }

    /**
     * Check if key exists in cache
     */
    static async exists(key: string, namespace?: string): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            return false;
        }

        try {
            const fullKey = this.buildKey(key, namespace);
            const result = await this.client.exists(fullKey);
            return result === 1;

        } catch (error) {
            logger.error('Cache exists error:', error);
            return false;
        }
    }

    /**
     * Get multiple keys at once
     */
    static async mget<T>(keys: string[], namespace?: string): Promise<(T | null)[]> {
        if (!this.client || !this.isConnected) {
            return keys.map(() => null);
        }

        try {
            const fullKeys = keys.map(key => this.buildKey(key, namespace));
            const results = await this.client.mget(...fullKeys);

            return results.map(result => {
                if (result === null) {
                    this.stats.misses++;
                    return null;
                }

                this.stats.hits++;
                try {
                    return JSON.parse(result);
                } catch {
                    return null;
                }
            });

        } catch (error) {
            logger.error('Cache mget error:', error);
            return keys.map(() => null);
        }
    }

    /**
     * Set multiple keys at once
     */
    static async mset(keyValuePairs: Array<{ key: string; value: any; ttl?: number }>, namespace?: string): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            return false;
        }

        try {
            const pipeline = this.client.pipeline();

            for (const { key, value, ttl = 3600 } of keyValuePairs) {
                const fullKey = this.buildKey(key, namespace);
                pipeline.setex(fullKey, ttl, JSON.stringify(value));
            }

            const results = await pipeline.exec();
            return results?.every(result => result[1] === 'OK') || false;

        } catch (error) {
            logger.error('Cache mset error:', error);
            return false;
        }
    }

    /**
     * Invalidate cache by tags
     */
    static async invalidateByTags(tags: string[]): Promise<number> {
        if (!this.client || !this.isConnected) {
            return 0;
        }

        try {
            let deletedCount = 0;

            for (const tag of tags) {
                const tagKey = `tag:${tag}`;
                const keys = await this.client.smembers(tagKey);

                if (keys.length > 0) {
                    const pipeline = this.client.pipeline();
                    keys.forEach(key => pipeline.del(key));
                    pipeline.del(tagKey);

                    const results = await pipeline.exec();
                    deletedCount += keys.length;
                }
            }

            logger.info(`Invalidated ${deletedCount} cache entries by tags: ${tags.join(', ')}`);
            return deletedCount;

        } catch (error) {
            logger.error('Cache invalidate by tags error:', error);
            return 0;
        }
    }

    /**
     * Clear all cache (use with caution)
     */
    static async clear(namespace?: string): Promise<boolean> {
        if (!this.client || !this.isConnected) {
            return false;
        }

        try {
            if (namespace) {
                const pattern = `gromo:${namespace}:*`;
                const keys = await this.client.keys(pattern);
                
                if (keys.length > 0) {
                    await this.client.del(...keys);
                }
            } else {
                await this.client.flushdb();
            }

            logger.info(`Cache cleared for namespace: ${namespace || 'all'}`);
            return true;

        } catch (error) {
            logger.error('Cache clear error:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    static async getStats(): Promise<CacheStats> {
        if (!this.client || !this.isConnected) {
            return {
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: 0,
                totalKeys: 0,
                memoryUsage: '0 bytes'
            };
        }

        try {
            const info = await this.client.info('memory');
            const dbsize = await this.client.dbsize();

            const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
            const memoryUsage = memoryMatch ? memoryMatch[1].trim() : '0 bytes';

            const total = this.stats.hits + this.stats.misses;
            const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

            return {
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: Math.round(hitRate * 100) / 100,
                totalKeys: dbsize,
                memoryUsage
            };

        } catch (error) {
            logger.error('Error getting cache stats:', error);
            return {
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: 0,
                totalKeys: 0,
                memoryUsage: '0 bytes'
            };
        }
    }

    /**
     * Cached function decorator
     */
    static cached<T extends (...args: any[]) => Promise<any>>(
        options: CacheOptions & { keyGenerator?: (...args: any[]) => string }
    ) {
        return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
            const method = descriptor.value;

            descriptor.value = async function (...args: any[]) {
                const cacheKey = options.keyGenerator 
                    ? options.keyGenerator(...args)
                    : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

                // Try to get from cache first
                const cached = await EnhancedCacheService.get(cacheKey, options);
                if (cached !== null) {
                    return cached;
                }

                // Execute the method and cache the result
                const result = await method.apply(this, args);
                await EnhancedCacheService.set(cacheKey, result, options);

                return result;
            };
        };
    }

    // Private helper methods
    private static buildKey(key: string, namespace?: string): string {
        return namespace ? `${namespace}:${key}` : key;
    }

    private static async addTags(key: string, tags: string[]): Promise<void> {
        if (!this.client) return;

        const pipeline = this.client.pipeline();
        for (const tag of tags) {
            pipeline.sadd(`tag:${tag}`, key);
            pipeline.expire(`tag:${tag}`, 86400); // Expire tag sets after 24 hours
        }
        await pipeline.exec();
    }

    private static async compress(data: string): Promise<string> {
        // Simple compression simulation - in production, use zlib or similar
        return Buffer.from(data).toString('base64');
    }

    private static async decompress(data: string): Promise<any> {
        // Simple decompression simulation
        return JSON.parse(Buffer.from(data, 'base64').toString());
    }

    /**
     * Cleanup and close connection
     */
    static async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
            logger.info('Cache service disconnected');
        }
    }

    /**
     * Health check for cache service
     */
    static async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
        if (!this.client) {
            return { status: 'disconnected', error: 'Client not initialized' };
        }

        try {
            const start = Date.now();
            await this.client.ping();
            const latency = Date.now() - start;

            return { 
                status: this.isConnected ? 'healthy' : 'connected',
                latency 
            };

        } catch (error) {
            return { 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }
}
