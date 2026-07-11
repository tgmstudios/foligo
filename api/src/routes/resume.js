const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const { prisma } = require('../services/database');
const ai = require('../services/ai/manager');
const latexCompiler = require('../services/latex-compiler');
const { createResumeEditorTools } = require('../services/resume-editor-tools');

const router = express.Router();

const PDF_STORAGE_DIR = path.join(__dirname, '../../generated/resumes');
const STARTER_TEMPLATE_PATH = path.join(__dirname, '../assets/starter-resume.tex');

async function getStarterContent() {
  return fs.readFile(STARTER_TEMPLATE_PATH, 'utf8');
}

async function ensurePdfDir() {
  await fs.mkdir(PDF_STORAGE_DIR, { recursive: true });
}

/** Fetch a portfolio content item, scoped to the requesting user, for the fetch_portfolio_item tool. */
async function fetchPortfolioItem(userId, postId) {
  const post = await prisma.content.findFirst({
    where: {
      id: postId,
      project: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    },
    select: { id: true, title: true, contentType: true, content: true, excerpt: true },
  });
  return post;
}

/** Titles/excerpts of all the user's portfolio content, for grounding the agent's context. */
async function getPortfolioContext(userId) {
  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);
  if (projectIds.length === 0) return [];

  return prisma.content.findMany({
    where: {
      projectId: { in: projectIds },
      status: { not: 'REVISION' },
      revisionOf: null,
      contentType: { not: 'SKILL' },
    },
    select: { id: true, title: true, excerpt: true, contentType: true },
    orderBy: { createdAt: 'desc' },
  });
}

function buildSystemPrompt({ content, jobDescription, portfolioContext }) {
  let portfolioSection = 'No portfolio content available.';
  if (portfolioContext.length > 0) {
    portfolioSection = 'AVAILABLE PORTFOLIO CONTENT (use fetch_portfolio_item for full details):\n' +
      portfolioContext.map((p) => `- [ID: ${p.id}] ${p.title || 'Untitled'} (${p.contentType})${p.excerpt ? `: ${p.excerpt}` : ''}`).join('\n');
  }

  return `You are an expert resume writer and LaTeX editor, working inside an agentic resume editor. You collaborate with the user to write and refine a LaTeX resume in real time.

CURRENT DOCUMENT (LaTeX source):
"""
${content}
"""

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n` : 'No target job description provided yet.'}

${portfolioSection}

RULES:
- Use the edit_resume_section tool for small, targeted changes (wording, a bullet, a date, a section tweak). The "search" text must match the current document verbatim and uniquely.
- Use the write_resume tool only for the first draft or large restructures — it replaces the whole document, so always output a complete, valid, compilable .tex file.
- Use fetch_portfolio_item when you need more detail about a specific project/experience than its excerpt gives you.
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
      select: { id: true, name: true, jobDescription: true, createdAt: true, updatedAt: true },
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
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: errors.array() });
    }

    const content = req.body.content || await getStarterContent();
    const document = await prisma.resumeDocument.create({
      data: {
        userId: req.user.id,
        name: req.body.name || 'Untitled Resume',
        content,
        jobDescription: req.body.jobDescription || null,
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

    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.content !== undefined) data.content = req.body.content;
    if (req.body.jobDescription !== undefined) data.jobDescription = req.body.jobDescription;

    const document = await prisma.resumeDocument.update({ where: { id: req.params.id }, data });
    res.json(document);
  } catch (error) {
    console.error('Update resume document error:', error);
    res.status(500).json({ error: 'Failed to update document', message: error.message });
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
      return res.status(422).json({ error: 'Compilation Failed', message: result.error, log: result.log });
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
router.post('/documents/:id/chat', [
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
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

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Tell any reverse proxy in front of this (nginx, etc.) not to buffer the
  // response — buffering would defeat the point of streaming by delivering
  // everything to the browser in one chunk at the end instead of incrementally.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const userMessage = req.body.message;
  const priorHistory = Array.isArray(document.chatHistory) ? document.chatHistory : [];
  const messages = [
    ...priorHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const doc = { content: document.content };
  const tools = createResumeEditorTools(doc, (postId) => fetchPortfolioItem(userId, postId));

  let assistantText = '';

  try {
    const portfolioContext = await getPortfolioContext(userId);
    const systemInstruction = buildSystemPrompt({
      content: doc.content,
      jobDescription: document.jobDescription,
      portfolioContext,
    });

    for await (const part of ai.streamChat(messages, { systemInstruction, tools, maxSteps: 6 })) {
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
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantText },
    ];

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
    send({ type: 'error', message: error.message || 'Agent request failed' });
  } finally {
    res.end();
  }
});

module.exports = router;
