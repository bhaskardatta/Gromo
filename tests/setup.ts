/// <reference types="jest" />
import { config } from 'dotenv';
import mongoose from 'mongoose';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock external APIs globally
jest.mock('@google-cloud/speech');
jest.mock('@google-cloud/vision');
jest.mock('twilio');
jest.mock('ioredis');

// Setup test database connection
beforeAll(async () => {
  // Use in-memory MongoDB for testing
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/gromo-test';
  
  try {
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.warn('MongoDB connection failed. Some tests may fail:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});

// Clear all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test helpers - properly typed for Jest
global.mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { id: 'test-user', role: 'customer' },
  file: null,
  files: [],
  ...overrides,
});

global.mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
};

global.mockNext = () => jest.fn();

// Ensure Jest types are properly loaded
declare global {
  function mockRequest(overrides?: any): any;
  function mockResponse(): any;
  function mockNext(): jest.Mock;
}
