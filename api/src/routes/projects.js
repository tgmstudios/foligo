const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         ownerId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         owner:
 *           $ref: '#/components/schemas/User'
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProjectMember'
 *         content:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Content'
 *     ProjectMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         role:
 *           type: string
 *           enum: [ADMIN, EDITOR, VIEWER]
 *         user:
 *           $ref: '#/components/schemas/User'
 *     Content:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [TEXT, IMAGE, VIDEO, CODE, LINK, EMBED]
 *         data:
 *           type: object
 *         order:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', [
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim()
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

    const { name, description } = req.body;
    const ownerId = req.user.id;

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        content: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            content: true,
            members: true
          }
        }
      }
    });

    // Clear user projects cache
    await cache.del(`user:projects:${ownerId}`);

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: 'Project Creation Failed',
      message: 'Unable to create project'
    });
  }
});

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects user has access to
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
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
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to get projects from cache first
    const cacheKey = `user:projects:${userId}`;
    let projects = await cache.get(cacheKey);

    if (!projects) {
      // Get owned projects
      const ownedProjects = await prisma.project.findMany({
        where: { ownerId: userId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          content: {
            orderBy: { order: 'asc' }
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

      // Get projects where user is a member
      const memberProjects = await prisma.project.findMany({
        where: {
          members: {
            some: { userId }
          },
          NOT: { ownerId: userId }
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          content: {
            orderBy: { order: 'asc' }
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
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Projects Retrieval Failed',
      message: 'Unable to retrieve projects'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project details
 *     tags: [Projects]
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
 *         description: Project details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authorizeProjectAccess('VIEWER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Try to get project from cache first
    const cacheKey = `project:${id}`;
    let project = await cache.get(cacheKey);

    if (!project) {
      // Get project from database
      project = await prisma.project.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          content: {
            orderBy: { order: 'asc' },
            include: {
              aiAnalysis: true
            }
          },
          assets: true,
          _count: {
            select: {
              content: true,
              members: true,
              assets: true
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          error: 'Project Not Found',
          message: 'The requested project does not exist'
        });
      }

      // Cache project data for 15 minutes
      await cache.set(cacheKey, project, 900);
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      error: 'Project Retrieval Failed',
      message: 'Unable to retrieve project'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project details
 *     tags: [Projects]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim()
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

    const { id } = req.params;
    const { name, description } = req.body;

    // Update project
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        content: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            content: true,
            members: true
          }
        }
      }
    });

    // Clear project cache
    await cache.del(`project:${id}`);
    await cache.delPattern(`user:projects:*`);

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      error: 'Project Update Failed',
      message: 'Unable to update project'
    });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
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
 *       204:
 *         description: Project deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.delete('/:id', authorizeProjectAccess('OWNER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id }
    });

    // Clear all related caches
    await cache.del(`project:${id}`);
    await cache.delPattern(`user:projects:*`);
    await cache.delPattern(`project:${id}:*`);

    res.status(204).send();
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      error: 'Project Deletion Failed',
      message: 'Unable to delete project'
    });
  }
});

module.exports = router;
