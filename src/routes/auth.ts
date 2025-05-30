import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route POST /api/v1/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // For testing purposes only - in production use proper authentication
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check credentials (simplified for testing)
    const isValid = (email.endsWith('@example.com') || email.endsWith('@gromo.com')) && 
                    password === 'password123';
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // User role based on email prefix
    let role = 'customer';
    if (email.startsWith('admin')) role = 'admin';
    if (email.startsWith('adjuster')) role = 'adjuster';
    if (email.startsWith('agent')) role = 'agent';

    // Create mock user
    const user = {
      id: `user-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role
    };

    // Create and sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.getSecurity().jwtSecret,
      { expiresIn: '1d' }
    );

    logger.info('User login successful', { email, role });
    
    // Return success with token
    return res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    logger.error('Login error', { error });
    return res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @route GET /api/v1/auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', (req, res) => {
  // For testing only - would normally use middleware to verify JWT
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      code: 'UNAUTHORIZED'
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.getSecurity().jwtSecret) as any;
    
    // Mock user profile response
    res.json({
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.email.split('@')[0],
        role: decoded.role
      }
    });
  } catch (error) {
    logger.error('Token verification failed', { error });
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
});

export default router;