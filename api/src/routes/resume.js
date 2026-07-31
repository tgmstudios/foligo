const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { prisma } = require('../services/core/database');
const ai = require('../services/ai/manager');
const latexCompiler = require('../services/goapply/latex-compiler');
const { createResumeEditorTools } = require('../services/goapply/resume-editor-tools');
const { createGithubTools } = require('../services/github/github-tools');
const githubService = require('../services/github/github-service');
const { fetchPortfolioItem, getPortfolioContext } = require('../services/goapply/portfolio-context');
const { prepareAttachments, buildModelMessage } = require('../services/goapply/ai-attachment-text');
const { setupSSE } = require('../utils/sse');

const router = express.Router();

const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

const PDF_STORAGE_DIR = path.join(__dirname, '../../generated/resumes');
const STARTER_TEMPLATE_PATH = path.join(__dirname, '../assets/starter-resume.tex');

async function getStarterContent() {
  return fs.readFile(STARTER_TEMPLATE_PATH, 'utf8');
}

async function ensurePdfDir() {
  await fs.mkdir(PDF_STORAGE_DIR, { recursive: true });
}

function buildSystemPrompt({ content, jobDescription, portfolioContext, otherDocuments }) {
  let portfolioSection = 'No portfolio content available.';
  if (portfolioContext.length > 0) {
    portfolioSection = 'AVAILABLE PORTFOLIO CONTENT (use fetch_portfolio_item for full details):\n' +
      portfolioContext.map((p) => `- [ID: ${p.id}] ${p.title || 'Untitled'} (${p.contentType})${p.excerpt ? `: ${p.excerpt}` : ''}`).join('\n');
  }

  let otherDocumentsSection = 'No other resume documents available.';
  if (otherDocuments.length > 0) {
    otherDocumentsSection = 'OTHER RESUME DOCUMENTS (use fetch_resume_document for the full LaTeX source):\n' +
      otherDocuments.map((d) => `- [ID: ${d.id}] ${d.name}${d.linkedJob ? ` (tailored for ${d.linkedJob.position} @ ${d.linkedJob.company})` : ''}`).join('\n');
  }

  return `You are an expert resume writer and LaTeX editor, working inside an agentic resume editor. You collaborate with the user to write and refine a LaTeX resume in real time.

CURRENT DOCUMENT (LaTeX source):
"""
${content}
"""

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n` : 'No target job description provided yet.'}

${portfolioSection}

${otherDocumentsSection}

RULES:
- Use the edit_resume_section tool for small, targeted changes (wording, a bullet, a date, a section tweak). The "search" text must match the current document verbatim and uniquely.
- Use the write_resume tool only for the first draft or large restructures — it replaces the whole document, so always output a complete, valid, compilable .tex file.
- Use fetch_portfolio_item when you need more detail about a specific project/experience than its excerpt gives you.
- Use fetch_resume_document when the user asks to reuse, reference, or pull in content/formatting from another one of their resumes — it only reads that other document, it never edits the current one.
- The github_* tools (github_list_repos, github_browse_files, github_read_file, github_search_code) read the user's connected GitHub repositories — use them ONLY to gather real facts about the user's projects for resume bullets, starting with github_list_repos. They never operate on the resume itself.
- Use web_search / pull_page only for public-web research (company facts, terminology, LaTeX package docs).
- The CURRENT DOCUMENT above is always the up-to-date resume — it is your only source for existing resume text. NEVER call github_search_code, web_search, or any other lookup tool to find text in the current document; copy the "search" text for edit_resume_section directly from the document shown above.
- After making edits, briefly tell the user what you changed and why, in plain prose (not LaTeX).
- Keep the document compiling: balance braces/environments, don't invent LaTeX packages that aren't already \\usepackage'd unless you add the \\usepackage line too.`;
}

/**
 * @swagger
 * /api/resume/documents:
 *   get:
 *     summary: List the current user's resume documents (history)
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/documents', async (req, res) => {
  try {
    const documents = await prisma.resumeDocument.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, jobDescription: true, linkedJobId: true,
        linkedJob: { select: { id: true, company: true, position: true, category: true } },
        isTemplate: true, isDefault: true, createdAt: true, updatedAt: true,
      },
    });
    res.json(documents);
  } catch (error) {
    console.error('List resume documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}:
 *   get:
 *     summary: Get a resume document (full content + chat history)
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/documents/:id', async (req, res) => {
  try {
    const document = await prisma.resumeDocument.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!document) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume document does not exist' });
    }
    res.json(document);
  } catch (error) {
    console.error('Get resume document error:', error);
    res.status(500).json({ error: 'Failed to fetch document', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents:
 *   post:
 *     summary: Create a new resume document
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/documents', [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('content').optional().isString(),
  body('jobDescription').optional().isString(),
  body('linkedJobId').optional({ nullable: true }).isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: errors.array() });
    }

    // Same ownership gate as PATCH /documents/:id — a résumé created for a job
    // (e.g. straight from the browser extension) can be linked in one call.
    if (req.body.linkedJobId) {
      const job = await prisma.jobApplication.findFirst({ where: { id: req.body.linkedJobId, userId: req.user.id } });
      if (!job) {
        return res.status(400).json({ error: 'Validation Error', message: 'linkedJobId does not refer to one of your tracked jobs' });
      }
    }

    const defaultDocument = req.body.content === undefined
      ? await prisma.resumeDocument.findFirst({ where: { userId: req.user.id, isDefault: true } })
      : null;
    const content = req.body.content ?? defaultDocument?.content ?? await getStarterContent();
    const document = await prisma.resumeDocument.create({
      data: {
        userId: req.user.id,
        name: req.body.name || 'Untitled Resume',
        content,
        jobDescription: req.body.jobDescription || null,
        linkedJobId: req.body.linkedJobId || null,
        chatHistory: [],
      },
    });
    res.json(document);
  } catch (error) {
    console.error('Create resume document error:', error);
    res.status(500).json({ error: 'Failed to create document', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}:
 *   patch:
 *     summary: Rename and/or manually update a resume document's content
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/documents/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('content').optional().isString(),
  body('jobDescription').optional({ nullable: true }).isString(),
  body('linkedJobId').optional({ nullable: true }).isString(),
  body('isTemplate').optional().isBoolean(),
  body('isDefault').optional().isBoolean(),
  body('kind').optional().isIn(['autosave', 'manual']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: errors.array() });
    }

    const existing = await prisma.resumeDocument.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume document does not exist' });
    }

    if (req.body.linkedJobId) {
      const job = await prisma.jobApplication.findFirst({ where: { id: req.body.linkedJobId, userId: req.user.id } });
      if (!job) {
        return res.status(400).json({ error: 'Validation Error', message: 'linkedJobId does not refer to one of your tracked jobs' });
      }
    }

    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.content !== undefined) data.content = req.body.content;
    if (req.body.jobDescription !== undefined) data.jobDescription = req.body.jobDescription;
    if (req.body.linkedJobId !== undefined) data.linkedJobId = req.body.linkedJobId;
    if (req.body.isTemplate !== undefined) data.isTemplate = req.body.isTemplate;
    if (req.body.isDefault !== undefined) {
      data.isDefault = req.body.isDefault;
      if (req.body.isDefault) data.isTemplate = true;
    }
    if (req.body.isTemplate === false) data.isDefault = false;

    // Manual saves (the default, for backward compatibility with callers that
    // don't pass `kind`) snapshot the pre-update content as a revision before
    // writing — autosave ticks deliberately skip this so the revision list
    // only fills up with meaningful checkpoints, not every debounce tick.
    const kind = req.body.kind || 'manual';
    let revisionId;
    let document;
    if (req.body.isDefault === true) {
      [, document] = await prisma.$transaction([
        prisma.resumeDocument.updateMany({
          where: { userId: req.user.id, isDefault: true, id: { not: existing.id } },
          data: { isDefault: false },
        }),
        prisma.resumeDocument.update({ where: { id: req.params.id }, data }),
      ]);
    } else if (kind === 'manual' && req.body.content !== undefined) {
      [{ id: revisionId }, document] = await prisma.$transaction([
        prisma.resumeDocumentRevision.create({
          data: { documentId: existing.id, content: existing.content, jobDescription: existing.jobDescription },
          select: { id: true },
        }),
        prisma.resumeDocument.update({ where: { id: req.params.id }, data }),
      ]);
    } else {
      document = await prisma.resumeDocument.update({ where: { id: req.params.id }, data });
    }

    res.json({ ...document, revisionId });
  } catch (error) {
    console.error('Update resume document error:', error);
    res.status(500).json({ error: 'Failed to update document', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}/clone:
 *   post:
 *     summary: Duplicate a resume document (content + job description, fresh chat history)
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/documents/:id/clone', async (req, res) => {
  try {
    const source = await prisma.resumeDocument.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!source) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume document does not exist' });
    }

    const clone = await prisma.resumeDocument.create({
      data: {
        userId: req.user.id,
        name: `${source.name} (copy)`,
        content: source.content,
        jobDescription: source.jobDescription,
        chatHistory: [],
      },
    });
    res.json(clone);
  } catch (error) {
    console.error('Clone resume document error:', error);
    res.status(500).json({ error: 'Failed to clone document', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}:
 *   delete:
 *     summary: Delete a resume document
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/documents/:id', async (req, res) => {
  try {
    const existing = await prisma.resumeDocument.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume document does not exist' });
    }

    if (existing.pdfPath) {
      await fs.unlink(existing.pdfPath).catch(() => {});
    }
    await prisma.resumeDocument.delete({ where: { id: req.params.id } });
    githubService.cleanupSession(req.user.id, `resume-doc:${req.params.id}`).catch(() => {});
    res.status(204).send();
  } catch (error) {
    console.error('Delete resume document error:', error);
    res.status(500).json({ error: 'Failed to delete document', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}/compile:
 *   post:
 *     summary: Compile a resume document's LaTeX content to PDF
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/documents/:id/compile', async (req, res) => {
  try {
    const document = await prisma.resumeDocument.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!document) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume document does not exist' });
    }

    const result = await latexCompiler.compile(document.content);
    if (result.error) {
      return res.status(422).json({
        error: 'Compilation Failed',
        message: result.error,
        log: result.log,
        errors: result.errors || [],
      });
    }

    await ensurePdfDir();
    const pdfPath = path.join(PDF_STORAGE_DIR, `${document.id}.pdf`);
    await fs.writeFile(pdfPath, result.pdf);
    await prisma.resumeDocument.update({ where: { id: document.id }, data: { pdfPath } });

    res.setHeader('Content-Type', 'application/pdf');
    res.send(result.pdf);
  } catch (error) {
    console.error('Compile resume document error:', error);
    res.status(500).json({ error: 'Compilation Failed', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}/pdf:
 *   get:
 *     summary: Get the last compiled PDF for a resume document
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/documents/:id/pdf', async (req, res) => {
  try {
    const document = await prisma.resumeDocument.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!document || !document.pdfPath) {
      return res.status(404).json({ error: 'Not Found', message: 'No compiled PDF for this document yet' });
    }
    // Check if file still exists on disk (cleared on restart)
    try {
      await fs.access(document.pdfPath);
    } catch {
      // File gone — clear stale path and return 404
      await prisma.resumeDocument.update({ where: { id: document.id }, data: { pdfPath: null } }).catch(() => {});
      return res.status(404).json({ error: 'Not Found', message: 'PDF was cleared by server restart. Please recompile.' });
    }
    const pdf = await fs.readFile(document.pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (error) {
    console.error('Get resume PDF error:', error);
    res.status(500).json({ error: 'Failed to fetch PDF', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}/chat:
 *   post:
 *     summary: Send a message to the resume editing agent (SSE stream of thinking/text/tool-call events)
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/documents/:id/chat', chatUpload.array('attachments', 5), (req, res, next) => {
  // Attachments arrive as multipart/form-data, where every field (including
  // the JSON-encoded history array) is transmitted as a plain string.
  if (typeof req.body.history === 'string') {
    try { req.body.history = JSON.parse(req.body.history); } catch { req.body.history = []; }
  }
  next();
}, [
  body('message').trim().custom((value, { req }) => {
    if (!value && !(req.files && req.files.length)) throw new Error('A message or attachment is required');
    return true;
  }),
  body('provider').optional().isString(),
  body('history').optional().isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: errors.array() });
  }

  const userId = req.user.id;
  const document = await prisma.resumeDocument.findFirst({ where: { id: req.params.id, userId } });
  if (!document) {
    return res.status(404).json({ error: 'Not Found', message: 'Resume document does not exist' });
  }

  let attachments;
  try {
    attachments = await prepareAttachments(req.files);
  } catch (error) {
    return res.status(400).json({ error: 'Attachment Error', message: error.message });
  }

  const { send, aborted, cleanup } = setupSSE(req, res);

  const userMessage = req.body.message;
  const modelMessage = buildModelMessage(userMessage, attachments);
  // Prefer the client-selected session history when supplied. Falling back to
  // the document column keeps older clients and existing conversations working.
  const priorHistory = Array.isArray(req.body.history)
    ? req.body.history
    : (Array.isArray(document.chatHistory) ? document.chatHistory : []);
  const messages = [
    ...priorHistory.map((m) => ({ role: m.role, content: m.modelContent || m.content })),
    { role: 'user', content: modelMessage },
  ];

  const doc = { content: document.content };
  const tools = {
    ...createResumeEditorTools(
      doc,
      (postId) => fetchPortfolioItem(userId, postId),
      (documentId) => prisma.resumeDocument.findFirst({ where: { id: documentId, userId } }),
    ),
    ...createGithubTools({ userId, sessionKey: `resume-doc:${document.id}` }),
  };

  let assistantText = '';

  try {
    const [portfolioContext, otherDocuments] = await Promise.all([
      getPortfolioContext(userId),
      prisma.resumeDocument.findMany({
        where: { userId, id: { not: document.id } },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, name: true,
          linkedJob: { select: { company: true, position: true } },
        },
      }),
    ]);
    const systemInstruction = buildSystemPrompt({
      content: doc.content,
      jobDescription: document.jobDescription,
      portfolioContext,
      otherDocuments,
    });

    for await (const part of ai.streamChat(messages, { systemInstruction, tools, maxSteps: 40, provider: req.body.provider })) {
      switch (part.type) {
        case 'text-delta':
          assistantText += part.text;
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
          break; // start/finish/step markers etc. — not needed by the client
      }
    }

    // Persist the (possibly tool-edited) content + updated chat history.
    const finalChatHistory = [
      ...priorHistory,
      {
        role: 'user',
        content: userMessage || 'Please review the attached file(s).',
        modelContent: modelMessage,
        attachments: attachments.map(({ name, type, size }) => ({ name, type, size })),
      },
      { role: 'assistant', content: assistantText },
    ];

    // The agent may have rewritten the document via a tool call — snapshot the
    // pre-turn content as a revision (same as a manual save) before persisting,
    // so an unwanted agent rewrite is undoable from the History popup.
    if (doc.content !== document.content) {
      await prisma.resumeDocumentRevision.create({
        data: { documentId: document.id, content: document.content, jobDescription: document.jobDescription },
      });
    }

    await prisma.resumeDocument.update({
      where: { id: document.id },
      data: { content: doc.content, chatHistory: finalChatHistory },
    });

    send({ type: 'document-updated', content: doc.content });

    // Auto-compile once the agent is done, so the preview stays in sync.
    const compileResult = await latexCompiler.compile(doc.content);
    if (compileResult.error) {
      send({ type: 'compile-error', message: compileResult.error, log: compileResult.log });
    } else {
      await ensurePdfDir();
      const pdfPath = path.join(PDF_STORAGE_DIR, `${document.id}.pdf`);
      await fs.writeFile(pdfPath, compileResult.pdf);
      await prisma.resumeDocument.update({ where: { id: document.id }, data: { pdfPath } });
      send({ type: 'compiled', pdfUrl: `/resume/documents/${document.id}/pdf` });
    }

    send({ type: 'done' });
  } catch (error) {
    console.error('Resume chat error:', error);
    if (!aborted) {
      send({ type: 'error', message: error.message || 'Agent request failed' });
    }
  } finally {
    cleanup();
    res.end();
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}/revisions:
 *   get:
 *     summary: List revision snapshots for a resume document (lightweight, no content)
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/documents/:id/revisions', async (req, res) => {
  try {
    const document = await prisma.resumeDocument.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!document) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume document does not exist' });
    }
    const revisions = await prisma.resumeDocumentRevision.findMany({
      where: { documentId: document.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
    res.json(revisions);
  } catch (error) {
    console.error('List resume revisions error:', error);
    res.status(500).json({ error: 'Failed to fetch revisions', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}/revisions/{revisionId}:
 *   get:
 *     summary: Get a single revision's full content
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/documents/:id/revisions/:revisionId', async (req, res) => {
  try {
    const document = await prisma.resumeDocument.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!document) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume document does not exist' });
    }
    const revision = await prisma.resumeDocumentRevision.findFirst({
      where: { id: req.params.revisionId, documentId: document.id },
    });
    if (!revision) {
      return res.status(404).json({ error: 'Not Found', message: 'Revision does not exist' });
    }
    res.json(revision);
  } catch (error) {
    console.error('Get resume revision error:', error);
    res.status(500).json({ error: 'Failed to fetch revision', message: error.message });
  }
});

/**
 * @swagger
 * /api/resume/documents/{id}/revisions/{revisionId}/restore:
 *   post:
 *     summary: Restore a resume document to a past revision (snapshots the current state first, so this is itself undoable)
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/documents/:id/revisions/:revisionId/restore', async (req, res) => {
  try {
    const document = await prisma.resumeDocument.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!document) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume document does not exist' });
    }
    const revision = await prisma.resumeDocumentRevision.findFirst({
      where: { id: req.params.revisionId, documentId: document.id },
    });
    if (!revision) {
      return res.status(404).json({ error: 'Not Found', message: 'Revision does not exist' });
    }

    const [, updated] = await prisma.$transaction([
      prisma.resumeDocumentRevision.create({
        data: { documentId: document.id, content: document.content, jobDescription: document.jobDescription },
      }),
      prisma.resumeDocument.update({
        where: { id: document.id },
        data: { content: revision.content, jobDescription: revision.jobDescription },
      }),
    ]);

    res.json(updated);
  } catch (error) {
    console.error('Restore resume revision error:', error);
    res.status(500).json({ error: 'Failed to restore revision', message: error.message });
  }
});

module.exports = router;
