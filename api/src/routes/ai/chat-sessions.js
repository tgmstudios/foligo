const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { prisma } = require('../../services/core/database');

const router = express.Router();
const allowedScopes = ['studio-content', 'studio-resume', 'studio-cover-letter', 'content-creator'];
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function titleFromHistory(history) {
  const first = history.find((message) => message.role === 'user' && typeof message.content === 'string');
  if (!first) return 'New chat';
  const title = first.content.trim().replace(/\s+/g, ' ');
  return title.length > 54 ? `${title.slice(0, 51)}…` : title || 'New chat';
}

router.get('/chat-sessions', [
  query('scope').isIn(allowedScopes),
  query('contextId').optional({ nullable: true }).isString(),
], asyncRoute(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid chat scope', details: errors.array() });
  const sessions = await prisma.aiChatSession.findMany({
    where: { userId: req.user.id, scope: req.query.scope, contextId: req.query.contextId || null },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, createdAt: true, updatedAt: true, chatHistory: true, metadata: true },
  });
  res.json(sessions.map((session) => ({ ...session, messageCount: Array.isArray(session.chatHistory) ? session.chatHistory.length : 0 })));
}));

router.post('/chat-sessions', [
  body('scope').isIn(allowedScopes),
  body('contextId').optional({ nullable: true }).isString(),
  body('metadata').optional({ nullable: true }).isObject(),
], asyncRoute(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid chat session', details: errors.array() });
  const session = await prisma.aiChatSession.create({ data: {
    userId: req.user.id, scope: req.body.scope, contextId: req.body.contextId || null,
    title: 'New chat', chatHistory: [], metadata: req.body.metadata || undefined,
  }});
  res.status(201).json(session);
}));

router.get('/chat-sessions/:id', asyncRoute(async (req, res) => {
  const session = await prisma.aiChatSession.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!session) return res.status(404).json({ message: 'Chat session not found' });
  res.json(session);
}));

router.put('/chat-sessions/:id', [
  body('chatHistory').isArray(),
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('metadata').optional({ nullable: true }).isObject(),
], asyncRoute(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid chat history', details: errors.array() });
  const existing = await prisma.aiChatSession.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ message: 'Chat session not found' });
  const title = req.body.title || (existing.title === 'New chat' ? titleFromHistory(req.body.chatHistory) : existing.title);
  const session = await prisma.aiChatSession.update({ where: { id: existing.id }, data: {
    chatHistory: req.body.chatHistory, title, ...(req.body.metadata !== undefined ? { metadata: req.body.metadata } : {}),
  }});
  res.json(session);
}));

module.exports = router;
