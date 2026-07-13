const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/meta:
 *   post:
 *     summary: Create or update content meta
 *     tags: [Content Meta]
 */
router.post('/projects/:projectId/content/:contentId/meta', [
  body('key').trim().isLength({ min: 1 }).withMessage('Key is required'),
  body('value').notEmpty().withMessage('Value is required'),
  body('contentType').optional().trim()
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
    const { key, value, contentType } = req.body;

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

    // Check if meta exists
    const existingMeta = await prisma.contentMeta.findFirst({
      where: {
        contentId,
        key
      }
    });

    let meta;
    if (existingMeta) {
      meta = await prisma.contentMeta.update({
        where: { id: existingMeta.id },
        data: {
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          contentType
        }
      });
    } else {
      meta = await prisma.contentMeta.create({
        data: {
          contentId,
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          contentType
        }
      });
    }

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    await cache.del(`content:${contentId}`);

    res.status(201).json(meta);
  } catch (error) {
    console.error('Create content meta error:', error);
    res.status(500).json({
      error: 'Content Meta Creation Failed',
      message: 'Unable to create content meta'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/meta:
 *   get:
 *     summary: Get all meta for content
 *     tags: [Content Meta]
 */
router.get('/projects/:projectId/content/:contentId/meta', authorizeProjectAccess('VIEWER'), async (req, res) => {
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

    const meta = await prisma.contentMeta.findMany({
      where: { contentId },
      orderBy: { key: 'asc' }
    });

    res.json(meta);
  } catch (error) {
    console.error('Get content meta error:', error);
    res.status(500).json({
      error: 'Content Meta Retrieval Failed',
      message: 'Unable to retrieve content meta'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/meta/{key}:
 *   delete:
 *     summary: Delete content meta
 *     tags: [Content Meta]
 */
router.delete('/projects/:projectId/content/:contentId/meta/:key', authorizeProjectAccess('EDITOR'), async (req, res) => {
  try {
    const { projectId, contentId, key } = req.params;

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

    await prisma.contentMeta.deleteMany({
      where: { contentId, key }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    await cache.del(`content:${contentId}`);

    res.status(204).send();
  } catch (error) {
    console.error('Delete content meta error:', error);
    res.status(500).json({
      error: 'Content Meta Deletion Failed',
      message: 'Unable to delete content meta'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/meta:
 *   post:
 *     summary: Create or update project meta
 *     tags: [Content Meta]
 */
router.post('/projects/:projectId/meta', [
  body('key').trim().isLength({ min: 1 }).withMessage('Key is required'),
  body('value').notEmpty().withMessage('Value is required'),
  body('contentType').optional().trim()
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
    const { key, value, contentType } = req.body;

    // Check if meta exists
    const existingMeta = await prisma.contentMeta.findFirst({
      where: {
        projectId,
        key
      }
    });

    let meta;
    if (existingMeta) {
      meta = await prisma.contentMeta.update({
        where: { id: existingMeta.id },
        data: {
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          contentType
        }
      });
    } else {
      meta = await prisma.contentMeta.create({
        data: {
          projectId,
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          contentType
        }
      });
    }

    // Clear caches
    await cache.del(`project:${projectId}`);

    res.status(201).json(meta);
  } catch (error) {
    console.error('Create project meta error:', error);
    res.status(500).json({
      error: 'Project Meta Creation Failed',
      message: 'Unable to create project meta'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/meta:
 *   get:
 *     summary: Get all meta for project
 *     tags: [Content Meta]
 */
router.get('/projects/:projectId/meta', authorizeProjectAccess('VIEWER'), async (req, res) => {
  try {
    const { projectId } = req.params;

    const meta = await prisma.contentMeta.findMany({
      where: { projectId },
      orderBy: { key: 'asc' }
    });

    res.json(meta);
  } catch (error) {
    console.error('Get project meta error:', error);
    res.status(500).json({
      error: 'Project Meta Retrieval Failed',
      message: 'Unable to retrieve project meta'
    });
  }
});

module.exports = router;

