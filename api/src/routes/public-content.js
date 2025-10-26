const express = require('express');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{projectId}/content:
 *   get:
 *     summary: Get all content blocks for a project (no auth required)
 *     tags: [CMS Content]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Content blocks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Content'
 *       404:
 *         description: Project not found
 */
router.get('/projects/:projectId/content', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Try to get content from cache first
    const cacheKey = `project:${projectId}:content`;
    let content = await cache.get(cacheKey);

    if (!content) {
      // Get content from database
      content = await prisma.content.findMany({
        where: { projectId },
        include: {
          aiAnalysis: true
        },
        orderBy: { order: 'asc' }
      });

      console.log(`Content query for project ${projectId}:`, {
        projectId,
        contentCount: content.length,
        content: content.map(c => ({
          id: c.id,
          title: c.title,
          contentType: c.contentType,
          type: c.type
        }))
      });

      // Cache content data for 15 minutes
      await cache.set(cacheKey, content, 900);
    }

    res.json(content);
  } catch (error) {
    console.error('Get project content error:', error);
    res.status(500).json({
      error: 'Content Retrieval Failed',
      message: 'Unable to retrieve project content'
    });
  }
});

module.exports = router;

