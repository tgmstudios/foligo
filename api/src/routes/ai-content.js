const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
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
  body('contentType').optional().isIn(['BLOG', 'PROJECT', 'EXPERIENCE']),
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
  body('contentType').isIn(['BLOG', 'PROJECT', 'EXPERIENCE']),
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

    console.log('[ai-content] Generation result from service:', {
      hasContent: !!result.content,
      contentLength: result.content?.length,
      title: result.title,
      hasStructuredData: !!result.structuredData,
      structuredDataKeys: result.structuredData ? Object.keys(result.structuredData) : [],
      skillsCount: result.skills?.length || 0,
      tagsCount: result.tags?.length || 0
    });

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
      
      console.log('[ai-content] Processing structured data:', {
        contentType,
        hasProjectLinks: !!structuredData.projectLinks,
        projectLinks: structuredData.projectLinks,
        hasSkills: !!structuredData.skills,
        skillsCount: structuredData.skills?.length || 0,
        hasTags: !!structuredData.tags,
        tagsCount: structuredData.tags?.length || 0
      });
      
      // PROJECT fields
      if (contentType === 'PROJECT') {
        if (structuredData.startDate) response.startDate = structuredData.startDate;
        if (structuredData.endDate) response.endDate = structuredData.endDate;
        if (structuredData.isOngoing !== undefined) response.isOngoing = structuredData.isOngoing;
        if (structuredData.featuredImage) response.featuredImage = structuredData.featuredImage;
        if (structuredData.projectLinks) response.projectLinks = structuredData.projectLinks;
        if (structuredData.contributors) response.contributors = structuredData.contributors;
        
        console.log('[ai-content] PROJECT fields added to response:', {
          startDate: response.startDate,
          endDate: response.endDate,
          isOngoing: response.isOngoing,
          projectLinks: response.projectLinks,
          contributors: response.contributors
        });
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
    } else {
      console.log('[ai-content] WARNING: No structured data in result');
    }
    
    // Add generation metadata
    response.metadata = {
      ...result.metadata,
      mode,
      contentType,
      generatedAt: new Date().toISOString(),
      wordCount: result.content.split(' ').length
    };

    console.log('[ai-content] Final response being sent to frontend:', {
      title: response.title,
      excerpt: response.excerpt?.substring(0, 100),
      projectLinks: response.projectLinks,
      skillsCount: response.skills?.length || 0,
      tagsCount: response.tags?.length || 0,
      hasContent: !!response.content,
      contentLength: response.content?.length
    });

    res.json(response);
  } catch (error) {
    console.error('AI content generation error:', error);
    res.status(500).json({
      error: 'Generation Failed',
      message: error.message || 'Unable to generate content'
    });
  }
});

/**
 * @swagger
 * /api/ai/create:
 *   post:
 *     summary: Generate content and create it in one step
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
 *               - projectId
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
 *               projectId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 content:
 *                   type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Creation failed
 */
router.post('/create', [
  body('mode').isIn(['create', 'edit']),
  body('contentType').isIn(['BLOG', 'PROJECT', 'EXPERIENCE']),
  body('chatHistory').isArray(),
  body('currentContent').optional().isString(),
  body('changes').optional().isString(),
  body('projectId').isUUID()
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
    const userId = req.user?.id;

    // Verify user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    });

    if (!project) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have access to this project'
      });
    }

    // Get context (user, project, existing content)
    const context = await getAIContext(userId, projectId);

    // Generate content using AI
    const generatedData = await geminiService.generateFinalContent(
      mode, 
      contentType, 
      chatHistory, 
      currentContent, 
      changes, 
      context
    );

    console.log('[ai-content/create] Generated data:', {
      hasContent: !!generatedData.content,
      title: generatedData.title,
      skillsCount: generatedData.skills?.length || 0,
      tagsCount: generatedData.tags?.length || 0
    });

    // Match or create skills
    const matchedSkills = await matchOrCreateSkills(generatedData.skills || [], projectId);
    
    // Match or create tags
    const matchedTags = await matchOrCreateTags(generatedData.tags || [], projectId);

    console.log('[ai-content/create] Matched/created:', {
      skillsCount: matchedSkills.length,
      tagsCount: matchedTags.length
    });

    // Generate slug from title
    let slug = generatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Ensure slug is unique
    const existingContent = await prisma.content.findFirst({
      where: { slug }
    });
    if (existingContent) {
      slug = `${slug}-${Date.now()}`;
    }

    // Get next order number
    const lastContent = await prisma.content.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    const order = lastContent ? lastContent.order + 1 : 0;

    // Use excerpt from structured data or generate from content
    const excerpt = generatedData.excerpt || generatedData.content.substring(0, 200).replace(/\n/g, ' ').trim() + '...';

    // Prepare content data
    const contentData = {
      projectId,
      type: contentType,
      contentType,
      title: generatedData.title,
      slug,
      excerpt,
      content: generatedData.content,
      metadata: generatedData.metadata || {},
      order,
      status: 'DRAFT'
    };

    // Add type-specific fields from structured data
    if (generatedData.structuredData) {
      const { structuredData } = generatedData;
      
      if (contentType === 'PROJECT') {
        if (structuredData.startDate) contentData.startDate = new Date(structuredData.startDate);
        if (structuredData.endDate) contentData.endDate = new Date(structuredData.endDate);
        if (structuredData.isOngoing !== undefined) contentData.isOngoing = structuredData.isOngoing;
        if (structuredData.featuredImage) contentData.featuredImage = structuredData.featuredImage;
        if (structuredData.projectLinks) contentData.projectLinks = structuredData.projectLinks;
        if (structuredData.contributors) contentData.contributors = structuredData.contributors;
      }
      
      if (contentType === 'EXPERIENCE') {
        if (structuredData.experienceCategory) contentData.experienceCategory = structuredData.experienceCategory;
        if (structuredData.location) contentData.location = structuredData.location;
        if (structuredData.locationType) contentData.locationType = structuredData.locationType;
        if (structuredData.startDate) contentData.startDate = new Date(structuredData.startDate);
        if (structuredData.endDate) contentData.endDate = new Date(structuredData.endDate);
        if (structuredData.isOngoing !== undefined) contentData.isOngoing = structuredData.isOngoing;
      }
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
            skills: true
          },
          orderBy: { startDate: 'desc' }
        },
        linkedSkills: true
      }
    });

    console.log('[ai-content/create] Content created:', newContent.id);

    // Link skills to content
    if (matchedSkills.length > 0) {
      await prisma.content.update({
        where: { id: newContent.id },
        data: {
          linkedSkills: {
            connect: matchedSkills.map(s => ({ id: s.id }))
          }
        }
      });
      console.log(`[ai-content/create] Linked ${matchedSkills.length} skills`);
    }

    // Link tags to content
    if (matchedTags.length > 0) {
      await prisma.content.update({
        where: { id: newContent.id },
        data: {
          tags: {
            connect: matchedTags.map(t => ({ id: t.id }))
          }
        }
      });
      console.log(`[ai-content/create] Linked ${matchedTags.length} tags`);
    }

    // Create roles for EXPERIENCE content
    if (contentType === 'EXPERIENCE' && generatedData.structuredData?.roles) {
      const rolesData = generatedData.structuredData.roles;
      console.log(`[ai-content/create] Creating ${rolesData.length} roles for experience`);
      
      for (const roleData of rolesData) {
        // Match or create skills for this role
        const roleSkills = await matchOrCreateSkills(roleData.skills || [], projectId);
        
        // Create the role
        await prisma.experienceRole.create({
          data: {
            contentId: newContent.id,
            title: roleData.title,
            description: roleData.description || null,
            startDate: new Date(roleData.startDate),
            endDate: roleData.endDate ? new Date(roleData.endDate) : null,
            isCurrent: roleData.isCurrent || false,
            skills: {
              connect: roleSkills.map(s => ({ id: s.id }))
            }
          }
        });
        
        console.log(`[ai-content/create] Created role: ${roleData.title} with ${roleSkills.length} skills`);
      }
    }

    // Fetch complete content with all relationships
    const completeContent = await prisma.content.findUnique({
      where: { id: newContent.id },
      include: {
        tags: true,
        meta: true,
        blocks: {
          orderBy: { order: 'asc' }
        },
        roles: {
          include: {
            skills: true
          },
          orderBy: { startDate: 'desc' }
        },
        linkedSkills: true
      }
    });

    // Clear project content cache so new content appears immediately
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);
    console.log(`[ai-content/create] Cleared cache for project ${projectId}`);

    res.status(201).json({
      id: completeContent.id,
      content: completeContent
    });
  } catch (error) {
    console.error('AI content creation error:', error);
    res.status(500).json({
      error: 'Creation Failed',
      message: error.message || 'Unable to create content'
    });
  }
});

// Helper function to match or create skills
async function matchOrCreateSkills(skills, projectId) {
  if (!skills || skills.length === 0) return [];
  
  const matchedSkills = [];
  
  for (const skillData of skills) {
    const skillName = skillData.name?.trim();
    const skillCategory = skillData.category?.trim() || null;
    
    if (!skillName) continue;

    try {
      // Try to find existing skill
      let skill = await prisma.skill.findFirst({
        where: {
          name: { equals: skillName, mode: 'insensitive' },
          category: skillCategory || null
        }
      });

      // If not found, create it
      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: skillName,
            category: skillCategory
          }
        });
        console.log('[matchOrCreateSkills] Created new skill:', skillName);
      }

      // Link skill to project if not already linked
      const existingLink = await prisma.skill.findFirst({
        where: {
          id: skill.id,
          projects: {
            some: {
              id: projectId
            }
          }
        }
      });

      if (!existingLink) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            skills: {
              connect: { id: skill.id }
            }
          }
        });
        console.log('[matchOrCreateSkills] Linked skill to project:', skill.id);
      }

      matchedSkills.push({
        id: skill.id,
        name: skill.name,
        category: skill.category
      });
    } catch (error) {
      console.error(`Error matching/creating skill ${skillName}:`, error.message);
    }
  }

  return matchedSkills;
}

// Helper function to match or create tags
async function matchOrCreateTags(tags, projectId) {
  if (!tags || tags.length === 0) return [];
  
  const matchedTags = [];
  
  for (const tagData of tags) {
    const tagName = tagData.name?.trim();
    const tagCategory = tagData.category?.trim() || null;
    
    if (!tagName) continue;

    try {
      // Try to find existing tag
      let tag = await prisma.contentTag.findFirst({
        where: {
          name: { equals: tagName, mode: 'insensitive' },
          category: tagCategory || null
        }
      });

      // If not found, create it
      if (!tag) {
        tag = await prisma.contentTag.create({
          data: {
            name: tagName,
            category: tagCategory
          }
        });
        console.log('[matchOrCreateTags] Created new tag:', tagName);
      }

      // Link tag to project if not already linked
      const existingLink = await prisma.contentTag.findFirst({
        where: {
          id: tag.id,
          projects: {
            some: {
              id: projectId
            }
          }
        }
      });

      if (!existingLink) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            tags: {
              connect: { id: tag.id }
            }
          }
        });
        console.log('[matchOrCreateTags] Linked tag to project:', tag.id);
      }

      matchedTags.push({
        id: tag.id,
        name: tag.name,
        category: tag.category
      });
    } catch (error) {
      console.error(`Error matching/creating tag ${tagName}:`, error.message);
    }
  }

  return matchedTags;
}

module.exports = router;
