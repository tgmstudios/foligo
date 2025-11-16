const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{projectId}/skills:
 *   post:
 *     summary: Create a skill
 *     tags: [Skills]
 */
router.post('/projects/:projectId/skills', [
  body('name').trim().isLength({ min: 1 }).withMessage('Skill name is required'),
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

    // Check if skill exists
    const existingSkill = await prisma.skill.findFirst({
      where: {
        name,
        category: category || null
      }
    });

    let skill;
    if (existingSkill) {
      skill = existingSkill;
    } else {
      skill = await prisma.skill.create({
        data: {
          name,
          category: category || null
        }
      });
    }

    res.status(201).json(skill);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({
      error: 'Skill Creation Failed',
      message: 'Unable to create skill'
    });
  }
});

/**
 * @swagger
 * /api/skills:
 *   get:
 *     summary: Get all skills
 *     tags: [Skills]
 */
router.get('/skills', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const where = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      error: 'Skills Retrieval Failed',
      message: 'Unable to retrieve skills'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/skills/{skillId}:
 *   post:
 *     summary: Add skill to project
 *     tags: [Skills]
 */
router.post('/projects/:projectId/skills/:skillId', authorizeProjectAccess('EDITOR'), async (req, res) => {
  try {
    const { projectId, skillId } = req.params;

    // Verify skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId }
    });

    if (!skill) {
      return res.status(404).json({
        error: 'Skill Not Found',
        message: 'The specified skill does not exist'
      });
    }

    // Connect skill to project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        skills: {
          connect: { id: skillId }
        }
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);

    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: { skills: true }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Add skill to project error:', error);
    res.status(500).json({
      error: 'Skill Assignment Failed',
      message: 'Unable to add skill to project'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/skills/{skillId}:
 *   delete:
 *     summary: Remove skill from project
 *     tags: [Skills]
 */
router.delete('/projects/:projectId/skills/:skillId', authorizeProjectAccess('EDITOR'), async (req, res) => {
  try {
    const { projectId, skillId } = req.params;

    // Disconnect skill from project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        skills: {
          disconnect: { id: skillId }
        }
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);

    res.status(204).send();
  } catch (error) {
    console.error('Remove skill from project error:', error);
    res.status(500).json({
      error: 'Skill Removal Failed',
      message: 'Unable to remove skill from project'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/{contentId}/skills:
 *   post:
 *     summary: Add skills to content (for projects/experiences)
 *     tags: [Skills]
 */
router.post('/projects/:projectId/content/:contentId/skills', [
  body('skillIds').isArray().withMessage('Skill IDs must be an array'),
  body('skillIds.*').isUUID().withMessage('Each skill ID must be a valid UUID')
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
    const { skillIds } = req.body;

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

    // Connect skills
    await prisma.content.update({
      where: { id: contentId },
      data: {
        linkedSkills: {
          connect: skillIds.map(id => ({ id }))
        }
      }
    });

    // Clear caches
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    await cache.del(`content:${contentId}`);

    const updatedContent = await prisma.content.findUnique({
      where: { id: contentId },
      include: { linkedSkills: true }
    });

    res.json(updatedContent);
  } catch (error) {
    console.error('Add skills to content error:', error);
    res.status(500).json({
      error: 'Skill Assignment Failed',
      message: 'Unable to add skills to content'
    });
  }
});

module.exports = router;

