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

    // Use excerpt from structured data or generate from content
    const excerpt = result.excerpt || result.content.substring(0, 200).replace(/\n/g, ' ').trim() + '...';

    // Build response with structured data fields mapped for database
    const response = {
      content: result.content,
      title: result.title,
      excerpt: excerpt,
      skills: result.skills || [],
      tags: result.tags || []
    };
    
    // Add database-ready fields from structured data
    if (result.structuredData) {
      const { structuredData } = result;
      
      // PROJECT fields
      if (contentType === 'PROJECT') {
        if (structuredData.startDate) response.startDate = structuredData.startDate;
        if (structuredData.endDate) response.endDate = structuredData.endDate;
        if (structuredData.isOngoing !== undefined) response.isOngoing = structuredData.isOngoing;
        if (structuredData.featuredImage) response.featuredImage = structuredData.featuredImage;
        if (structuredData.projectLinks) response.projectLinks = structuredData.projectLinks;
        if (structuredData.contributors) response.contributors = structuredData.contributors;
      }
      
      // EXPERIENCE fields
      if (contentType === 'EXPERIENCE') {
        if (structuredData.experienceCategory) response.experienceCategory = structuredData.experienceCategory;
        if (structuredData.location) response.location = structuredData.location;
        if (structuredData.locationType) response.locationType = structuredData.locationType;
        if (structuredData.startDate) response.startDate = structuredData.startDate;
        if (structuredData.endDate) response.endDate = structuredData.endDate;
        if (structuredData.isOngoing !== undefined) response.isOngoing = structuredData.isOngoing;
        if (structuredData.roles) response.roles = structuredData.roles;
      }
    }
    
    // Add generation metadata
    response.metadata = {
      ...result.metadata,
      mode,
      contentType,
      generatedAt: new Date().toISOString(),
      wordCount: result.content.split(' ').length
    };

    res.json(response);
  } catch (error) {
    console.error('AI content generation error:', error);
    res.status(500).json({
      error: 'Generation Failed',
      message: error.message || 'Unable to generate content'
    });
  }
});

module.exports = router;
