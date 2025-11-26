const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const docxService = require('../services/docx');
const aiService = require('../services/resume-ai');
const path = require('path');
const fs = require('fs').promises;
const { prisma } = require('../services/database');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.docx') {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'));
    }
  }
});

/**
 * @swagger
 * /api/resume/upload:
 *   post:
 *     summary: Upload a DOCX resume template
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *             properties:
 *               template:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Template uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templateId:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 */
router.post('/upload', upload.single('template'), [
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('saveToLibrary').optional().isBoolean()
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

    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Template file is required'
      });
    }

    const userId = req.user.id;
    const { name, description, saveToLibrary } = req.body;

    const templatePath = await docxService.saveTemplate(
      req.file.buffer,
      req.file.originalname
    );

    const templateId = path.basename(templatePath, path.extname(templatePath));

    // Save to library if requested
    let savedTemplate = null;
    if (saveToLibrary === true || saveToLibrary === 'true') {
      const templateName = name || req.file.originalname.replace('.docx', '');
      savedTemplate = await prisma.resumeTemplate.create({
        data: {
          userId,
          name: templateName,
          templatePath,
          fileName: req.file.originalname,
          description: description || null
        }
      });
    }

    res.json({
      templateId,
      templatePath,
      savedTemplate: savedTemplate ? {
        id: savedTemplate.id,
        name: savedTemplate.name,
        description: savedTemplate.description
      } : null,
      message: 'Template uploaded successfully'
    });
  } catch (error) {
    console.error('Upload template error:', error);
    res.status(500).json({
      error: 'Template Upload Failed',
      message: error.message || 'Unable to upload template'
    });
  }
});

/**
 * @swagger
 * /api/resume/tailor:
 *   post:
 *     summary: Generate tailored resume content using AI
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobDescription
 *               - userProfile
 *               - projects
 *             properties:
 *               jobDescription:
 *                 type: string
 *               userProfile:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   bio:
 *                     type: string
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *               projects:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *               size:
 *                 type: string
 *                 enum: [small, medium, large]
 *     responses:
 *       200:
 *         description: Resume content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                 projects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       tech:
 *                         type: string
 *       400:
 *         description: Validation error
 */
router.post('/tailor', [
  body('jobDescription').trim().isLength({ min: 10 }).withMessage('Job description is required'),
  body('userProfile').isObject().withMessage('User profile is required'),
  body('contentItems').optional().isArray().withMessage('Content items must be an array'),
  body('size').optional().isIn(['small', 'medium', 'large']).withMessage('Size must be small, medium, or large')
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

    const { jobDescription, userProfile, contentItems = [], size = 'medium' } = req.body;
    const userId = req.user?.id;

    // Fetch ALL user content with titles and excerpts (like resume chatbot)
    let allContent = [];
    if (userId) {
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: { userId }
              }
            }
          ]
        },
        select: { id: true }
      });
      
      const projectIds = userProjects.map(p => p.id);
      
      if (projectIds.length > 0) {
        allContent = await prisma.content.findMany({
          where: {
            projectId: { in: projectIds },
            status: { not: 'REVISION' },
            revisionOf: null,
            contentType: { not: 'SKILL' }
          },
          select: {
            id: true,
            title: true,
            excerpt: true,
            contentType: true,
            projectId: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    }

    // Generate resume with tool calls support
    const resumeData = await aiService.generateResumeContent({
      jobDescription,
      userProfile,
      allContent, // Pass all titles/excerpts
      selectedContentIds: contentItems.map(item => item.id).filter(Boolean), // Selected IDs for reference
      size,
      userId // For tool calls
    }, async (postId) => {
      // Tool call handler: fetch full content
      const post = await prisma.content.findUnique({
        where: { id: postId },
        select: {
          id: true,
          title: true,
          contentType: true,
          content: true,
          excerpt: true,
          metadata: true
        }
      });
      return post;
    });

    res.json(resumeData);
  } catch (error) {
    console.error('Tailor resume error:', error);
    res.status(500).json({
      error: 'Resume Generation Failed',
      message: error.message || 'Unable to generate resume content'
    });
  }
});

/**
 * @swagger
 * /api/resume/improve-text:
 *   post:
 *     summary: Improve resume text using AI
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalText
 *               - jobDescription
 *             properties:
 *               originalText:
 *                 type: string
 *               jobDescription:
 *                 type: string
 *               context:
 *                 type: string
 *               size:
 *                 type: string
 *                 enum: [small, medium, large]
 *     responses:
 *       200:
 *         description: Improved text generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 improvedText:
 *                   type: string
 */
router.post('/improve-text', [
  body('originalText').trim().isLength({ min: 1 }).withMessage('Original text is required'),
  body('jobDescription').trim().isLength({ min: 10 }).withMessage('Job description is required'),
  body('context').optional().trim(),
  body('size').optional().isIn(['small', 'medium', 'large']).withMessage('Size must be small, medium, or large')
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

    const { originalText, jobDescription, context, size = 'medium' } = req.body;

    const improvedText = await aiService.improveResumeText({
      originalText,
      jobDescription,
      context,
      size
    });

    res.json({ improvedText });
  } catch (error) {
    console.error('Improve text error:', error);
    res.status(500).json({
      error: 'Text Improvement Failed',
      message: error.message || 'Unable to improve text'
    });
  }
});

/**
 * @swagger
 * /api/resume/render:
 *   post:
 *     summary: Render a DOCX resume from template and data
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templatePath
 *               - data
 *             properties:
 *               templatePath:
 *                 type: string
 *               data:
 *                 type: object
 *                 properties:
 *                   summary:
 *                     type: string
 *                   projects:
 *                     type: array
 *                     items:
 *                       type: object
 *     responses:
 *       200:
 *         description: Resume rendered successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Validation error
 */
router.post('/render', [
  body('templatePath').trim().isLength({ min: 1 }).withMessage('Template path is required'),
  body('data').isObject().withMessage('Data object is required')
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

    const { templatePath, data } = req.body;

    // Load template
    const templateBuffer = await docxService.loadTemplate(templatePath);

    // Render template with data
    const renderedBuffer = await docxService.renderTemplate(templateBuffer, data);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.docx"');
    res.setHeader('Content-Length', renderedBuffer.length);

    res.send(renderedBuffer);
  } catch (error) {
    console.error('Render resume error:', error);
    res.status(500).json({
      error: 'Resume Rendering Failed',
      message: error.message || 'Unable to render resume'
    });
  }
});

/**
 * @swagger
 * /api/resume/templates:
 *   get:
 *     summary: Get all resume templates for the current user
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates
 */
router.get('/templates', async (req, res) => {
  try {
    const userId = req.user.id;

    const templates = await prisma.resumeTemplate.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        fileName: true,
        templatePath: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      error: 'Failed to fetch templates',
      message: error.message || 'Unable to retrieve templates'
    });
  }
});

/**
 * @swagger
 * /api/resume/templates:
 *   post:
 *     summary: Save a template to library
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 */
router.post('/templates', [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required (1-255 characters)'),
  body('templatePath').trim().isLength({ min: 1 }).withMessage('Template path is required'),
  body('fileName').trim().isLength({ min: 1 }).withMessage('File name is required'),
  body('description').optional().trim().isLength({ max: 1000 })
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

    const userId = req.user.id;
    const { name, templatePath, fileName, description } = req.body;

    // Verify template file exists
    try {
      await fs.access(templatePath);
    } catch {
      return res.status(404).json({
        error: 'Template Not Found',
        message: 'Template file does not exist'
      });
    }

    const template = await prisma.resumeTemplate.create({
      data: {
        userId,
        name,
        templatePath,
        fileName,
        description: description || null
      }
    });

    res.json(template);
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({
      error: 'Failed to save template',
      message: error.message || 'Unable to save template'
    });
  }
});

/**
 * @swagger
 * /api/resume/templates/{id}:
 *   delete:
 *     summary: Delete a template
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const template = await prisma.resumeTemplate.findFirst({
      where: { id, userId }
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template Not Found',
        message: 'Template does not exist'
      });
    }

    // Delete template file
    try {
      await docxService.deleteTemplate(template.templatePath);
    } catch (error) {
      console.error('Error deleting template file:', error);
    }

    // Delete from database
    await prisma.resumeTemplate.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      error: 'Failed to delete template',
      message: error.message || 'Unable to delete template'
    });
  }
});

/**
 * @swagger
 * /api/resume/history:
 *   get:
 *     summary: Get resume generation history
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await prisma.resumeHistory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            fileName: true
          }
        }
      }
    });

    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message || 'Unable to retrieve history'
    });
  }
});

/**
 * @swagger
 * /api/resume/history:
 *   post:
 *     summary: Save resume generation to history
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 */
router.post('/history', [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required (1-255 characters)'),
  body('templateId').optional().isUUID(),
  body('jobDescription').trim().isLength({ min: 1 }).withMessage('Job description is required'),
  body('resumeData').isObject().withMessage('Resume data is required'),
  body('contentItemIds').optional().isArray(),
  body('resumeSize').isIn(['small', 'medium', 'large']).withMessage('Resume size must be small, medium, or large')
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

    const userId = req.user.id;
    const { name, templateId, jobDescription, resumeData, contentItemIds, resumeSize } = req.body;

    // Verify template exists if provided
    if (templateId) {
      const template = await prisma.resumeTemplate.findFirst({
        where: { id: templateId, userId }
      });
      if (!template) {
        return res.status(404).json({
          error: 'Template Not Found',
          message: 'Template does not exist'
        });
      }
    }

    const history = await prisma.resumeHistory.create({
      data: {
        userId,
        name,
        templateId: templateId || null,
        jobDescription,
        resumeData,
        contentItemIds: contentItemIds || null,
        resumeSize
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            fileName: true
          }
        }
      }
    });

    res.json(history);
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({
      error: 'Failed to save history',
      message: error.message || 'Unable to save history'
    });
  }
});

/**
 * @swagger
 * /api/resume/history/{id}:
 *   get:
 *     summary: Get a specific resume from history
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const history = await prisma.resumeHistory.findFirst({
      where: { id, userId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            fileName: true,
            templatePath: true
          }
        }
      }
    });

    if (!history) {
      return res.status(404).json({
        error: 'History Not Found',
        message: 'Resume history does not exist'
      });
    }

    res.json(history);
  } catch (error) {
    console.error('Get history item error:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message || 'Unable to retrieve history'
    });
  }
});

/**
 * @swagger
 * /api/resume/history/{id}:
 *   delete:
 *     summary: Delete a resume from history
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/history/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const history = await prisma.resumeHistory.findFirst({
      where: { id, userId }
    });

    if (!history) {
      return res.status(404).json({
        error: 'History Not Found',
        message: 'Resume history does not exist'
      });
    }

    await prisma.resumeHistory.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({
      error: 'Failed to delete history',
      message: error.message || 'Unable to delete history'
    });
  }
});

module.exports = router;

