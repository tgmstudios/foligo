const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../../services/core/database');
const { cache } = require('../../services/core/redis');
const ai = require('../../services/ai/manager');
const { createContentEditorTools } = require('../../services/content/content-editor-tools');
const { createGithubTools } = require('../../services/github/github-tools');
const { setupSSE } = require('../../utils/sse');
const { snapshotContentRevision } = require('./content-crud');

const router = express.Router();

/**
 * @swagger
 * /api/content/{id}/chat:
 *   post:
 *     summary: Send a message to the content editing agent (SSE stream of thinking/text/tool-call events)
 *     tags: [CMS Content]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/content/:id/chat', [
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('provider').optional().isString(),
  body('history').optional().isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: errors.array() });
  }

  const userId = req.user.id;
  const existingContent = await prisma.content.findUnique({
    where: { id: req.params.id },
    include: { project: { include: { owner: true, members: { where: { userId } } } } },
  });
  if (!existingContent) {
    return res.status(404).json({ error: 'Not Found', message: 'Content does not exist' });
  }
  const isOwner = existingContent.project.ownerId === userId;
  const memberAccess = existingContent.project.members[0];
  const canEdit = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));
  if (!canEdit) {
    return res.status(403).json({ error: 'Access Denied', message: 'You do not have permission to edit this content' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event) => sendSse(res, event);

  const userMessage = req.body.message;
  // Content has no chatHistory column (unlike ResumeDocument) — the client
  // resends prior turns each request instead of the server persisting them.
  const priorHistory = Array.isArray(req.body.history) ? req.body.history : [];
  const messages = [
    ...priorHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const doc = { content: existingContent.content };
  const tools = {
    ...createContentEditorTools(doc),
    ...createGithubTools({ userId, sessionKey: `content:${existingContent.id}` }),
  };

  const systemInstruction = `You are an expert content editor and writer, working inside an agentic Markdown editor for a "${existingContent.contentType || existingContent.type}" post titled "${existingContent.title}".

CURRENT CONTENT (Markdown source):
"""
${doc.content}
"""

${existingContent.excerpt ? `EXCERPT: ${existingContent.excerpt}\n` : ''}

RULES:
- Use the edit_content_section tool for small, targeted changes. The "search" text must match the current content verbatim and uniquely.
- Use the write_content tool only for the first draft or large restructures — it replaces the whole body, so always output complete, valid Markdown.
- After making edits, briefly tell the user what you changed and why, in plain prose.
- Preserve existing Markdown formatting conventions already used in the document (headers, code fences, image links, mermaid/drawio blocks) unless asked to change them.`;

  let assistantText = '';

  try {
    for await (const part of ai.streamChat(messages, { systemInstruction, tools, maxSteps: 6, provider: req.body.provider })) {
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

    if (doc.content !== existingContent.content) {
      await snapshotContentRevision(existingContent);
      await prisma.content.update({ where: { id: existingContent.id }, data: { content: doc.content } });
      await cache.del(`project:${existingContent.projectId}`);
      await cache.del(`project:${existingContent.projectId}:content`);
      await cache.del(`content:${existingContent.id}`);
    }

    send({ type: 'document-updated', content: doc.content });
    send({ type: 'done' });
  } catch (error) {
    console.error('Content chat error:', error);
    send({ type: 'error', message: error.message || 'Agent request failed' });
  } finally {
    cleanup();
    res.end();
  }
});

module.exports = router;
