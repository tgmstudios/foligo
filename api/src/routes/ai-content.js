const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { authorizeProjectAccess } = require('../middleware/auth');
const geminiService = require('../services/gemini');

// Helper function to get context for AI (user, project, existing content)
async function getAIContext(userId, projectId) {
  const context = {
    user: null,
    project: null,
    existingContent: [],
    postsByType: {
      BLOG: [],
      PROJECT: [],
      EXPERIENCE: []
    },
    skills: [],
    categories: []
  };

  try {
    // Get user info
    if (userId) {
      context.user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true
        }
      });
    }

    // Get project info
    if (projectId) {
      context.project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          description: true,
          subdomain: true,
          isPublished: true,
          siteConfig: {
            select: {
              profileName: true,
              profileBio: true,
              siteName: true,
              siteDescription: true
            }
          }
        }
      });

      if (context.project) {
        // Get existing content (titles and excerpts, excluding revisions)
        context.existingContent = await prisma.content.findMany({
          where: {
            projectId: projectId,
            status: { not: 'REVISION' },
            revisionOf: null
          },
          select: {
            id: true,
            type: true,
            contentType: true,
            title: true,
            excerpt: true,
            status: true
          },
          orderBy: { createdAt: 'desc' },
          take: 50 // Limit to recent 50 posts
        });

        // Get last 10 posts per type (BLOG, PROJECT, EXPERIENCE)
        const postTypes = ['BLOG', 'PROJECT', 'EXPERIENCE'];
        for (const postType of postTypes) {
          context.postsByType[postType] = await prisma.content.findMany({
            where: {
              projectId: projectId,
              contentType: postType,
              status: { not: 'REVISION' },
              revisionOf: null
            },
            select: {
              id: true,
              title: true,
              excerpt: true,
              contentType: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          });
        }

        // Get all skills for the project
        context.skills = await prisma.skill.findMany({
          where: {
            projects: {
              some: {
                id: projectId
              }
            }
          },
          select: {
            id: true,
            name: true,
            category: true
          },
          orderBy: [
            { category: 'asc' },
            { name: 'asc' }
          ]
        });

        // Get all unique categories from skills and content tags
        const skillCategories = [...new Set(context.skills.map(s => s.category).filter(Boolean))];
        const contentTags = await prisma.contentTag.findMany({
          where: {
            projects: {
              some: {
                id: projectId
              }
            }
          },
          select: {
            category: true
          },
          distinct: ['category']
        });
        const tagCategories = contentTags.map(t => t.category).filter(Boolean);
        context.categories = [...new Set([...skillCategories, ...tagCategories])];
      }
    }
  } catch (error) {
    console.error('Error fetching AI context:', error);
  }

  return context;
}

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
  body('contentType').optional().isIn(['BLOG', 'PROJECT', 'EXPERIENCE', 'SKILL']),
  body('initialInfo').optional().isObject(),
  body('chatHistory').isArray(),
  body('projectId').optional().isUUID()
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

    let { mode, contentType, initialInfo = {}, chatHistory, projectId } = req.body;
    
    // Get context (user, project, existing content)
    const userId = req.user?.id;
    const context = await getAIContext(userId, projectId);
    
    // If contentType is not provided, try to infer it from the conversation
    if (!contentType && chatHistory.length > 0) {
      contentType = await geminiService.inferContentType(chatHistory, initialInfo);
    }

    const result = await geminiService.handleAISession(mode, contentType, initialInfo, chatHistory, context);

    // Handle toolcall (post fetch)
    if (result.toolcall === 'fetch_post' && result.postId) {
      try {
        // Fetch the full post content
        const post = await prisma.content.findUnique({
          where: { id: result.postId },
          select: {
            id: true,
            title: true,
            contentType: true,
            content: true,
            excerpt: true,
            metadata: true
          }
        });

        if (post) {
          // Add the fetched post to chat history and continue conversation automatically
          // The user will see "Fetching {post title}..." message, then the continued conversation
          const updatedChatHistory = [
            ...chatHistory,
            { role: 'assistant', content: result.message || `Fetching "${post.title}"...` },
            { role: 'user', content: `Here is the full content of the post "${post.title}":\n\n${post.content}` }
          ];

          // Continue the session with the fetched post included
          const continuedResult = await geminiService.handleAISession(
            mode, 
            contentType, 
            initialInfo, 
            updatedChatHistory, 
            context
          );

          // Use the contentType from result if it was corrected
          const finalContentType = continuedResult.contentType || contentType;
          
          // Return the continued result, but include info about the fetched post
          return res.json({
            ...continuedResult,
            contentType: finalContentType,
            fetchedPost: {
              id: post.id,
              title: post.title
            }
          });
        } else {
          return res.json({
            message: result.message || 'Post not found',
            done: false,
            error: 'Post not found'
          });
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        return res.json({
          message: result.message || 'Error fetching post',
          done: false,
          error: 'Failed to fetch post'
        });
      }
    }

    // Use the contentType from result if it was corrected, otherwise use the original
    const finalContentType = result.contentType || contentType;
    
    res.json({
      ...result,
      contentType: finalContentType
    });
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
  body('contentType').isIn(['BLOG', 'PROJECT', 'EXPERIENCE', 'SKILL']),
  body('chatHistory').isArray(),
  body('currentContent').optional().isString(),
  body('changes').optional().isString(),
  body('projectId').optional().isUUID()
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

    const { mode, contentType, chatHistory, currentContent = '', changes = '', projectId } = req.body;

    // Get context (user, project, existing content)
    const userId = req.user?.id;
    const context = await getAIContext(userId, projectId);

    const result = await geminiService.generateFinalContent(mode, contentType, chatHistory, currentContent, changes, context);

    // Extract excerpt from content if not in metadata
    // Remove title and any header metadata from excerpt
    let excerptContent = result.content;
    // Remove the first heading (title)
    excerptContent = excerptContent.replace(/^#\s+.+$/m, '').trim();
    // Remove any header metadata patterns like "By Name • Date • Type"
    excerptContent = excerptContent.replace(/^By\s+[^•]+•\s*[^•]+•\s*[^\n]+\n?/i, '').trim();
    // Extract clean excerpt (first 200 chars of actual content)
    const excerpt = result.metadata?.excerpt || excerptContent.substring(0, 200).replace(/\n/g, ' ').trim() + '...';

    res.json({
      content: result.content,
      title: result.title,
      excerpt: excerpt,
      metadata: {
        ...result.metadata,
        mode,
        contentType,
        generatedAt: new Date().toISOString(),
        wordCount: result.content.split(' ').length
      },
      skills: result.skills || [],
      tags: result.tags || []
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
