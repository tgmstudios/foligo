const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authenticateToken } = require('../middleware/auth');
const ai = require('../services/ai/manager');
const latexCompiler = require('../services/latex-compiler');
const { createJobAssistantTools } = require('../services/job-assistant-tools');
const { createCoverLetterEditorTools } = require('../services/cover-letter-editor-tools');
const { fetchPortfolioItem, getPortfolioContext } = require('../services/portfolio-context');
const { prepareAttachments, buildModelMessage } = require('../services/ai-attachment-text');

const router = express.Router();

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
const assistantUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

// All goapply routes require authentication
router.use(authenticateToken);

function sendSse(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

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
        project: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
        status: { not: 'REVISION' }, revisionOf: null,
      },
      select: { id: true, title: true, contentType: true, excerpt: true },
      orderBy: { updatedAt: 'desc' }, take: 60,
    }),
    prisma.project.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: { userId, role: { in: ['ADMIN', 'EDITOR'] } } } }] },
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
  const tools = createJobAssistantTools(prisma, req.user.id);
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
    res.end();
  }
});

// =============================================================================
// PROFILE
// =============================================================================

// Everything beyond the original core fields (name/email/phone/location/
// linkedin/github/portfolio/resumeUrl) mirrors the extension's autofill field
// taxonomy (Personal Info, Location, EEO, Work Authorization, Social & Links,
// Other) 1:1 with matching Prisma columns, so it can pass straight through
// without translation. Education/Experience/Skills fields are NOT here — those
// are fully derived from linkedJobs/linkedEducation/linkedSkills (see
// computeDerivedFields) instead of being stored as flat text.
const PROFILE_PASSTHROUGH_FIELDS = [
  'firstName', 'lastName', 'middleName', 'preferredName', 'legalName', 'username',
  'phoneType', 'phoneCountry', 'birthday', 'pronouns',
  'address', 'address2', 'city', 'state', 'country', 'postalCode',
  'language',
  'gender', 'ethnicity', 'hispanicLatino', 'veteranStatus', 'disabilityStatus', 'lgbtStatus',
  'over18', 'over21', 'hasDriversLicense',
  'workAuthUS', 'workAuth', 'sponsorshipRequired',
  'twitter', 'behance', 'dribbble', 'website',
  'desiredSalary', 'referredBy', 'source',
];

const PROFILE_URL_FIELDS = new Set([
  'linkedin', 'github', 'portfolio', 'resumeUrl',
  'twitter', 'behance', 'dribbble', 'website'
]);

function isHttpUrl(value) {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

// Shape returned for each linked Content(EXPERIENCE) item — enough to render a
// summary card without a second round-trip, and to know which project it lives in.
const EXPERIENCE_INCLUDE = {
  roles: { include: { skills: true }, orderBy: { startDate: 'desc' } },
  linkedSkills: true,
  project: { select: { id: true, name: true } }
};

const PROFILE_INCLUDE = {
  linkedJobs: { include: EXPERIENCE_INCLUDE },
  linkedEducation: { include: EXPERIENCE_INCLUDE },
  linkedSkills: true
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

// Of a set of linked Content items, prefer one that's currently ongoing (a role
// marked isCurrent, or the content's own isOngoing flag); otherwise the most
// recently started one. Used to pick which linked job/education "represents"
// the flat autofill fields the extension reads.
function pickPrimary(items) {
  if (!items || items.length === 0) return null;
  const ongoing = items.find((item) => item.roles?.some((r) => r.isCurrent) || item.isOngoing);
  if (ongoing) return ongoing;
  return [...items].sort((a, b) => {
    const aDate = a.roles?.[0]?.startDate || a.startDate || 0;
    const bDate = b.roles?.[0]?.startDate || b.startDate || 0;
    return new Date(bDate) - new Date(aDate);
  })[0];
}

// GoApply has no flat job/education/skills storage anymore — everything the
// extension autofills for those fields is computed here, on read, from the
// linked Content(EXPERIENCE)/Skill objects.
function computeDerivedFields(profile) {
  const jobs = profile.linkedJobs || [];
  const education = profile.linkedEducation || [];

  const primaryJob = pickPrimary(jobs);
  const primaryRole = primaryJob?.roles?.[0];
  const primaryEducation = pickPrimary(education);
  const primaryEduRole = primaryEducation?.roles?.[0];

  // Approximate total years of experience by summing each job's role spans
  // (or its own start/end if it has no roles), treating ongoing spans as
  // running through today.
  let totalMs = 0;
  for (const job of jobs) {
    const spans = job.roles?.length
      ? job.roles
      : [{ startDate: job.startDate, endDate: job.endDate, isCurrent: job.isOngoing }];
    for (const span of spans) {
      if (!span.startDate) continue;
      const start = new Date(span.startDate).getTime();
      const end = span.isCurrent || !span.endDate ? Date.now() : new Date(span.endDate).getTime();
      if (end > start) totalMs += end - start;
    }
  }

  return {
    currentCompany: primaryJob?.title,
    currentTitle: primaryRole?.title,
    currentlyWorking: primaryRole ? primaryRole.isCurrent : primaryJob?.isOngoing,
    experienceSummary: primaryJob?.excerpt || undefined,
    yearsExperience: totalMs > 0 ? (totalMs / MS_PER_YEAR).toFixed(1) : undefined,
    school: primaryEducation?.title,
    // Content/ExperienceRole don't model "degree" separately from "discipline" —
    // both best-effort resolve to the same role title (e.g. "B.S. Computer Science").
    highestDegree: primaryEduRole?.title,
    discipline: primaryEduRole?.title,
    educationSummary: primaryEducation?.excerpt || undefined,
  };
}

// The DB column is named `fullName` but the dashboard's GoApplyProfile contract
// uses `name`; `skills` is now derived from linkedSkills rather than stored.
// Translate at the boundary so callers never see the storage representation.
function serializeProfile(profile) {
  if (!profile) return null;
  const { fullName, ...rest } = profile;
  const skills = (profile.linkedSkills || []).map((s) => s.name);
  return { ...rest, name: fullName, skills, ...computeDerivedFields(profile) };
}

// Project ids the user can read/write Content in — owns, or has a ProjectAccess row for.
// Mirrors the access check in authorizeProjectAccess (middleware/auth.js), just not tied
// to a single :projectId route param since GoApply searches/links across all of them.
async function getAccessibleProjectIds(userId) {
  const [owned, access] = await Promise.all([
    prisma.project.findMany({ where: { ownerId: userId }, select: { id: true } }),
    prisma.projectAccess.findMany({ where: { userId }, select: { projectId: true } })
  ]);
  return [...new Set([...owned.map(p => p.id), ...access.map(a => a.projectId)])];
}

// GET /api/goapply/profile — get logged-in user's profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE
    });

    res.json(serializeProfile(profile));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Profile Retrieval Failed',
      message: 'Unable to retrieve profile'
    });
  }
});

// GET /api/goapply/experience?category=JOB|EDUCATION&q=... — search the user's own
// portfolio Content(EXPERIENCE) items so they can be linked instead of retyped.
router.get('/experience', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, q } = req.query;

    if (!['JOB', 'EDUCATION'].includes(category)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'category must be JOB or EDUCATION'
      });
    }

    const projectIds = await getAccessibleProjectIds(userId);
    if (projectIds.length === 0) {
      return res.json([]);
    }

    const results = await prisma.content.findMany({
      where: {
        projectId: { in: projectIds },
        contentType: 'EXPERIENCE',
        experienceCategory: category,
        revisionOf: null,
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {})
      },
      include: EXPERIENCE_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    res.json(results);
  } catch (error) {
    console.error('Search experience error:', error);
    res.status(500).json({
      error: 'Experience Search Failed',
      message: 'Unable to search experience'
    });
  }
});

// Shared handler for linking a set of Content(EXPERIENCE) items to the profile,
// scoped to a single category so /profile/jobs can't be used to link education.
function linkExperienceHandler(category, relationField) {
  return async (req, res) => {
    try {
      const userId = req.user.id;
      const { contentIds } = req.body;

      if (!Array.isArray(contentIds)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'contentIds must be an array'
        });
      }

      if (contentIds.length > 0) {
        const projectIds = await getAccessibleProjectIds(userId);
        const validCount = await prisma.content.count({
          where: {
            id: { in: contentIds },
            projectId: { in: projectIds },
            contentType: 'EXPERIENCE',
            experienceCategory: category
          }
        });

        if (validCount !== contentIds.length) {
          return res.status(403).json({
            error: 'Access Denied',
            message: `One or more items are not an accessible ${category} entry`
          });
        }
      }

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          [relationField]: { connect: contentIds.map(id => ({ id })) }
        },
        update: {
          [relationField]: { set: contentIds.map(id => ({ id })) }
        },
        include: PROFILE_INCLUDE
      });

      res.json(serializeProfile(profile));
    } catch (error) {
      console.error(`Link ${category} error:`, error);
      res.status(500).json({
        error: 'Link Failed',
        message: `Unable to update linked ${category.toLowerCase()} entries`
      });
    }
  };
}

// PUT /api/goapply/profile/jobs — replace the set of linked Content(EXPERIENCE, JOB) items
router.put('/profile/jobs', linkExperienceHandler('JOB', 'linkedJobs'));

// PUT /api/goapply/profile/education — replace the set of linked Content(EXPERIENCE, EDUCATION) items
router.put('/profile/education', linkExperienceHandler('EDUCATION', 'linkedEducation'));

// PUT /api/goapply/profile/skills — replace the set of linked (global) Skill items
router.put('/profile/skills', async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillIds } = req.body;

    if (!Array.isArray(skillIds)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'skillIds must be an array'
      });
    }

    if (skillIds.length > 0) {
      const validCount = await prisma.skill.count({ where: { id: { in: skillIds } } });
      if (validCount !== skillIds.length) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'One or more skill ids do not exist'
        });
      }
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        linkedSkills: { connect: skillIds.map(id => ({ id })) }
      },
      update: {
        linkedSkills: { set: skillIds.map(id => ({ id })) }
      },
      include: PROFILE_INCLUDE
    });

    res.json(serializeProfile(profile));
  } catch (error) {
    console.error('Link skills error:', error);
    res.status(500).json({
      error: 'Link Failed',
      message: 'Unable to update linked skills'
    });
  }
});

// POST /api/goapply/skills — find-or-create a global Skill without requiring project
// access (mirrors POST /projects/:projectId/content skills creation in skills.js, minus
// the project gate — skills are a shared, harmless taxonomy any logged-in user can add to).
router.post('/skills', async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Skill name is required'
      });
    }

    const existingSkill = await prisma.skill.findFirst({
      where: { name: name.trim(), category: category || null }
    });

    const skill = existingSkill || await prisma.skill.create({
      data: { name: name.trim(), category: category || null }
    });

    res.status(existingSkill ? 200 : 201).json(skill);
  } catch (error) {
    console.error('Create global skill error:', error);
    res.status(500).json({
      error: 'Skill Creation Failed',
      message: 'Unable to create skill'
    });
  }
});

// PUT /api/goapply/profile — upsert profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, email, phone, location,
      linkedin, github, portfolio, resumeUrl
    } = req.body;

    const invalidUrlField = [...PROFILE_URL_FIELDS].find(
      field => Object.prototype.hasOwnProperty.call(req.body, field) && !isHttpUrl(req.body[field])
    );
    if (invalidUrlField) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `${invalidUrlField} must be a valid HTTP or HTTPS URL`
      });
    }

    const passthrough = {};
    for (const field of PROFILE_PASSTHROUGH_FIELDS) {
      if (req.body[field] !== undefined) passthrough[field] = req.body[field];
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: name || null,
        email: email || null,
        phone: phone || null,
        location: location || null,
        linkedin: linkedin || null,
        github: github || null,
        portfolio: portfolio || null,
        resumeUrl: resumeUrl || null,
        ...passthrough
      },
      update: {
        fullName: name !== undefined ? (name || null) : undefined,
        email: email !== undefined ? (email || null) : undefined,
        phone: phone !== undefined ? (phone || null) : undefined,
        location: location !== undefined ? (location || null) : undefined,
        linkedin: linkedin !== undefined ? (linkedin || null) : undefined,
        github: github !== undefined ? (github || null) : undefined,
        portfolio: portfolio !== undefined ? (portfolio || null) : undefined,
        resumeUrl: resumeUrl !== undefined ? (resumeUrl || null) : undefined,
        ...passthrough
      },
      include: PROFILE_INCLUDE
    });

    res.json(serializeProfile(profile));
  } catch (error) {
    console.error('Upsert profile error:', error);
    res.status(500).json({
      error: 'Profile Update Failed',
      message: 'Unable to update profile'
    });
  }
});

// =============================================================================
// JOB APPLICATIONS
// =============================================================================

function normalizeJobTags(tags) {
  if (tags === undefined) return undefined;
  if (!Array.isArray(tags)) return null;
  return [...new Set(tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean))].slice(0, 25);
}

// GET /api/goapply/jobs — list jobs (filter query param: ?status=saved)
router.get('/jobs', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const jobs = await prisma.jobApplication.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
    });

    res.json(jobs);
  } catch (error) {
    console.error('List jobs error:', error);
    res.status(500).json({
      error: 'Job List Retrieval Failed',
      message: 'Unable to retrieve job applications'
    });
  }
});

// POST /api/goapply/jobs — create job application
router.post('/jobs', async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, position, url, status, notes, category, tags, appliedAt, referredBy, sortOrder } = req.body;

    if (!company || !position) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Company and position are required'
      });
    }
    const normalizedTags = normalizeJobTags(tags);
    if (normalizedTags === null) return res.status(400).json({ error: 'Validation Error', message: 'Tags must be an array of strings' });

    const job = await prisma.jobApplication.create({
      data: {
        userId,
        company,
        position,
        url: url || null,
        status: status || 'saved',
        notes: notes || null,
        category: typeof category === 'string' ? category.trim() || null : null,
        tags: normalizedTags || [],
        referredBy: referredBy || null,
        sortOrder: sortOrder ?? 0,
        appliedAt: appliedAt ? new Date(appliedAt) : null
      }
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      error: 'Job Creation Failed',
      message: 'Unable to create job application'
    });
  }
});

// PUT /api/goapply/jobs/reorder — bulk reorder (updates sortOrder + optional status)
// MUST be defined before /jobs/:id to prevent Express from matching "reorder" as an :id param
router.put('/jobs/reorder', async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // [{ id, sortOrder, status? }]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'items array is required'
      });
    }

    // Verify ownership and update each job in a transaction
    const results = await prisma.$transaction(
      items.map((item) => {
        const data = { sortOrder: item.sortOrder };
        if (item.status) data.status = item.status;
        return prisma.jobApplication.updateMany({
          where: { id: item.id, userId },
          data
        });
      })
    );

    res.json({ success: true, updated: results.length });
  } catch (error) {
    console.error('Bulk reorder error:', error);
    res.status(500).json({
      error: 'Reorder Failed',
      message: 'Unable to reorder job applications'
    });
  }
});

// PUT /api/goapply/jobs/:id — update job (status, notes, etc.)
router.put('/jobs/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { company, position, url, status, notes, category, tags, appliedAt, referredBy, sortOrder } = req.body;

    // Verify ownership
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Job Not Found',
        message: 'Job application not found'
      });
    }
    const normalizedTags = normalizeJobTags(tags);
    if (normalizedTags === null) return res.status(400).json({ error: 'Validation Error', message: 'Tags must be an array of strings' });

    const data = {};
    if (company !== undefined) data.company = company;
    if (position !== undefined) data.position = position;
    if (url !== undefined) data.url = url;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (category !== undefined) data.category = typeof category === 'string' ? category.trim() || null : null;
    if (normalizedTags !== undefined) data.tags = normalizedTags;
    if (appliedAt !== undefined) data.appliedAt = appliedAt ? new Date(appliedAt) : null;
    if (referredBy !== undefined) data.referredBy = referredBy;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const job = await prisma.jobApplication.update({
      where: { id },
      data
    });

    res.json(job);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      error: 'Job Update Failed',
      message: 'Unable to update job application'
    });
  }
});

// DELETE /api/goapply/jobs/:id — delete job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Job Not Found',
        message: 'Job application not found'
      });
    }

    await prisma.jobApplication.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Job application deleted' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      error: 'Job Deletion Failed',
      message: 'Unable to delete job application'
    });
  }
});

// GET /api/goapply/kanban — get all jobs grouped by status for kanban
router.get('/kanban', async (req, res) => {
  try {
    const userId = req.user.id;

    const jobs = await prisma.jobApplication.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
    });

    // Group by status
    const statuses = ['saved', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn', 'archived'];
    const kanban = {};

    for (const status of statuses) {
      kanban[status] = jobs.filter(job => job.status === status);
    }

    res.json(kanban);
  } catch (error) {
    console.error('Kanban error:', error);
    res.status(500).json({
      error: 'Kanban Retrieval Failed',
      message: 'Unable to retrieve kanban data'
    });
  }
});

// =============================================================================
// SAVED ANSWERS
// =============================================================================

const savedAnswerJobsSelect = { id: true, company: true, position: true };

async function ownedJobConnections(userId, jobIds) {
  if (!Array.isArray(jobIds)) return undefined;
  const uniqueIds = [...new Set(jobIds.filter((id) => typeof id === 'string' && id))];
  const jobs = await prisma.jobApplication.findMany({
    where: { userId, id: { in: uniqueIds } },
    select: { id: true },
  });
  if (jobs.length !== uniqueIds.length) throw new Error('INVALID_JOB_IDS');
  return jobs.map(({ id }) => ({ id }));
}

// GET /api/goapply/answers — list saved answers
router.get('/answers', async (req, res) => {
  try {
    const userId = req.user.id;

    const answers = await prisma.savedAnswer.findMany({
      where: { userId },
      include: { jobs: { select: savedAnswerJobsSelect } },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(answers);
  } catch (error) {
    console.error('List answers error:', error);
    res.status(500).json({
      error: 'Answers Retrieval Failed',
      message: 'Unable to retrieve saved answers'
    });
  }
});

// POST /api/goapply/answers — create saved answer
router.post('/answers', async (req, res) => {
  try {
    const userId = req.user.id;
    const { question, answer, category, jobIds } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Question and answer are required'
      });
    }

    const jobs = await ownedJobConnections(userId, jobIds);
    const savedAnswer = await prisma.savedAnswer.create({
      data: {
        userId,
        question,
        answer,
        category: category || null,
        ...(jobs !== undefined ? { jobs: { connect: jobs } } : {}),
      },
      include: { jobs: { select: savedAnswerJobsSelect } },
    });

    res.status(201).json(savedAnswer);
  } catch (error) {
    if (error.message === 'INVALID_JOB_IDS') return res.status(400).json({ error: 'Validation Error', message: 'One or more selected jobs are not accessible.' });
    console.error('Create answer error:', error);
    res.status(500).json({
      error: 'Answer Creation Failed',
      message: 'Unable to create saved answer'
    });
  }
});

// PUT /api/goapply/answers/:id — update saved answer
router.put('/answers/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { question, answer, category, jobIds } = req.body;

    // Verify ownership
    const existing = await prisma.savedAnswer.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Answer Not Found',
        message: 'Saved answer not found'
      });
    }

    const data = {};
    if (question !== undefined) data.question = question;
    if (answer !== undefined) data.answer = answer;
    if (category !== undefined) data.category = category;
    const jobs = await ownedJobConnections(userId, jobIds);
    if (jobs !== undefined) data.jobs = { set: jobs };

    const updated = await prisma.savedAnswer.update({
      where: { id },
      data,
      include: { jobs: { select: savedAnswerJobsSelect } },
    });

    res.json(updated);
  } catch (error) {
    if (error.message === 'INVALID_JOB_IDS') return res.status(400).json({ error: 'Validation Error', message: 'One or more selected jobs are not accessible.' });
    console.error('Update answer error:', error);
    res.status(500).json({
      error: 'Answer Update Failed',
      message: 'Unable to update saved answer'
    });
  }
});

// DELETE /api/goapply/answers/:id — delete saved answer
router.delete('/answers/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.savedAnswer.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Answer Not Found',
        message: 'Saved answer not found'
      });
    }

    await prisma.savedAnswer.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Saved answer deleted' });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({
      error: 'Answer Deletion Failed',
      message: 'Unable to delete saved answer'
    });
  }
});

// =============================================================================
// COVER LETTERS
// =============================================================================

// GET /api/goapply/cover-letters — list cover letters
router.get('/cover-letters', async (req, res) => {
  try {
    const userId = req.user.id;

    const letters = await prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { job: { select: { id: true, company: true, position: true } } }
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
      include: { job: { select: { id: true, company: true, position: true } } }
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
    const pdf = await fs.readFile(letter.pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (error) {
    console.error('Get cover letter PDF error:', error);
    res.status(500).json({ error: 'Failed to fetch PDF', message: error.message });
  }
});

// POST /api/goapply/cover-letters/:id/chat — send a message to the cover letter editing agent (SSE stream)
router.post('/cover-letters/:id/chat', async (req, res) => {
  const userId = req.user.id;
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ error: 'Validation Error', message: 'Message is required' });
  }

  const letter = await prisma.coverLetter.findFirst({
    where: { id: req.params.id, userId },
    include: { job: { select: { id: true, company: true, position: true, notes: true } } },
  });
  if (!letter) {
    return res.status(404).json({ error: 'Not Found', message: 'Cover letter does not exist' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const priorHistory = Array.isArray(letter.chatHistory) ? letter.chatHistory : [];
  const messages = [
    ...priorHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const doc = { content: letter.content };
  const tools = createCoverLetterEditorTools(doc, (postId) => fetchPortfolioItem(userId, postId));

  let assistantText = '';

  try {
    const portfolioContext = await getPortfolioContext(userId);
    const systemInstruction = buildCoverLetterSystemPrompt({
      content: doc.content,
      job: letter.job,
      portfolioContext,
    });

    for await (const part of ai.streamChat(messages, { systemInstruction, tools, maxSteps: 6, provider: req.body.provider })) {
      switch (part.type) {
        case 'text-delta':
          assistantText += part.text;
          sendSse(res, { type: 'text-delta', text: part.text });
          break;
        case 'reasoning-delta':
          sendSse(res, { type: 'reasoning-delta', text: part.text });
          break;
        case 'tool-call':
          sendSse(res, { type: 'tool-call', toolCallId: part.toolCallId, toolName: part.toolName, input: part.input });
          break;
        case 'tool-result':
          sendSse(res, { type: 'tool-result', toolCallId: part.toolCallId, toolName: part.toolName, output: part.output });
          break;
        case 'tool-error':
          sendSse(res, { type: 'tool-error', toolCallId: part.toolCallId, toolName: part.toolName, error: part.error?.message || String(part.error) });
          break;
        case 'error':
          sendSse(res, { type: 'error', message: part.error?.message || String(part.error) });
          break;
        default:
          break;
      }
    }

    const finalChatHistory = [
      ...priorHistory,
      { role: 'user', content: message },
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

    sendSse(res, { type: 'document-updated', content: doc.content });

    // Auto-compile once the agent is done, so the preview stays in sync.
    const compileResult = await latexCompiler.compile(doc.content);
    if (compileResult.error) {
      sendSse(res, { type: 'compile-error', message: compileResult.error, log: compileResult.log });
    } else {
      await ensureCoverLetterPdfDir();
      const pdfPath = path.join(COVER_LETTER_PDF_DIR, `${letter.id}.pdf`);
      await fs.writeFile(pdfPath, compileResult.pdf);
      await prisma.coverLetter.update({ where: { id: letter.id }, data: { pdfPath } });
      sendSse(res, { type: 'compiled', pdfUrl: `/goapply/cover-letters/${letter.id}/pdf` });
    }

    sendSse(res, { type: 'done' });
  } catch (error) {
    console.error('Cover letter chat error:', error);
    sendSse(res, { type: 'error', message: error.message || 'Agent request failed' });
  } finally {
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
