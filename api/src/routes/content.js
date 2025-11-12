const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{projectId}/content:
 *   post:
 *     summary: Create new content block
 *     tags: [CMS Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *               - type
 *               - data
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [TEXT, IMAGE, VIDEO, CODE, LINK, EMBED]
 *               data:
 *                 type: object
 *                 description: Content-specific data
 *               order:
 *                 type: integer
 *                 description: Display order (optional)
 *     responses:
 *       201:
 *         description: Content block created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/projects/:projectId/content', [
  body('contentType').isIn(['PROJECT', 'BLOG', 'EXPERIENCE']),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('excerpt').optional().trim(),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('metadata').optional().isObject(),
  body('order').optional().isInt({ min: 0 }),
  body('isPublished').optional().isBoolean()
], authorizeProjectAccess('EDITOR'), async (req, res) => {
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

    const { projectId } = req.params;
    const { contentType, title, slug, excerpt, content, metadata, order, isPublished } = req.body;

    // Generate slug if not provided
    let contentSlug = slug;
    if (!contentSlug && title) {
      contentSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }

    // Check if slug is unique
    if (contentSlug) {
      const existingContent = await prisma.content.findFirst({
        where: { slug: contentSlug }
      });
      if (existingContent) {
        contentSlug = `${contentSlug}-${Date.now()}`;
      }
    }

    // If no order specified, get the next order number
    let contentOrder = order;
    if (contentOrder === undefined) {
      const lastContent = await prisma.content.findFirst({
        where: { projectId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      contentOrder = lastContent ? lastContent.order + 1 : 0;
    }

    // Create content
    const newContent = await prisma.content.create({
      data: {
        projectId,
        type: contentType, // Use contentType as the main type
        contentType,
        title,
        slug: contentSlug,
        excerpt,
        content, // Markdown content
        metadata: metadata || {},
        order: contentOrder,
        isPublished: isPublished || false
      },
      include: {
        aiAnalysis: true
      }
    });

    // Clear project cache
    await cache.del(`project:${projectId}`);
    await cache.delPattern(`project:${projectId}:content*`);

    res.status(201).json(newContent);
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      error: 'Content Creation Failed',
      message: 'Unable to create content'
    });
  }
});

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get specific content block
 *     tags: [CMS Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content block retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Content not found
 */
router.get('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get content with project info
    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: true,
            members: {
              where: { userId }
            }
          }
        },
        aiAnalysis: true
      }
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    // Check access permissions
    const isOwner = content.project.ownerId === userId;
    const isMember = content.project.members.length > 0;

    if (!isOwner && !isMember) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have access to this content'
      });
    }

    res.json(content);
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      error: 'Content Retrieval Failed',
      message: 'Unable to retrieve content block'
    });
  }
});

/**
 * @swagger
 * /api/content/{id}:
 *   put:
 *     summary: Update content block
 *     tags: [CMS Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [TEXT, IMAGE, VIDEO, CODE, LINK, EMBED]
 *               data:
 *                 type: object
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Content block updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Content not found
 */
router.put('/content/:id', [
  body('type').optional().isIn(['TEXT', 'IMAGE', 'VIDEO', 'CODE', 'LINK', 'EMBED']),
  body('data').optional().isObject(),
  body('order').optional().isInt({ min: 0 })
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

    const { id } = req.params;
    const userId = req.user.id;
    const { type, data, order } = req.body;

    // Get content with project info to check permissions
    const existingContent = await prisma.content.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!existingContent) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    // Check access permissions
    const isOwner = existingContent.project.ownerId === userId;
    const memberAccess = existingContent.project.members[0];
    const canEdit = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canEdit) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to edit this content'
      });
    }

    // Update content
    const updateData = {};
    if (type) updateData.type = type;
    if (data) updateData.data = data;
    if (order !== undefined) updateData.order = order;

    const content = await prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        aiAnalysis: true
      }
    });

    // Clear project and content caches
    await cache.del(`project:${existingContent.projectId}`);
    await cache.del(`project:${existingContent.projectId}:content`);
    await cache.del(`content:${id}`);

    res.json(content);
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      error: 'Content Update Failed',
      message: 'Unable to update content block'
    });
  }
});

/**
 * @swagger
 * /api/content/{id}/fields:
 *   put:
 *     summary: Update content fields (title, content, slug, excerpt, metadata)
 *     tags: [CMS Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               content:
 *                 type: string
 *               metadata:
 *                 type: object
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Content fields updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Content not found
 */
router.put('/content/:id/fields', [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('excerpt').optional().trim(),
  body('content').optional().trim(),
  body('metadata').optional().isObject(),
  body('isPublished').optional().isBoolean()
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

    const { id } = req.params;
    const userId = req.user.id;
    const { title, slug, excerpt, content, metadata, isPublished } = req.body;

    // Get content with project info to check permissions
    const existingContent = await prisma.content.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!existingContent) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content does not exist'
      });
    }

    // Check access permissions
    const isOwner = existingContent.project.ownerId === userId;
    const memberAccess = existingContent.project.members[0];
    const canEdit = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canEdit) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to edit this content'
      });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    // Update content
    const updatedContent = await prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        aiAnalysis: true
      }
    });

    // Clear project and content caches
    await cache.del(`project:${existingContent.projectId}`);
    await cache.del(`project:${existingContent.projectId}:content`);
    await cache.del(`content:${id}`);

    res.json(updatedContent);
  } catch (error) {
    console.error('Update content fields error:', error);
    res.status(500).json({
      error: 'Content Update Failed',
      message: 'Unable to update content fields'
    });
  }
});

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     summary: Delete content block
 *     tags: [CMS Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     responses:
 *       204:
 *         description: Content block deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Content not found
 */
router.delete('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get content with project info to check permissions
    const existingContent = await prisma.content.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!existingContent) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    // Check access permissions
    const isOwner = existingContent.project.ownerId === userId;
    const memberAccess = existingContent.project.members[0];
    const canDelete = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canDelete) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to delete this content'
      });
    }

    // Delete content
    await prisma.content.delete({
      where: { id }
    });

    // Clear project and content caches
    await cache.del(`project:${existingContent.projectId}`);
    await cache.del(`project:${existingContent.projectId}:content`);
    await cache.del(`content:${id}`);

    res.status(204).send();
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      error: 'Content Deletion Failed',
      message: 'Unable to delete content block'
    });
  }
});

/**
 * @swagger
 * /api/content/{id}/reorder:
 *   put:
 *     summary: Reorder content blocks
 *     tags: [CMS Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newOrder
 *             properties:
 *               newOrder:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Content reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Content not found
 */
router.put('/content/:id/reorder', [
  body('newOrder').isInt({ min: 0 })
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

    const { id } = req.params;
    const userId = req.user.id;
    const { newOrder } = req.body;

    // Get content with project info to check permissions
    const existingContent = await prisma.content.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!existingContent) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    // Check access permissions
    const isOwner = existingContent.project.ownerId === userId;
    const memberAccess = existingContent.project.members[0];
    const canEdit = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canEdit) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to reorder this content'
      });
    }

    // Update content order
    const content = await prisma.content.update({
      where: { id },
      data: { order: newOrder },
      include: {
        aiAnalysis: true
      }
    });

    // Clear project and content caches
    await cache.del(`project:${existingContent.projectId}`);
    await cache.del(`project:${existingContent.projectId}:content`);

    res.json(content);
  } catch (error) {
    console.error('Reorder content error:', error);
    res.status(500).json({
      error: 'Content Reorder Failed',
      message: 'Unable to reorder content block'
    });
  }
});

module.exports = router;
