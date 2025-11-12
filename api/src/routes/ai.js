const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AIAnalysis:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         contentId:
 *           type: string
 *           format: uuid
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         summary:
 *           type: string
 *         altText:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AIAnalysisRequest:
 *       type: object
 *       properties:
 *         analysisType:
 *           type: string
 *           enum: [TAG_IMAGE, SUMMARIZE_TEXT, GENERATE_ALT_TEXT, ALL]
 *         options:
 *           type: object
 *           description: Analysis-specific options
 */

// Mock AI service - replace with actual AI service integration
const mockAIService = {
  async analyzeImage(imageUrl, options = {}) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      tags: ['technology', 'web development', 'portfolio', 'design'],
      altText: 'A modern portfolio website showcasing web development projects with clean design and responsive layout'
    };
  },

  async summarizeText(text, options = {}) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      summary: `This text discusses ${text.split(' ').length > 50 ? 'complex topics' : 'various subjects'} related to web development and portfolio creation.`
    };
  },

  async generateAltText(imageUrl, options = {}) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      altText: 'An image showing web development concepts and portfolio design elements'
    };
  }
};

/**
 * @swagger
 * /api/content/{id}/analyze:
 *   post:
 *     summary: Trigger AI analysis of content block
 *     tags: [AI Integration]
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
 *             $ref: '#/components/schemas/AIAnalysisRequest'
 *     responses:
 *       202:
 *         description: AI analysis started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 analysisId:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Content not found
 */
router.post('/content/:id/analyze', [
  body('analysisType').isIn(['TAG_IMAGE', 'SUMMARIZE_TEXT', 'GENERATE_ALT_TEXT', 'ALL']),
  body('options').optional().isObject()
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

    const { id: contentId } = req.params;
    const userId = req.user.id;
    const { analysisType, options = {} } = req.body;

    // Get content with project info to check permissions
    const content = await prisma.content.findUnique({
      where: { id: contentId },
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

    if (!content) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    // Check access permissions
    const isOwner = content.project.ownerId === userId;
    const memberAccess = content.project.members[0];
    const canAnalyze = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canAnalyze) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to analyze this content'
      });
    }

    // Check if analysis already exists
    const existingAnalysis = await prisma.aIAnalysis.findUnique({
      where: { contentId }
    });

    if (existingAnalysis) {
      return res.status(409).json({
        error: 'Analysis Already Exists',
        message: 'AI analysis for this content already exists'
      });
    }

    // Start AI analysis asynchronously
    const analysisId = contentId; // Using contentId as analysisId for simplicity
    
    // Process analysis in background
    processAIAnalysis(contentId, content, analysisType, options).catch(error => {
      console.error('AI Analysis failed:', error);
    });

    res.status(202).json({
      message: 'AI analysis started',
      analysisId
    });
  } catch (error) {
    console.error('Start AI analysis error:', error);
    res.status(500).json({
      error: 'Analysis Start Failed',
      message: 'Unable to start AI analysis'
    });
  }
});

/**
 * @swagger
 * /api/content/{id}/analysis:
 *   get:
 *     summary: Get AI analysis for content block
 *     tags: [AI Integration]
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
 *         description: AI analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIAnalysis'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Content or analysis not found
 */
router.get('/content/:id/analysis', async (req, res) => {
  try {
    const { id: contentId } = req.params;
    const userId = req.user.id;

    // Get content with project info to check permissions
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        project: {
          include: {
            owner: true,
            members: {
              where: { userId }
            }
          }
        },
        aiAnalysis: true
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

    if (!content.aiAnalysis) {
      return res.status(404).json({
        error: 'Analysis Not Found',
        message: 'No AI analysis found for this content'
      });
    }

    res.json(content.aiAnalysis);
  } catch (error) {
    console.error('Get AI analysis error:', error);
    res.status(500).json({
      error: 'Analysis Retrieval Failed',
      message: 'Unable to retrieve AI analysis'
    });
  }
});

/**
 * @swagger
 * /api/content/{id}/analysis:
 *   delete:
 *     summary: Delete AI analysis for content block
 *     tags: [AI Integration]
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
 *         description: AI analysis deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Content or analysis not found
 */
router.delete('/content/:id/analysis', async (req, res) => {
  try {
    const { id: contentId } = req.params;
    const userId = req.user.id;

    // Get content with project info to check permissions
    const content = await prisma.content.findUnique({
      where: { id: contentId },
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

    if (!content) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    // Check access permissions
    const isOwner = content.project.ownerId === userId;
    const memberAccess = content.project.members[0];
    const canDelete = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canDelete) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to delete this analysis'
      });
    }

    // Delete AI analysis
    await prisma.aIAnalysis.deleteMany({
      where: { contentId }
    });

    // Clear content cache
    await cache.del(`content:${contentId}`);
    await cache.del(`project:${content.projectId}:content`);

    res.status(204).send();
  } catch (error) {
    console.error('Delete AI analysis error:', error);
    res.status(500).json({
      error: 'Analysis Deletion Failed',
      message: 'Unable to delete AI analysis'
    });
  }
});

/**
 * @swagger
 * /api/ai/batch-analyze:
 *   post:
 *     summary: Trigger batch AI analysis for multiple content blocks
 *     tags: [AI Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentIds
 *               - analysisType
 *             properties:
 *               contentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               analysisType:
 *                 type: string
 *                 enum: [TAG_IMAGE, SUMMARIZE_TEXT, GENERATE_ALT_TEXT, ALL]
 *               options:
 *                 type: object
 *     responses:
 *       202:
 *         description: Batch AI analysis started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 batchId:
 *                   type: string
 *                 processedCount:
 *                   type: integer
 *       400:
 *         description: Validation error
 */
router.post('/batch-analyze', [
  body('contentIds').isArray({ min: 1 }),
  body('contentIds.*').isUUID(),
  body('analysisType').isIn(['TAG_IMAGE', 'SUMMARIZE_TEXT', 'GENERATE_ALT_TEXT', 'ALL']),
  body('options').optional().isObject()
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

    const { contentIds, analysisType, options = {} } = req.body;
    const userId = req.user.id;

    // Verify user has access to all content blocks
    const contents = await prisma.content.findMany({
      where: {
        id: { in: contentIds }
      },
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

    if (contents.length !== contentIds.length) {
      return res.status(404).json({
        error: 'Some Content Not Found',
        message: 'One or more content blocks do not exist'
      });
    }

    // Check permissions for all content
    const unauthorizedContent = contents.filter(content => {
      const isOwner = content.project.ownerId === userId;
      const memberAccess = content.project.members[0];
      return !isOwner && !(memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));
    });

    if (unauthorizedContent.length > 0) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to analyze some of the content blocks'
      });
    }

    // Start batch analysis
    const batchId = `batch_${Date.now()}`;
    
    // Process batch analysis in background
    processBatchAIAnalysis(contentIds, analysisType, options, batchId).catch(error => {
      console.error('Batch AI Analysis failed:', error);
    });

    res.status(202).json({
      message: 'Batch AI analysis started',
      batchId,
      processedCount: contentIds.length
    });
  } catch (error) {
    console.error('Start batch AI analysis error:', error);
    res.status(500).json({
      error: 'Batch Analysis Start Failed',
      message: 'Unable to start batch AI analysis'
    });
  }
});

// Background AI analysis processing
async function processAIAnalysis(contentId, content, analysisType, options) {
  try {
    let analysisResult = {};

    switch (content.type) {
      case 'IMAGE':
        if (analysisType === 'TAG_IMAGE' || analysisType === 'ALL') {
          const imageAnalysis = await mockAIService.analyzeImage(content.data.url, options);
          analysisResult.tags = imageAnalysis.tags;
          analysisResult.altText = imageAnalysis.altText;
        }
        break;

      case 'TEXT':
        if (analysisType === 'SUMMARIZE_TEXT' || analysisType === 'ALL') {
          const textAnalysis = await mockAIService.summarizeText(content.data.text, options);
          analysisResult.summary = textAnalysis.summary;
        }
        break;

      default:
        if (analysisType === 'ALL') {
          // Generic analysis for other content types
          analysisResult.tags = ['content', 'portfolio'];
          analysisResult.summary = `This ${content.type.toLowerCase()} content has been analyzed.`;
        }
    }

    // Save analysis to database
    await prisma.aIAnalysis.create({
      data: {
        contentId,
        tags: analysisResult.tags || [],
        summary: analysisResult.summary || null,
        altText: analysisResult.altText || null
      }
    });

    // Clear content cache
    await cache.del(`content:${contentId}`);
    await cache.del(`project:${content.projectId}:content`);

    console.log(`AI analysis completed for content ${contentId}`);
  } catch (error) {
    console.error(`AI analysis failed for content ${contentId}:`, error);
  }
}

// Background batch AI analysis processing
async function processBatchAIAnalysis(contentIds, analysisType, options, batchId) {
  try {
    console.log(`Starting batch AI analysis ${batchId} for ${contentIds.length} content blocks`);

    for (const contentId of contentIds) {
      const content = await prisma.content.findUnique({
        where: { id: contentId },
        include: {
          project: true
        }
      });

      if (content) {
        await processAIAnalysis(contentId, content, analysisType, options);
      }
    }

    console.log(`Batch AI analysis ${batchId} completed`);
  } catch (error) {
    console.error(`Batch AI analysis ${batchId} failed:`, error);
  }
}

module.exports = router;
