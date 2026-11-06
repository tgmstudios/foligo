const express = require('express');
const { prisma } = require('../../services/core/database');

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
// Anonymous callers may only ever see PUBLISHED, non-revision content of a PUBLISHED
// project, and only these fields (no revision bookkeeping).
const PUBLIC_CONTENT_SELECT = {
  id: true,
  projectId: true,
  type: true,
  contentType: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  metadata: true,
  order: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  startDate: true,
  endDate: true,
  isOngoing: true,
  featuredImage: true,
  projectLinks: true,
  contributors: true,
  experienceCategory: true,
  location: true,
  locationType: true
};

const PUBLIC_CONTENT_WHERE = (projectId) => ({
  projectId,
  status: 'PUBLISHED',
  revisionOf: null
});

router.get('/projects/:projectId/content', async (req, res) => {
  // Set before any early return so 404/500 responses are never cached either.
  res.set('Cache-Control', 'no-store');
  try {
    const { projectId } = req.params;

    // Publication state is checked against the database on every request, so unpublishing
    // takes effect immediately.
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, isPublished: true }
    });
    if (!project || project.isPublished !== true) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    // No route-level cache: a fingerprint of the published set (count + max(updatedAt)) can
    // collide on replace/tie, and any cache would delay revocation. Always read published rows.
    const content = await prisma.content.findMany({
      where: PUBLIC_CONTENT_WHERE(projectId),
      select: PUBLIC_CONTENT_SELECT,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]
    });

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
module.exports._internals = { PUBLIC_CONTENT_SELECT, PUBLIC_CONTENT_WHERE };
