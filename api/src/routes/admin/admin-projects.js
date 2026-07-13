const express = require('express');
const { body, query } = require('express-validator');
const { prisma } = require('../../services/core/database');
const { cache } = require('../../services/core/redis');
const { requireAdmin } = require('../../middleware/auth');
const { handleValidation } = require('../../middleware/handle-validation');
const { paginate, buildPaginationResponse } = require('../../utils/pagination');
const { buildSearchWhere } = require('../../utils/search-where');
const { checkSubdomainAvailable } = require('../../utils/uniqueness-check');

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAdmin);

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
  query('search').optional().trim(),
  handleValidation
], async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req);
    const search = req.query.search || '';

    const where = buildSearchWhere(search, ['name', 'description', 'subdomain']);

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
      pagination: buildPaginationResponse(total, page, limit)
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
        content: {
          where: { revisionOf: null },
          select: {
            id: true,
            title: true,
            contentType: true,
            status: true,
            excerpt: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' }
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
  body('isPublished').optional().isBoolean(),
  handleValidation
], async (req, res) => {
  try {
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
      const available = await checkSubdomainAvailable(prisma, subdomain, id);
      if (!available) {
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

module.exports = router;
