import express from 'express';
import path from 'path';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';
import { config } from './config/config';
import { EnhancedCacheService } from './services/enhancedCacheService';
import { setupSwagger } from './config/swagger';
import cors from 'cors';

// Import security middleware
import {
    configureHelmet,
    configureCORS,
    generalRateLimit,
    strictRateLimit,
    authRateLimit,
    uploadRateLimit,
    configureCompression,
    requestLogger,
    securityHeaders,
    sanitizeInput,
    validateFileUpload
} from './middleware/securityMiddleware';

import {
    authenticateToken,
    optionalAuth,
    authenticateApiKey,
    adminOnly,
    agentOrHigher,
    customerServiceAccess
} from './middleware/authMiddleware';

// Import routes
import voiceRoutes from './api/voice';
import ocrRoutes from './api/ocr';
import claimRoutes from './api/claims';
import simulationRoutes from './api/simulation';
import escalationRoutes from './api/escalation';
import copilotRoutes from './routes/copilot';
import apiKeysRoutes from './api/apiKeys';
import whatsappRoutes from './api/whatsapp';
import authRoutes from './routes/auth';
import frontendMockRoutes from './routes/frontend-mocks';
import debugRoutes from './routes/debug';

const app = express();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// ====================================
// SECURITY MIDDLEWARE (Order matters!)
// ====================================

// 1. Basic security headers
app.use(configureHelmet());
app.use(securityHeaders);

// 2. CORS configuration
app.use(configureCORS());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 3. Request logging and tracking
app.use(requestLogger);

// 4. Body parsing with compression
app.use(configureCompression());
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        // Store raw body for signature verification if needed
        (req as any).rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Input sanitization
app.use(sanitizeInput);

// 6. File upload validation
app.use(validateFileUpload);

// 7. Structured logging
app.use(morgan('combined', { 
    stream: { 
        write: (message: string) => logger.info(message.trim()) 
    }
}));

// ====================================
// HEALTH CHECK ENDPOINTS
// ====================================

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Gromo API is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.isDevelopment() ? 'development' : 'production'
    });
});

app.get('/health/detailed', optionalAuth, async (req, res) => {
    const cacheHealth = await EnhancedCacheService.healthCheck();
    const cacheStats = await EnhancedCacheService.getStats();
    
    const healthStatus = {
        success: true,
        message: 'Gromo API detailed health check',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.isDevelopment() ? 'development' : 'production',
        features: config.getFeatureFlags(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid,
        services: {
            cache: {
                status: cacheHealth.status,
                latency: cacheHealth.latency,
                stats: cacheStats
            }
        }
    };

    res.status(200).json(healthStatus);
});

// ====================================
// API DOCUMENTATION
// ====================================
setupSwagger(app);

// ====================================
// API ROUTES WITH RATE LIMITING
// ====================================

// Public routes with general rate limiting
app.use('/api/v1/voice', generalRateLimit, voiceRoutes);
app.use('/api/v1/ocr', uploadRateLimit, ocrRoutes);
app.use('/api/v1/whatsapp', generalRateLimit, whatsappRoutes);

// Debug route - no authentication required
if (config.isDevelopment()) {
    app.use('/debug', debugRoutes);
}

// Protected routes requiring authentication
app.use('/api/v1/claims', generalRateLimit, authenticateToken, claimRoutes);
app.use('/api/v1/copilot', generalRateLimit, authenticateToken, copilotRoutes);

// Administrative routes with strict rate limiting
app.use('/api/v1/escalation', strictRateLimit, authenticateToken, agentOrHigher, escalationRoutes);

// API Key management routes (admin only)
app.use('/api/admin/api-keys', apiKeysRoutes);

// Simulation routes (development/testing)
if (config.isDevelopment()) {
    app.use('/api/v1/simulation', authRateLimit, authenticateApiKey, simulationRoutes);
} else {
    app.use('/api/v1/simulation', strictRateLimit, authenticateToken, adminOnly, simulationRoutes);
}

// ====================================
// AUTH ROUTES
// ====================================

app.use('/api/v1/auth', authRoutes);

// ====================================
// ADMIN ROUTES
// ====================================

app.get('/api/admin/config', strictRateLimit, authenticateToken, adminOnly, (req, res) => {
    if (config.isDevelopment()) {
        config.logConfig();
    }
    
    res.json({
        success: true,
        message: 'Configuration logged to console (development only)',
        environment: config.get().nodeEnv
    });
});

app.get('/api/admin/status', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    const cacheHealth = await EnhancedCacheService.healthCheck();
    const cacheStats = await EnhancedCacheService.getStats();
    
    res.json({
        success: true,
        status: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            version: process.version,
            pid: process.pid,
            environment: config.get().nodeEnv,
            features: config.getFeatureFlags(),
            cache: {
                health: cacheHealth,
                stats: cacheStats
            }
        }
    });
});

// Cache management endpoints
app.get('/api/admin/cache/stats', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    const stats = await EnhancedCacheService.getStats();
    res.json({ success: true, data: stats });
});

app.delete('/api/admin/cache/clear', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    const { namespace } = req.query;
    const cleared = await EnhancedCacheService.clear(namespace as string);
    res.json({ 
        success: cleared, 
        message: `Cache ${cleared ? 'cleared' : 'clear failed'} for namespace: ${namespace || 'all'}` 
    });
});

app.delete('/api/admin/cache/invalidate', strictRateLimit, authenticateToken, adminOnly, async (req, res) => {
    const { tags } = req.body;
    if (!tags || !Array.isArray(tags)) {
        return res.status(400).json({ success: false, message: 'Tags array required' });
    }
    
    const deletedCount = await EnhancedCacheService.invalidateByTags(tags);
    res.json({ 
        success: true, 
        message: `Invalidated ${deletedCount} cache entries`,
        deletedCount 
    });
});

// ====================================
// STATIC FILE SERVING (FRONTEND)
// ====================================

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve React app for all non-API routes
app.get('*', (req, res) => {
    // Don't serve React for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.startsWith('/docs')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    
    // Serve React app
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Frontend routes for E2E testing
if (process.env.NODE_ENV === 'development' || process.env.CYPRESS) {
  app.use('/', frontendMockRoutes);
  logger.info('Frontend mock routes enabled for testing');
}

// ====================================
// ERROR HANDLING
// ====================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

export default app;
