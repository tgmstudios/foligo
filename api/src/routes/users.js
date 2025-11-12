const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');

const router = express.Router();

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user public profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to get user from cache first
    const cacheKey = `user:public:${id}`;
    let user = await cache.get(cacheKey);

    if (!user) {
      // Get user from database (public info only)
      user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'The requested user does not exist'
        });
      }

      // Cache user data for 1 hour
      await cache.set(cacheKey, user, 3600);
    }

    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Profile Retrieval Failed',
      message: 'Unable to retrieve user profile'
    });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/me', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail()
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

    const { name, email } = req.body;
    const userId = req.user.id;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'A user with this email already exists'
        });
      }
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Clear user cache
    await cache.del(`user:${userId}`);
    await cache.del(`user:public:${userId}`);

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      error: 'Profile Update Failed',
      message: 'Unable to update user profile'
    });
  }
});

/**
 * @swagger
 * /api/users/me/projects:
 *   get:
 *     summary: Get current user's projects
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ownedProjects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 memberProjects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 */
router.get('/me/projects', async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to get projects from cache first
    const cacheKey = `user:projects:${userId}`;
    let projects = await cache.get(cacheKey);

    if (!projects) {
      // Get owned projects
      const ownedProjects = await prisma.project.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              content: true,
              members: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Get projects where user is a member
      const memberProjects = await prisma.project.findMany({
        where: {
          members: {
            some: { userId }
          },
          NOT: { ownerId: userId }
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              name: true
            }
          },
          members: {
            where: { userId },
            select: {
              role: true
            }
          },
          _count: {
            select: {
              content: true,
              members: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      projects = {
        ownedProjects,
        memberProjects
      };

      // Cache projects data for 30 minutes
      await cache.set(cacheKey, projects, 1800);
    }

    res.json(projects);
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      error: 'Projects Retrieval Failed',
      message: 'Unable to retrieve user projects'
    });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               hasCompletedOnboarding:
 *                 type: boolean
 *               isAdmin:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/me', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('hasCompletedOnboarding').optional().isBoolean(),
  body('isAdmin').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const updateData = req.body;

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No Data Provided',
        message: 'At least one field must be provided for update'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    // Clear user cache
    await cache.del(`user:${userId}`);

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Profile Update Failed',
      message: 'Unable to update profile'
    });
  }
});

module.exports = router;
