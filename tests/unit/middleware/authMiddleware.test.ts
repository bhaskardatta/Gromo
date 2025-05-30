/// <reference types="jest" />
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../src/middleware/authMiddleware';
import { config } from '../../../src/config/config';
import { logger } from '../../../src/utils/logger';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../src/utils/logger');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: any;
}

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate valid token', () => {
    const mockUser = { id: 'user123', email: 'test@example.com', role: 'customer' };
    const mockToken = 'valid.jwt.token';
    
    mockRequest.headers = {
      authorization: `Bearer ${mockToken}`
    };

    // Mock successful JWT verification
    mockedJwt.verify.mockImplementation((token, secret, callback: any) => {
      callback(null, mockUser);
    });

    authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockedJwt.verify).toHaveBeenCalledWith(
      mockToken, 
      config.getSecurity().jwtSecret, 
      expect.any(Function)
    );
    expect(mockRequest.user).toEqual(mockUser);
    expect(nextFunction).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('User authenticated', expect.any(Object));
  });

  it('should reject missing token', () => {
    authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      success: false,
      error: 'Access token required',
      code: 'TOKEN_REQUIRED'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject invalid token', () => {
    const mockToken = 'invalid.jwt.token';
    
    mockRequest.headers = {
      authorization: `Bearer ${mockToken}`
    };

    // Mock JWT verification failure
    mockedJwt.verify.mockImplementation((token, secret, callback: any) => {
      callback(new Error('Invalid token'), null);
    });

    authenticateToken(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      success: false,
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('JWT verification failed', expect.any(Object));
  });

  it('should handle malformed authorization header', () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat'
    };

    authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      success: false,
      error: 'Access token required',
      code: 'TOKEN_REQUIRED'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
