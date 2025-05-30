"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const mongoose_1 = __importDefault(require("mongoose"));
// Load test environment variables
(0, dotenv_1.config)({ path: '.env.test' });
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
        await mongoose_1.default.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
    catch (error) {
        console.warn('MongoDB connection failed. Some tests may fail:', error);
    }
});
// Cleanup after all tests
afterAll(async () => {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.connection.dropDatabase();
        await mongoose_1.default.connection.close();
    }
});
// Clear all mocks between tests
afterEach(() => {
    jest.clearAllMocks();
});
// Increase timeout for integration tests
jest.setTimeout(30000);
// Global test helpers
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
//# sourceMappingURL=setup.js.map