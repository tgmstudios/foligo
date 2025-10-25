const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{id}/members:
 *   post:
 *     summary: Add a user to project
 *     tags: [Project Access Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [ADMIN, EDITOR, VIEWER]
 *     responses:
 *       201:
 *         description: User added to project successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectMember'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project or user not found
 *       409:
 *         description: User already has access
 */
router.post('/:id/members', [
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['ADMIN', 'EDITOR', 'VIEWER'])
], authorizeProjectAccess('ADMIN'), async (req, res) => {
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

    const { id: projectId } = req.params;
    const { email, role } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'No user found with this email address'
      });
    }

    // Check if user is already a member
    const existingAccess = await prisma.projectAccess.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (existingAccess) {
      return res.status(409).json({
        error: 'User Already Has Access',
        message: 'This user already has access to the project'
      });
    }

    // Check if user is the project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: user.id
      }
    });

    if (project) {
      return res.status(409).json({
        error: 'User Is Project Owner',
        message: 'The project owner cannot be added as a member'
      });
    }

    // Add user to project
    const projectAccess = await prisma.projectAccess.create({
      data: {
        userId: user.id,
        projectId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Clear project and user caches
    await cache.del(`project:${projectId}`);
    await cache.del(`user:projects:${user.id}`);
    await cache.delPattern(`user:projects:*`);

    res.status(201).json(projectAccess);
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({
      error: 'Add Member Failed',
      message: 'Unable to add user to project'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}/members:
 *   get:
 *     summary: Get project members
 *     tags: [Project Access Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectMember'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.get('/:id/members', authorizeProjectAccess('VIEWER'), async (req, res) => {
  try {
    const { id: projectId } = req.params;

    // Try to get members from cache first
    const cacheKey = `project:${projectId}:members`;
    let members = await cache.get(cacheKey);

    if (!members) {
      // Get project members
      members = await prisma.projectAccess.findMany({
        where: { projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Cache members data for 15 minutes
      await cache.set(cacheKey, members, 900);
    }

    res.json(members);
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({
      error: 'Members Retrieval Failed',
      message: 'Unable to retrieve project members'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}/members/{userId}:
 *   put:
 *     summary: Update user role in project
 *     tags: [Project Access Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, EDITOR, VIEWER]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectMember'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project access not found
 */
router.put('/:id/members/:userId', [
  body('role').isIn(['ADMIN', 'EDITOR', 'VIEWER'])
], authorizeProjectAccess('ADMIN'), async (req, res) => {
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

    const { id: projectId, userId } = req.params;
    const { role } = req.body;

    // Check if user is the project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });

    if (project) {
      return res.status(400).json({
        error: 'Cannot Modify Owner',
        message: 'Cannot change the role of the project owner'
      });
    }

    // Update user role
    const projectAccess = await prisma.projectAccess.updateMany({
      where: {
        projectId,
        userId
      },
      data: { role }
    });

    if (projectAccess.count === 0) {
      return res.status(404).json({
        error: 'Access Not Found',
        message: 'User does not have access to this project'
      });
    }

    // Get updated access record
    const updatedAccess = await prisma.projectAccess.findFirst({
      where: {
        projectId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Clear project and user caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:members`);
    await cache.del(`user:projects:${userId}`);
    await cache.delPattern(`user:projects:*`);

    res.json(updatedAccess);
  } catch (error) {
    console.error('Update project member role error:', error);
    res.status(500).json({
      error: 'Role Update Failed',
      message: 'Unable to update user role'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}/members/{userId}:
 *   delete:
 *     summary: Remove user from project
 *     tags: [Project Access Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       204:
 *         description: User removed from project successfully
 *       400:
 *         description: Cannot remove project owner
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project access not found
 */
router.delete('/:id/members/:userId', authorizeProjectAccess('ADMIN'), async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    // Check if user is the project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });

    if (project) {
      return res.status(400).json({
        error: 'Cannot Remove Owner',
        message: 'Cannot remove the project owner from the project'
      });
    }

    // Remove user from project
    const deletedAccess = await prisma.projectAccess.deleteMany({
      where: {
        projectId,
        userId
      }
    });

    if (deletedAccess.count === 0) {
      return res.status(404).json({
        error: 'Access Not Found',
        message: 'User does not have access to this project'
      });
    }

    // Clear project and user caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:members`);
    await cache.del(`user:projects:${userId}`);
    await cache.delPattern(`user:projects:*`);

    res.status(204).send();
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({
      error: 'Remove Member Failed',
      message: 'Unable to remove user from project'
    });
  }
});

module.exports = router;
