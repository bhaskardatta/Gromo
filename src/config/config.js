"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
var dotenv = require("dotenv");
var logger_1 = require("../utils/logger");
// Load environment variables
dotenv.config();
var ConfigService = /** @class */ (function () {
    function ConfigService() {
        this.config = this.loadConfig();
        this.validateConfig();
    }
    ConfigService.prototype.loadConfig = function () {
        return {
            // Server Configuration
            port: parseInt(process.env.PORT || '3000'),
            nodeEnv: process.env.NODE_ENV || 'development',
            // Database Configuration
            mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/claimassist',
            // Redis Configuration
            redisHost: process.env.REDIS_HOST || 'localhost',
            redisPort: parseInt(process.env.REDIS_PORT || '6379'),
            redisPassword: process.env.REDIS_PASSWORD,
            // Google Cloud Configuration
            googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'claimassist-project',
            googleCloudKeyFile: process.env.GOOGLE_CLOUD_KEY_FILE,
            googleCloudCredentials: process.env.GOOGLE_CLOUD_CREDENTIALS,
            // Twilio Configuration
            twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
            twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
            twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
            twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
            // Security Configuration
            jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
            // File Upload Configuration
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
            allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx').split(','),
            uploadPath: process.env.UPLOAD_PATH || './uploads',
            // Rate Limiting
            rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
            rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
            // Logging Configuration
            logLevel: process.env.LOG_LEVEL || 'info',
            // Worker Configuration
            workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
            queueCleanupInterval: parseInt(process.env.QUEUE_CLEANUP_INTERVAL || '3600000'), // 1 hour
            // Management Contacts
            managementContact: process.env.MANAGEMENT_CONTACT || '+1234567890',
            supportContact: process.env.SUPPORT_CONTACT || '+1234567891',
            // Feature Flags
            enableVoiceProcessing: process.env.ENABLE_VOICE_PROCESSING !== 'false',
            enableOcrProcessing: process.env.ENABLE_OCR_PROCESSING !== 'false',
            enableFraudDetection: process.env.ENABLE_FRAUD_DETECTION !== 'false',
            enableEscalation: process.env.ENABLE_ESCALATION !== 'false',
            enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false'
        };
    };
    ConfigService.prototype.validateConfig = function () {
        var errors = [];
        // Validate required configurations
        if (this.config.nodeEnv === 'production') {
            // Production-specific validations
            if (!this.config.mongoUri || this.config.mongoUri.includes('localhost')) {
                errors.push('Production MongoDB URI is required');
            }
            if (this.config.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
                errors.push('Production JWT secret must be changed');
            }
            if (this.config.enableNotifications && (!this.config.twilioAccountSid || !this.config.twilioAuthToken)) {
                errors.push('Twilio credentials are required for notifications in production');
            }
            if ((this.config.enableVoiceProcessing || this.config.enableOcrProcessing) &&
                !this.config.googleCloudProjectId) {
                errors.push('Google Cloud Project ID is required for voice/OCR processing');
            }
        }
        // Validate numeric ranges
        if (this.config.port < 1 || this.config.port > 65535) {
            errors.push('Port must be between 1 and 65535');
        }
        if (this.config.bcryptRounds < 8 || this.config.bcryptRounds > 15) {
            errors.push('Bcrypt rounds must be between 8 and 15');
        }
        if (this.config.maxFileSize < 1024 || this.config.maxFileSize > 104857600) { // 1KB to 100MB
            errors.push('Max file size must be between 1KB and 100MB');
        }
        // Validate file types
        var validFileTypes = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt'];
        var invalidTypes = this.config.allowedFileTypes.filter(function (type) { return !validFileTypes.includes(type.toLowerCase()); });
        if (invalidTypes.length > 0) {
            errors.push("Invalid file types: ".concat(invalidTypes.join(', ')));
        }
        if (errors.length > 0) {
            logger_1.logger.error('Configuration validation failed:', errors);
            throw new Error("Configuration validation failed: ".concat(errors.join(', ')));
        }
        logger_1.logger.info('Configuration validated successfully');
    };
    // Getter methods for accessing configuration
    ConfigService.prototype.get = function () {
        return __assign({}, this.config); // Return a copy to prevent mutation
    };
    ConfigService.prototype.getServer = function () {
        return {
            port: this.config.port,
            nodeEnv: this.config.nodeEnv
        };
    };
    ConfigService.prototype.getDatabase = function () {
        return {
            mongoUri: this.config.mongoUri
        };
    };
    ConfigService.prototype.getRedis = function () {
        return {
            host: this.config.redisHost,
            port: this.config.redisPort,
            password: this.config.redisPassword
        };
    };
    ConfigService.prototype.getGoogleCloud = function () {
        return {
            projectId: this.config.googleCloudProjectId,
            keyFile: this.config.googleCloudKeyFile,
            credentials: this.config.googleCloudCredentials
        };
    };
    ConfigService.prototype.getTwilio = function () {
        return {
            accountSid: this.config.twilioAccountSid,
            authToken: this.config.twilioAuthToken,
            phoneNumber: this.config.twilioPhoneNumber,
            whatsAppNumber: this.config.twilioWhatsAppNumber
        };
    };
    ConfigService.prototype.getSecurity = function () {
        return {
            jwtSecret: this.config.jwtSecret,
            bcryptRounds: this.config.bcryptRounds
        };
    };
    ConfigService.prototype.getFileUpload = function () {
        return {
            maxFileSize: this.config.maxFileSize,
            allowedFileTypes: this.config.allowedFileTypes,
            uploadPath: this.config.uploadPath
        };
    };
    ConfigService.prototype.getRateLimit = function () {
        return {
            windowMs: this.config.rateLimitWindowMs,
            maxRequests: this.config.rateLimitMaxRequests
        };
    };
    ConfigService.prototype.getLogging = function () {
        return {
            level: this.config.logLevel
        };
    };
    ConfigService.prototype.getWorkers = function () {
        return {
            concurrency: this.config.workerConcurrency,
            cleanupInterval: this.config.queueCleanupInterval
        };
    };
    ConfigService.prototype.getContacts = function () {
        return {
            management: this.config.managementContact,
            support: this.config.supportContact
        };
    };
    ConfigService.prototype.getFeatureFlags = function () {
        return {
            enableVoiceProcessing: this.config.enableVoiceProcessing,
            enableOcrProcessing: this.config.enableOcrProcessing,
            enableFraudDetection: this.config.enableFraudDetection,
            enableEscalation: this.config.enableEscalation,
            enableNotifications: this.config.enableNotifications
        };
    };
    // Environment check methods
    ConfigService.prototype.isDevelopment = function () {
        return this.config.nodeEnv === 'development';
    };
    ConfigService.prototype.isProduction = function () {
        return this.config.nodeEnv === 'production';
    };
    ConfigService.prototype.isTest = function () {
        return this.config.nodeEnv === 'test';
    };
    // Feature check methods
    ConfigService.prototype.isFeatureEnabled = function (feature) {
        var flags = this.getFeatureFlags();
        return flags[feature] || false;
    };
    // Debug method to log sanitized configuration
    ConfigService.prototype.logConfig = function () {
        var sanitizedConfig = __assign(__assign({}, this.config), { mongoUri: this.config.mongoUri.replace(/\/\/.*:.*@/, '//***:***@'), twilioAccountSid: this.config.twilioAccountSid ? '***' : 'not set', twilioAuthToken: this.config.twilioAuthToken ? '***' : 'not set', jwtSecret: '***', redisPassword: this.config.redisPassword ? '***' : 'not set', googleCloudCredentials: this.config.googleCloudCredentials ? '***' : 'not set' });
        logger_1.logger.info('Current configuration:', sanitizedConfig);
    };
    return ConfigService;
}());
// Export singleton instance
exports.config = new ConfigService();
