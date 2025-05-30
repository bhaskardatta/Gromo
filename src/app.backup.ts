import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';
import { config } from './config/config';

// Import routes
import voiceRoutes from './api/voice';
import ocrRoutes from './api/ocr';
import claimRoutes from './api/claims';
import simulationRoutes from './api/simulation';
import escalationRoutes from './api/escalation';

const app = express();

// Get configuration
const rateLimitConfig = config.getRateLimit();
const fileUploadConfig = config.getFileUpload();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.maxRequests,
    message: {
        error: 'Too many requests',
        message: 'Please try again later'
    }
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: `${Math.round(fileUploadConfig.maxFileSize / 1024 / 1024)}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${Math.round(fileUploadConfig.maxFileSize / 1024 / 1024)}mb` }));

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'ClaimAssist Pro API' 
    });
});

// API routes
app.use('/api/v1/voice', voiceRoutes);
app.use('/api/v1/ocr', ocrRoutes);
app.use('/api/v1/claims', claimRoutes);
app.use('/api/v1/simulation', simulationRoutes);
app.use('/api/v1/escalation', escalationRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
