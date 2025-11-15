const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/revisions:
 *   get:
 *     summary: Get all revisions for content
 *     tags: [Revisions]
 */
router.get('/projects/:projectId/content/:contentId/revisions', authorizeProjectAccess('VIEWER'), async (req, res) => {
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

    // Get all revisions
    const revisions = await prisma.content.findMany({
      where: { revisionOf: contentId },
      orderBy: { revisionNumber: 'desc' },
      include: {
        tags: true,
        linkedSkills: { include: { tag: true } }
      }
    });

    res.json(revisions);
  } catch (error) {
    console.error('Get revisions error:', error);
    res.status(500).json({
      error: 'Revisions Retrieval Failed',
      message: 'Unable to retrieve revisions'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/revisions/{revisionId}:
 *   get:
 *     summary: Get a specific revision
 *     tags: [Revisions]
 */
router.get('/projects/:projectId/content/:contentId/revisions/:revisionId', authorizeProjectAccess('VIEWER'), async (req, res) => {
  try {
    const { projectId, contentId, revisionId } = req.params;

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

    // Get revision
    const revision = await prisma.content.findFirst({
      where: { 
        id: revisionId,
        revisionOf: contentId
      },
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

    if (!revision) {
      return res.status(404).json({
        error: 'Revision Not Found',
        message: 'The requested revision does not exist'
      });
    }

    res.json(revision);
  } catch (error) {
    console.error('Get revision error:', error);
    res.status(500).json({
      error: 'Revision Retrieval Failed',
      message: 'Unable to retrieve revision'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/revisions/{revisionId}/restore:
 *   post:
 *     summary: Restore a revision (creates a new revision of current content, then restores)
 *     tags: [Revisions]
 */
router.post('/projects/:projectId/content/:contentId/revisions/:revisionId/restore', authorizeProjectAccess('EDITOR'), async (req, res) => {
  try {
    const { projectId, contentId, revisionId } = req.params;

    // Verify content belongs to project
    const currentContent = await prisma.content.findFirst({
      where: { id: contentId, projectId }
    });

    if (!currentContent) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'Content not found in this project'
      });
    }

    // Get revision
    const revision = await prisma.content.findFirst({
      where: { 
        id: revisionId,
        revisionOf: contentId
      }
    });

    if (!revision) {
      return res.status(404).json({
        error: 'Revision Not Found',
        message: 'The requested revision does not exist'
      });
    }

    // Always create revision of current content before restoring (unless this is already a revision)
    if (currentContent.status !== 'REVISION') {
      const latestRevision = await prisma.content.findFirst({
        where: { revisionOf: contentId },
        orderBy: { revisionNumber: 'desc' },
        select: { revisionNumber: true }
      });
      
      const nextRevisionNumber = latestRevision ? latestRevision.revisionNumber + 1 : 1;
      
      await prisma.content.create({
        data: {
          projectId: currentContent.projectId,
          type: currentContent.type,
          contentType: currentContent.contentType,
          title: currentContent.title,
          slug: `${currentContent.slug}-rev-${nextRevisionNumber}`,
          excerpt: currentContent.excerpt,
          content: currentContent.content,
          metadata: currentContent.metadata,
          order: currentContent.order,
          status: 'REVISION',
          revisionOf: contentId,
          revisionNumber: nextRevisionNumber,
          revisedAt: new Date(),
          startDate: currentContent.startDate,
          endDate: currentContent.endDate,
          isOngoing: currentContent.isOngoing,
          featuredImage: currentContent.featuredImage,
          projectLinks: currentContent.projectLinks,
          contributors: currentContent.contributors,
          experienceCategory: currentContent.experienceCategory,
          location: currentContent.location,
          locationType: currentContent.locationType
        }
      });
    }

    // Restore revision content to current content
    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: {
        title: revision.title,
        excerpt: revision.excerpt,
        content: revision.content,
        metadata: revision.metadata,
        startDate: revision.startDate,
        endDate: revision.endDate,
        isOngoing: revision.isOngoing,
        featuredImage: revision.featuredImage,
        projectLinks: revision.projectLinks,
        contributors: revision.contributors,
        experienceCategory: revision.experienceCategory,
        location: revision.location,
        locationType: revision.locationType
      },
      include: {
        aiAnalysis: true,
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

    // Get revision tags and skills
    const revisionTags = await prisma.contentTag.findMany({
      where: {
        content: {
          some: { id: revisionId }
        }
      }
    });

    const revisionSkills = await prisma.skill.findMany({
      where: {
        content: {
          some: { id: revisionId }
        }
      }
    });

    // Update tags and skills
    await prisma.content.update({
      where: { id: contentId },
      data: {
        tags: {
          set: revisionTags.map(tag => ({ id: tag.id }))
        },
        linkedSkills: {
          set: revisionSkills.map(skill => ({ id: skill.id }))
        }
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    await cache.del(`content:${contentId}`);

    res.json(updatedContent);
  } catch (error) {
    console.error('Restore revision error:', error);
    res.status(500).json({
      error: 'Revision Restore Failed',
      message: 'Unable to restore revision'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/revisions/{revisionId}:
 *   delete:
 *     summary: Delete a revision
 *     tags: [Revisions]
 */
router.delete('/projects/:projectId/content/:contentId/revisions/:revisionId', authorizeProjectAccess('EDITOR'), async (req, res) => {
  try {
    const { projectId, contentId, revisionId } = req.params;

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

    // Verify revision belongs to content
    const revision = await prisma.content.findFirst({
      where: { 
        id: revisionId,
        revisionOf: contentId
      }
    });

    if (!revision) {
      return res.status(404).json({
        error: 'Revision Not Found',
        message: 'The requested revision does not exist'
      });
    }

    await prisma.content.delete({
      where: { id: revisionId }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    await cache.del(`content:${contentId}`);

    res.status(204).send();
  } catch (error) {
    console.error('Delete revision error:', error);
    res.status(500).json({
      error: 'Revision Deletion Failed',
      message: 'Unable to delete revision'
    });
  }
});

module.exports = router;

