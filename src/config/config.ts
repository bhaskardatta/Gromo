import * as dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface Config {
  // Server Configuration
  port: number;
  nodeEnv: string;
  
  // Database Configuration
  mongoUri: string;
  
  // Redis Configuration
  redis?: {
    host: string;
    port: number;
    password?: string;
    database?: number;
  };
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  
  // Google Cloud Configuration
  googleCloudProjectId: string;
  googleCloudKeyFile?: string;
  googleCloudCredentials?: string;
  
  // Twilio Configuration
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  twilioWhatsAppNumber: string;
  
  // Security Configuration
  jwtSecret: string;
  bcryptRounds: number;
  
  // File Upload Configuration
  maxFileSize: number;
  allowedFileTypes: string[];
  uploadPath: string;
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  
  // Logging Configuration
  logLevel: string;
  
  // Worker Configuration
  workerConcurrency: number;
  queueCleanupInterval: number;
  
  // Management Contacts
  managementContact: string;
  supportContact: string;
  
  // Feature Flags
  enableVoiceProcessing: boolean;
  enableOcrProcessing: boolean;
  enableFraudDetection: boolean;
  enableEscalation: boolean;
  enableNotifications: boolean;
  
  // CORS Configuration
  cors?: {
    allowedOrigins: string[];
  };
}

class ConfigService {
  mongoUri(mongoUri: any) {
      throw new Error('Method not implemented.');
  }
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): Config {
    return {
      // Server Configuration
      port: parseInt(process.env.PORT || '3000'),
      nodeEnv: process.env.NODE_ENV || 'development',
      
      // Database Configuration
      mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/claimassist',
      
      // Redis Configuration
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DATABASE || '0')
      },
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
      enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
      
      // CORS Configuration
      cors: {
        allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',')
      }
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

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
    const validFileTypes = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt'];
    const invalidTypes = this.config.allowedFileTypes.filter(type => !validFileTypes.includes(type.toLowerCase()));
    if (invalidTypes.length > 0) {
      errors.push(`Invalid file types: ${invalidTypes.join(', ')}`);
    }

    if (errors.length > 0) {
      logger.error('Configuration validation failed:', errors);
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    logger.info('Configuration validated successfully');
  }

  // Getter methods for accessing configuration
  get(): Config {
    return { ...this.config }; // Return a copy to prevent mutation
  }

  getServer() {
    return {
      port: this.config.port,
      nodeEnv: this.config.nodeEnv
    };
  }

  getDatabase() {
    return {
      mongoUri: this.config.mongoUri
    };
  }

  getRedis() {
    // Return both legacy format and new redis config format
    return {
      host: this.config.redisHost,
      port: this.config.redisPort,
      password: this.config.redisPassword,
      // Add the new format properties
      ...this.config.redis
    };
  }

  // Add redis property for enhanced cache service
  get redis() {
    return this.config.redis;
  }

  // Add cors property for security middleware
  get cors() {
    return this.config.cors;
  }

  getGoogleCloud() {
    return {
      projectId: this.config.googleCloudProjectId,
      keyFile: this.config.googleCloudKeyFile,
      credentials: this.config.googleCloudCredentials
    };
  }

  // Add google property for backward compatibility with voice service
  get google() {
    return {
      projectId: this.config.googleCloudProjectId,
      credentialsPath: this.config.googleCloudKeyFile,
      credentials: this.config.googleCloudCredentials
    };
  }

  getTwilio() {
    return {
      accountSid: this.config.twilioAccountSid,
      authToken: this.config.twilioAuthToken,
      phoneNumber: this.config.twilioPhoneNumber,
      whatsAppNumber: this.config.twilioWhatsAppNumber
    };
  }

  // No need for a separate getRedis implementation - merged above
  
  getCors() {
    return this.config.cors;
  }

  getSecurity() {
    return {
      jwtSecret: this.config.jwtSecret,
      bcryptRounds: this.config.bcryptRounds
    };
  }

  getFileUpload() {
    return {
      maxFileSize: this.config.maxFileSize,
      allowedFileTypes: this.config.allowedFileTypes,
      uploadPath: this.config.uploadPath
    };
  }

  getRateLimit() {
    return {
      windowMs: this.config.rateLimitWindowMs,
      maxRequests: this.config.rateLimitMaxRequests
    };
  }

  getLogging() {
    return {
      level: this.config.logLevel
    };
  }

  getWorkers() {
    return {
      concurrency: this.config.workerConcurrency,
      cleanupInterval: this.config.queueCleanupInterval
    };
  }

  getContacts() {
    return {
      management: this.config.managementContact,
      support: this.config.supportContact
    };
  }

  getFeatureFlags() {
    return {
      enableVoiceProcessing: this.config.enableVoiceProcessing,
      enableOcrProcessing: this.config.enableOcrProcessing,
      enableFraudDetection: this.config.enableFraudDetection,
      enableEscalation: this.config.enableEscalation,
      enableNotifications: this.config.enableNotifications
    };
  }

  // Environment check methods
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  // Feature check methods
  isFeatureEnabled(feature: keyof Config['enableVoiceProcessing']): boolean {
    const flags = this.getFeatureFlags();
    return flags[feature as keyof typeof flags] || false;
  }

  // Debug method to log sanitized configuration
  logConfig(): void {
    const sanitizedConfig = {
      ...this.config,
      mongoUri: this.config.mongoUri.replace(/\/\/.*:.*@/, '//***:***@'),
      twilioAccountSid: this.config.twilioAccountSid ? '***' : 'not set',
      twilioAuthToken: this.config.twilioAuthToken ? '***' : 'not set',
      jwtSecret: '***',
      redisPassword: this.config.redisPassword ? '***' : 'not set',
      googleCloudCredentials: this.config.googleCloudCredentials ? '***' : 'not set'
    };

    logger.info('Current configuration:', sanitizedConfig);
  }
}

// Export singleton instance
export const config = new ConfigService();
