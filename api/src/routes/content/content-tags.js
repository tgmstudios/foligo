const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{projectId}/content-tags:
 *   post:
 *     summary: Create a content tag
 *     tags: [Content Tags]
 */
router.post('/projects/:projectId/content-tags', [
  body('name').trim().isLength({ min: 1 }).withMessage('Tag name is required'),
  body('category').optional().trim()
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

    const { name, category } = req.body;

    // Check if tag exists
    const existingTag = await prisma.contentTag.findFirst({
      where: {
        name,
        category: category || null
      }
    });

    let tag;
    if (existingTag) {
      tag = existingTag;
    } else {
      tag = await prisma.contentTag.create({
        data: {
          name,
          category: category || null
        }
      });
    }

    res.status(201).json(tag);
  } catch (error) {
    console.error('Create content tag error:', error);
    res.status(500).json({
      error: 'Content Tag Creation Failed',
      message: 'Unable to create content tag'
    });
  }
});

/**
 * @swagger
 * /api/content-tags:
 *   get:
 *     summary: Get all content tags
 *     tags: [Content Tags]
 */
router.get('/content-tags', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const where = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const tags = await prisma.contentTag.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(tags);
  } catch (error) {
    console.error('Get content tags error:', error);
    res.status(500).json({
      error: 'Content Tags Retrieval Failed',
      message: 'Unable to retrieve content tags'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/tags:
 *   post:
 *     summary: Add tags to content
 *     tags: [Content Tags]
 */
router.post('/projects/:projectId/content/:contentId/tags', [
  body('tagIds').isArray().withMessage('Tag IDs must be an array'),
  body('tagIds.*').isUUID().withMessage('Each tag ID must be a valid UUID')
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
    const { tagIds } = req.body;

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

    // Connect tags
    await prisma.content.update({
      where: { id: contentId },
      data: {
        tags: {
          connect: tagIds.map(id => ({ id }))
        }
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    await cache.del(`content:${contentId}`);

    const updatedContent = await prisma.content.findUnique({
      where: { id: contentId },
      include: { tags: true }
    });

    res.json(updatedContent);
  } catch (error) {
    console.error('Add tags to content error:', error);
    res.status(500).json({
      error: 'Tag Assignment Failed',
      message: 'Unable to add tags to content'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/tags/{tagId}:
 *   delete:
 *     summary: Remove tag from content
 *     tags: [Content Tags]
 */
router.delete('/projects/:projectId/content/:contentId/tags/:tagId', authorizeProjectAccess('EDITOR'), async (req, res) => {
  try {
    const { projectId, contentId, tagId } = req.params;

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

    // Disconnect tag
    await prisma.content.update({
      where: { id: contentId },
      data: {
        tags: {
          disconnect: { id: tagId }
        }
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    await cache.del(`content:${contentId}`);

    res.status(204).send();
  } catch (error) {
    console.error('Remove tag from content error:', error);
    res.status(500).json({
      error: 'Tag Removal Failed',
      message: 'Unable to remove tag from content'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/tags:
 *   post:
 *     summary: Add tags to project
 *     tags: [Content Tags]
 */
router.post('/projects/:projectId/tags', [
  body('tagIds').isArray().withMessage('Tag IDs must be an array'),
  body('tagIds.*').isUUID().withMessage('Each tag ID must be a valid UUID')
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

    const { projectId } = req.params;
    const { tagIds } = req.body;

    // Connect tags
    await prisma.project.update({
      where: { id: projectId },
      data: {
        tags: {
          connect: tagIds.map(id => ({ id }))
        }
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);

    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tags: true }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Add tags to project error:', error);
    res.status(500).json({
      error: 'Tag Assignment Failed',
      message: 'Unable to add tags to project'
    });
  }
});

module.exports = router;

