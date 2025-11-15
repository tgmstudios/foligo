const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { authorizeProjectAccess } = require('../middleware/auth');
const geminiService = require('../services/gemini');

const router = express.Router();

/**
 * @swagger
 * /api/ai/generate-content:
 *   post:
 *     summary: Generate content using AI
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - topic
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [BLOG, PROJECT, EXPERIENCE]
 *               topic:
 *                 type: string
 *               details:
 *                 type: object
 *                 description: Additional context for content generation
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *                 metadata:
 *                   type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: AI generation failed
 */
router.post('/generate-content', [
  body('contentType').isIn(['BLOG', 'PROJECT', 'EXPERIENCE']),
  body('topic').trim().isLength({ min: 1 }).withMessage('Topic is required'),
  body('details').optional().isObject()
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

    const { contentType, topic, details = {} } = req.body;

    // Use the new method that incorporates answers and chat history
    const generatedContent = await geminiService.generateContentFromAnswers(
      contentType,
      topic,
      details.answers || [],
      details.questions || [],
      details.chatHistory || []
    );

    res.json({
      content: generatedContent,
      metadata: {
        contentType,
        topic,
        generatedAt: new Date().toISOString(),
        wordCount: generatedContent.split(' ').length
      }
    });
  } catch (error) {
    console.error('AI content generation error:', error);
    res.status(500).json({
      error: 'Content Generation Failed',
      message: error.message || 'Unable to generate content'
    });
  }
});

/**
 * @swagger
 * /api/ai/ask-question:
 *   post:
 *     summary: Ask AI for the next question in conversation
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - currentInfo
 *               - chatHistory
 *               - questionNumber
 *               - maxQuestions
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [BLOG, PROJECT, EXPERIENCE]
 *               currentInfo:
 *                 type: object
 *               chatHistory:
 *                 type: array
 *               questionNumber:
 *                 type: number
 *               maxQuestions:
 *                 type: number
 *     responses:
 *       200:
 *         description: Question generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Question generation failed
 */
router.post('/ask-question', [
  body('contentType').isIn(['BLOG', 'PROJECT', 'EXPERIENCE']),
  body('currentInfo').isObject(),
  body('chatHistory').isArray(),
  body('questionNumber').isInt({ min: 1 }),
  body('maxQuestions').isInt({ min: 1 })
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

    const { contentType, currentInfo, chatHistory, questionNumber, maxQuestions } = req.body;

    const question = await geminiService.askNextQuestion(
      contentType,
      currentInfo,
      chatHistory,
      questionNumber,
      maxQuestions
    );

    res.json({
      question: question
    });
  } catch (error) {
    console.error('AI question generation error:', error);
    res.status(500).json({
      error: 'Question Generation Failed',
      message: 'Failed to generate question',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat with AI for content creation assistance
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chat response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Chat generation failed
 */
router.post('/chat', [
  body('messages').isArray().withMessage('Messages must be an array'),
  body('messages.*.role').isIn(['user', 'assistant']).withMessage('Invalid message role'),
  body('messages.*.content').trim().isLength({ min: 1 }).withMessage('Message content is required')
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

    const { messages } = req.body;

    const response = await geminiService.chatWithUser(messages);

    res.json({
      response,
      metadata: {
        generatedAt: new Date().toISOString(),
        messageCount: messages.length
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: 'Chat Failed',
      message: error.message || 'Unable to process chat request'
    });
  }
});

/**
 * @swagger
 * /api/ai/clarifying-questions:
 *   post:
 *     summary: Generate clarifying questions for content creation
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [BLOG, PROJECT, EXPERIENCE]
 *               initialInfo:
 *                 type: object
 *                 description: Initial information about the content
 *     responses:
 *       200:
 *         description: Clarifying questions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Question generation failed
 */
router.post('/clarifying-questions', [
  body('contentType').isIn(['BLOG', 'PROJECT', 'EXPERIENCE']),
  body('initialInfo').optional().isObject()
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

    const { contentType, initialInfo = {} } = req.body;

    const questions = await geminiService.generateClarifyingQuestions(contentType, initialInfo);

    res.json({
      questions,
      metadata: {
        contentType,
        generatedAt: new Date().toISOString(),
        questionCount: questions.length
      }
    });
  } catch (error) {
    console.error('AI clarifying questions error:', error);
    res.status(500).json({
      error: 'Question Generation Failed',
      message: error.message || 'Unable to generate clarifying questions'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/ai-generate:
 *   post:
 *     summary: Generate and create content using AI
 *     tags: [AI Content Generation]
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
 *               - contentType
 *               - topic
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [BLOG, PROJECT, EXPERIENCE]
 *               topic:
 *                 type: string
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               details:
 *                 type: object
 *               metadata:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, HIDDEN]
 *     responses:
 *       201:
 *         description: AI-generated content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Content generation or creation failed
 */
router.post('/projects/:projectId/content/ai-generate', [
  body('contentType').isIn(['BLOG', 'PROJECT', 'EXPERIENCE']),
  body('topic').trim().isLength({ min: 1 }).withMessage('Topic is required'),
  body('title').optional().trim(),
  body('slug').optional().trim(),
  body('excerpt').optional().trim(),
  body('details').optional().isObject(),
  body('metadata').optional().isObject(),
  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'HIDDEN'])
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
    const { contentType, topic, title, slug, excerpt, details = {}, metadata = {}, status = 'DRAFT' } = req.body;

    // Generate content using AI
    let generatedContent;
    switch (contentType) {
      case 'BLOG':
        generatedContent = await geminiService.generateBlogPost(topic, details);
        break;
      case 'PROJECT':
        generatedContent = await geminiService.generateProjectDescription(
          topic, 
          details.technologies || [], 
          details.features || []
        );
        break;
      case 'EXPERIENCE':
        generatedContent = await geminiService.generateExperienceDescription(
          details.company || topic,
          details.position || '',
          details.duration || '',
          details.responsibilities || []
        );
        break;
      default:
        throw new Error('Invalid content type');
    }

    // Generate title if not provided
    const contentTitle = title || topic;
    
    // Generate slug if not provided
    let contentSlug = slug;
    if (!contentSlug && contentTitle) {
      contentSlug = contentTitle
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

    // Get the next order number
    const lastContent = await prisma.content.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    const contentOrder = lastContent ? lastContent.order + 1 : 0;

    // Create content in database
    const newContent = await prisma.content.create({
      data: {
        projectId,
        type: contentType,
        contentType,
        title: contentTitle,
        slug: contentSlug,
        excerpt: excerpt || generatedContent.substring(0, 200) + '...',
        content: generatedContent,
        metadata: {
          ...metadata,
          aiGenerated: true,
          generatedAt: new Date().toISOString(),
          originalTopic: topic
        },
        order: contentOrder,
        status
      },
      include: {
        aiAnalysis: true
      }
    });

    res.status(201).json(newContent);
  } catch (error) {
    console.error('AI content generation and creation error:', error);
    res.status(500).json({
      error: 'AI Content Creation Failed',
      message: error.message || 'Unable to generate and create content'
    });
  }
});

/**
 * @swagger
 * /api/ai/session:
 *   post:
 *     summary: Handle multi-step AI session (clarifying questions)
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *               - contentType
 *               - chatHistory
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [create, edit]
 *               contentType:
 *                 type: string
 *                 enum: [BLOG, PROJECT, EXPERIENCE]
 *               initialInfo:
 *                 type: object
 *               chatHistory:
 *                 type: array
 *     responses:
 *       200:
 *         description: Session response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 done:
 *                   type: boolean
 *                 summary:
 *                   type: string
 *                 changes:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Session failed
 */
router.post('/session', [
  body('mode').isIn(['create', 'edit']),
  body('contentType').isIn(['BLOG', 'PROJECT', 'EXPERIENCE']),
  body('initialInfo').optional().isObject(),
  body('chatHistory').isArray()
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

    const { mode, contentType, initialInfo = {}, chatHistory } = req.body;

    const result = await geminiService.handleAISession(mode, contentType, initialInfo, chatHistory);

    res.json(result);
  } catch (error) {
    console.error('AI session error:', error);
    res.status(500).json({
      error: 'Session Failed',
      message: error.message || 'Unable to process session'
    });
  }
});

/**
 * @swagger
 * /api/ai/generate:
 *   post:
 *     summary: Generate final content using pro model
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *               - contentType
 *               - chatHistory
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [create, edit]
 *               contentType:
 *                 type: string
 *                 enum: [BLOG, PROJECT, EXPERIENCE]
 *               chatHistory:
 *                 type: array
 *               currentContent:
 *                 type: string
 *               changes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Generation failed
 */
router.post('/generate', [
  body('mode').isIn(['create', 'edit']),
  body('contentType').isIn(['BLOG', 'PROJECT', 'EXPERIENCE']),
  body('chatHistory').isArray(),
  body('currentContent').optional().isString(),
  body('changes').optional().isString()
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

    const { mode, contentType, chatHistory, currentContent = '', changes = '' } = req.body;

    const result = await geminiService.generateFinalContent(mode, contentType, chatHistory, currentContent, changes);

    res.json({
      content: result.content,
      title: result.title,
      metadata: {
        mode,
        contentType,
        generatedAt: new Date().toISOString(),
        wordCount: result.content.split(' ').length
      }
    });
  } catch (error) {
    console.error('AI content generation error:', error);
    res.status(500).json({
      error: 'Generation Failed',
      message: error.message || 'Unable to generate content'
    });
  }
});

module.exports = router;
