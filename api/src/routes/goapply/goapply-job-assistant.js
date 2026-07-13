const express = require('express');
const multer = require('multer');
const { prisma } = require('../../services/core/database');
const ai = require('../../services/ai/manager');
const { createJobAssistantTools } = require('../../services/goapply/job-assistant-tools');
const { createGithubTools } = require('../../services/github/github-tools');
const githubService = require('../../services/github/github-service');
const { prepareAttachments, buildModelMessage } = require('../../services/goapply/ai-attachment-text');
const { setupSSE } = require('../../utils/sse');
const { projectAccessWhere } = require('../../utils/project-access-where');

const ALL_PROJECT_ROLES = ['VIEWER', 'EDITOR', 'ADMIN'];

const router = express.Router();

const assistantUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

async function getAssistantSession(userId, id) {
  return prisma.resumeChatSession.findFirst({ where: { id, userId } });
}

async function getJobAssistantContext(userId, session) {
  const [job, resumes, coverLetters, portfolio, writableProjects, attachedAnswers] = await Promise.all([
    prisma.jobApplication.findFirst({
      where: { id: session.jobId, userId },
      select: { id: true, company: true, position: true, url: true, status: true, notes: true, referredBy: true, appliedAt: true },
    }),
    prisma.resumeDocument.findMany({
      where: { userId },
      select: { id: true, name: true, linkedJobId: true, jobDescription: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.coverLetter.findMany({
      where: { userId },
      select: { id: true, title: true, jobId: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.content.findMany({
      where: {
        project: projectAccessWhere(userId, ALL_PROJECT_ROLES),
        status: { not: 'REVISION' }, revisionOf: null,
      },
      select: { id: true, title: true, contentType: true, excerpt: true },
      orderBy: { updatedAt: 'desc' }, take: 60,
    }),
    prisma.project.findMany({
      where: projectAccessWhere(userId, ['ADMIN', 'EDITOR']),
      select: { id: true, name: true, description: true }, orderBy: { updatedAt: 'desc' },
    }),
    prisma.savedAnswer.findMany({
      where: { userId, jobs: { some: { id: session.jobId } } },
      select: { id: true, question: true, answer: true, category: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);
  if (!job) return null;

  const attachedResumes = await prisma.resumeDocument.findMany({
    where: { userId, id: { in: session.attachedResumeIds || [] } },
    select: { id: true, name: true, content: true, jobDescription: true, linkedJobId: true },
  });
  const attachedLetters = await prisma.coverLetter.findMany({
    where: { userId, id: { in: session.attachedCoverLetterIds || [] } },
    select: { id: true, title: true, content: true, jobId: true },
  });
  return { job, resumes, coverLetters, portfolio, writableProjects, attachedAnswers, attachedResumes, attachedLetters };
}

function buildJobAssistantPrompt(context) {
  const catalog = (items, label) => items.length
    ? items.map((item) => `- [${item.id}] ${item.name || item.title} (${label}${item.linkedJobId === context.job.id || item.jobId === context.job.id ? ', linked to this job' : ''})`).join('\n')
    : `- No ${label.toLowerCase()}s available`;
  return `You are Foligo's Job Application Assistant, embedded in GoApply. Help the user make concrete progress on the selected application while staying consistent with their real Foligo data.

SELECTED JOB:
${JSON.stringify(context.job, null, 2)}

EXPLICITLY ATTACHED RESUMES (full content):
${context.attachedResumes.length ? JSON.stringify(context.attachedResumes, null, 2) : 'None explicitly attached.'}

EXPLICITLY ATTACHED COVER LETTERS (full content):
${context.attachedLetters.length ? JSON.stringify(context.attachedLetters, null, 2) : 'None explicitly attached.'}

Q&A ATTACHED TO THIS JOB:
${context.attachedAnswers.length ? JSON.stringify(context.attachedAnswers, null, 2) : 'None attached.'}

AVAILABLE RESUMES (use get_resume for full content as needed):
${catalog(context.resumes, 'Resume')}

AVAILABLE COVER LETTERS (use get_cover_letter for full content as needed):
${catalog(context.coverLetters, 'Cover letter')}

AVAILABLE FOLIGO PORTFOLIO ITEMS (use get_portfolio_item as needed):
${context.portfolio.length ? context.portfolio.map((p) => `- [${p.id}] ${p.title} (${p.contentType})${p.excerpt ? `: ${p.excerpt}` : ''}`).join('\n') : '- None available'}

WRITABLE FOLIGO PROJECTS (use these IDs with save_skills or create_portfolio_items):
${context.writableProjects.length ? context.writableProjects.map((p) => `- [${p.id}] ${p.name}${p.description ? `: ${p.description}` : ''}`).join('\n') : '- None available'}

Use get_goapply_profile and get_saved_answers when personal/application details are needed. Use tools instead of guessing. Never invent experience, qualifications, or personal facts. Treat job notes as the stored job description/context.

You have write access through save_resume, save_cover_letter, save_answers, update_goapply_profile, save_skills, and create_portfolio_items. When the user asks you to create, save, update, or test writing objects, you MUST attempt the appropriate write tool in the same turn after gathering only the context actually needed. Do not stop after reads, defer the write to a later turn, claim you only have read access, or ask the user to copy generated content manually. A request to test writing authorizes clearly labeled test/draft records with non-sensitive placeholder content; report exactly what test records you created. For updates, use a catalog ID or load the object first. Only write personal profile facts the user explicitly supplied or confirmed. After a write, clearly state which object was created or updated. Explain recommendations clearly and end with a practical next action when appropriate.`;
}

function summarizeAssistantContext(context) {
  return {
    loaded: [
      { group: 'Selected job', items: [{ id: context.job.id, label: `${context.job.position} at ${context.job.company}`, detail: 'Full job record and stored notes' }] },
      { group: 'Attached resumes', items: context.attachedResumes.map((item) => ({ id: item.id, label: item.name, detail: 'Full LaTeX content' })) },
      { group: 'Attached cover letters', items: context.attachedLetters.map((item) => ({ id: item.id, label: item.title, detail: 'Full letter content' })) },
      { group: 'Attached Q&A', items: context.attachedAnswers.map((item) => ({ id: item.id, label: item.question, detail: item.category || 'Saved application answer' })) },
    ],
    discoverable: [
      { group: 'Resumes', items: context.resumes.map((item) => ({ id: item.id, label: item.name, detail: 'Metadata; full content loaded only when requested' })) },
      { group: 'Cover letters', items: context.coverLetters.map((item) => ({ id: item.id, label: item.title, detail: 'Metadata; full content loaded only when requested' })) },
      { group: 'Foligo portfolio items', items: context.portfolio.map((item) => ({ id: item.id, label: item.title, detail: `${item.contentType} metadata${item.excerpt ? ' and excerpt' : ''}` })) },
      { group: 'Writable Foligo projects', items: context.writableProjects.map((item) => ({ id: item.id, label: item.name, detail: 'Available for new skills and portfolio items' })) },
    ],
  };
}

// Job-backed, model-agnostic assistant. This intentionally uses the same AI
// manager and SSE event contract as Editor Studio.
router.get('/assistant/sessions', async (req, res) => {
  const sessions = await prisma.resumeChatSession.findMany({
    where: { userId: req.user.id, jobId: { not: null } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, jobId: true, chatHistory: true, attachedResumeIds: true, attachedCoverLetterIds: true, updatedAt: true },
  });
  const jobIds = [...new Set(sessions.map((s) => s.jobId).filter(Boolean))];
  const jobs = await prisma.jobApplication.findMany({ where: { userId: req.user.id, id: { in: jobIds } }, select: { id: true, company: true, position: true } });
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  res.json(sessions.map((session) => ({ ...session, job: jobsById.get(session.jobId), messageCount: Array.isArray(session.chatHistory) ? session.chatHistory.length : 0 })));
});

router.post('/assistant/sessions', async (req, res) => {
  const { jobId, resumeIds, coverLetterIds } = req.body;
  const job = await prisma.jobApplication.findFirst({ where: { id: jobId, userId: req.user.id }, include: { resumes: { select: { id: true } }, coverLetters: { select: { id: true } } } });
  if (!job) return res.status(400).json({ error: 'Validation Error', message: 'Choose one of your GoApply jobs.' });
  const validResumes = await prisma.resumeDocument.findMany({ where: { userId: req.user.id, id: { in: Array.isArray(resumeIds) ? resumeIds : job.resumes.map((r) => r.id) } }, select: { id: true } });
  const validLetters = await prisma.coverLetter.findMany({ where: { userId: req.user.id, id: { in: Array.isArray(coverLetterIds) ? coverLetterIds : job.coverLetters.map((l) => l.id) } }, select: { id: true } });
  const session = await prisma.resumeChatSession.create({
    data: {
      userId: req.user.id,
      title: `${job.position} at ${job.company}`,
      chatHistory: [], jobId: job.id, jobPosting: job.notes,
      attachedResumeIds: validResumes.map((r) => r.id),
      attachedCoverLetterIds: validLetters.map((l) => l.id),
    },
  });
  res.status(201).json(session);
});

router.get('/assistant/sessions/:id', async (req, res) => {
  const session = await getAssistantSession(req.user.id, req.params.id);
  if (!session || !session.jobId) return res.status(404).json({ error: 'Not Found', message: 'Assistant session not found.' });
  const context = await getJobAssistantContext(req.user.id, session);
  res.json({ ...session, job: context?.job, contextSummary: context ? summarizeAssistantContext(context) : null });
});

router.delete('/assistant/sessions/:id', async (req, res) => {
  const session = await getAssistantSession(req.user.id, req.params.id);
  if (!session || !session.jobId) return res.status(404).json({ error: 'Not Found', message: 'Assistant session not found.' });
  await prisma.resumeChatSession.delete({ where: { id: session.id } });
  githubService.cleanupSession(req.user.id, `job-assistant:${session.id}`).catch(() => {});
  res.json({ success: true });
});

router.post('/assistant/sessions/:id/chat', assistantUpload.array('attachments', 5), async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message && !req.files?.length) return res.status(400).json({ error: 'Validation Error', message: 'A message or attachment is required.' });
  const session = await getAssistantSession(req.user.id, req.params.id);
  if (!session || !session.jobId) return res.status(404).json({ error: 'Not Found', message: 'Assistant session not found.' });
  const context = await getJobAssistantContext(req.user.id, session);
  if (!context) return res.status(409).json({ error: 'Job Missing', message: 'The attached job no longer exists.' });

  let attachments;
  try {
    attachments = await prepareAttachments(req.files);
  } catch (error) {
    return res.status(400).json({ error: 'Attachment Error', message: error.message });
  }
  const modelMessage = buildModelMessage(message, attachments);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const prior = Array.isArray(session.chatHistory) ? session.chatHistory : [];
  const messages = [...prior.map((m) => ({ role: m.role, content: m.modelContent || m.content })), { role: 'user', content: modelMessage }];
  const tools = {
    ...createJobAssistantTools(prisma, req.user.id),
    ...createGithubTools({ userId: req.user.id, sessionKey: `job-assistant:${session.id}` }),
  };
  let assistantText = '';
  try {
    for await (const part of ai.streamChat(messages, { systemInstruction: buildJobAssistantPrompt(context), tools, maxSteps: 8, provider: req.body.provider })) {
      if (part.type === 'text-delta') { assistantText += part.text; sendSse(res, { type: 'text-delta', text: part.text }); }
      else if (part.type === 'reasoning-delta') sendSse(res, { type: 'reasoning-delta', text: part.text });
      else if (part.type === 'tool-call') sendSse(res, { type: 'tool-call', toolCallId: part.toolCallId, toolName: part.toolName, input: part.input });
      else if (part.type === 'tool-result') sendSse(res, { type: 'tool-result', toolCallId: part.toolCallId, toolName: part.toolName, output: part.output });
      else if (part.type === 'tool-error') sendSse(res, { type: 'tool-error', toolCallId: part.toolCallId, toolName: part.toolName, error: part.error?.message || String(part.error) });
      else if (part.type === 'error') sendSse(res, { type: 'error', message: part.error?.message || String(part.error) });
    }
    await prisma.resumeChatSession.update({
      where: { id: session.id },
      data: { chatHistory: [...prior, {
        role: 'user', content: message || 'Please review the attached file(s).', modelContent: modelMessage,
        attachments: attachments.map(({ name, type, size }) => ({ name, type, size })),
      }, { role: 'assistant', content: assistantText }] },
    });
  } catch (error) {
    sendSse(res, { type: 'error', message: error.message || 'Assistant request failed.' });
  } finally {
    cleanup();
    res.end();
  }
});

module.exports = router;
