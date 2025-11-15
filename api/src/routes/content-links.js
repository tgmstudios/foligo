const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper function to normalize link direction (ensures consistent ordering)
 * Always stores with sourceId < targetId lexicographically for undirected links
 */
function normalizeLinkDirection(sourceId, targetId, sourceType, targetType) {
  // For content-to-content links, normalize direction
  if (sourceType === 'content' && targetType === 'content') {
    if (sourceId > targetId) {
      // Swap to ensure consistent direction
      return {
        sourceId: targetId,
        targetId: sourceId,
        sourceType: targetType,
        targetType: sourceType
      };
    }
  }
  return { sourceId, targetId, sourceType, targetType };
}

/**
 * @swagger
 * /api/projects/{projectId}/content-links:
 *   get:
 *     summary: Get content links for a project (undirected - returns links in both directions)
 *     tags: [Content Links]
 */
router.get('/projects/:projectId/content-links', authorizeProjectAccess('VIEWER'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { contentId } = req.query; // Query by contentId to get all related content

    let links = [];

    if (contentId) {
      // Get all links where this content is either source or target (undirected)
      links = await prisma.contentLink.findMany({
        where: {
          OR: [
            { sourceId: contentId, sourceType: 'content' },
            { targetId: contentId, targetType: 'content' }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Get all links for the project
      // We need to get all content IDs for this project first
      const projectContent = await prisma.content.findMany({
        where: { projectId },
        select: { id: true }
      });
      const contentIds = projectContent.map(c => c.id);

      if (contentIds.length > 0) {
        links = await prisma.contentLink.findMany({
          where: {
            OR: [
              { sourceId: { in: contentIds }, sourceType: 'content' },
              { targetId: { in: contentIds }, targetType: 'content' }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    }

    res.json(links);
  } catch (error) {
    console.error('Get content links error:', error);
    res.status(500).json({
      error: 'Content Links Retrieval Failed',
      message: 'Unable to retrieve content links'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content-links:
 *   post:
 *     summary: Create an undirected content link (content-to-content only)
 *     tags: [Content Links]
 */
router.post('/projects/:projectId/content-links', [
  body('sourceId').trim().isLength({ min: 1 }).withMessage('Source ID is required'),
  body('targetId').trim().isLength({ min: 1 }).withMessage('Target ID is required'),
  body('sourceType').equals('content').withMessage('Source type must be content (only content-to-content links supported)'),
  body('targetType').equals('content').withMessage('Target type must be content (only content-to-content links supported)'),
  body('linkType').trim().isLength({ min: 1 }).withMessage('Link type is required')
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
    let { sourceId, targetId, sourceType, targetType, linkType } = req.body;

    // Ensure sourceId and targetId are different
    if (sourceId === targetId) {
      return res.status(400).json({
        error: 'Invalid Link',
        message: 'Cannot link content to itself'
      });
    }

    // Normalize direction for undirected links (content-to-content only)
    const normalized = normalizeLinkDirection(sourceId, targetId, sourceType, targetType);
    sourceId = normalized.sourceId;
    targetId = normalized.targetId;
    sourceType = normalized.sourceType;
    targetType = normalized.targetType;

    // Check if link already exists (in either direction)
    const existingLink = await prisma.contentLink.findFirst({
      where: {
        OR: [
          {
            sourceId,
            targetId,
            linkType
          },
          {
            sourceId: targetId,
            targetId: sourceId,
            linkType
          }
        ]
      }
    });

    if (existingLink) {
      return res.status(409).json({
        error: 'Link Already Exists',
        message: 'This link already exists'
      });
    }

    const link = await prisma.contentLink.create({
      data: {
        sourceId,
        targetId,
        sourceType,
        targetType,
        linkType
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);

    res.status(201).json(link);
  } catch (error) {
    console.error('Create content link error:', error);
    res.status(500).json({
      error: 'Content Link Creation Failed',
      message: 'Unable to create content link'
    });
  }
});

/**
 * @swagger
 * /api/content-links/{id}:
 *   get:
 *     summary: Get a specific content link
 *     tags: [Content Links]
 */
router.get('/content-links/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const link = await prisma.contentLink.findUnique({
      where: { id }
    });

    if (!link) {
      return res.status(404).json({
        error: 'Content Link Not Found',
        message: 'The requested content link does not exist'
      });
    }

    res.json(link);
  } catch (error) {
    console.error('Get content link error:', error);
    res.status(500).json({
      error: 'Content Link Retrieval Failed',
      message: 'Unable to retrieve content link'
    });
  }
});

/**
 * @swagger
 * /api/content-links/{id}:
 *   put:
 *     summary: Update a content link
 *     tags: [Content Links]
 */
router.put('/content-links/:id', [
  body('linkType').optional().trim().isLength({ min: 1 }).withMessage('Link type cannot be empty')
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
    const { linkType } = req.body;

    const link = await prisma.contentLink.findUnique({
      where: { id }
    });

    if (!link) {
      return res.status(404).json({
        error: 'Content Link Not Found',
        message: 'The requested content link does not exist'
      });
    }

    const updateData = {};
    if (linkType !== undefined) updateData.linkType = linkType;

    const updatedLink = await prisma.contentLink.update({
      where: { id },
      data: updateData
    });

    res.json(updatedLink);
  } catch (error) {
    console.error('Update content link error:', error);
    res.status(500).json({
      error: 'Content Link Update Failed',
      message: 'Unable to update content link'
    });
  }
});

/**
 * @swagger
 * /api/content-links/{id}:
 *   delete:
 *     summary: Delete a content link (undirected - deletes the relationship regardless of direction)
 *     tags: [Content Links]
 */
router.delete('/content-links/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const link = await prisma.contentLink.findUnique({
      where: { id }
    });

    if (!link) {
      return res.status(404).json({
        error: 'Content Link Not Found',
        message: 'The requested content link does not exist'
      });
    }

    // Delete the link (only one direction exists due to normalization)
    await prisma.contentLink.delete({
      where: { id }
    });

    // Clear caches (we don't know the project ID, so clear all project caches)
    // In production, you might want to store projectId in the link or pass it as a param
    const keys = await cache.keys('project:*');
    if (keys.length > 0) {
      await cache.del(...keys);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete content link error:', error);
    res.status(500).json({
      error: 'Content Link Deletion Failed',
      message: 'Unable to delete content link'
    });
  }
});

module.exports = router;


