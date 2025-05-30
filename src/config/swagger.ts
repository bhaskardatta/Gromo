import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { config } from './config';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gromo Insurance Claim API',
      version: '1.0.0',
      description: 'Comprehensive insurance claim processing API with AI-powered voice and OCR capabilities',
      contact: {
        name: 'Gromo API Support',
        email: 'api-support@gromo.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: config.getServer().nodeEnv === 'production' ? 'https://api.gromo.com' : `http://localhost:${config.getServer().port}`,
        description: config.getServer().nodeEnv === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service communication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'phone', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
              example: '+91-9876543210',
            },
            role: {
              type: 'string',
              enum: ['customer', 'agent', 'admin', 'customer_service'],
              description: 'User role',
              example: 'customer',
            },
            isActive: {
              type: 'boolean',
              description: 'User active status',
              default: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        Claim: {
          type: 'object',
          required: ['policyNumber', 'claimType', 'status'],
          properties: {
            _id: {
              type: 'string',
              description: 'Claim ID',
              example: '507f1f77bcf86cd799439012',
            },
            claimNumber: {
              type: 'string',
              description: 'Unique claim number',
              example: 'CLM-2024-001234',
            },
            policyNumber: {
              type: 'string',
              description: 'Insurance policy number',
              example: 'POL-987654321',
            },
            claimType: {
              type: 'string',
              enum: ['motor', 'health', 'property', 'travel'],
              description: 'Type of insurance claim',
              example: 'motor',
            },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'settled'],
              description: 'Current claim status',
              example: 'submitted',
            },
            description: {
              type: 'string',
              description: 'Claim description',
              example: 'Vehicle collision with minor damage',
            },
            incidentDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time of incident',
            },
            claimAmount: {
              type: 'number',
              minimum: 0,
              description: 'Claimed amount in INR',
              example: 50000,
            },
            approvedAmount: {
              type: 'number',
              minimum: 0,
              description: 'Approved amount in INR',
              example: 45000,
            },
            documents: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Document',
              },
              description: 'Claim supporting documents',
            },
            fraudAnalysis: {
              $ref: '#/components/schemas/FraudAnalysis',
            },
            processingSteps: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProcessingStep',
              },
              description: 'Claim processing history',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Claim creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Document: {
          type: 'object',
          required: ['type', 'filename', 'url'],
          properties: {
            type: {
              type: 'string',
              enum: ['police_report', 'medical_bill', 'prescription', 'vehicle_photo', 'damage_photo', 'identity_proof'],
              description: 'Document type',
              example: 'medical_bill',
            },
            filename: {
              type: 'string',
              description: 'Original filename',
              example: 'hospital_bill.pdf',
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Document URL',
              example: 'https://storage.gromo.com/documents/abc123.pdf',
            },
            extractedData: {
              type: 'object',
              description: 'OCR extracted data',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'OCR confidence score',
              example: 0.95,
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Upload timestamp',
            },
          },
        },
        FraudAnalysis: {
          type: 'object',
          properties: {
            fraudScore: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Fraud probability score',
              example: 0.15,
            },
            riskLevel: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Risk assessment level',
              example: 'low',
            },
            flags: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Fraud detection flags',
              example: ['location_mismatch', 'unusual_amount'],
            },
            recommendation: {
              type: 'string',
              enum: ['auto_approve', 'manual_review', 'investigate'],
              description: 'Processing recommendation',
              example: 'manual_review',
            },
            analyzedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Analysis timestamp',
            },
          },
        },
        ProcessingStep: {
          type: 'object',
          required: ['step', 'completedAt', 'success'],
          properties: {
            step: {
              type: 'string',
              description: 'Processing step name',
              example: 'document_verification',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Step completion timestamp',
            },
            success: {
              type: 'boolean',
              description: 'Step success status',
              example: true,
            },
            details: {
              type: 'string',
              description: 'Step details or error message',
              example: 'All documents verified successfully',
            },
            processor: {
              type: 'string',
              description: 'Processor (system/user ID)',
              example: 'system',
            },
          },
        },
        VoiceTranscription: {
          type: 'object',
          properties: {
            transcript: {
              type: 'string',
              description: 'Transcribed text',
              example: 'I had an accident yesterday near the hospital',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Transcription confidence',
              example: 0.92,
            },
            language: {
              type: 'string',
              description: 'Detected language',
              example: 'en-IN',
            },
            keywords: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Extracted keywords',
              example: ['accident', 'hospital', 'yesterday'],
            },
            duration: {
              type: 'number',
              description: 'Audio duration in seconds',
              example: 12.5,
            },
          },
        },
        OCRResult: {
          type: 'object',
          properties: {
            extractedText: {
              type: 'string',
              description: 'Extracted text content',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'OCR confidence score',
              example: 0.88,
            },
            structuredData: {
              type: 'object',
              description: 'Structured extracted data',
            },
            method: {
              type: 'string',
              enum: ['tesseract', 'google_vision'],
              description: 'OCR method used',
              example: 'google_vision',
            },
            processingTime: {
              type: 'number',
              description: 'Processing time in milliseconds',
              example: 1500,
            },
          },
        },
        Error: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                  example: 'Invalid input data',
                },
                details: {
                  type: 'object',
                  description: 'Additional error details',
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp',
                },
                requestId: {
                  type: 'string',
                  description: 'Request ID for tracking',
                  example: 'req_123456',
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Response timestamp',
                },
                requestId: {
                  type: 'string',
                  description: 'Request ID for tracking',
                  example: 'req_123456',
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'number',
                      example: 1,
                    },
                    limit: {
                      type: 'number',
                      example: 10,
                    },
                    total: {
                      type: 'number',
                      example: 100,
                    },
                    pages: {
                      type: 'number',
                      example: 10,
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid input data',
                  details: {
                    field: 'email',
                    issue: 'Invalid email format',
                  },
                },
                meta: {
                  timestamp: '2024-01-01T00:00:00Z',
                  requestId: 'req_123456',
                },
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required',
                },
                meta: {
                  timestamp: '2024-01-01T00:00:00Z',
                  requestId: 'req_123456',
                },
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions',
                },
                meta: {
                  timestamp: '2024-01-01T00:00:00Z',
                  requestId: 'req_123456',
                },
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                },
                meta: {
                  timestamp: '2024-01-01T00:00:00Z',
                  requestId: 'req_123456',
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'An unexpected error occurred',
                },
                meta: {
                  timestamp: '2024-01-01T00:00:00Z',
                  requestId: 'req_123456',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/api/*.ts', // Path to the API route files
    './src/models/*.ts', // Path to the model files
  ],
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Application): void => {
  // Swagger UI setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Gromo API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));

  // Raw OpenAPI JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log(`📚 API Documentation available at: ${config.getServer().nodeEnv === 'production' ? 'https://api.gromo.com' : `http://localhost:${config.getServer().port}`}/api-docs`);
};

export { specs as swaggerSpecs };
