const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { prisma } = require('../../services/core/database');
const ai = require('../../services/ai/manager');
const latexCompiler = require('../../services/goapply/latex-compiler');
const { createCoverLetterEditorTools } = require('../../services/goapply/cover-letter-editor-tools');
const { createGithubTools } = require('../../services/github/github-tools');
const githubService = require('../../services/github/github-service');
const { fetchPortfolioItem, getPortfolioContext } = require('../../services/goapply/portfolio-context');
const { prepareAttachments, buildModelMessage } = require('../../services/goapply/ai-attachment-text');
const { setupSSE } = require('../../utils/sse');

const router = express.Router();

const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

const COVER_LETTER_PDF_DIR = path.join(__dirname, '../../generated/cover-letters');
const COVER_LETTER_STARTER_PATH = path.join(__dirname, '../assets/starter-cover-letter.tex');

async function getStarterCoverLetterContent() {
  return fs.readFile(COVER_LETTER_STARTER_PATH, 'utf8');
}

async function ensureCoverLetterPdfDir() {
  await fs.mkdir(COVER_LETTER_PDF_DIR, { recursive: true });
}

function buildCoverLetterSystemPrompt({ content, job, portfolioContext }) {
  let portfolioSection = 'No portfolio content available.';
  if (portfolioContext.length > 0) {
    portfolioSection = 'AVAILABLE PORTFOLIO CONTENT (use fetch_portfolio_item for full details):\n' +
      portfolioContext.map((p) => `- [ID: ${p.id}] ${p.title || 'Untitled'} (${p.contentType})${p.excerpt ? `: ${p.excerpt}` : ''}`).join('\n');
  }

  return `You are an expert cover letter writer and LaTeX editor, working inside an agentic cover letter editor. You collaborate with the user to write and refine a LaTeX cover letter in real time.

CURRENT DOCUMENT (LaTeX source):
"""
${content}
"""

${job ? `TARGET JOB:\nCompany: ${job.company}\nPosition: ${job.position}\n${job.notes ? `Notes/job description: ${job.notes}\n` : ''}` : 'No linked job yet.'}

${portfolioSection}

RULES:
- Use the edit_cover_letter_section tool for small, targeted changes (wording, a paragraph, a detail). The "search" text must match the current document verbatim and uniquely.
- Use the write_cover_letter tool only for the first draft or large restructures — it replaces the whole document, so always output a complete, valid, compilable .tex file.
- Use fetch_portfolio_item when you need more detail about a specific project/experience than its excerpt gives you.
- After making edits, briefly tell the user what you changed and why, in plain prose (not LaTeX).
- Keep the document compiling: balance braces/environments, don't invent LaTeX packages that aren't already \\usepackage'd unless you add the \\usepackage line too.`;
}

// GET /api/goapply/cover-letters — list cover letters
router.get('/cover-letters', async (req, res) => {
  try {
    const userId = req.user.id;

    const letters = await prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { job: { select: { id: true, company: true, position: true, category: true } } }
    });

    res.json(letters);
  } catch (error) {
    console.error('List cover letters error:', error);
    res.status(500).json({
      error: 'Cover Letters Retrieval Failed',
      message: 'Unable to retrieve cover letters'
    });
  }
});

// GET /api/goapply/cover-letters/:id — load a letter in Studio
router.get('/cover-letters/:id', async (req, res) => {
  try {
    const letter = await prisma.coverLetter.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { job: { select: { id: true, company: true, position: true, category: true } } }
    });
    if (!letter) return res.status(404).json({ error: 'Cover Letter Not Found', message: 'Cover letter not found' });
    res.json(letter);
  } catch (error) {
    console.error('Get cover letter error:', error);
    res.status(500).json({ error: 'Cover Letter Retrieval Failed', message: 'Unable to retrieve cover letter' });
  }
});

// POST /api/goapply/cover-letters — create cover letter
router.post('/cover-letters', async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId, title, generatedBy } = req.body;
    let { content } = req.body;

    if (content === undefined) {
      const defaultLetter = await prisma.coverLetter.findFirst({ where: { userId, isDefault: true } });
      content = defaultLetter?.content || await getStarterCoverLetterContent();
    }

    if (!title || !content) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title and content are required'
      });
    }

    if (jobId) {
      const job = await prisma.jobApplication.findFirst({ where: { id: jobId, userId } });
      if (!job) return res.status(400).json({ error: 'Validation Error', message: 'Job does not belong to you' });
    }

    const letter = await prisma.coverLetter.create({
      data: {
        userId,
        jobId: jobId || null,
        title,
        content,
        generatedBy: generatedBy || null
      }
    });

    res.status(201).json(letter);
  } catch (error) {
    console.error('Create cover letter error:', error);
    res.status(500).json({
      error: 'Cover Letter Creation Failed',
      message: 'Unable to create cover letter'
    });
  }
});

// PATCH /api/goapply/cover-letters/:id — autosave or manually save Studio edits
router.patch('/cover-letters/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const existing = await prisma.coverLetter.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ error: 'Cover Letter Not Found', message: 'Cover letter not found' });

    const { title, content, jobId, isTemplate, isDefault, kind = 'manual' } = req.body;
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'Validation Error', message: 'Title cannot be empty' });
    }
    if (content !== undefined && typeof content !== 'string') {
      return res.status(400).json({ error: 'Validation Error', message: 'Content must be text' });
    }
    if (jobId) {
      const job = await prisma.jobApplication.findFirst({ where: { id: jobId, userId } });
      if (!job) return res.status(400).json({ error: 'Validation Error', message: 'Job does not belong to you' });
    }

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (content !== undefined) data.content = content;
    if (jobId !== undefined) data.jobId = jobId || null;
    if (isTemplate !== undefined) data.isTemplate = Boolean(isTemplate);
    if (isDefault !== undefined) {
      data.isDefault = Boolean(isDefault);
      if (isDefault) data.isTemplate = true;
    }
    if (isTemplate === false) data.isDefault = false;

    let revisionId;
    let letter;
    if (isDefault === true) {
      [, letter] = await prisma.$transaction([
        prisma.coverLetter.updateMany({ where: { userId, isDefault: true, id: { not: existing.id } }, data: { isDefault: false } }),
        prisma.coverLetter.update({ where: { id: existing.id }, data })
      ]);
    } else if (kind === 'manual' && content !== undefined) {
      [{ id: revisionId }, letter] = await prisma.$transaction([
        prisma.coverLetterRevision.create({ data: { coverLetterId: existing.id, content: existing.content }, select: { id: true } }),
        prisma.coverLetter.update({ where: { id: existing.id }, data })
      ]);
    } else {
      letter = await prisma.coverLetter.update({ where: { id: existing.id }, data });
    }
    res.json({ ...letter, revisionId });
  } catch (error) {
    console.error('Update cover letter error:', error);
    res.status(500).json({ error: 'Cover Letter Update Failed', message: 'Unable to update cover letter' });
  }
});

router.post('/cover-letters/:id/clone', async (req, res) => {
  try {
    const source = await prisma.coverLetter.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!source) return res.status(404).json({ error: 'Cover Letter Not Found', message: 'Cover letter not found' });
    const clone = await prisma.coverLetter.create({
      data: { userId: req.user.id, title: `${source.title} (copy)`, content: source.content, jobId: source.jobId }
    });
    res.status(201).json(clone);
  } catch (error) {
    console.error('Clone cover letter error:', error);
    res.status(500).json({ error: 'Cover Letter Clone Failed', message: 'Unable to clone cover letter' });
  }
});

router.get('/cover-letters/:id/revisions', async (req, res) => {
  const letter = await prisma.coverLetter.findFirst({ where: { id: req.params.id, userId: req.user.id }, select: { id: true } });
  if (!letter) return res.status(404).json({ error: 'Cover Letter Not Found', message: 'Cover letter not found' });
  const revisions = await prisma.coverLetterRevision.findMany({ where: { coverLetterId: letter.id }, orderBy: { createdAt: 'desc' }, select: { id: true, createdAt: true } });
  res.json(revisions);
});

router.get('/cover-letters/:id/revisions/:revisionId', async (req, res) => {
  const letter = await prisma.coverLetter.findFirst({ where: { id: req.params.id, userId: req.user.id }, select: { id: true } });
  if (!letter) return res.status(404).json({ error: 'Cover Letter Not Found', message: 'Cover letter not found' });
  const revision = await prisma.coverLetterRevision.findFirst({ where: { id: req.params.revisionId, coverLetterId: letter.id } });
  if (!revision) return res.status(404).json({ error: 'Revision Not Found', message: 'Revision not found' });
  res.json(revision);
});

router.post('/cover-letters/:id/revisions/:revisionId/restore', async (req, res) => {
  const letter = await prisma.coverLetter.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!letter) return res.status(404).json({ error: 'Cover Letter Not Found', message: 'Cover letter not found' });
  const revision = await prisma.coverLetterRevision.findFirst({ where: { id: req.params.revisionId, coverLetterId: letter.id } });
  if (!revision) return res.status(404).json({ error: 'Revision Not Found', message: 'Revision not found' });
  const [, restored] = await prisma.$transaction([
    prisma.coverLetterRevision.create({ data: { coverLetterId: letter.id, content: letter.content } }),
    prisma.coverLetter.update({ where: { id: letter.id }, data: { content: revision.content } })
  ]);
  res.json(restored);
});

// POST /api/goapply/cover-letters/:id/compile — compile a cover letter's LaTeX content to PDF
router.post('/cover-letters/:id/compile', async (req, res) => {
  try {
    const letter = await prisma.coverLetter.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!letter) return res.status(404).json({ error: 'Cover Letter Not Found', message: 'Cover letter not found' });

    const result = await latexCompiler.compile(letter.content);
    if (result.error) {
      return res.status(422).json({ error: 'Compilation Failed', message: result.error, log: result.log });
    }

    await ensureCoverLetterPdfDir();
    const pdfPath = path.join(COVER_LETTER_PDF_DIR, `${letter.id}.pdf`);
    await fs.writeFile(pdfPath, result.pdf);
    await prisma.coverLetter.update({ where: { id: letter.id }, data: { pdfPath } });

    res.setHeader('Content-Type', 'application/pdf');
    res.send(result.pdf);
  } catch (error) {
    console.error('Compile cover letter error:', error);
    res.status(500).json({ error: 'Compilation Failed', message: error.message });
  }
});

// GET /api/goapply/cover-letters/:id/pdf — get the last compiled PDF for a cover letter
router.get('/cover-letters/:id/pdf', async (req, res) => {
  try {
    const letter = await prisma.coverLetter.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!letter || !letter.pdfPath) {
      return res.status(404).json({ error: 'Not Found', message: 'No compiled PDF for this cover letter yet' });
    }
    // Check if file still exists on disk (cleared on restart)
    try {
      await fs.access(letter.pdfPath);
    } catch {
      // File gone — clear stale path and return 404
      await prisma.coverLetter.update({ where: { id: letter.id }, data: { pdfPath: null } }).catch(() => {});
      return res.status(404).json({ error: 'Not Found', message: 'PDF was cleared by server restart. Please recompile.' });
    }
    const pdf = await fs.readFile(letter.pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (error) {
    console.error('Get cover letter PDF error:', error);
    res.status(500).json({ error: 'Failed to fetch PDF', message: error.message });
  }
});

// POST /api/goapply/cover-letters/:id/chat — send a message to the cover letter editing agent (SSE stream)
router.post('/cover-letters/:id/chat', chatUpload.array('attachments', 5), async (req, res) => {
  const userId = req.user.id;
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message && !req.files?.length) {
    return res.status(400).json({ error: 'Validation Error', message: 'A message or attachment is required' });
  }
  // Attachments arrive as multipart/form-data, where every field (including
  // the JSON-encoded history array) is transmitted as a plain string.
  if (typeof req.body.history === 'string') {
    try { req.body.history = JSON.parse(req.body.history); } catch { req.body.history = []; }
  }

  const letter = await prisma.coverLetter.findFirst({
    where: { id: req.params.id, userId },
    include: { job: { select: { id: true, company: true, position: true, notes: true } } },
  });
  if (!letter) {
    return res.status(404).json({ error: 'Not Found', message: 'Cover letter does not exist' });
  }

  let attachments;
  try {
    attachments = await prepareAttachments(req.files);
  } catch (error) {
    return res.status(400).json({ error: 'Attachment Error', message: error.message });
  }

  const { send, aborted, cleanup } = setupSSE(req, res);

  const modelMessage = buildModelMessage(message, attachments);
  // Prefer the client-selected session history when supplied. Falling back to
  // the document column keeps older clients and existing conversations working.
  const priorHistory = Array.isArray(req.body.history)
    ? req.body.history
    : (Array.isArray(letter.chatHistory) ? letter.chatHistory : []);
  const messages = [
    ...priorHistory.map((m) => ({ role: m.role, content: m.modelContent || m.content })),
    { role: 'user', content: modelMessage },
  ];

  const doc = { content: letter.content };
  const tools = {
    ...createCoverLetterEditorTools(doc, (postId) => fetchPortfolioItem(userId, postId)),
    ...createGithubTools({ userId, sessionKey: `cover-letter:${letter.id}` }),
  };

  let assistantText = '';

  try {
    const portfolioContext = await getPortfolioContext(userId);
    const systemInstruction = buildCoverLetterSystemPrompt({
      content: doc.content,
      job: letter.job,
      portfolioContext,
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
          break;
      }
    }

    const finalChatHistory = [
      ...priorHistory,
      {
        role: 'user',
        content: message || 'Please review the attached file(s).',
        modelContent: modelMessage,
        attachments: attachments.map(({ name, type, size }) => ({ name, type, size })),
      },
      { role: 'assistant', content: assistantText },
    ];

    // The agent may have rewritten the document via a tool call — snapshot the
    // pre-turn content as a revision (same as a manual save) before persisting,
    // so an unwanted agent rewrite is undoable from the History popup.
    if (doc.content !== letter.content) {
      await prisma.coverLetterRevision.create({
        data: { coverLetterId: letter.id, content: letter.content },
      });
    }

    await prisma.coverLetter.update({
      where: { id: letter.id },
      data: { content: doc.content, chatHistory: finalChatHistory },
    });

    send({ type: 'document-updated', content: doc.content });

    // Auto-compile once the agent is done, so the preview stays in sync.
    const compileResult = await latexCompiler.compile(doc.content);
    if (compileResult.error) {
      send({ type: 'compile-error', message: compileResult.error, log: compileResult.log });
    } else {
      await ensureCoverLetterPdfDir();
      const pdfPath = path.join(COVER_LETTER_PDF_DIR, `${letter.id}.pdf`);
      await fs.writeFile(pdfPath, compileResult.pdf);
      await prisma.coverLetter.update({ where: { id: letter.id }, data: { pdfPath } });
      send({ type: 'compiled', pdfUrl: `/goapply/cover-letters/${letter.id}/pdf` });
    }

    send({ type: 'done' });
  } catch (error) {
    console.error('Cover letter chat error:', error);
    if (!aborted) send({ type: 'error', message: error.message || 'Agent request failed' });
  } finally {
    cleanup();
    res.end();
  }
});

// DELETE /api/goapply/cover-letters/:id — delete cover letter
router.delete('/cover-letters/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.coverLetter.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Cover Letter Not Found',
        message: 'Cover letter not found'
      });
    }

    if (existing.pdfPath) {
      await fs.unlink(existing.pdfPath).catch(() => {});
    }
    await prisma.coverLetter.delete({
      where: { id }
    });
    githubService.cleanupSession(userId, `cover-letter:${id}`).catch(() => {});

    res.json({ success: true, message: 'Cover letter deleted' });
  } catch (error) {
    console.error('Delete cover letter error:', error);
    res.status(500).json({
      error: 'Cover Letter Deletion Failed',
      message: 'Unable to delete cover letter'
    });
  }
});

module.exports = router;
