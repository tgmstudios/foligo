const { tool } = require('ai');
const { z } = require('zod');
const { projectAccessWhere } = require('../../utils/project-access-where');
const { createWebSearchTool } = require('./web-search-tool');
const { createPullPageTool } = require('./pull-page-tool');

const optionalText = z.string().nullable().optional();

// Tool results are replayed as ModelMessage content when the agent takes a
// subsequent step. The AI SDK validates that content as JSON, while Prisma
// records contain Date instances (notably createdAt/updatedAt). Normalize at
// the tool boundary so a successful lookup/save cannot poison the next step.
function toJsonCompatible(value) {
  return JSON.parse(JSON.stringify(value));
}

function jobAssistantTool(definition) {
  const execute = definition.execute;
  return tool({
    ...definition,
    execute: async (...args) => toJsonCompatible(await execute(...args)),
  });
}

const profileSchema = z.object({
  fullName: optionalText, email: optionalText, phone: optionalText, location: optionalText,
  linkedin: optionalText, github: optionalText, portfolio: optionalText, resumeUrl: optionalText,
  firstName: optionalText, lastName: optionalText, middleName: optionalText,
  preferredName: optionalText, legalName: optionalText, username: optionalText,
  phoneType: optionalText, phoneCountry: optionalText, birthday: optionalText, pronouns: optionalText,
  address: optionalText, address2: optionalText, city: optionalText, state: optionalText,
  country: optionalText, postalCode: optionalText, language: optionalText,
  gender: optionalText, ethnicity: optionalText, hispanicLatino: optionalText,
  veteranStatus: optionalText, disabilityStatus: optionalText, lgbtStatus: optionalText,
  over18: z.boolean().nullable().optional(), over21: z.boolean().nullable().optional(),
  hasDriversLicense: z.boolean().nullable().optional(),
  workAuthUS: optionalText, workAuth: optionalText, sponsorshipRequired: optionalText,
  twitter: optionalText, behance: optionalText, dribbble: optionalText, website: optionalText,
  desiredSalary: optionalText, referredBy: optionalText, source: optionalText,
}).strict();

async function assertOwnedJob(prisma, userId, jobId) {
  if (!jobId) return;
  const job = await prisma.jobApplication.findFirst({ where: { id: jobId, userId }, select: { id: true } });
  if (!job) throw new Error('The linked job does not exist or is not accessible.');
}

async function assertWritableProject(prisma, userId, projectId) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...projectAccessWhere(userId, ['ADMIN', 'EDITOR']) },
    select: { id: true, name: true },
  });
  if (!project) throw new Error('The Foligo project does not exist or you do not have write access.');
  return project;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'item';
}

function createJobAssistantTools(prisma, userId) {
  const webSearch = createWebSearchTool({ toolFn: tool, z });
  const pullPage = createPullPageTool({ toolFn: tool, z });

  return {
    web_search: webSearch,
    pull_page: pullPage,
    get_resume: jobAssistantTool({
      description: 'Load the full LaTeX content and job description of ONE of the user\'s resumes, by id. Use this when you need to read or edit an existing resume\'s content — not to create one (use save_resume for that).',
      inputSchema: z.object({ resumeId: z.string().describe('The id of the resume to load, from the available resume catalog.') }),
      execute: async ({ resumeId }) => {
        const resume = await prisma.resumeDocument.findFirst({
          where: { id: resumeId, userId },
          select: { id: true, name: true, content: true, jobDescription: true, linkedJobId: true, updatedAt: true },
        });
        return resume ? { objectType: 'resume', action: 'loaded', object: resume } : 'Resume not found or not accessible.';
      },
    }),
    get_cover_letter: jobAssistantTool({
      description: 'Load the full LaTeX source of ONE of the user\'s cover letters, by id. Use this when you need to read or edit an existing cover letter\'s content — not to create one (use save_cover_letter for that).',
      inputSchema: z.object({ coverLetterId: z.string().describe('The id of the cover letter to load, from the available cover letter catalog.') }),
      execute: async ({ coverLetterId }) => {
        const letter = await prisma.coverLetter.findFirst({
          where: { id: coverLetterId, userId },
          select: { id: true, title: true, content: true, jobId: true, updatedAt: true },
        });
        return letter ? { objectType: 'coverLetter', action: 'loaded', object: letter } : 'Cover letter not found or not accessible.';
      },
    }),
    get_goapply_profile: jobAssistantTool({
      description: 'Load the user\'s GoApply profile fields (name, contact info, work authorization, demographics, etc.) plus linked experience/education posts and skills. Use this when you need background/application details for filling out a job application or writing about the user — not for resume/cover-letter content (use get_resume/get_cover_letter for those).',
      inputSchema: z.object({}),
      execute: async () => {
        const profile = await prisma.userProfile.findUnique({
          where: { userId },
          include: {
            linkedJobs: { select: { id: true, title: true, content: true, excerpt: true, metadata: true } },
            linkedEducation: { select: { id: true, title: true, content: true, excerpt: true, metadata: true } },
            linkedSkills: { select: { id: true, name: true, category: true } },
          },
        });
        return profile ? { objectType: 'profile', action: 'loaded', object: profile } : 'No GoApply profile has been set up.';
      },
    }),
    get_saved_answers: jobAssistantTool({
      description: 'Search the user\'s reusable job-application answers (e.g. "Why do you want to work here?" style Q&A), including which jobs each is attached to. Use this to reuse a past answer instead of writing one from scratch. Both params are optional — omit both to load all saved answers.',
      inputSchema: z.object({
        query: z.string().optional().describe('Case-insensitive substring to match against the question, answer, or category text.'),
        jobId: z.string().optional().describe('Restrict to answers attached to this specific tracked job application.'),
      }),
      execute: async ({ query, jobId }) => {
        if (jobId) await assertOwnedJob(prisma, userId, jobId);
        const answers = await prisma.savedAnswer.findMany({
          where: {
            userId,
            ...(jobId ? { jobs: { some: { id: jobId } } } : {}),
            ...(query ? { OR: [
              { question: { contains: query, mode: 'insensitive' } },
              { answer: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
            ] } : {}),
          },
          select: { id: true, question: true, answer: true, category: true, jobs: { select: { id: true, company: true, position: true } } },
          take: 25,
        });
        return { objectType: 'savedAnswer', action: 'loaded', objects: answers };
      },
    }),
    get_portfolio_item: jobAssistantTool({
      description: 'Load the full content of ONE portfolio project or experience post, by id, when you need more detail/evidence than an excerpt already in context provides (e.g. to write an accurate resume bullet or cover letter paragraph).',
      inputSchema: z.object({ contentId: z.string().describe('The id of the portfolio content item to load.') }),
      execute: async ({ contentId }) => {
        const item = await prisma.content.findFirst({
          where: { id: contentId, project: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } },
          select: { id: true, title: true, contentType: true, content: true, excerpt: true, metadata: true },
        });
        return item ? { objectType: 'portfolioItem', action: 'loaded', object: item } : 'Portfolio item not found or not accessible.';
      },
    }),
    save_resume: jobAssistantTool({
      description: 'Persist a resume: creates a brand-new resume, or fully overwrites an existing one if `resumeId` is included. `content` must always be the COMPLETE LaTeX source — this is a whole-document save, not a targeted edit, so include everything you want kept, not just what changed. Use get_resume first if you need to read/modify existing content before re-saving it. Omit `resumeId` to create; include it to update that resume (its prior content is snapshotted as a revision first).',
      inputSchema: z.object({
        resumeId: z.string().optional().describe('Omit to create a new resume. Include the id of an existing owned resume to overwrite it.'),
        name: z.string().min(1).max(255).describe('Display name for the resume.'),
        content: z.string().min(1).describe('The complete LaTeX resume source, from \\documentclass through \\end{document}. Not a partial snippet.'),
        jobDescription: optionalText,
        linkedJobId: optionalText.describe('Optional id of a tracked job application this resume is tailored for.'),
      }),
      execute: async ({ resumeId, name, content, jobDescription, linkedJobId }) => {
        await assertOwnedJob(prisma, userId, linkedJobId);
        let resume;
        let action;
        if (resumeId) {
          const existing = await prisma.resumeDocument.findFirst({ where: { id: resumeId, userId } });
          if (!existing) throw new Error('Resume not found or not accessible.');
          [, resume] = await prisma.$transaction([
            prisma.resumeDocumentRevision.create({ data: { documentId: existing.id, content: existing.content, jobDescription: existing.jobDescription } }),
            prisma.resumeDocument.update({ where: { id: existing.id }, data: { name, content, jobDescription: jobDescription ?? null, linkedJobId: linkedJobId ?? null } }),
          ]);
          action = 'updated';
        } else {
          resume = await prisma.resumeDocument.create({ data: { userId, name, content, jobDescription: jobDescription ?? null, linkedJobId: linkedJobId ?? null, chatHistory: [] } });
          action = 'created';
        }
        return { objectType: 'resume', action, object: { id: resume.id, name: resume.name, linkedJobId: resume.linkedJobId, updatedAt: resume.updatedAt } };
      },
    }),
    save_cover_letter: jobAssistantTool({
      description: 'Persist a cover letter: creates a brand-new one, or fully overwrites an existing one if `coverLetterId` is included. `content` must always be the COMPLETE LaTeX source — this is a whole-document save, not a targeted edit, so include everything you want kept, not just what changed. Use get_cover_letter first if you need to read/modify existing content before re-saving it. Omit `coverLetterId` to create; include it to update (its prior content is snapshotted as a revision first).',
      inputSchema: z.object({
        coverLetterId: z.string().optional().describe('Omit to create a new cover letter. Include the id of an existing owned cover letter to overwrite it.'),
        title: z.string().min(1).max(255).describe('Display title for the cover letter.'),
        content: z.string().min(1).describe('The complete LaTeX cover letter source, from \\documentclass through \\end{document}. Not a partial snippet.'),
        jobId: optionalText.describe('Optional id of a tracked job application this cover letter is tailored for.'),
      }),
      execute: async ({ coverLetterId, title, content, jobId }) => {
        await assertOwnedJob(prisma, userId, jobId);
        let letter;
        let action;
        if (coverLetterId) {
          const existing = await prisma.coverLetter.findFirst({ where: { id: coverLetterId, userId } });
          if (!existing) throw new Error('Cover letter not found or not accessible.');
          [, letter] = await prisma.$transaction([
            prisma.coverLetterRevision.create({ data: { coverLetterId: existing.id, content: existing.content } }),
            prisma.coverLetter.update({ where: { id: existing.id }, data: { title, content, jobId: jobId ?? null, generatedBy: 'job-assistant' } }),
          ]);
          action = 'updated';
        } else {
          letter = await prisma.coverLetter.create({ data: { userId, title, content, jobId: jobId ?? null, generatedBy: 'job-assistant' } });
          action = 'created';
        }
        return { objectType: 'coverLetter', action, object: { id: letter.id, title: letter.title, jobId: letter.jobId, updatedAt: letter.updatedAt } };
      },
    }),
    save_answers: jobAssistantTool({
      description: 'Create and/or update one or more reusable GoApply saved answers (Q&A pairs like "Why do you want to work here?") in a single call — pass multiple entries in `answers` at once rather than calling this repeatedly. Within each entry: omit `answerId` to create a new answer, include it to overwrite an existing owned one.',
      inputSchema: z.object({ answers: z.array(z.object({
        answerId: z.string().optional().describe('Omit to create a new saved answer. Include the id of an existing owned answer to overwrite it.'),
        question: z.string().min(1).describe('The application question this answer responds to.'),
        answer: z.string().min(1).describe('The full answer text.'),
        category: optionalText.describe('Optional grouping label, e.g. "behavioral" or "technical".'),
        jobIds: z.array(z.string()).max(50).optional().describe('Optional ids of tracked job applications this answer should be attached to.'),
      })).min(1).max(25).describe('One or more answers to save in this single call.') }),
      execute: async ({ answers }) => {
        const updateIds = answers.map((answer) => answer.answerId).filter(Boolean);
        if (updateIds.length) {
          const owned = await prisma.savedAnswer.findMany({ where: { userId, id: { in: updateIds } }, select: { id: true } });
          if (owned.length !== new Set(updateIds).size) throw new Error('One or more saved answers do not exist or are not accessible.');
        }
        const requestedJobIds = [...new Set(answers.flatMap((answer) => answer.jobIds || []))];
        if (requestedJobIds.length) {
          const ownedJobs = await prisma.jobApplication.count({ where: { userId, id: { in: requestedJobIds } } });
          if (ownedJobs !== requestedJobIds.length) throw new Error('One or more jobs do not exist or are not accessible.');
        }
        const saved = await prisma.$transaction(answers.map((answer) => {
          const jobs = answer.jobIds?.map((id) => ({ id }));
          return answer.answerId
            ? prisma.savedAnswer.update({ where: { id: answer.answerId }, data: { question: answer.question, answer: answer.answer, category: answer.category ?? null, ...(jobs ? { jobs: { set: jobs } } : {}) } })
            : prisma.savedAnswer.create({ data: { userId, question: answer.question, answer: answer.answer, category: answer.category ?? null, ...(jobs ? { jobs: { connect: jobs } } : {}) } });
        }));
        return { objectType: 'savedAnswer', action: updateIds.length === answers.length ? 'updated' : 'saved', objects: saved.map(({ id, question, category }) => ({ id, question, category })) };
      },
    }),
    update_goapply_profile: jobAssistantTool({
      description: 'Update the user\'s GoApply profile fields (contact info, work authorization, demographics, links, etc.) with facts EXPLICITLY provided or confirmed by the user — never infer or guess sensitive/personal values. Only pass the fields that are changing; omitted fields are left as-is. Not for experience/education/skills content — those are portfolio posts, not profile fields.',
      inputSchema: profileSchema,
      execute: async (fields) => {
        if (!Object.keys(fields).length) throw new Error('At least one profile field is required.');
        const profile = await prisma.userProfile.upsert({
          where: { userId }, update: fields, create: { userId, ...fields },
        });
        return { objectType: 'profile', action: 'updated', object: { id: profile.id, fields: Object.keys(fields) } };
      },
    }),
    save_skills: jobAssistantTool({
      description: 'Create or reuse Foligo skills by name, attach them to one writable Foligo project, and optionally also link them to the GoApply profile (via `linkToGoApplyProfile`). Use this for explicit requests to add/save skills at the project or profile level — NOT to attach skills to one specific portfolio post or experience role (that\'s add_skills_to_post / add_experience_role, defined elsewhere).',
      inputSchema: z.object({
        projectId: z.string().describe('The id of the Foligo project to attach these skills to. Requires write access.'),
        skills: z.array(z.object({ name: z.string().min(1).max(100).describe('Skill name, e.g. "TypeScript".'), category: optionalText.describe('Optional grouping label, e.g. "Languages".') })).min(1).max(30),
        linkToGoApplyProfile: z.boolean().optional().default(false).describe('If true, also link these skills to the user\'s GoApply profile, not just the project.'),
      }),
      execute: async ({ projectId, skills, linkToGoApplyProfile }) => {
        const project = await assertWritableProject(prisma, userId, projectId);
        const saved = [];
        for (const input of skills) {
          const name = input.name.trim();
          const category = input.category?.trim() || null;
          let skill = await prisma.skill.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, category } });
          if (!skill) skill = await prisma.skill.create({ data: { name, category } });
          saved.push(skill);
        }
        await prisma.project.update({ where: { id: project.id }, data: { skills: { connect: saved.map(({ id }) => ({ id })) } } });
        if (linkToGoApplyProfile) {
          await prisma.userProfile.upsert({
            where: { userId },
            create: { userId, linkedSkills: { connect: saved.map(({ id }) => ({ id })) } },
            update: { linkedSkills: { connect: saved.map(({ id }) => ({ id })) } },
          });
        }
        return { objectType: 'skill', action: 'saved', project: { id: project.id, name: project.name }, objects: saved.map(({ id, name, category }) => ({ id, name, category })) };
      },
    }),
    create_portfolio_items: jobAssistantTool({
      description: 'Create one or more brand-new Foligo portfolio posts (PROJECT, BLOG, or EXPERIENCE) as DRAFTS in a writable project, in a single call. Use for explicit requests to add portfolio content, projects, blog posts, or experience/education/certification records. Not for editing an existing post — there is no update tool in this set for that.',
      inputSchema: z.object({
        projectId: z.string().describe('The id of the Foligo project to create these posts in. Requires write access.'),
        items: z.array(z.object({
          contentType: z.enum(['PROJECT', 'BLOG', 'EXPERIENCE']).describe('The kind of post to create.'),
          title: z.string().min(1).max(255),
          excerpt: optionalText,
          content: z.string().min(1).describe('The full Markdown body of the post.'),
          experienceCategory: z.enum(['JOB', 'EDUCATION', 'CERTIFICATION']).nullable().optional().describe('EXPERIENCE posts only — the kind of experience this represents.'),
          location: optionalText.describe('EXPERIENCE posts only.'),
          locationType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable().optional().describe('EXPERIENCE posts only.'),
        })).min(1).max(10).describe('One or more posts to create in this single call.'),
      }),
      execute: async ({ projectId, items }) => {
        const project = await assertWritableProject(prisma, userId, projectId);
        const created = [];
        for (const item of items) {
          const baseSlug = slugify(item.title);
          const collision = await prisma.content.findFirst({ where: { slug: baseSlug }, select: { id: true } });
          const record = await prisma.content.create({ data: {
            projectId: project.id, type: item.contentType, contentType: item.contentType,
            title: item.title.trim(), slug: collision ? `${baseSlug}-${Date.now()}-${created.length}` : baseSlug,
            excerpt: item.excerpt?.trim() || null, content: item.content, status: 'DRAFT', contributors: [],
            experienceCategory: item.contentType === 'EXPERIENCE' ? item.experienceCategory ?? null : null,
            location: item.contentType === 'EXPERIENCE' ? item.location ?? null : null,
            locationType: item.contentType === 'EXPERIENCE' ? item.locationType ?? null : null,
          } });
          created.push(record);
        }
        return { objectType: 'portfolioItem', action: 'created', project: { id: project.id, name: project.name }, objects: created.map(({ id, title, contentType }) => ({ id, title, contentType })) };
      },
    }),
  };
}

module.exports = { createJobAssistantTools, jobAssistantTool, toJsonCompatible };
