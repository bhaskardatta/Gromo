import app from './app';
import { connectDB } from './config/database';
import { EnhancedCacheService } from './services/enhancedCacheService';
import { apiKeyRotationService } from './services/apiKeyRotationService';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

/**
 * Main entry point for ClaimAssist Pro backend
 * Insurance claims processing with voice/OCR capabilities
 */

async function startServer() {
    try {
        // Initialize cache service
        await EnhancedCacheService.initialize();
        logger.info('Cache service initialized successfully');

        // Initialize API Key Rotation Service
        await apiKeyRotationService.initialize();
        logger.info('API Key Rotation Service initialized successfully');

        // Connect to MongoDB
        await connectDB();
        logger.info('Database connected successfully');

        // Start Express server
        app.listen(PORT, () => {
            logger.info(`🚀 ClaimAssist Pro server running on port ${PORT}`);
            logger.info(`📋 API Documentation: http://localhost:${PORT}/api/docs`);
            logger.info(`🗄️  Cache service status: ${EnhancedCacheService.healthCheck ? 'Active' : 'Inactive'}`);
            logger.info(`🔑 API Key Rotation Service: Active`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await EnhancedCacheService.disconnect();
    apiKeyRotationService.stop();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await EnhancedCacheService.disconnect();
    apiKeyRotationService.stop();
    process.exit(0);
});

startServer();
