import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
    try {
        // Check for both MONGODB_URI and MONGO_URI to support both naming conventions
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/gromo';
        
        logger.info(`Connecting to MongoDB: ${mongoURI.split('/').slice(0, -1).join('/')}/[db]`);
        
        await mongoose.connect(mongoURI, {
            // Modern connection options (deprecated options removed)
        });
        
        logger.info(`MongoDB connected: ${mongoose.connection.host}`);
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        throw error;
    }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
});
