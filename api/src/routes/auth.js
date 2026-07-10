const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    // Gate: public sign-ups can be disabled via env var.
    // SSO/OAuth account creation (sso-auth.js) is unaffected.
    const allowSignups = process.env.ALLOW_PUBLIC_SIGNUPS !== 'false';
    if (!allowSignups) {
      return res.status(403).json({
        error: 'Registration Disabled',
        message: 'Public sign-ups are currently disabled. Please use SSO to create an account.'
      });
    }

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User Already Exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        hasCompletedOnboarding: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration Failed',
      message: 'Unable to create user account'
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login Failed',
      message: 'Unable to authenticate user'
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access Token Required',
        message: 'Please provide a valid access token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to get user from cache first
    const cacheKey = `user:${decoded.userId}`;
    let user = await cache.get(cacheKey);

    if (!user) {
      // Get user from database
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          hasCompletedOnboarding: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Invalid Token',
          message: 'User not found'
        });
      }

      // Cache user data for 1 hour
      await cache.set(cacheKey, user, 3600);
    }

    res.json(user);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Please login again'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Please provide a valid token'
      });
    }

    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Profile Retrieval Failed',
      message: 'Unable to retrieve user profile'
    });
  }
});

// =============================================================================
// DEVICE CODE AUTH
// =============================================================================

/**
 * POST /api/auth/device-code
 * (authenticated) Generates a 6-character device code for cross-device login.
 * Stores userId in Redis with 5min TTL.
 */
router.post('/device-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const key = `device_code:${code}`;

    // Store userId in Redis with 5min TTL
    await cache.set(key, userId, 300);

    res.json({
      deviceCode: code,
      expiresIn: 300
    });
  } catch (error) {
    console.error('Device code generation error:', error);
    res.status(500).json({
      error: 'Device Code Generation Failed',
      message: 'Unable to generate device code'
    });
  }
});

/**
 * POST /api/auth/device-code/exchange
 * (public, no auth) Exchanges a device code for a JWT token.
 * Takes { deviceCode }, looks up userId in Redis, returns JWT.
 * Deletes the code after successful exchange.
 */
router.post('/device-code/exchange', async (req, res) => {
  try {
    const { deviceCode } = req.body;

    if (!deviceCode) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Device code is required'
      });
    }

    const key = `device_code:${deviceCode}`;
    const userId = await cache.get(key);

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid or Expired Code',
        message: 'The device code is invalid or has expired'
      });
    }

    // Delete the code (one-time use)
    await cache.del(key);

    // Generate JWT token
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        hasCompletedOnboarding: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      user,
      token
    });
  } catch (error) {
    console.error('Device code exchange error:', error);
    res.status(500).json({
      error: 'Device Code Exchange Failed',
      message: 'Unable to exchange device code'
    });
  }
});

/**
 * POST /api/auth/device-code/external
 * (authenticated) Accepts a device code from the foligo web page
 * and stores it in Redis for the extension to exchange.
 * Used by the foligo.tech/auth/link-device page content script.
 */
router.post('/device-code/external', authenticateToken, async (req, res) => {
  try {
    const { deviceCode } = req.body;

    if (!deviceCode || deviceCode.length !== 6) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A 6-character device code is required'
      });
    }

    const userId = req.user.id;
    const key = `device_code:${deviceCode}`;

    // Store userId in Redis with 5min TTL
    await cache.set(key, userId, 300);

    res.json({ success: true });
  } catch (error) {
    console.error('External device code error:', error);
    res.status(500).json({
      error: 'Device Code Registration Failed',
      message: 'Unable to register device code'
    });
  }
});

module.exports = router;
