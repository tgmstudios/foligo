const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/roles:
 *   post:
 *     summary: Create an experience role
 *     tags: [Experience Roles]
 */
router.post('/projects/:projectId/content/:contentId/roles', [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').optional().isISO8601(),
  body('isCurrent').optional().isBoolean(),
  body('skillIds').optional().isArray(),
  body('skillIds.*').optional().isUUID()
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
    const { title, description, startDate, endDate, isCurrent, skillIds } = req.body;

    // Verify content belongs to project and is an experience
    const content = await prisma.content.findFirst({
      where: { 
        id: contentId, 
        projectId,
        contentType: 'EXPERIENCE'
      }
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'Experience content not found in this project'
      });
    }

    // Prepare role data
    const roleData = {
      contentId,
      title,
      description,
      startDate: new Date(startDate),
      isCurrent: isCurrent || false
    };

    if (endDate) {
      roleData.endDate = new Date(endDate);
    }

    // Create role
    const role = await prisma.experienceRole.create({
      data: {
        ...roleData,
        ...(skillIds && skillIds.length > 0 ? {
          skills: {
            connect: skillIds.map(id => ({ id }))
          }
        } : {})
      },
      include: {
        skills: { include: { tag: true } }
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    await cache.del(`content:${contentId}`);

    res.status(201).json(role);
  } catch (error) {
    console.error('Create experience role error:', error);
    res.status(500).json({
      error: 'Experience Role Creation Failed',
      message: 'Unable to create experience role'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/roles:
 *   get:
 *     summary: Get all roles for an experience
 *     tags: [Experience Roles]
 */
router.get('/projects/:projectId/content/:contentId/roles', authorizeProjectAccess('VIEWER'), async (req, res) => {
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

    const roles = await prisma.experienceRole.findMany({
      where: { contentId },
      include: {
        skills: { include: { tag: true } }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json(roles);
  } catch (error) {
    console.error('Get experience roles error:', error);
    res.status(500).json({
      error: 'Experience Roles Retrieval Failed',
      message: 'Unable to retrieve experience roles'
    });
  }
});

/**
 * @swagger
 * /api/experience-roles/{id}:
 *   put:
 *     summary: Update an experience role
 *     tags: [Experience Roles]
 */
router.put('/experience-roles/:id', [
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('isCurrent').optional().isBoolean(),
  body('skillIds').optional().isArray(),
  body('skillIds.*').optional().isUUID()
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
    const { title, description, startDate, endDate, isCurrent, skillIds } = req.body;

    // Get role with content and project info
    const role = await prisma.experienceRole.findUnique({
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

    if (!role) {
      return res.status(404).json({
        error: 'Role Not Found',
        message: 'The requested role does not exist'
      });
    }

    // Check access
    const isOwner = role.content.project.ownerId === userId;
    const memberAccess = role.content.project.members[0];
    const canEdit = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canEdit) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to edit this role'
      });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isCurrent !== undefined) updateData.isCurrent = isCurrent;

    // Update role
    const updatedRole = await prisma.experienceRole.update({
      where: { id },
      data: {
        ...updateData,
        ...(skillIds !== undefined ? {
          skills: {
            set: skillIds.map(skillId => ({ id: skillId }))
          }
        } : {})
      },
      include: {
        skills: { include: { tag: true } }
      }
    });

    // Clear caches
    await cache.del(`project:${role.content.projectId}`);
    await cache.del(`project:${role.content.projectId}:content`);
    await cache.del(`content:${role.contentId}`);

    res.json(updatedRole);
  } catch (error) {
    console.error('Update experience role error:', error);
    res.status(500).json({
      error: 'Experience Role Update Failed',
      message: 'Unable to update experience role'
    });
  }
});

/**
 * @swagger
 * /api/experience-roles/{id}:
 *   delete:
 *     summary: Delete an experience role
 *     tags: [Experience Roles]
 */
router.delete('/experience-roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get role with content and project info
    const role = await prisma.experienceRole.findUnique({
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

    if (!role) {
      return res.status(404).json({
        error: 'Role Not Found',
        message: 'The requested role does not exist'
      });
    }

    // Check access
    const isOwner = role.content.project.ownerId === userId;
    const memberAccess = role.content.project.members[0];
    const canDelete = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canDelete) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to delete this role'
      });
    }

    await prisma.experienceRole.delete({
      where: { id }
    });

    // Clear caches
    await cache.del(`project:${role.content.projectId}`);
    await cache.del(`project:${role.content.projectId}:content`);
    await cache.del(`content:${role.contentId}`);

    res.status(204).send();
  } catch (error) {
    console.error('Delete experience role error:', error);
    res.status(500).json({
      error: 'Experience Role Deletion Failed',
      message: 'Unable to delete experience role'
    });
  }
});

module.exports = router;


