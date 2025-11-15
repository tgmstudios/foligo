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
  body('locationType').optional().isIn(['REMOTE', 'HYBRID', 'ONSITE'])
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
    const { 
      contentType, title, slug, excerpt, content, metadata, order, status,
      startDate, endDate, isOngoing, featuredImage, projectLinks, contributors,
      experienceCategory, location, locationType
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
      include: {
        tags: true,
        meta: true,
        blocks: {
          orderBy: { order: 'asc' }
        },
        roles: {
          include: {
            skills: { include: { tag: true } }
          },
          orderBy: { startDate: 'desc' }
        },
        linkedSkills: { include: { tag: true } }
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

    // Get content with project info and all related data
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
        tags: true,
        meta: true,
        blocks: {
          orderBy: { order: 'asc' }
        },
        roles: {
          include: {
            skills: { include: { tag: true } }
          },
          orderBy: { startDate: 'desc' }
        },
        linkedSkills: { include: { tag: true } }
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
      data: updateData
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
  body('locationType').optional().isIn(['REMOTE', 'HYBRID', 'ONSITE'])
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
    const { 
      title, slug, excerpt, content, metadata, status,
      startDate, endDate, isOngoing, featuredImage, projectLinks, contributors,
      experienceCategory, location, locationType
    } = req.body;

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

    // Always create revision before updating (unless this is already a revision)
    if (existingContent.status !== 'REVISION') {
      // Get the latest revision number
      const latestRevision = await prisma.content.findFirst({
        where: { revisionOf: id },
        orderBy: { revisionNumber: 'desc' },
        select: { revisionNumber: true }
      });
      
      const nextRevisionNumber = latestRevision ? latestRevision.revisionNumber + 1 : 1;
      
      // Get current tags and skills
      const currentTags = await prisma.contentTag.findMany({
        where: {
          content: {
            some: { id }
          }
        }
      });
      
      const currentSkills = await prisma.skill.findMany({
        where: {
          content: {
            some: { id }
          }
        }
      });
      
      // Create revision with current content state
      const revisionData = {
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
        revisionOf: id,
        revisionNumber: nextRevisionNumber,
        revisedAt: new Date(),
        // Project-specific fields
        startDate: existingContent.startDate,
        endDate: existingContent.endDate,
        isOngoing: existingContent.isOngoing,
        featuredImage: existingContent.featuredImage,
        projectLinks: existingContent.projectLinks,
        contributors: existingContent.contributors,
        // Experience-specific fields
        experienceCategory: existingContent.experienceCategory,
        location: existingContent.location,
        locationType: existingContent.locationType
      };
      
      const createdRevision = await prisma.content.create({
        data: revisionData
      });
      
      // Connect tags and skills to revision
      if (currentTags.length > 0) {
        await prisma.content.update({
          where: { id: createdRevision.id },
          data: {
            tags: {
              connect: currentTags.map(tag => ({ id: tag.id }))
            }
          }
        });
      }
      
      if (currentSkills.length > 0) {
        await prisma.content.update({
          where: { id: createdRevision.id },
          data: {
            linkedSkills: {
              connect: currentSkills.map(skill => ({ id: skill.id }))
            }
          }
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (status !== undefined) updateData.status = status;

    // Add project-specific fields
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isOngoing !== undefined) updateData.isOngoing = isOngoing;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (projectLinks !== undefined) updateData.projectLinks = projectLinks;
    if (contributors !== undefined) updateData.contributors = contributors;

    // Add experience-specific fields
    if (experienceCategory !== undefined) updateData.experienceCategory = experienceCategory;
    if (location !== undefined) updateData.location = location;
    if (locationType !== undefined) updateData.locationType = locationType;

    // Update content
    const updatedContent = await prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
        meta: true,
        blocks: {
          orderBy: { order: 'asc' }
        },
        roles: {
          include: {
            skills: { include: { tag: true } }
          },
          orderBy: { startDate: 'desc' }
        },
        linkedSkills: { include: { tag: true } },
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
      data: { order: newOrder }
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
