const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/blocks:
 *   post:
 *     summary: Create a content block
 *     tags: [Content Blocks]
 */
router.post('/projects/:projectId/content/:contentId/blocks', [
  body('type').isIn(['TEXT', 'IMAGE', 'VIDEO', 'CODE', 'LINK', 'EMBED', 'GALLERY', 'QUOTE', 'CUSTOM']).withMessage('Invalid block type'),
  body('content').notEmpty().withMessage('Content is required'),
  body('order').optional().isInt({ min: 0 })
], authorizeProjectAccess('EDITOR'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { projectId, contentId } = req.params;
    const { type, content: blockContent, order } = req.body;

    // Verify content belongs to project
    const content = await prisma.content.findFirst({
      where: { id: contentId, projectId }
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'Content not found in this project'
      });
    }

    // Determine order
    let blockOrder = order;
    if (blockOrder === undefined) {
      const lastBlock = await prisma.contentBlock.findFirst({
        where: { contentId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      blockOrder = lastBlock ? lastBlock.order + 1 : 0;
    }

    // Create block
    const block = await prisma.contentBlock.create({
      data: {
        contentId,
        type,
        content: typeof blockContent === 'object' ? JSON.stringify(blockContent) : String(blockContent),
        order: blockOrder
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    await cache.del(`content:${contentId}`);

    res.status(201).json(block);
  } catch (error) {
    console.error('Create content block error:', error);
    res.status(500).json({
      error: 'Content Block Creation Failed',
      message: 'Unable to create content block'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/blocks:
 *   get:
 *     summary: Get all blocks for content
 *     tags: [Content Blocks]
 */
router.get('/projects/:projectId/content/:contentId/blocks', authorizeProjectAccess('VIEWER'), async (req, res) => {
  try {
    const { projectId, contentId } = req.params;

    // Verify content belongs to project
    const content = await prisma.content.findFirst({
      where: { id: contentId, projectId }
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'Content not found in this project'
      });
    }

    const blocks = await prisma.contentBlock.findMany({
      where: { contentId },
      orderBy: { order: 'asc' }
    });

    res.json(blocks);
  } catch (error) {
    console.error('Get content blocks error:', error);
    res.status(500).json({
      error: 'Content Blocks Retrieval Failed',
      message: 'Unable to retrieve content blocks'
    });
  }
});

/**
 * @swagger
 * /api/content-blocks/{id}:
 *   put:
 *     summary: Update a content block
 *     tags: [Content Blocks]
 */
router.put('/content-blocks/:id', [
  body('type').optional().isIn(['TEXT', 'IMAGE', 'VIDEO', 'CODE', 'LINK', 'EMBED', 'GALLERY', 'QUOTE', 'CUSTOM']),
  body('content').optional().notEmpty(),
  body('order').optional().isInt({ min: 0 })
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
    const userId = req.user.id;
    const { type, content: blockContent, order } = req.body;

    // Get block with content and project info
    const block = await prisma.contentBlock.findUnique({
      where: { id },
      include: {
        content: {
          include: {
            project: {
              include: {
                owner: true,
                members: { where: { userId } }
              }
            }
          }
        }
      }
    });

    if (!block) {
      return res.status(404).json({
        error: 'Block Not Found',
        message: 'The requested block does not exist'
      });
    }

    // Check access
    const isOwner = block.content.project.ownerId === userId;
    const memberAccess = block.content.project.members[0];
    const canEdit = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canEdit) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to edit this block'
      });
    }

    // Update block
    const updateData = {};
    if (type) updateData.type = type;
    if (blockContent !== undefined) {
      updateData.content = typeof blockContent === 'object' ? JSON.stringify(blockContent) : String(blockContent);
    }
    if (order !== undefined) updateData.order = order;

    const updatedBlock = await prisma.contentBlock.update({
      where: { id },
      data: updateData
    });

    // Clear caches
    await cache.del(`project:${block.content.projectId}`);
    await cache.del(`project:${block.content.projectId}:content`);
    await cache.del(`content:${block.contentId}`);

    res.json(updatedBlock);
  } catch (error) {
    console.error('Update content block error:', error);
    res.status(500).json({
      error: 'Content Block Update Failed',
      message: 'Unable to update content block'
    });
  }
});

/**
 * @swagger
 * /api/content-blocks/{id}:
 *   delete:
 *     summary: Delete a content block
 *     tags: [Content Blocks]
 */
router.delete('/content-blocks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get block with content and project info
    const block = await prisma.contentBlock.findUnique({
      where: { id },
      include: {
        content: {
          include: {
            project: {
              include: {
                owner: true,
                members: { where: { userId } }
              }
            }
          }
        }
      }
    });

    if (!block) {
      return res.status(404).json({
        error: 'Block Not Found',
        message: 'The requested block does not exist'
      });
    }

    // Check access
    const isOwner = block.content.project.ownerId === userId;
    const memberAccess = block.content.project.members[0];
    const canDelete = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canDelete) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to delete this block'
      });
    }

    await prisma.contentBlock.delete({
      where: { id }
    });

    // Clear caches
    await cache.del(`project:${block.content.projectId}`);
    await cache.del(`project:${block.content.projectId}:content`);
    await cache.del(`content:${block.contentId}`);

    res.status(204).send();
  } catch (error) {
    console.error('Delete content block error:', error);
    res.status(500).json({
      error: 'Content Block Deletion Failed',
      message: 'Unable to delete content block'
    });
  }
});

module.exports = router;


