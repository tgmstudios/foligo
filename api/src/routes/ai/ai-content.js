const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const mammoth = require('mammoth');

// Import pdf-parse - v2.x exports PDFParse class
const pdfParseModule = require('pdf-parse');
const PDFParse = pdfParseModule.PDFParse || pdfParseModule;

// Validate PDFParse class is available
if (!PDFParse || typeof PDFParse !== 'function') {
  console.error('pdf-parse import error - module structure:', {
    moduleType: typeof pdfParseModule,
    moduleKeys: Object.keys(pdfParseModule || {}),
    hasPDFParse: !!pdfParseModule?.PDFParse,
    PDFParseType: typeof PDFParse
  });
  throw new Error('pdf-parse module is not properly loaded. Please reinstall pdf-parse: npm install pdf-parse');
}
const { prisma } = require('../../services/core/database');
const { cache } = require('../../services/core/redis');
const { authorizeProjectAccess, authenticateToken } = require('../../middleware/auth');
const geminiService = require('../../services/ai-session');
const { findSimilarPostPairs } = require('../../services/content/post-similarity');
const { matchOrCreateSkills, matchOrCreateTags } = require('../../services/content/skill-tag-matcher');
const { setupSSE } = require('../../utils/sse');
const ai = require('../../services/ai/manager');
const { createPortfolioAgentTools } = require('../../services/content/portfolio-agent-tools');

// Configure multer for resume uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Please upload PDF, DOC, DOCX, or TXT files.'), false);
    }
  }
});

// Helper function to extract text from resume file
async function extractResumeText(file) {
  // Validate file buffer exists
  if (!file.buffer || file.buffer.length === 0) {
    throw new Error('File buffer is empty or invalid');
  }

  if (file.mimetype === 'text/plain') {
    try {
      return file.buffer.toString('utf-8');
    } catch (error) {
      console.error('Error reading text file:', error);
      throw new Error('Failed to read text file. Please ensure the file is valid.');
    }
  } else if (file.mimetype === 'application/pdf') {
    try {
      // Validate PDF by checking magic bytes
      const pdfHeader = file.buffer.slice(0, 4).toString();
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file: File does not appear to be a valid PDF.');
      }

      // Use PDFParse class (v2.x API)
      const parser = new PDFParse({ data: file.buffer });
      const result = await parser.getText();
      const data = { text: result.text || '' };

      if (!data || !data.text) {
        throw new Error('PDF appears to be empty or contains no extractable text. The PDF might be image-based or encrypted.');
      }

      const extractedText = data.text.trim();
      if (extractedText.length === 0) {
        throw new Error('PDF contains no extractable text. The PDF might be image-based or encrypted.');
      }

      return extractedText;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Invalid PDF') || error.message.includes('empty') || error.message.includes('encrypted')) {
        throw error;
      }
      
      // Check if it's a known pdf-parse error
      if (error.message && error.message.includes('pdf')) {
        throw new Error(`PDF parsing failed: ${error.message}. The PDF might be corrupted, encrypted, or in an unsupported format.`);
      }
      
      throw new Error('Failed to extract text from PDF file. The PDF might be corrupted, encrypted, or in an unsupported format. Please try a different PDF file.');
    }
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             file.mimetype === 'application/msword') {
    // DOCX or DOC file
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      
      if (!result || !result.value) {
        throw new Error('Failed to extract text from Word document. The document might be empty or corrupted.');
      }

      const extractedText = result.value.trim();
      if (extractedText.length === 0) {
        throw new Error('Word document contains no extractable text.');
      }

      return extractedText;
    } catch (error) {
      console.error('Error parsing DOCX/DOC:', error);
      
      if (error.message && (error.message.includes('empty') || error.message.includes('corrupted'))) {
        throw error;
      }
      
      throw new Error('Failed to extract text from Word document. Please ensure the file is a valid DOCX or DOC file and is not corrupted.');
    }
  } else {
    throw new Error(`Unsupported file type: ${file.mimetype}. Please upload a PDF, DOC, DOCX, or TXT file.`);
  }
}

// Helper function to save or update chat session
async function saveChatSession(userId, sessionId, chatHistory, resumeText, resumeFileName, jobPosting) {
  try {
    // Generate title from first user message if not exists
    let title = 'New Chat';
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      const firstUserMessage = chatHistory.find(msg => msg.role === 'user');
      if (firstUserMessage && firstUserMessage.content) {
        // Use first 50 characters of first message as title
        title = firstUserMessage.content.substring(0, 50).trim();
        if (firstUserMessage.content.length > 50) {
          title += '...';
        }
      }
    }

    if (sessionId) {
      // Update existing session
      const existingSession = await prisma.resumeChatSession.findFirst({
        where: {
          id: sessionId,
          userId
        }
      });

      if (existingSession) {
        return await prisma.resumeChatSession.update({
          where: { id: sessionId },
          data: {
            title: existingSession.title || title,
            chatHistory,
            resumeText: resumeText || existingSession.resumeText,
            resumeFileName: resumeFileName || existingSession.resumeFileName,
            jobPosting: jobPosting || existingSession.jobPosting
          }
        });
      }
    }

    // Create new session
    return await prisma.resumeChatSession.create({
      data: {
        userId,
        title,
        chatHistory,
        resumeText: resumeText || null,
        resumeFileName: resumeFileName || null,
        jobPosting: jobPosting || null
      }
    });
  } catch (error) {
    console.error('Error saving chat session:', error);
    // Don't throw - allow chat to continue even if save fails
    return null;
  }
}

/**
 * Get comprehensive context for resume chatbot
 * Fetches ALL user content across all projects (not just one project)
 */
async function getResumeChatbotContext(userId) {
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
    tags: [],
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

      // Get all projects the user owns or is a member of
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
        select: {
          id: true
        }
      });
      
      const projectIds = userProjects.map(p => p.id);
      
      if (projectIds.length > 0) {
        // Get ALL content across all user's projects (titles and excerpts)
        context.existingContent = await prisma.content.findMany({
          where: {
            projectId: { in: projectIds },
            status: { not: 'REVISION' },
            revisionOf: null
          },
          select: {
            id: true,
            type: true,
            contentType: true,
            title: true,
            excerpt: true,
            status: true,
            projectId: true
          },
          orderBy: { createdAt: 'desc' }
        });

        // Get ALL posts per type across all projects
        const postTypes = ['BLOG', 'PROJECT', 'EXPERIENCE'];
        for (const postType of postTypes) {
          context.postsByType[postType] = await prisma.content.findMany({
            where: {
              projectId: { in: projectIds },
              contentType: postType,
              status: { not: 'REVISION' },
              revisionOf: null
            },
            select: {
              id: true,
              title: true,
              excerpt: true,
              contentType: true,
              createdAt: true,
              projectId: true
            },
            orderBy: { createdAt: 'desc' }
          });
        }

        // Get all skills across all user's projects
        const allSkills = await prisma.skill.findMany({
          where: {
            projects: {
              some: {
                id: { in: projectIds }
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
        
        // Deduplicate skills by name and category
        const skillsMap = new Map();
        allSkills.forEach(skill => {
          const key = `${skill.name}|${skill.category || 'null'}`;
          if (!skillsMap.has(key)) {
            skillsMap.set(key, skill);
          }
        });
        context.skills = Array.from(skillsMap.values());

        // Get all content tags across all user's projects
        const allTags = await prisma.contentTag.findMany({
          where: {
            projects: {
              some: {
                id: { in: projectIds }
              }
            }
          },
          select: {
            id: true,
            name: true,
            category: true
          }
        });
        
        // Deduplicate tags by name and category
        const tagsMap = new Map();
        allTags.forEach(tag => {
          const key = `${tag.name}|${tag.category || 'null'}`;
          if (!tagsMap.has(key)) {
            tagsMap.set(key, tag);
          }
        });
        context.tags = Array.from(tagsMap.values());

        // Get all unique categories from skills and content tags
        const skillCategories = [...new Set(context.skills.map(s => s.category).filter(Boolean))];
        const tagCategories = [...new Set(context.tags.map(t => t.category).filter(Boolean))];
        context.categories = [...new Set([...skillCategories, ...tagCategories])];
      }
    }
  } catch (error) {
    console.error('Error fetching resume chatbot context:', error);
  }

  return context;
}

const router = express.Router();

const CURRENT_PAGE_LABELS = {
  dashboard: 'the main dashboard',
  blogs: 'the blog posts list',
  'projects-content': 'the projects list',
  experience: 'the experience list',
  portfolios: 'the portfolios list',
  'portfolio-detail': 'a portfolio detail page',
  'create-content': 'the new-post form',
  'create-content-portfolio': 'the new-post form',
  'content-editor': 'the Content Editor',
  'studio-content': 'the AI Markdown Studio',
  'studio-resume': 'Resume Studio',
  'studio-cover-letter': 'Cover Letter Studio',
  'goapply-kanban': 'the GoApply job tracker (kanban board)',
  'goapply-jobs': 'the GoApply job list',
  'goapply-assistant': 'the GoApply Job Assistant chat',
  'goapply-assistant-session': 'a GoApply Job Assistant session',
  'goapply-resume': 'the GoApply resume gallery',
  'goapply-answers': 'the GoApply saved answers list',
  'goapply-letters': 'the GoApply cover letters list',
  'goapply-profile': 'the GoApply profile settings',
};

/**
 * Turn the dashboard route the user currently has open into a system-prompt
 * blurb, resolving the focal entity (post/resume/cover letter) by id where
 * possible so "add a role to this experience" / "update this resume" work
 * without the user having to name or look anything up first.
 */
async function describeCurrentPage(currentPage, { projectId, userId }) {
  const name = currentPage?.name;
  if (!name) return '';
  const params = currentPage.params || {};
  const label = CURRENT_PAGE_LABELS[name] || `the "${name}" page`;

  if ((name === 'content-editor' || name === 'studio-content') && params.id) {
    const post = await prisma.content.findFirst({
      where: { id: params.id, projectId },
      select: { id: true, title: true, contentType: true },
    });
    if (post) {
      return `The user currently has ${label} open, editing this post: "${post.title}" (${post.contentType}, id: ${post.id}). When they say "this post"/"this experience"/"this project"/"it" etc. without naming something else, they mean this one — act on it directly, no need to call list_posts first.`;
    }
  }

  if (name === 'studio-resume' && params.id) {
    const resume = await prisma.resumeDocument.findFirst({ where: { id: params.id, userId }, select: { id: true, name: true } });
    if (resume) {
      return `The user currently has ${label} open, editing this resume: "${resume.name}" (id: ${resume.id}). When they say "this resume"/"it", they mean this one.`;
    }
  }

  if (name === 'studio-cover-letter' && params.id) {
    const letter = await prisma.coverLetter.findFirst({ where: { id: params.id, userId }, select: { id: true, title: true } });
    if (letter) {
      return `The user currently has ${label} open, editing this cover letter: "${letter.title}" (id: ${letter.id}). When they say "this cover letter"/"it", they mean this one.`;
    }
  }

  return `The user currently has ${label} open in the dashboard.`;
}

/**
 * @swagger
 * /api/ai/portfolio/chat:
 *   post:
 *     summary: Send a message to the whole-portfolio AI Content Creator agent (SSE stream of thinking/text/tool-call events)
 *     tags: [AI Content Generation]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/portfolio/chat', [
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('projectId').isUUID().withMessage('Valid project ID is required'),
  body('provider').optional().isString(),
  body('history').optional().isArray(),
  body('currentPage').optional().isObject(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: errors.array() });
  }

  const userId = req.user.id;
  const { projectId } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { owner: true, members: { where: { userId } } },
  });
  if (!project) {
    return res.status(404).json({ error: 'Not Found', message: 'Project does not exist' });
  }
  const isOwner = project.ownerId === userId;
  const memberAccess = project.members[0];
  const canEdit = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));
  if (!canEdit) {
    return res.status(403).json({ error: 'Access Denied', message: 'You do not have permission to edit this project' });
  }

  const { send, aborted, cleanup } = setupSSE(req, res);

  const userMessage = req.body.message;
  const priorHistory = Array.isArray(req.body.history) ? req.body.history : [];
  const messages = [
    ...priorHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const posts = await prisma.content.findMany({
    where: { projectId, revisionOf: null },
    select: { id: true, title: true, contentType: true, status: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  const postList = posts.length
    ? posts.map((p) => `- [${p.contentType}/${p.status}] "${p.title}" (id: ${p.id})`).join('\n')
    : '(no posts yet)';

  const tools = createPortfolioAgentTools({ projectId, userId });
  const currentPageContext = await describeCurrentPage(req.body.currentPage, { projectId, userId });

  const systemInstruction = `You are the AI Content Creator, an agent with full read/write authority over the user's entire Foligo account: every post (BLOG, PROJECT, and EXPERIENCE entries) in the portfolio project "${project.name}" — every field, every experience role, every linked skill and tag — PLUS everything in GoApply: resumes, cover letters, tracked job applications, saved answers, and their GoApply profile, across all of their projects. You can also navigate the user anywhere in the dashboard.

${currentPageContext ? `CURRENT PAGE:\n${currentPageContext}\n` : ''}
CURRENT POSTS IN THIS PROJECT:
${postList}

PORTFOLIO CAPABILITIES:
- Use list_posts / get_post to find and inspect posts before acting on them — never guess a postId.
- Use create_post, update_post_fields, update_post_content, add/update/delete_experience_role, and add/remove_skills_to_post / add/remove_tags_to_post freely — these are real, immediate writes (each snapshots a revision first where applicable).

GOAPPLY CAPABILITIES (these span ALL of the user's projects, not just "${project.name}"):
- Resumes: list_resumes, get_resume, save_resume (omit resumeId to create, include it to update).
- Cover letters: list_cover_letters, get_cover_letter, save_cover_letter (same create/update pattern).
- Job applications (the tracker/kanban): list_job_applications, save_job_application (same create/update pattern; status must be one of saved/applied/screening/interview/offer/accepted/rejected/withdrawn/archived).
- Saved answers: get_saved_answers, save_answers (batch create/update).
- Profile: get_goapply_profile, update_goapply_profile (only set fields the user explicitly gave you — never invent personal details).
- save_skills attaches/creates Foligo skills on a writable project and can optionally link them to the GoApply profile.

NAVIGATION:
- Use navigate_to whenever the user asks to see, open, or go to something — portfolio posts/lists, or GoApply's kanban, job list, resume gallery, cover letters, saved answers, profile, job assistant, or a specific resume/cover-letter Studio.
- Also call it (target "studio-content") right after create_post succeeds, unless the user is clearly about to have you create more posts in this same conversation — landing them in the editor for what was just made is the expected default.

RESEARCH: use web_search / pull_page when useful.

HARD RULES:
- Deleting ANYTHING (a post, resume, cover letter, job application, or saved answer) always requires human confirmation. Call the matching propose_delete_* tool, then STOP — none of them delete anything themselves, they only surface a confirmation prompt in the UI. Never claim something was deleted; the user must click Confirm themselves.
- You have NO tools for and must NEVER discuss, infer, or offer to change the user's account email, password, authentication, billing, or security settings — those are entirely out of scope and live elsewhere in the dashboard.
- After making changes, briefly tell the user what you did in plain prose.`;

  try {
    for await (const part of ai.streamChat(messages, { systemInstruction, tools, maxSteps: 40, provider: req.body.provider })) {
      switch (part.type) {
        case 'text-delta':
          send({ type: 'text-delta', text: part.text });
          break;
        case 'reasoning-delta':
          send({ type: 'reasoning-delta', text: part.text });
          break;
        case 'tool-call':
          send({ type: 'tool-call', toolCallId: part.toolCallId, toolName: part.toolName, input: part.input });
          break;
        case 'tool-result':
          send({ type: 'tool-result', toolCallId: part.toolCallId, toolName: part.toolName, output: part.output });
          break;
        case 'tool-error':
          send({ type: 'tool-error', toolCallId: part.toolCallId, toolName: part.toolName, error: part.error?.message || String(part.error) });
          break;
        case 'error':
          send({ type: 'error', message: part.error?.message || String(part.error) });
          break;
        default:
          break;
      }
    }

    send({ type: 'done' });
  } catch (error) {
    console.error('Portfolio chat error:', error);
    if (!aborted) send({ type: 'error', message: error.message || 'Agent request failed' });
  } finally {
    cleanup();
    res.end();
  }
});

/**
 * @swagger
 * /api/ai/post-links:
 *   post:
 *     summary: Find and create links between similar posts
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
 *               - projectId
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Post links generated and created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 links:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Link generation failed
 */
router.post('/post-links', [
  body('projectId').isUUID().withMessage('Valid project ID is required')
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

    const { projectId } = req.body;
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

    // Get all post text and curated metadata used by the similarity scorer.
    const posts = await prisma.content.findMany({
      where: {
        projectId: projectId,
        status: { not: 'REVISION' },
        revisionOf: null
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        contentType: true,
        linkedSkills: {
          select: {
            name: true,
            category: true
          }
        },
        tags: {
          select: {
            name: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (posts.length < 2) {
      return res.status(400).json({
        error: 'Insufficient Posts',
        message: 'You need at least 2 posts to generate links'
      });
    }

    // Keep this legacy URL compatible while using the deterministic scorer.
    const result = { links: findSimilarPostPairs(posts) };

    // Create links in database
    const createdLinks = [];
    const skippedLinks = [];

    for (const link of result.links) {
      try {
        // Check if link already exists
        const existingLink = await prisma.contentLink.findFirst({
          where: {
            OR: [
              {
                sourceId: link.sourceId,
                targetId: link.targetId,
                linkType: link.linkType
              },
              {
                sourceId: link.targetId,
                targetId: link.sourceId,
                linkType: link.linkType
              }
            ]
          }
        });

        if (existingLink) {
          skippedLinks.push({
            ...link,
            reason: 'Link already exists'
          });
          continue;
        }

        // Verify both posts exist
        const sourcePost = await prisma.content.findUnique({
          where: { id: link.sourceId },
          select: { id: true }
        });
        const targetPost = await prisma.content.findUnique({
          where: { id: link.targetId },
          select: { id: true }
        });

        if (!sourcePost || !targetPost) {
          skippedLinks.push({
            ...link,
            reason: 'One or both posts not found'
          });
          continue;
        }

        // Create the link
        const newLink = await prisma.contentLink.create({
          data: {
            sourceId: link.sourceId,
            targetId: link.targetId,
            sourceType: 'content',
            targetType: 'content',
            linkType: link.linkType
          }
        });

        createdLinks.push(newLink);
      } catch (error) {
        console.error(`Error creating link ${link.sourceId} -> ${link.targetId}:`, error);
        skippedLinks.push({
          ...link,
          reason: error.message
        });
      }
    }

    // Clear project cache
    await cache.del(`project:${projectId}`);
    await cache.del(`project:${projectId}:content`);

    res.json({
      success: true,
      created: createdLinks.length,
      skipped: skippedLinks.length,
      links: createdLinks,
      skipped: skippedLinks
    });
  } catch (error) {
    console.error('Post links generation error:', error);
    res.status(500).json({
      error: 'Link Generation Failed',
      message: error.message || 'Unable to generate post links'
    });
  }
});

/**
 * @swagger
 * /api/ai/resume-chatbot/session:
 *   post:
 *     summary: Resume and job application chatbot session
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Resume file (PDF, DOC, DOCX, or TXT)
 *               jobPosting:
 *                 type: string
 *                 description: Job posting text
 *               chatHistory:
 *                 type: string
 *                 description: JSON string of chat history
 *     responses:
 *       200:
 *         description: Chatbot response
 */
router.post('/resume-chatbot/session',
  authenticateToken,
  upload.single('resume'),
  [
    body('chatHistory').optional().isString(),
    body('jobPosting').optional().isString(),
    body('sessionId').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      let resumeText = null;
      let chatHistory = [];
      let jobPosting = req.body.jobPosting || '';
      const sessionId = req.body.sessionId;

      // Extract resume text if file uploaded
      if (req.file) {
        try {
          console.log('Processing resume file:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            bufferLength: req.file.buffer?.length
          });
          
          resumeText = await extractResumeText(req.file);
          
          if (!resumeText || resumeText.trim().length === 0) {
            return res.status(400).json({
              error: 'Resume Processing Error',
              message: 'The resume file appears to be empty or contains no extractable text. If this is a scanned PDF, please use a text-based PDF or convert it to text first.'
            });
          }
          
          console.log('Successfully extracted resume text, length:', resumeText.length);
        } catch (error) {
          console.error('Resume extraction error:', {
            error: error.message,
            stack: error.stack,
            fileName: req.file?.originalname,
            mimeType: req.file?.mimetype
          });
          
          return res.status(400).json({
            error: 'Resume Processing Error',
            message: error.message || 'Failed to process resume file. Please ensure the file is a valid PDF, DOC, DOCX, or TXT file and is not corrupted or encrypted.'
          });
        }
      }

      // Parse chat history if provided
      if (req.body.chatHistory) {
        try {
          chatHistory = JSON.parse(req.body.chatHistory);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid Chat History',
            message: 'Chat history must be valid JSON'
          });
        }
      }

      // Load or create session
      let session = null;
      if (sessionId) {
        session = await prisma.resumeChatSession.findFirst({
          where: {
            id: sessionId,
            userId
          }
        });
        if (session) {
          // Use existing session data if not provided in request
          if (!resumeText && session.resumeText) resumeText = session.resumeText;
          if (!jobPosting && session.jobPosting) jobPosting = session.jobPosting;
        }
      }

      // Get comprehensive context for resume chatbot (all user content across all projects)
      const context = await getResumeChatbotContext(userId);
      const resumeSessionKey = sessionId || `resume-chat:${userId}`;

      // Call resume chatbot handler
      const result = await geminiService.handleResumeChatbotSession(
        resumeText,
        jobPosting,
        chatHistory,
        userId,
        context,
        { sessionKey: resumeSessionKey }
      );

      // Handle toolcall: create a saved resume document for the agentic LaTeX editor (no extra AI)
      if (result.toolcall === 'create_resume_document' && result.resume) {
        try {
          const {
            name,
            jobDescription: jdFromTool = '',
            resumeContent
          } = result.resume;

          const effectiveJobDescription = jdFromTool || jobPosting || '';

          if (!name || !resumeContent) {
            return res.status(400).json({
              error: 'Invalid Resume Draft',
              message: 'The AI tool call did not provide all required resume fields (name, resumeContent).'
            });
          }

          const document = await prisma.resumeDocument.create({
            data: {
              userId,
              name,
              content: resumeContent,
              jobDescription: effectiveJobDescription || null
            }
          });

          // Save updated chat history including the assistant message
          const finalChatHistory = [
            ...chatHistory,
            { role: 'assistant', content: result.message || '' }
          ];
          const savedSession = await saveChatSession(
            userId,
            sessionId,
            finalChatHistory,
            resumeText,
            req.file?.originalname,
            jobPosting
          );

          return res.json({
            ...result,
            createdResumeId: document.id,
            createdResume: document,
            sessionId: savedSession?.id || sessionId || null
          });
        } catch (error) {
          console.error('Error creating resume document from toolcall:', error);
          return res.status(500).json({
            error: 'Resume Draft Creation Failed',
            message: error.message || 'Unable to create resume draft from chatbot toolcall'
          });
        }
      }

      // Handle toolcall (post fetch) - same as regular AI session
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
            const updatedChatHistory = [
              ...chatHistory,
              { role: 'assistant', content: result.message || `Fetching "${post.title}"...` },
              { role: 'user', content: `Here is the full content of the post "${post.title}":\n\n${post.content}` }
            ];

            // Continue the session with the fetched post included
            const continuedResult = await geminiService.handleResumeChatbotSession(
              resumeText,
              jobPosting,
              updatedChatHistory,
              userId,
              context,
              { sessionKey: resumeSessionKey }
            );

            // Save updated chat history
            const finalChatHistory = [
              ...updatedChatHistory,
              { role: 'assistant', content: continuedResult.message || '' }
            ];
            await saveChatSession(userId, sessionId, finalChatHistory, resumeText, req.file?.originalname, jobPosting);

            return res.json({
              ...continuedResult,
              sessionId: session?.id || (await prisma.resumeChatSession.findFirst({
                where: { userId },
                orderBy: { updatedAt: 'desc' }
              }))?.id
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

      // Save chat history after getting response
      const finalChatHistory = [
        ...chatHistory,
        { role: 'assistant', content: result.message || '' }
      ];
      const savedSession = await saveChatSession(userId, sessionId, finalChatHistory, resumeText, req.file?.originalname, jobPosting);

      res.json({
        ...result,
        sessionId: savedSession.id
      });
    } catch (error) {
      console.error('Resume chatbot session error:', error);
      res.status(500).json({
        error: 'Session Failed',
        message: error.message || 'Unable to process resume chatbot session'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/resume-chatbot/sessions:
 *   get:
 *     summary: Get all resume chat sessions for the current user
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat sessions
 */
router.get('/resume-chatbot/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const sessions = await prisma.resumeChatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        resumeFileName: true,
        jobPosting: true,
        chatHistory: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Transform to include message count
    const sessionsWithCount = sessions.map(session => ({
      id: session.id,
      title: session.title,
      resumeFileName: session.resumeFileName,
      hasJobPosting: !!session.jobPosting,
      messageCount: Array.isArray(session.chatHistory) ? session.chatHistory.length : 0,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));

    res.json({ sessions: sessionsWithCount });
  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      error: 'Failed to fetch sessions',
      message: error.message || 'Unable to retrieve chat sessions'
    });
  }
});

/**
 * @swagger
 * /api/ai/resume-chatbot/sessions/{id}:
 *   get:
 *     summary: Get a specific resume chat session
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat session details
 *       404:
 *         description: Session not found
 */
router.get('/resume-chatbot/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const session = await prisma.resumeChatSession.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session Not Found',
        message: 'The requested chat session does not exist'
      });
    }

    res.json({
      id: session.id,
      title: session.title,
      chatHistory: session.chatHistory,
      resumeText: session.resumeText,
      resumeFileName: session.resumeFileName,
      jobPosting: session.jobPosting,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      error: 'Failed to fetch session',
      message: error.message || 'Unable to retrieve chat session'
    });
  }
});

/**
 * @swagger
 * /api/ai/resume-chatbot/sessions:
 *   post:
 *     summary: Create a new resume chat session
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               resumeText:
 *                 type: string
 *               resumeFileName:
 *                 type: string
 *               jobPosting:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session created
 */
router.post('/resume-chatbot/sessions',
  authenticateToken,
  [
    body('title').optional().isString().trim(),
    body('resumeText').optional().isString(),
    body('resumeFileName').optional().isString(),
    body('jobPosting').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      const { title, resumeText, resumeFileName, jobPosting } = req.body;

      const session = await prisma.resumeChatSession.create({
        data: {
          userId,
          title: title || 'New Chat',
          chatHistory: [],
          resumeText: resumeText || null,
          resumeFileName: resumeFileName || null,
          jobPosting: jobPosting || null
        }
      });

      res.status(201).json({
        id: session.id,
        title: session.title,
        chatHistory: session.chatHistory,
        resumeText: session.resumeText,
        resumeFileName: session.resumeFileName,
        jobPosting: session.jobPosting,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      });
    } catch (error) {
      console.error('Create chat session error:', error);
      res.status(500).json({
        error: 'Failed to create session',
        message: error.message || 'Unable to create chat session'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/resume-chatbot/sessions/{id}:
 *   put:
 *     summary: Update a resume chat session
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               chatHistory:
 *                 type: array
 *               resumeText:
 *                 type: string
 *               resumeFileName:
 *                 type: string
 *               jobPosting:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session updated
 *       404:
 *         description: Session not found
 */
router.put('/resume-chatbot/sessions/:id',
  authenticateToken,
  [
    body('title').optional().isString().trim(),
    body('chatHistory').optional().isArray(),
    body('resumeText').optional().isString(),
    body('resumeFileName').optional().isString(),
    body('jobPosting').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      const { id } = req.params;
      const { title, chatHistory, resumeText, resumeFileName, jobPosting } = req.body;

      // Check if session exists and belongs to user
      const existingSession = await prisma.resumeChatSession.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingSession) {
        return res.status(404).json({
          error: 'Session Not Found',
          message: 'The requested chat session does not exist'
        });
      }

      // Build update data
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (chatHistory !== undefined) updateData.chatHistory = chatHistory;
      if (resumeText !== undefined) updateData.resumeText = resumeText;
      if (resumeFileName !== undefined) updateData.resumeFileName = resumeFileName;
      if (jobPosting !== undefined) updateData.jobPosting = jobPosting;

      const session = await prisma.resumeChatSession.update({
        where: { id },
        data: updateData
      });

      res.json({
        id: session.id,
        title: session.title,
        chatHistory: session.chatHistory,
        resumeText: session.resumeText,
        resumeFileName: session.resumeFileName,
        jobPosting: session.jobPosting,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      });
    } catch (error) {
      console.error('Update chat session error:', error);
      res.status(500).json({
        error: 'Failed to update session',
        message: error.message || 'Unable to update chat session'
      });
    }
  }
);

/**
 * @swagger
 * /api/ai/resume-chatbot/sessions/{id}:
 *   delete:
 *     summary: Delete a resume chat session
 *     tags: [AI Content Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session deleted
 *       404:
 *         description: Session not found
 */
router.delete('/resume-chatbot/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const session = await prisma.resumeChatSession.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session Not Found',
        message: 'The requested chat session does not exist'
      });
    }

    await prisma.resumeChatSession.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({
      error: 'Failed to delete session',
      message: error.message || 'Unable to delete chat session'
    });
  }
});

/**
 * @swagger
 * /api/ai/social-posts:
 *   post:
 *     summary: Generate social media post (LinkedIn or X) for content
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
 *               - contentId
 *               - projectId
 *               - platform
 *             properties:
 *               contentId:
 *                 type: string
 *                 format: uuid
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               platform:
 *                 type: string
 *                 enum: [linkedin, x]
 *                 description: Platform to generate post for
 *     responses:
 *       200:
 *         description: Social post generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   type: string
 *                 platform:
 *                   type: string
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Generation failed
 */
router.post('/social-posts', [
  authenticateToken,
  authorizeProjectAccess('VIEWER'),
  body('contentId').isUUID().withMessage('Valid content ID is required'),
  body('projectId').isUUID().withMessage('Valid project ID is required'),
  body('platform').isIn(['linkedin', 'x']).withMessage('Platform must be either "linkedin" or "x"')
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

    const { contentId, projectId, platform } = req.body;
    const userId = req.user?.id;

    // Verify user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: {
        id: true,
        subdomain: true
      }
    });

    if (!project) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have access to this project'
      });
    }

    // Fetch content with all necessary data including tags and skills
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        projectId: projectId
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        type: true,
        projectLinks: true,
        tags: {
          select: {
            name: true
          }
        },
        linkedSkills: {
          select: {
            name: true
          }
        }
      }
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content does not exist'
      });
    }

    // Generate social post for selected platform
    const result = await geminiService.generateSocialPost(content, project, platform);

    res.json(result);
  } catch (error) {
    console.error('Social post generation error:', error);
    res.status(500).json({
      error: 'Social Post Generation Failed',
      message: error.message || 'Unable to generate social post'
    });
  }
});

module.exports = router;
