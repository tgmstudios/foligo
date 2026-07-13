const { tool } = require('ai');
const { z } = require('zod');

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
    where: { id: projectId, OR: [{ ownerId: userId }, { members: { some: { userId, role: { in: ['ADMIN', 'EDITOR'] } } } }] },
    select: { id: true, name: true },
  });
  if (!project) throw new Error('The Foligo project does not exist or you do not have write access.');
  return project;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'item';
}

function createJobAssistantTools(prisma, userId) {
  return {
    get_resume: jobAssistantTool({
      description: 'Load the full LaTeX content and job description of one of the user’s resumes. Use an ID from the available resume catalog.',
      inputSchema: z.object({ resumeId: z.string() }),
      execute: async ({ resumeId }) => {
        const resume = await prisma.resumeDocument.findFirst({
          where: { id: resumeId, userId },
          select: { id: true, name: true, content: true, jobDescription: true, linkedJobId: true, updatedAt: true },
        });
        return resume ? { objectType: 'resume', action: 'loaded', object: resume } : 'Resume not found or not accessible.';
      },
    }),
    get_cover_letter: jobAssistantTool({
      description: 'Load the full LaTeX source of one of the user’s cover letters. Use an ID from the available cover letter catalog.',
      inputSchema: z.object({ coverLetterId: z.string() }),
      execute: async ({ coverLetterId }) => {
        const letter = await prisma.coverLetter.findFirst({
          where: { id: coverLetterId, userId },
          select: { id: true, title: true, content: true, jobId: true, updatedAt: true },
        });
        return letter ? { objectType: 'coverLetter', action: 'loaded', object: letter } : 'Cover letter not found or not accessible.';
      },
    }),
    get_goapply_profile: jobAssistantTool({
      description: 'Load the user’s GoApply profile, linked experience, education, and skills when application details or background are needed.',
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
      description: 'Load the user’s reusable job-application answers, including their attached jobs. Filter by job ID when answers for one application are needed.',
      inputSchema: z.object({ query: z.string().optional(), jobId: z.string().optional() }),
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
      description: 'Load a portfolio project or experience item by ID when more evidence or detail is needed.',
      inputSchema: z.object({ contentId: z.string() }),
      execute: async ({ contentId }) => {
        const item = await prisma.content.findFirst({
          where: { id: contentId, project: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } },
          select: { id: true, title: true, contentType: true, content: true, excerpt: true, metadata: true },
        });
        return item ? { objectType: 'portfolioItem', action: 'loaded', object: item } : 'Portfolio item not found or not accessible.';
      },
    }),
    save_resume: jobAssistantTool({
      description: 'Create a resume or update an existing owned resume. Use this when the user asks to save resume content. Omit resumeId to create a new resume; include it to update that resume.',
      inputSchema: z.object({
        resumeId: z.string().optional(),
        name: z.string().min(1).max(255),
        content: z.string().min(1).describe('Complete LaTeX resume source.'),
        jobDescription: optionalText,
        linkedJobId: optionalText,
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
      description: 'Create a cover letter or update an existing owned cover letter. Use this when the user asks to save cover-letter content. Omit coverLetterId to create; include it to update.',
      inputSchema: z.object({
        coverLetterId: z.string().optional(), title: z.string().min(1).max(255),
        content: z.string().min(1).describe('Complete LaTeX cover letter source.'), jobId: optionalText,
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
      description: 'Create or update reusable GoApply saved answers. Use answerId to update an existing owned answer; omit it to create a new one. Save multiple answers together when appropriate.',
      inputSchema: z.object({ answers: z.array(z.object({
        answerId: z.string().optional(), question: z.string().min(1), answer: z.string().min(1), category: optionalText,
        jobIds: z.array(z.string()).max(50).optional(),
      })).min(1).max(25) }),
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
      description: 'Update the user’s scalar GoApply profile fields with facts explicitly provided or confirmed by the user. Never infer sensitive or personal values.',
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
      description: 'Create or reuse Foligo skills, attach them to one writable Foligo project, and optionally link them to the GoApply profile. Use this for explicit requests to create or save skills.',
      inputSchema: z.object({
        projectId: z.string(),
        skills: z.array(z.object({ name: z.string().min(1).max(100), category: optionalText })).min(1).max(30),
        linkToGoApplyProfile: z.boolean().optional().default(false),
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
      description: 'Create draft Foligo portfolio items in a writable project. Use this for explicit requests to create portfolio objects, projects, blog posts, or experience/education records.',
      inputSchema: z.object({
        projectId: z.string(),
        items: z.array(z.object({
          contentType: z.enum(['PROJECT', 'BLOG', 'EXPERIENCE']),
          title: z.string().min(1).max(255), excerpt: optionalText,
          content: z.string().min(1).describe('Markdown body.'),
          experienceCategory: z.enum(['JOB', 'EDUCATION', 'CERTIFICATION']).nullable().optional(),
          location: optionalText, locationType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable().optional(),
        })).min(1).max(10),
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
