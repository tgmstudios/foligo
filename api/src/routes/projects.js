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
  body('description').optional().trim(),
  body('subdomain').optional().trim().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9-]+$/).withMessage('Subdomain must be 3-50 characters, lowercase letters, numbers, and hyphens only')
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

    const { name, description, subdomain } = req.body;
    const ownerId = req.user.id;

    // Check if subdomain is already taken
    if (subdomain) {
      const existingProject = await prisma.project.findUnique({
        where: { subdomain }
      });
      if (existingProject) {
        return res.status(409).json({
          error: 'Subdomain already taken',
          message: 'This subdomain is already in use'
        });
      }
    }

    // Create project with site configuration
    const project = await prisma.project.create({
      data: {
        name,
        description,
        subdomain,
        ownerId,
        siteConfig: {
          create: {
            siteName: name,
            siteDescription: description,
            layoutConfig: {}
          }
        }
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
        siteConfig: true,
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

      console.log('Owned projects query result:', ownedProjects.map(p => ({
        id: p.id,
        name: p.name,
        contentCount: p._count.content,
        contentArrayLength: p.content.length,
        content: p.content
      })));

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
          siteConfig: true,
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
    } else {
      // If we got data from cache but it doesn't have siteConfig, fetch fresh data
      if (!project.siteConfig) {
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
            siteConfig: true,
            _count: {
              select: {
                content: true,
                members: true,
                assets: true
              }
            }
          }
        });
        
        if (project) {
          await cache.set(cacheKey, project, 900);
        }
      }
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
     *               subdomain:
     *                 type: string
     *                 pattern: '^[a-z0-9-]+$'
     *                 minLength: 3
     *                 maxLength: 50
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
  body('description').optional().trim(),
  body('subdomain').optional().trim().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9-]+$/).withMessage('Subdomain must be 3-50 characters, lowercase letters, numbers, and hyphens only')
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
    const { name, description, subdomain } = req.body;

    // Check if subdomain is already taken (if provided and different from current)
    if (subdomain) {
      const currentProject = await prisma.project.findUnique({
        where: { id },
        select: { subdomain: true }
      });
      
      // Only check if subdomain is different from current
      if (currentProject && currentProject.subdomain !== subdomain) {
        const existingProject = await prisma.project.findUnique({
          where: { subdomain }
        });
        if (existingProject) {
          return res.status(409).json({
            error: 'Subdomain already taken',
            message: 'This subdomain is already in use'
          });
        }
      }
    }

    // Update project
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subdomain !== undefined) updateData.subdomain = subdomain;

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

/**
 * @swagger
 * /api/projects/{id}/site-config:
 *   get:
 *     summary: Get site configuration for a project
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
 *         description: Site configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 siteName:
 *                   type: string
 *                 siteDescription:
 *                   type: string
 *                 primaryColor:
 *                   type: string
 *                 secondaryColor:
 *                   type: string
 *                 accentColor:
 *                   type: string
 *                 backgroundColor:
 *                   type: string
 *                 textColor:
 *                   type: string
 *                 indexLayout:
 *                   type: string
 *                 archiveLayout:
 *                   type: string
 *                 singleLayout:
 *                   type: string
 *                 metaTitle:
 *                   type: string
 *                 metaDescription:
 *                   type: string
 *                 favicon:
 *                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.get('/:id/site-config', authorizeProjectAccess('VIEWER'), async (req, res) => {
  try {
    const projectId = req.params.id;

    const siteConfig = await prisma.siteConfig.findUnique({
      where: { projectId }
    });

    if (!siteConfig) {
      // Create default site config if it doesn't exist
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, description: true }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const newSiteConfig = await prisma.siteConfig.create({
        data: {
          projectId,
          siteName: project.name,
          siteDescription: project.description
        }
      });

      return res.json(newSiteConfig);
    }

    res.json(siteConfig);
  } catch (error) {
    console.error('Error fetching site config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/projects/{id}/site-config:
 *   put:
 *     summary: Update site configuration for a project
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
 *               siteName:
 *                 type: string
 *               siteDescription:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *               accentColor:
 *                 type: string
 *               backgroundColor:
 *                 type: string
 *               textColor:
 *                 type: string
 *               indexLayout:
 *                 type: string
 *                 enum: [grid, list, masonry]
 *               archiveLayout:
 *                 type: string
 *                 enum: [grid, list, masonry]
 *               singleLayout:
 *                 type: string
 *                 enum: [standard, wide, minimal]
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               favicon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Site configuration updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.put('/:id/site-config', [
  authorizeProjectAccess('EDITOR'),
  body('siteName').optional().trim(),
  body('siteDescription').optional().trim(),
  body('primaryColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('secondaryColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('accentColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('backgroundColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('textColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('indexLayout').optional().isIn(['grid', 'list', 'masonry']),
  body('archiveLayout').optional().isIn(['grid', 'list', 'masonry']),
  body('singleLayout').optional().isIn(['standard', 'wide', 'minimal']),
  body('metaTitle').optional().trim(),
  body('metaDescription').optional().trim(),
  body('favicon').optional().trim()
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

    const projectId = req.params.id;
    const updateData = req.body;

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const siteConfig = await prisma.siteConfig.upsert({
      where: { projectId },
      update: {
        ...updateData,
        layoutConfig: updateData.layoutConfig || {}
      },
      create: {
        projectId,
        ...updateData,
        layoutConfig: updateData.layoutConfig || {}
      }
    });

    // Clear project cache
    await cache.del(`project:${projectId}`);

    res.json(siteConfig);
  } catch (error) {
    console.error('Error updating site config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/projects/{id}/publish:
 *   post:
 *     summary: Publish or unpublish a project site
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
 *             required:
 *               - isPublished
 *             properties:
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Project publish status updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.post('/:id/publish', [
  authorizeProjectAccess('ADMIN'),
  body('isPublished').isBoolean()
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

    const projectId = req.params.id;
    const { isPublished } = req.body;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { isPublished },
      select: {
        id: true,
        name: true,
        subdomain: true,
        isPublished: true
      }
    });

    // Clear project cache
    await cache.del(`project:${projectId}`);

    res.json({
      message: `Project ${isPublished ? 'published' : 'unpublished'} successfully`,
      project
    });
  } catch (error) {
    console.error('Error updating publish status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
