# Gromo - Insurance Claim Assistance Platform

A comprehensive TypeScript-based insurance claim processing platform with AI-powered voice and OCR capabilities, fraud detection, and automated escalation features.

## 🚀 Project Status
✅ **Production Ready** - Complete implementation with comprehensive testing, security, and deployment infrastructure.

## 🔄 Modernization Overview

The Gromo platform has been fully modernized with enterprise-grade capabilities:

### ✨ Recent Modernization Enhancements

#### 🧪 Enhanced E2E Testing Infrastructure
- **Comprehensive Test Coverage**: Complete claims management workflow testing
- **Authentication Testing**: Registration, login, RBAC, and session management
- **Performance Testing**: Load time and responsiveness validation
- **Accessibility Testing**: Basic WCAG compliance checks
- **Mobile Responsiveness**: Touch interactions and responsive layout testing
- **Security Testing**: 2FA, brute force protection, and session security

#### 📊 Advanced Monitoring Dashboards
- **Business Metrics Dashboard**: Claims processing rates, fraud detection analytics, voice processing latency, language distribution, and SLA tracking
- **Infrastructure Dashboard**: Kubernetes health, resource usage, database monitoring, network I/O, and service discovery status
- **Real-time Alerting**: Automated notifications for critical system events
- **Performance Metrics**: Comprehensive application and infrastructure monitoring

#### 💾 Enhanced Backup Automation
- **Multi-Component Backup**: MongoDB, Redis, and application data
- **Cloud Integration**: AWS S3, Azure Blob Storage, and Google Cloud Storage support
- **Encryption**: AES-256 encryption for backup data
- **Verification**: Automated backup integrity checks
- **Notifications**: Email/Slack alerts for backup status
- **Retention Policies**: Configurable backup retention and cleanup

#### 🔄 CI/CD Pipeline Enhancements
- **Code Quality**: ESLint, Prettier, and TypeScript type checking
- **Security Scanning**: CodeQL analysis, Trivy vulnerability scanning, and SonarCloud integration
- **Multi-Environment Testing**: Unit, integration, E2E, and performance testing
- **Automated Deployment**: Staging and production deployment with blue-green strategy
- **Container Security**: Docker image scanning and security best practices

#### ⚡ Performance Optimization
- **Node.js Optimization**: Memory management and garbage collection tuning
- **Database Optimization**: Connection pooling and query optimization
- **Caching Strategy**: Redis caching with intelligent cache invalidation
- **Rate Limiting**: API protection and DDoS prevention
- **Auto-scaling**: Kubernetes horizontal pod autoscaling configuration

### 🔧 Modernization Tools & Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| **E2E Testing** | Cypress | Complete user workflow testing |
| **Monitoring** | Grafana + Prometheus | Real-time metrics and alerting |
| **Backup** | Custom Scripts + Cloud Storage | Automated data protection |
| **CI/CD** | GitHub Actions | Automated testing and deployment |
| **Performance** | Node.js + Redis | High-performance configuration |
| **Security** | CodeQL + Trivy | Vulnerability scanning and analysis |
| **Documentation** | Swagger + JSDoc | Comprehensive API documentation |

## 🏗️ Architecture Overview

Gromo is built with modern enterprise architecture principles:

- **Backend**: Node.js with TypeScript, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for performance optimization
- **Authentication**: JWT with role-based access control
- **AI Services**: Google Cloud Speech-to-Text and Vision APIs
- **Queue Management**: BullMQ for background processing
- **Monitoring**: Prometheus and Grafana
- **Deployment**: Docker with Kubernetes support

## 🛠️ Prerequisites

- **Node.js** (version 18 or higher)
- **MongoDB** (version 6.0 or higher)
- **Redis** (version 7 or higher)
- **Google Cloud Platform** account (for AI services)
- **Docker** (for containerized deployment)

## 📦 Installation

### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd gromo

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure your environment variables in .env
# - Database connections
# - Google Cloud credentials
# - JWT secrets
# - API keys

# Start development server
npm run dev
```

### Full Stack Quick Start (Frontend + Backend)

To run the complete integrated application with both React frontend and Express backend:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Copy environment configuration
cp .env.example .env

# Configure your environment variables in .env
# - Database connections (MongoDB, Redis)
# - Google Cloud credentials  
# - JWT secrets
# - API keys

# Build and start the full stack application
npm run start:full

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3000/api/v1/*
# - API Docs: http://localhost:3000/api-docs
# - Health Check: http://localhost:3000/health
```

**Alternative Development Commands:**
```bash
# Build everything (backend + frontend)
npm run build:full

# Development mode with hot reload (backend only)
npm run dev

# Development mode for frontend (in separate terminal)
npm run dev:frontend
```

### Docker Development Setup

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f gromo-app

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
