# Gromo Development Guide

This guide covers everything you need to know to develop, test, and deploy the Gromo insurance claim processing platform.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Testing Guidelines](#testing-guidelines)
6. [Code Quality](#code-quality)
7. [Database Management](#database-management)
8. [API Development](#api-development)
9. [Security Guidelines](#security-guidelines)
10. [Performance Optimization](#performance-optimization)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Docker and Docker Compose
- MongoDB 6.0+
- Redis 7+
- Google Cloud Platform account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd gromo

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up Git hooks
npx husky install

# Start development environment
docker-compose up -d
npm run dev
```

## Development Environment

### Local Development

```bash
# Start all services with Docker
docker-compose up -d

# Start the application
npm run dev

# In separate terminals:
npm run test:watch    # Run tests in watch mode
npm run lint:watch    # Run linter in watch mode
```

### Environment Variables

- `.env` - Local development
- `.env.test` - Test environment
- `.env.production` - Production template

### Required Services

- **MongoDB**: Document database
- **Redis**: Caching and queue management
- **Google Cloud**: Speech-to-Text and Vision APIs

## Project Structure

```
src/
├── api/                    # Route handlers
│   ├── auth.ts            # Authentication endpoints
│   ├── claims.ts          # Claims management
│   ├── voice.ts           # Voice processing
│   └── ocr.ts             # OCR processing
├── middleware/            # Express middleware
├── services/              # Business logic
├── models/                # Database models
├── workers/               # Background jobs
├── config/                # Configuration
├── utils/                 # Utilities
└── app.ts                 # Express setup

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
├── e2e/                   # End-to-end tests
└── load/                  # Load tests

scripts/                   # Utility scripts
monitoring/                # Monitoring configuration
docs/                      # Documentation
```

## Development Workflow

### Branch Strategy

- `main` - Production branch
- `develop` - Development integration
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

### Commit Convention

We use conventional commits:

```bash
feat: add voice transcription feature
fix: resolve authentication token expiry
docs: update API documentation
test: add unit tests for fraud detection
refactor: optimize database queries
```

### Code Review Process

1. Create feature branch from `develop`
2. Implement feature with tests
3. Run all quality checks
4. Create pull request
5. Code review and approval
6. Merge to `develop`

## Testing Guidelines

### Test Structure

```
tests/
├── unit/
│   ├── services/          # Service unit tests
│   ├── middleware/        # Middleware tests
│   └── utils/             # Utility tests
├── integration/
│   ├── api/               # API endpoint tests
│   └── database/          # Database tests
├── e2e/
│   ├── workflows/         # User workflow tests
│   └── scenarios/         # Business scenario tests
└── load/
    ├── config.yml         # Load test configuration
    └── fixtures/          # Test data
```

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Load tests
npm run test:load

# All tests
npm run test:all

# Coverage report
npm run test:coverage
```

### Writing Tests

#### Unit Test Example

```typescript
// tests/unit/services/fraudDetectionService.test.ts
import { FraudDetectionService } from '../../../src/services/fraudDetectionService';

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;

  beforeEach(() => {
    service = new FraudDetectionService();
  });

  describe('calculateRiskScore', () => {
    it('should return high risk for suspicious patterns', async () => {
      const claimData = {
        amount: 500000,
        location: 'known_fraud_location',
        vehicleAge: 20,
      };

      const result = await service.calculateRiskScore(claimData);
      expect(result.score).toBeGreaterThan(70);
      expect(result.factors).toContain('high_amount');
    });
  });
});
```

#### Integration Test Example

```typescript
// tests/integration/api/claims.test.ts
import request from 'supertest';
import { app } from '../../../src/app';

describe('Claims API', () => {
  describe('POST /api/claims', () => {
    it('should create a new claim', async () => {
      const claimData = {
        policyNumber: 'POL123',
        vehicleNumber: 'MH01AB1234',
        incidentType: 'collision',
        description: 'Minor accident',
      };

      const response = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${validToken}`)
        .send(claimData)
        .expect(201);

      expect(response.body.claimNumber).toBeDefined();
      expect(response.body.status).toBe('submitted');
    });
  });
});
```

## Code Quality

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Type checking
npm run type-check
```

### Pre-commit Hooks

Husky runs the following checks before each commit:

- TypeScript compilation
- ESLint validation
- Unit tests
- Security audit

### Code Standards

- Use TypeScript for all source code
- Follow ESLint configuration
- Write comprehensive JSDoc comments
- Maintain 80%+ test coverage
- Use meaningful variable names

## Database Management

### Migrations

```bash
# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status
```

### Seeding

```bash
# Add sample data
npm run db:seed

# Clear database
npm run db:seed clear

# Reset with fresh data
npm run db:seed reset
```

### Creating Migrations

```typescript
// src/database/migrations/005_add_feature.ts
import { Migration } from '../migrationRunner';

export const migration005: Migration = {
  version: '005',
  description: 'Add new feature fields',
  async up() {
    // Migration logic
  },
  async down() {
    // Rollback logic
  },
};
```

## API Development

### Route Structure

```typescript
// src/api/claims.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateClaim } from '../middleware/validation';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['customer', 'agent']),
  validateClaim,
  createClaim
);

export { router as claimsRouter };
```

### Error Handling

```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      field: error.field,
      message: error.message,
    });
  }
  
  // Handle other errors...
};
```

### Response Format

```typescript
// Successful response
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { /* error details */ }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123"
  }
}
```

## Security Guidelines

### Authentication

- Use JWT tokens with short expiry
- Implement refresh token rotation
- Store passwords with bcrypt (cost factor 12+)
- Implement account lockout after failed attempts

### Authorization

- Role-based access control (RBAC)
- Resource-level permissions
- API key authentication for services

### Input Validation

- Validate all inputs with express-validator
- Sanitize user inputs
- Use parameterized queries
- Implement rate limiting

### File Uploads

- Validate file types and sizes
- Scan for malware
- Store in secure location
- Generate unique filenames

## Performance Optimization

### Database Optimization

```typescript
// Use indexes for frequent queries
await collection.createIndex({ userId: 1, status: 1 });

// Use aggregation pipelines for complex queries
const results = await Claim.aggregate([
  { $match: { status: 'under-review' } },
  { $group: { _id: '$userId', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

// Use lean queries for read-only operations
const claims = await Claim.find({ userId }).lean();
```

### Caching Strategy

```typescript
// Cache frequently accessed data
const cacheKey = `user:${userId}:claims`;
let claims = await redis.get(cacheKey);

if (!claims) {
  claims = await Claim.find({ userId });
  await redis.setex(cacheKey, 3600, JSON.stringify(claims));
}
```

### API Response Optimization

- Use compression middleware
- Implement pagination
- Use field selection
- Cache static responses

## Deployment

### Development Deployment

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Deploy with Docker
docker build -t gromo:latest .
docker run -p 3000:3000 gromo:latest
```

### Production Deployment

```bash
# CI/CD pipeline automatically:
# 1. Runs tests
# 2. Builds Docker image
# 3. Pushes to registry
# 4. Deploys to Kubernetes

# Manual deployment
kubectl apply -f k8s/
kubectl rollout status deployment/gromo-app
```

### Environment Configuration

- Development: Single instance, file storage
- Staging: Multi-instance, cloud storage
- Production: Auto-scaling, CDN, monitoring

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check MongoDB connection
mongosh mongodb://localhost:27017/gromo

# Check Redis connection
redis-cli ping
```

#### Memory Issues

```bash
# Check memory usage
node --inspect src/index.ts

# Profile memory
npm install -g clinic
clinic doctor -- node src/index.ts
```

#### Performance Issues

```bash
# Profile CPU usage
npm run profile

# Check slow queries
db.setProfilingLevel(2)
db.system.profile.find().sort({ts: -1}).limit(5)
```

### Debugging

```bash
# Debug mode
DEBUG=gromo:* npm run dev

# VS Code debugging
# Use .vscode/launch.json configuration

# Remote debugging
node --inspect=0.0.0.0:9229 dist/index.js
```

### Logs

```bash
# View application logs
docker-compose logs -f gromo-app

# View system logs
kubectl logs -f deployment/gromo-app

# Search logs
grep "ERROR" logs/app.log | tail -20
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the development workflow
4. Submit a pull request
5. Address review feedback

### Getting Help

- Check the documentation first
- Search existing issues
- Create a detailed issue report
- Join the development chat

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Google Cloud APIs](https://cloud.google.com/docs)
- [Jest Testing Framework](https://jestjs.io/docs)

---

Happy coding! 🚀
