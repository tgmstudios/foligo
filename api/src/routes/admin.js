const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          hasCompletedOnboarding: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projectsOwned: true,
              projectAccess: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: 'Unable to fetch users'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true,
        projectsOwned: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            isPublished: true,
            createdAt: true,
            _count: {
              select: {
                content: true,
                members: true
              }
            }
          }
        },
        projectAccess: {
          select: {
            id: true,
            role: true,
            project: {
              select: {
                id: true,
                name: true,
                subdomain: true,
                isPublished: true
              }
            }
          }
        },
        _count: {
          select: {
            projectsOwned: true,
            projectAccess: true,
            media: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'The requested user does not exist'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user',
      message: 'Unable to fetch user details'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/users/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('isAdmin').optional().isBoolean(),
  body('hasCompletedOnboarding').optional().isBoolean()
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

    const { id } = req.params;
    const { name, email, isAdmin, hasCompletedOnboarding } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'The requested user does not exist'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }
        }
      });

      if (emailExists) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'A user with this email already exists'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (hasCompletedOnboarding !== undefined) updateData.hasCompletedOnboarding = hasCompletedOnboarding;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Clear user cache
    await cache.del(`user:${id}`);
    await cache.del(`user:public:${id}`);

    res.json(updatedUser);
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'Unable to update user'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot Delete Self',
        message: 'You cannot delete your own account'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'The requested user does not exist'
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    // Clear user cache
    await cache.del(`user:${id}`);
    await cache.del(`user:public:${id}`);
    await cache.del(`user:projects:${id}`);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'Unable to delete user'
    });
  }
});

/**
 * @swagger
 * /api/admin/projects:
 *   get:
 *     summary: Get all projects (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/projects', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              content: true,
              members: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get projects error:', error);
    res.status(500).json({
      error: 'Failed to retrieve projects',
      message: 'Unable to fetch projects'
    });
  }
});

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   get:
 *     summary: Get project details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
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
        siteConfig: true,
        _count: {
          select: {
            content: true,
            members: true,
            media: true
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

    res.json(project);
  } catch (error) {
    console.error('Admin get project error:', error);
    res.status(500).json({
      error: 'Failed to retrieve project',
      message: 'Unable to fetch project details'
    });
  }
});

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   put:
 *     summary: Update project (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/projects/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('subdomain').optional().trim().isLength({ min: 3, max: 50 }),
  body('isPublished').optional().isBoolean()
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

    const { id } = req.params;
    const { name, description, subdomain, isPublished } = req.body;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({
        error: 'Project Not Found',
        message: 'The requested project does not exist'
      });
    }

    // Check if subdomain is being changed and if it already exists
    if (subdomain && subdomain !== existingProject.subdomain) {
      const subdomainExists = await prisma.project.findFirst({
        where: {
          subdomain,
          NOT: { id }
        }
      });

      if (subdomainExists) {
        return res.status(409).json({
          error: 'Subdomain Already Taken',
          message: 'This subdomain is already in use'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subdomain !== undefined) updateData.subdomain = subdomain;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updatedProject = await prisma.project.update({
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
    await cache.del(`project:${id}:content`);
    if (updatedProject.ownerId) {
      await cache.del(`user:projects:${updatedProject.ownerId}`);
    }

    res.json(updatedProject);
  } catch (error) {
    console.error('Admin update project error:', error);
    res.status(500).json({
      error: 'Failed to update project',
      message: 'Unable to update project'
    });
  }
});

/**
 * @swagger
 * /api/admin/projects/{id}:
 *   delete:
 *     summary: Delete project (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project Not Found',
        message: 'The requested project does not exist'
      });
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id }
    });

    // Clear caches
    await cache.del(`project:${id}`);
    await cache.del(`project:${id}:content`);
    if (project.ownerId) {
      await cache.del(`user:projects:${project.ownerId}`);
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Admin delete project error:', error);
    res.status(500).json({
      error: 'Failed to delete project',
      message: 'Unable to delete project'
    });
  }
});

/**
 * @swagger
 * /api/admin/content:
 *   get:
 *     summary: Get all content (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/content', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('contentType').optional().isIn(['PROJECT', 'BLOG', 'EXPERIENCE', 'SKILL']),
  query('status').optional().isIn(['DRAFT', 'PUBLISHED', 'HIDDEN', 'REVISION'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const contentType = req.query.contentType;
    const status = req.query.status;

    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (contentType) {
      where.contentType = contentType;
    }
    if (status) {
      where.status = status;
    }

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              subdomain: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.content.count({ where })
    ]);

    res.json({
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get content error:', error);
    res.status(500).json({
      error: 'Failed to retrieve content',
      message: 'Unable to fetch content'
    });
  }
});

/**
 * @swagger
 * /api/admin/content/{id}:
 *   get:
 *     summary: Get content details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content does not exist'
      });
    }

    res.json(content);
  } catch (error) {
    console.error('Admin get content error:', error);
    res.status(500).json({
      error: 'Failed to retrieve content',
      message: 'Unable to fetch content details'
    });
  }
});

/**
 * @swagger
 * /api/admin/content/{id}:
 *   put:
 *     summary: Update content (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/content/:id', [
  body('title').optional().trim().isLength({ min: 1 }),
  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'HIDDEN', 'REVISION'])
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

    const { id } = req.params;
    const { title, status } = req.body;

    // Check if content exists
    const existingContent = await prisma.content.findUnique({
      where: { id },
      select: { projectId: true }
    });

    if (!existingContent) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content does not exist'
      });
    }

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;

    const updatedContent = await prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Clear content cache
    if (existingContent.projectId) {
      await cache.del(`project:${existingContent.projectId}:content`);
    }

    res.json(updatedContent);
  } catch (error) {
    console.error('Admin update content error:', error);
    res.status(500).json({
      error: 'Failed to update content',
      message: 'Unable to update content'
    });
  }
});

/**
 * @swagger
 * /api/admin/content/{id}:
 *   delete:
 *     summary: Delete content (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if content exists
    const content = await prisma.content.findUnique({
      where: { id },
      select: { projectId: true }
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content does not exist'
      });
    }

    // Delete content (cascade will handle related records)
    await prisma.content.delete({
      where: { id }
    });

    // Clear content cache
    if (content.projectId) {
      await cache.del(`project:${content.projectId}:content`);
    }

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Admin delete content error:', error);
    res.status(500).json({
      error: 'Failed to delete content',
      message: 'Unable to delete content'
    });
  }
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalProjects, totalContent, recentUsers, recentProjects] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.content.count({ where: { revisionOf: null } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          subdomain: true,
          createdAt: true,
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProjects,
        totalContent
      },
      recentUsers,
      recentProjects
    });
  } catch (error) {
    console.error('Admin get stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: 'Unable to fetch dashboard statistics'
    });
  }
});

module.exports = router;

