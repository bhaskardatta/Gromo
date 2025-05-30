/// <reference types="jest" />
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../../src/middleware/authMiddleware';
import { config } from '../../../src/config/config';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate valid token', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com', role: 'customer' };
    const mockToken = 'valid.jwt.token';
    
    mockRequest.headers = {
      authorization: `Bearer ${mockToken}`
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockUser);

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(jwt.verify).toHaveBeenCalledWith(mockToken, config.getSecurity().jwtSecret);
    expect(mockRequest.user).toEqual(mockUser);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should reject missing token', async () => {
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should reject invalid token', async () => {
    const mockToken = 'invalid.jwt.token';
    
    mockRequest.headers = {
      authorization: `Bearer ${mockToken}`
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle malformed authorization header', async () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat'
    };

    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
