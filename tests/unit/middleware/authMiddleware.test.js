"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("../../../src/middleware/authMiddleware");
const config_1 = require("../../../src/config/config");
// Mock jwt
jest.mock('jsonwebtoken');
const mockJwt = jsonwebtoken_1.default;
describe('Authentication Middleware', () => {
    let req;
    let res;
    let next;
    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        next = mockNext();
        jest.clearAllMocks();
    });
    describe('authenticateToken', () => {
        it('should authenticate valid JWT token', () => {
            req.headers.authorization = 'Bearer valid-token';
            const mockUser = { id: 'user123', email: 'test@example.com', role: 'customer' };
            mockJwt.verify.mockReturnValue(mockUser);
            (0, authMiddleware_1.authenticateToken)(req, res, next);
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
            expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', config_1.config.jwt.secret);
        });
        it('should reject request without authorization header', () => {
            (0, authMiddleware_1.authenticateToken)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. No token provided.'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should reject request with invalid token format', () => {
            req.headers.authorization = 'InvalidFormat token';
            (0, authMiddleware_1.authenticateToken)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. Invalid token format.'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should reject request with invalid token', () => {
            req.headers.authorization = 'Bearer invalid-token';
            mockJwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            (0, authMiddleware_1.authenticateToken)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. Invalid token.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
    describe('optionalAuth', () => {
        it('should set user if valid token is provided', () => {
            req.headers.authorization = 'Bearer valid-token';
            const mockUser = { id: 'user123', email: 'test@example.com', role: 'customer' };
            mockJwt.verify.mockReturnValue(mockUser);
            (0, authMiddleware_1.optionalAuth)(req, res, next);
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });
        it('should continue without user if no token is provided', () => {
            (0, authMiddleware_1.optionalAuth)(req, res, next);
            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });
        it('should continue without user if invalid token is provided', () => {
            req.headers.authorization = 'Bearer invalid-token';
            mockJwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            (0, authMiddleware_1.optionalAuth)(req, res, next);
            expect(req.user).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });
    });
    describe('authenticateApiKey', () => {
        it('should authenticate valid API key', () => {
            req.headers['x-api-key'] = config_1.config.auth.apiKey;
            (0, authMiddleware_1.authenticateApiKey)(req, res, next);
            expect(req.apiKeyAuth).toBe(true);
            expect(next).toHaveBeenCalled();
        });
        it('should reject request without API key', () => {
            (0, authMiddleware_1.authenticateApiKey)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. API key required.'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should reject request with invalid API key', () => {
            req.headers['x-api-key'] = 'invalid-api-key';
            (0, authMiddleware_1.authenticateApiKey)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. Invalid API key.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
    describe('adminOnly', () => {
        it('should allow admin users', () => {
            req.user = { id: 'admin123', role: 'admin' };
            (0, authMiddleware_1.adminOnly)(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject non-admin users', () => {
            req.user = { id: 'user123', role: 'customer' };
            (0, authMiddleware_1.adminOnly)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. Admin role required.'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should reject requests without user', () => {
            (0, authMiddleware_1.adminOnly)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. Authentication required.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
    describe('agentOrHigher', () => {
        it('should allow admin users', () => {
            req.user = { id: 'admin123', role: 'admin' };
            (0, authMiddleware_1.agentOrHigher)(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should allow agent users', () => {
            req.user = { id: 'agent123', role: 'agent' };
            (0, authMiddleware_1.agentOrHigher)(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject customer users', () => {
            req.user = { id: 'customer123', role: 'customer' };
            (0, authMiddleware_1.agentOrHigher)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. Agent role or higher required.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
    describe('customerServiceAccess', () => {
        it('should allow admin users', () => {
            req.user = { id: 'admin123', role: 'admin' };
            (0, authMiddleware_1.customerServiceAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should allow agent users', () => {
            req.user = { id: 'agent123', role: 'agent' };
            (0, authMiddleware_1.customerServiceAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should allow customer_service users', () => {
            req.user = { id: 'cs123', role: 'customer_service' };
            (0, authMiddleware_1.customerServiceAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject customer users', () => {
            req.user = { id: 'customer123', role: 'customer' };
            (0, authMiddleware_1.customerServiceAccess)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. Customer service access required.'
            });
            expect(next).not.toHaveBeenCalled();
        });
        it('should reject requests without user', () => {
            (0, authMiddleware_1.customerServiceAccess)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Access denied. Authentication required.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=authMiddleware.test.js.map