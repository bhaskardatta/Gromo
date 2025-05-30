# Gromo - Insurance Claim Assistance Platform

Gromo is a comprehensive insurance claim processing platform that leverages AI technologies for voice recognition, document OCR, and claims management. The platform helps streamline the insurance claims process through intelligent automation and data extraction.

## 🚀 Features

- **Voice Processing**: Transcribe and analyze voice recordings for claim information extraction
- **Document OCR**: Extract structured data from insurance documents using optical character recognition
- **Claims Management**: End-to-end management of insurance claims with status tracking
- **Authentication**: Secure user authentication and authorization
- **API Documentation**: Comprehensive API documentation with Swagger/OpenAPI

## 🛠️ Technologies

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, Material-UI, TypeScript
- **Database**: MongoDB
- **Caching**: Redis
- **AI Services**: Google Cloud Speech-to-Text, Google Cloud Vision
- **Authentication**: JWT, bcrypt
- **Documentation**: Swagger/OpenAPI

## 🏁 Quick Start Guide

### Prerequisites

- Node.js (v18+)
- MongoDB (v6.0+)
- Redis (v7.0+)
- Google Cloud Platform account (for production use of Speech-to-Text and Vision APIs)

### Full Stack Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gromo.git
   cd gromo
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Copy environment configuration**
   ```bash
   # Copy the example .env file
   cp .env.example .env

   # Open and edit the .env file with your configuration
   # For development, you can keep MOCK_GOOGLE_SERVICES=true
   ```

4. **Configure your environment variables in .env**
   - Database connections
   - Google Cloud credentials
   - JWT secrets
   - API keys

5. **Start development server**
   ```bash
   npm run seed
   npm run build:full && npm start
   ```

6. **Access the application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:3000/api/v1/*](http://localhost:3000/api/v1/*)
   - API Docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
   - Health Check: [http://localhost:3000/health](http://localhost:3000/health)

### Docker Development Setup

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f gromo-app

# In a separate terminal, run the database seeder
docker-compose exec api npm run seed

# Stop services
docker-compose down
```

## 🧪 Testing

The project includes comprehensive testing at multiple levels:

### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test specific API endpoints
npm run test:integration -- --testNamePattern="Voice API"
```

### End-to-End Tests
```bash
# Run E2E tests with Cypress
npm run test:e2e

# Open Cypress interactive mode
npm run test:e2e:open
```

### Load Testing
```bash
# Run load tests with Artillery
npm run test:load

# Custom load test configuration
artillery run tests/load/config.yml
```

### Security Testing
```bash
# Run security audit
npm run security:audit

# Lint code for security issues
npm run lint
```

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
# Build and start both frontend and backend
npm run build:full && npm start

# Testing
npm run test         # Run all tests
npm run test:unit    # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e     # End-to-end tests
npm run test:load    # Load testing
npm run test:all     # Run complete test suite

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run security:audit  # Security vulnerability scan

# Utilities
npm run clean        # Clean build artifacts
npm run watch        # Watch mode compilation
```

## 📁 Project Structure

```
├── src/
│   ├── api/                 # API route handlers
│   │   ├── voice.ts         # Voice processing endpoints
│   │   ├── ocr.ts          # OCR processing endpoints
│   │   ├── claims.ts       # Claims management
│   │   └── escalation.ts   # Escalation workflows
│   ├── middleware/         # Express middleware
│   │   ├── authMiddleware.ts       # Authentication & authorization
│   │   ├── securityMiddleware.ts   # Security headers & validation
│   │   ├── errorHandler.ts        # Error handling
│   │   └── notFound.ts            # 404 handler
│   ├── services/           # Business logic services
│   │   ├── voiceService.ts         # Google Speech-to-Text integration
│   │   ├── ocrService.ts          # Google Vision API integration
│   │   ├── fraudDetectionService.ts # AI fraud detection
│   │   ├── escalationService.ts    # Automated escalation
│   │   └── notificationService.ts  # Twilio notifications
│   ├── models/             # MongoDB data models
│   │   ├── User.ts         # User management
│   │   └── Claim.ts        # Insurance claims
│   ├── workers/            # Background job processors
│   │   ├── escalationWorker.ts     # Escalation queue worker
│   │   ├── notificationWorker.ts   # Notification sender
│   │   └── workerManager.ts       # Worker coordination
│   ├── config/             # Configuration management
│   │   ├── config.ts       # Environment configuration
│   │   └── database.ts     # Database connection
│   ├── utils/              # Utility functions
│   │   └── logger.ts       # Structured logging
│   └── app.ts              # Express application setup
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── e2e/               # End-to-end tests
│   ├── load/              # Load testing configuration
│   └── setup.ts           # Test configuration
├── monitoring/             # Monitoring and alerting
│   ├── prometheus.yml      # Metrics collection
│   └── alert_rules.yml     # Alert definitions
├── .github/workflows/      # CI/CD pipelines
├── docs/                   # Documentation
├── docker-compose.yml      # Development environment
├── Dockerfile             # Container configuration
└── package.json           # Dependencies and scripts
```

## 🔐 Security Features

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (Admin, Agent, Customer Service, Customer)
- **Rate Limiting**: Multiple tiers based on endpoint sensitivity
- **Input Validation**: Comprehensive sanitization and validation
- **File Upload Security**: Format validation, size limits, virus scanning
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for comprehensive security headers
- **API Key Authentication**: For service-to-service communication

## 🤖 AI Capabilities

### Voice Processing
- **Multi-language Support**: 10+ Indian languages
- **Real-time Transcription**: Google Speech-to-Text integration
- **Entity Extraction**: Automatic extraction of claim numbers, policy numbers, dates, locations
- **Confidence Scoring**: Quality assessment of transcriptions

### OCR Processing
- **Document Types**: Claims forms, medical bills, police reports, repair estimates
- **Fallback Mechanisms**: 3-tier processing for maximum accuracy
- **Data Extraction**: Structured data extraction from unstructured documents
- **Validation**: Cross-document consistency checking

### Fraud Detection
- **Pattern Analysis**: ML-based suspicious pattern detection
- **Risk Scoring**: Multi-factor risk assessment
- **Blacklist Checking**: Vehicle and phone number validation
- **Document Verification**: Cross-reference validation

## 📊 Monitoring and Observability

### Metrics Collection
- **Application Metrics**: Response times, error rates, throughput
- **System Metrics**: CPU, memory, disk usage
- **Database Metrics**: Connection pools, query performance
- **Custom Metrics**: Business KPIs and fraud detection rates

### Alerting
- **Performance Alerts**: High response times, error rates
- **Infrastructure Alerts**: Resource exhaustion, service failures
- **Business Alerts**: Fraud detection triggers, escalation timeouts
- **Security Alerts**: Authentication failures, rate limit breaches

### Dashboards
- **Operational Dashboard**: Real-time system health
- **Business Dashboard**: Claims processing metrics
- **Security Dashboard**: Threat detection and response

## 🚀 Deployment

### Development Environment
```bash
# Start with Docker Compose
docker-compose up -d

# Access services:
# - Application: http://localhost:3000
# - MongoDB: localhost:27017
# - Redis: localhost:6379
# - Grafana: http://localhost:3001
# - Prometheus: http://localhost:9090
```

### Production Deployment

#### Using Docker
```bash
# Build production image
docker build -t gromo:latest .

# Run with production configuration
docker run -d \
  --name gromo-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://mongodb:27017/gromo \
  gromo:latest
```

#### Using Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=gromo

# View logs
kubectl logs -f deployment/gromo-app
```

## 🔄 CI/CD Pipeline

The project includes a comprehensive GitHub Actions pipeline:

1. **Code Quality**: Linting, type checking, security scanning
2. **Testing**: Unit, integration, and E2E tests
3. **Security**: Dependency auditing, SAST scanning
4. **Performance**: Load testing and performance regression detection
5. **Build**: Docker image creation and registry push
6. **Deploy**: Automated deployment to staging and production

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### Voice Processing Endpoints
- `POST /api/voice/transcribe` - Transcribe audio files
- `GET /api/voice/languages` - Get supported languages
- `POST /api/voice/validate` - Validate audio format

### OCR Processing Endpoints
- `POST /api/ocr/extract` - Extract text from images
- `POST /api/ocr/batch` - Batch process multiple images
- `GET /api/ocr/formats` - Get supported image formats

### Claims Management Endpoints
- `GET /api/claims` - List claims (paginated)
- `POST /api/claims` - Create new claim
- `GET /api/claims/:id` - Get claim details
- `PUT /api/claims/:id` - Update claim
- `DELETE /api/claims/:id` - Delete claim (admin only)

### Admin Endpoints
- `GET /api/admin/health` - System health check
- `GET /api/admin/metrics` - Performance metrics
- `GET /api/admin/users` - User management

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow the existing code style and patterns
- Ensure security considerations are addressed

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check the `docs/` directory
- **Issues**: Open a GitHub issue
- **Security**: Report security issues privately

## 🏆 Acknowledgments

- Google Cloud Platform for AI services
- MongoDB for database solutions
- Redis for caching infrastructure
- The open-source community for excellent tools and libraries

## License

ISC
