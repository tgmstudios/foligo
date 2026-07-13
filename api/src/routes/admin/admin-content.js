const express = require('express');
const { body, query } = require('express-validator');
const { prisma } = require('../../services/core/database');
const { cache } = require('../../services/core/redis');
const { requireAdmin } = require('../../middleware/auth');
const { handleValidation } = require('../../middleware/handle-validation');
const { paginate, buildPaginationResponse } = require('../../utils/pagination');
const { buildSearchWhere } = require('../../utils/search-where');

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAdmin);

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
  query('status').optional().isIn(['DRAFT', 'PUBLISHED', 'HIDDEN', 'REVISION']),
  handleValidation
], async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req);
    const search = req.query.search || '';
    const contentType = req.query.contentType;
    const status = req.query.status;

    const where = buildSearchWhere(search, ['title', 'excerpt', 'slug']);
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
      pagination: buildPaginationResponse(total, page, limit)
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
  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'HIDDEN', 'REVISION']),
  handleValidation
], async (req, res) => {
  try {
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

module.exports = router;
