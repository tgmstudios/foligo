const express = require('express');
const { body } = require('express-validator');
const { prisma } = require('../../services/core/database');
const { cache } = require('../../services/core/redis');
const { authorizeProjectAccess } = require('../../middleware/auth');
const { handleValidation } = require('../../middleware/handle-validation');
const githubService = require('../../services/github/github-service');
const { CONTENT_INCLUDE, getContentWithAccess, invalidateContentCache } = require('../../utils/content-access');

const router = express.Router();

/**
 * Snapshot the current state of a Content row as a revision before it gets
 * overwritten. Shared by the manual-fields update route and the AI chat
 * route so both save paths produce the exact same revision shape/behavior —
 * every update revisions (there's no autosave-vs-manual distinction for
 * Content the way there is for ResumeDocument).
 */
async function snapshotContentRevision(existingContent) {
  if (existingContent.status === 'REVISION') return;

  const latestRevision = await prisma.content.findFirst({
    where: { revisionOf: existingContent.id },
    orderBy: { revisionNumber: 'desc' },
    select: { revisionNumber: true },
  });
  const nextRevisionNumber = latestRevision ? latestRevision.revisionNumber + 1 : 1;

  const currentTags = await prisma.contentTag.findMany({
    where: { content: { some: { id: existingContent.id } } },
  });
  const currentSkills = await prisma.skill.findMany({
    where: { content: { some: { id: existingContent.id } } },
  });

  const createdRevision = await prisma.content.create({
    data: {
      projectId: existingContent.projectId,
      type: existingContent.type,
      contentType: existingContent.contentType,
      title: existingContent.title,
      slug: `${existingContent.slug || 'content'}-rev-${nextRevisionNumber}`,
      excerpt: existingContent.excerpt,
      content: existingContent.content,
      metadata: existingContent.metadata,
      order: existingContent.order,
      status: 'REVISION',
      revisionOf: existingContent.id,
      revisionNumber: nextRevisionNumber,
      revisedAt: new Date(),
      startDate: existingContent.startDate,
      endDate: existingContent.endDate,
      isOngoing: existingContent.isOngoing,
      featuredImage: existingContent.featuredImage,
      projectLinks: existingContent.projectLinks,
      contributors: existingContent.contributors,
      experienceCategory: existingContent.experienceCategory,
      location: existingContent.location,
      locationType: existingContent.locationType,
    },
  });

  if (currentTags.length > 0) {
    await prisma.content.update({
      where: { id: createdRevision.id },
      data: { tags: { connect: currentTags.map((tag) => ({ id: tag.id })) } },
    });
  }
  if (currentSkills.length > 0) {
    await prisma.content.update({
      where: { id: createdRevision.id },
      data: { linkedSkills: { connect: currentSkills.map((skill) => ({ id: skill.id })) } },
    });
  }
}

/**
 * Build a Prisma `data` patch object from a partial content-fields payload.
 * Shared by the manual PUT /content/:id/fields route and the AI portfolio
 * agent tools so both write paths accept/ignore the exact same field set.
 */
function buildContentFieldUpdate(fields) {
  const {
    title, slug, excerpt, content, metadata, status,
    startDate, endDate, isOngoing, featuredImage, projectLinks, contributors,
    experienceCategory, location, locationType
  } = fields;

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (excerpt !== undefined) updateData.excerpt = excerpt;
  if (content !== undefined) updateData.content = content;
  if (metadata !== undefined) updateData.metadata = metadata;
  if (status !== undefined) updateData.status = status;

  // Project-specific fields
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
  if (isOngoing !== undefined) updateData.isOngoing = isOngoing;
  if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
  if (projectLinks !== undefined) updateData.projectLinks = projectLinks;
  if (contributors !== undefined) updateData.contributors = contributors;

  // Experience-specific fields
  if (experienceCategory !== undefined) updateData.experienceCategory = experienceCategory;
  if (location !== undefined) updateData.location = location;
  if (locationType !== undefined) updateData.locationType = locationType;

  return updateData;
}

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
  body('contentType').isIn(['PROJECT', 'BLOG', 'EXPERIENCE', 'SKILL']),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('excerpt').optional().trim(),
  body('content').isLength({ min: 1 }).withMessage('Content is required'),
  body('metadata').optional().isObject(),
  body('order').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'HIDDEN', 'REVISION']),
  // Project-specific fields
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('isOngoing').optional().isBoolean(),
  body('featuredImage').optional().trim(),
  body('projectLinks').optional().isObject(),
  body('contributors').optional().isArray(),
  // Experience-specific fields
  body('experienceCategory').optional().isIn(['JOB', 'EDUCATION', 'CERTIFICATION']),
  body('location').optional().trim(),
  body('locationType').optional().isIn(['REMOTE', 'HYBRID', 'ONSITE']),
  // Skills and tags
  body('skills').optional().isArray(),
  body('tags').optional().isArray(),
  handleValidation
], authorizeProjectAccess('EDITOR'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      contentType, title, slug, excerpt, content, metadata, order, status,
      startDate, endDate, isOngoing, featuredImage, projectLinks, contributors,
      experienceCategory, location, locationType,
      skills, tags
    } = req.body;

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

    // If no order specified, set to 0 (latest post should be first)
    // and increment all other posts' orders
    let contentOrder = order;
    if (contentOrder === undefined) {
      contentOrder = 0;

      // Increment all existing posts' orders (excluding revisions)
      await prisma.$transaction(async (tx) => {
        // Update Content table order field
        await tx.content.updateMany({
          where: {
            projectId,
            status: { not: 'REVISION' },
            revisionOf: null
          },
          data: {
            order: { increment: 1 }
          }
        });

        // Update PostOrder table if entries exist
        await tx.postOrder.updateMany({
          where: { projectId },
          data: {
            order: { increment: 1 }
          }
        });
      });
    }

    // Prepare data object
    const contentData = {
      projectId,
      type: contentType,
      contentType,
      title,
      slug: contentSlug,
      excerpt,
      content,
      metadata: metadata || {},
      order: contentOrder,
      status: status || 'DRAFT'
    };

    // Add project-specific fields if content type is PROJECT
    if (contentType === 'PROJECT') {
      if (startDate) contentData.startDate = new Date(startDate);
      if (endDate) contentData.endDate = new Date(endDate);
      if (isOngoing !== undefined) contentData.isOngoing = isOngoing;
      if (featuredImage) contentData.featuredImage = featuredImage;
      if (projectLinks) contentData.projectLinks = projectLinks;
      if (contributors) contentData.contributors = contributors;
    }

    // Add experience-specific fields if content type is EXPERIENCE
    if (contentType === 'EXPERIENCE') {
      if (experienceCategory) contentData.experienceCategory = experienceCategory;
      if (location) contentData.location = location;
      if (locationType) contentData.locationType = locationType;
      if (startDate) contentData.startDate = new Date(startDate);
      if (endDate) contentData.endDate = new Date(endDate);
      if (isOngoing !== undefined) contentData.isOngoing = isOngoing;
    }

    // Create content
    const newContent = await prisma.content.create({
      data: contentData,
      include: CONTENT_INCLUDE
    });

    // Create PostOrder entry for the new content (only if not a revision)
    if (contentData.status !== 'REVISION' && !contentData.revisionOf) {
      await prisma.postOrder.create({
        data: {
          projectId,
          contentId: newContent.id,
          order: contentOrder
        }
      });
    }

    // Link skills to content if provided
    if (skills && skills.length > 0) {
      const skillIds = skills.map(skill => skill.id).filter(Boolean);
      if (skillIds.length > 0) {
        await prisma.content.update({
          where: { id: newContent.id },
          data: {
            linkedSkills: {
              connect: skillIds.map(id => ({ id }))
            }
          }
        });
        console.log(`[content] Linked ${skillIds.length} skills to content ${newContent.id}`);
      }
    }

    // Link tags to content if provided
    if (tags && tags.length > 0) {
      const tagIds = tags.map(tag => tag.id).filter(Boolean);
      if (tagIds.length > 0) {
        await prisma.content.update({
          where: { id: newContent.id },
          data: {
            tags: {
              connect: tagIds.map(id => ({ id }))
            }
          }
        });
        console.log(`[content] Linked ${tagIds.length} tags to content ${newContent.id}`);
      }
    }

    // Fetch the complete content with all relationships
    const completeContent = await prisma.content.findUnique({
      where: { id: newContent.id },
      include: CONTENT_INCLUDE
    });

    // Clear project cache
    await cache.del(`project:${projectId}`);
    await cache.delPattern(`project:${projectId}:content*`);

    res.status(201).json(completeContent);
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

    const access = await getContentWithAccess(prisma, id, userId);

    if (!access) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    if (!access.isOwner && !access.isMember) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have access to this content'
      });
    }

    res.json(access.content);
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
  body('order').optional().isInt({ min: 0 }),
  handleValidation
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { type, data, order } = req.body;

    const access = await getContentWithAccess(prisma, id, userId);

    if (!access) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    if (!access.canEdit) {
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
      data: updateData
    });

    // Clear project and content caches
    await invalidateContentCache(cache, access.content.projectId, id);

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
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, HIDDEN, REVISION]
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
  body('content').optional(),
  body('metadata').optional().isObject(),
  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'HIDDEN', 'REVISION']),
  // Project-specific fields
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('isOngoing').optional().isBoolean(),
  body('featuredImage').optional().trim(),
  body('projectLinks').optional().isObject(),
  body('contributors').optional().isArray(),
  // Experience-specific fields
  body('experienceCategory').optional().isIn(['JOB', 'EDUCATION', 'CERTIFICATION']),
  body('location').optional().trim(),
  body('locationType').optional().isIn(['REMOTE', 'HYBRID', 'ONSITE']),
  handleValidation
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const access = await getContentWithAccess(prisma, id, userId);

    if (!access) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content does not exist'
      });
    }

    if (!access.canEdit) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to edit this content'
      });
    }

    const existingContent = access.content;

    // Always create revision before updating (unless this is already a revision)
    await snapshotContentRevision(existingContent);

    const updateData = buildContentFieldUpdate(req.body);

    // Update content
    const updatedContent = await prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        ...CONTENT_INCLUDE,
        revisions: {
          orderBy: { revisionNumber: 'desc' },
          select: {
            id: true,
            title: true,
            revisionNumber: true,
            revisedAt: true,
            status: true,
            createdAt: true
          }
        },
        parentContent: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    // Clear project and content caches
    await invalidateContentCache(cache, existingContent.projectId, id);

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

    const access = await getContentWithAccess(prisma, id, userId);

    if (!access) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    if (!access.canEdit) {
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
    await invalidateContentCache(cache, access.content.projectId, id);
    githubService.cleanupSession(userId, `content:${id}`).catch(() => {});

    res.status(204).send();
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      error: 'Content Deletion Failed',
      message: 'Unable to delete content block'
    });
  }
});

module.exports = router;
module.exports.snapshotContentRevision = snapshotContentRevision;
module.exports.buildContentFieldUpdate = buildContentFieldUpdate;
