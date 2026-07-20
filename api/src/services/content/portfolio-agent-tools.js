/**
 * Tool set for the whole-portfolio AI Content Creator agent. Unlike
 * content-editor-tools.js (which batches edits into a single mutable `doc`
 * box scoped to one open post), this agent ranges across every post in a
 * project — and every GoApply resume, cover letter, job application, saved
 * answer, and profile field belonging to the user — across a single
 * conversation, so each write tool commits directly to Prisma inside its own
 * `execute` — there's no single document to diff and persist at the end of
 * the turn.
 *
 * Every `propose_delete_*` tool and `navigate_to` never touch the database —
 * they return a descriptor the frontend acts on (a confirm/cancel card, or a
 * router.push), so destructive/navigational actions always go through a
 * client-side gate rather than executing unilaterally. GoApply's read/write
 * tools are largely reused as-is from job-assistant-tools.js (the existing,
 * proven per-job assistant agent) rather than reimplemented here.
 */
const { tool } = require('ai');
const { z } = require('zod');
const { prisma } = require('../core/database');
const { cache } = require('../core/redis');
const { CONTENT_INCLUDE, invalidateContentCache } = require('../../utils/content-access');
const { snapshotContentRevision, buildContentFieldUpdate } = require('../../routes/content/content-crud');
const { matchOrCreateSkills, matchOrCreateTags } = require('./skill-tag-matcher');
const { createWebSearchTool } = require('../goapply/web-search-tool');
const { createPullPageTool } = require('../goapply/pull-page-tool');
const { createJobAssistantTools } = require('../goapply/job-assistant-tools');

const skillInput = z.object({ name: z.string(), category: z.string().optional() });
const tagInput = z.object({ name: z.string(), category: z.string().optional() });

// Tool results are replayed as ModelMessage content on the next agent step,
// which the AI SDK validates as JSON — Prisma rows carry Date instances
// (startDate/endDate/createdAt/updatedAt) that aren't JSON-safe on their own.
function toJsonCompatible(value) {
  return JSON.parse(JSON.stringify(value));
}

function portfolioTool(definition) {
  const execute = definition.execute;
  return tool({ ...definition, execute: async (...args) => toJsonCompatible(await execute(...args)) });
}

const NAV_TARGETS = [
  'content-editor', 'studio-content', 'create-content-portfolio', 'blogs', 'projects-content', 'experience', 'portfolios',
  'goapply-kanban', 'goapply-jobs', 'goapply-assistant', 'goapply-resume', 'goapply-answers', 'goapply-letters', 'goapply-profile',
  'studio-resume', 'studio-cover-letter',
];
const JOB_STATUSES = new Set(['saved', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn', 'archived']);

function normalizeJobTags(tags) {
  if (tags === undefined) return undefined;
  if (!Array.isArray(tags)) return null;
  return [...new Set(tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean))].slice(0, 25);
}

/**
 * @param {{ projectId: string, userId: string }} scope - `projectId` scopes
 *   portfolio-post tools; `userId` scopes GoApply tools, which range across
 *   ALL of the user's projects/documents, not just this one.
 */
function createPortfolioAgentTools({ projectId, userId }) {
  const webSearch = createWebSearchTool({ toolFn: tool, z });
  const pullPage = createPullPageTool({ toolFn: tool, z });

  // GoApply tools already do everything a job-application assistant needs
  // (get/save resume, cover letter, profile, saved answers, skills) —
  // reuse them as-is. Drop web_search/pull_page (already have our own) and
  // create_portfolio_items/get_portfolio_item (redundant with create_post/
  // get_post/list_posts below, which are the canonical portfolio tools here).
  const { web_search: _ws, pull_page: _pp, create_portfolio_items, get_portfolio_item, ...goApplyTools } = createJobAssistantTools(prisma, userId);

  return {
    web_search: webSearch,
    pull_page: pullPage,

    list_posts: portfolioTool({
      description: 'Search or list posts (BLOG, PROJECT, or EXPERIENCE) in this portfolio project. Returns a compact summary of each match — use get_post to fetch full details for one before editing it.',
      inputSchema: z.object({
        query: z.string().optional().describe('Case-insensitive substring to match against title or excerpt. Omit to list everything.'),
        contentType: z.enum(['BLOG', 'PROJECT', 'EXPERIENCE']).optional(),
        status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
      }),
      execute: async ({ query, contentType, status }) => {
        const posts = await prisma.content.findMany({
          where: {
            projectId,
            revisionOf: null,
            ...(contentType ? { contentType } : {}),
            ...(status ? { status } : {}),
            ...(query ? { OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { excerpt: { contains: query, mode: 'insensitive' } },
            ] } : {}),
          },
          select: { id: true, title: true, contentType: true, status: true, excerpt: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        });
        return { posts };
      },
    }),

    get_post: portfolioTool({
      description: 'Fetch full details of one post: all fields, experience roles (with their skills), linked skills, tags, and custom meta.',
      inputSchema: z.object({ postId: z.string().uuid() }),
      execute: async ({ postId }) => {
        const post = await prisma.content.findFirst({ where: { id: postId, projectId }, include: CONTENT_INCLUDE });
        if (!post) return { error: `No post with id ${postId} found in this project.` };
        return { post };
      },
    }),

    create_post: portfolioTool({
      description: 'Create a brand-new post in this portfolio project, saved as a draft. Returns the new post id.',
      inputSchema: z.object({
        contentType: z.enum(['BLOG', 'PROJECT', 'EXPERIENCE']),
        title: z.string().min(1),
        content: z.string().min(1).describe('The full Markdown body.'),
        excerpt: z.string().optional(),
        skills: z.array(skillInput).optional(),
        tags: z.array(tagInput).optional(),
        startDate: z.string().optional().describe('ISO date. PROJECT/EXPERIENCE only.'),
        endDate: z.string().optional().describe('ISO date. PROJECT/EXPERIENCE only.'),
        isOngoing: z.boolean().optional(),
        featuredImage: z.string().optional().describe('PROJECT only.'),
        projectLinks: z.object({ github: z.string().optional(), devpost: z.string().optional(), other: z.array(z.string()).optional() }).optional().describe('PROJECT only.'),
        contributors: z.array(z.string()).optional().describe('PROJECT only.'),
        experienceCategory: z.enum(['JOB', 'EDUCATION', 'CERTIFICATION']).optional().describe('EXPERIENCE only.'),
        location: z.string().optional().describe('EXPERIENCE only.'),
        locationType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional().describe('EXPERIENCE only.'),
        roles: z.array(z.object({
          title: z.string(),
          description: z.string().optional(),
          startDate: z.string(),
          endDate: z.string().optional(),
          isCurrent: z.boolean().optional(),
          skills: z.array(skillInput).optional(),
        })).optional().describe('EXPERIENCE only — individual roles held during this experience.'),
      }),
      execute: async (input) => {
        const { contentType, title, content, excerpt, skills, tags, roles, ...typeFields } = input;

        let slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
        if (await prisma.content.findFirst({ where: { slug } })) slug = `${slug}-${Date.now()}`;

        await prisma.$transaction(async (tx) => {
          await tx.content.updateMany({ where: { projectId, status: { not: 'REVISION' }, revisionOf: null }, data: { order: { increment: 1 } } });
          await tx.postOrder.updateMany({ where: { projectId }, data: { order: { increment: 1 } } });
        });

        const contentData = {
          projectId, type: contentType, contentType, title, slug,
          excerpt: excerpt || content.substring(0, 200).replace(/\n/g, ' ').trim() + '...',
          content, order: 0, status: 'DRAFT',
        };
        if (typeFields.startDate) contentData.startDate = new Date(typeFields.startDate);
        if (typeFields.endDate) contentData.endDate = new Date(typeFields.endDate);
        if (typeFields.isOngoing !== undefined) contentData.isOngoing = typeFields.isOngoing;
        if (contentType === 'PROJECT') {
          if (typeFields.featuredImage) contentData.featuredImage = typeFields.featuredImage;
          if (typeFields.projectLinks) contentData.projectLinks = typeFields.projectLinks;
          if (typeFields.contributors) contentData.contributors = typeFields.contributors;
        }
        if (contentType === 'EXPERIENCE') {
          if (typeFields.experienceCategory) contentData.experienceCategory = typeFields.experienceCategory;
          if (typeFields.location) contentData.location = typeFields.location;
          if (typeFields.locationType) contentData.locationType = typeFields.locationType;
        }

        const newPost = await prisma.content.create({ data: contentData });
        await prisma.postOrder.create({ data: { projectId, contentId: newPost.id, order: 0 } });

        const matchedSkills = await matchOrCreateSkills(prisma, skills || [], projectId);
        if (matchedSkills.length) {
          await prisma.content.update({ where: { id: newPost.id }, data: { linkedSkills: { connect: matchedSkills.map((s) => ({ id: s.id })) } } });
        }
        const matchedTags = await matchOrCreateTags(prisma, tags || [], projectId);
        if (matchedTags.length) {
          await prisma.content.update({ where: { id: newPost.id }, data: { tags: { connect: matchedTags.map((t) => ({ id: t.id })) } } });
        }

        if (contentType === 'EXPERIENCE' && roles?.length) {
          for (const roleData of roles) {
            const roleSkills = await matchOrCreateSkills(prisma, roleData.skills || [], projectId);
            await prisma.experienceRole.create({
              data: {
                contentId: newPost.id,
                title: roleData.title,
                description: roleData.description || null,
                startDate: new Date(roleData.startDate),
                endDate: roleData.endDate ? new Date(roleData.endDate) : null,
                isCurrent: roleData.isCurrent || false,
                skills: { connect: roleSkills.map((s) => ({ id: s.id })) },
              },
            });
          }
        }

        await invalidateContentCache(cache, projectId, newPost.id);
        return { success: true, postId: newPost.id, title: newPost.title };
      },
    }),

    update_post_fields: portfolioTool({
      description: 'Update an existing post\'s STRUCTURED fields — title, slug, excerpt, status (DRAFT/PUBLISHED/HIDDEN), and, for PROJECT/EXPERIENCE posts, dates/location/links/etc. Does NOT touch the Markdown body — use update_post_content for that. Requires `postId`; use list_posts/get_post first if you don\'t have it. Only the fields you pass in are changed; omitted fields are left as-is. Snapshots a revision first, so this is safe to call speculatively.',
      inputSchema: z.object({
        postId: z.string().uuid(),
        title: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
        excerpt: z.string().optional(),
        status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().nullable().optional(),
        isOngoing: z.boolean().optional(),
        featuredImage: z.string().optional(),
        projectLinks: z.object({ github: z.string().optional(), devpost: z.string().optional(), other: z.array(z.string()).optional() }).optional(),
        contributors: z.array(z.string()).optional(),
        experienceCategory: z.enum(['JOB', 'EDUCATION', 'CERTIFICATION']).optional(),
        location: z.string().optional(),
        locationType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
      }),
      execute: async ({ postId, ...fields }) => {
        const existing = await prisma.content.findFirst({ where: { id: postId, projectId } });
        if (!existing) return { error: `No post with id ${postId} found in this project.` };
        await snapshotContentRevision(existing);
        const updateData = buildContentFieldUpdate(fields);
        await prisma.content.update({ where: { id: postId }, data: updateData });
        await invalidateContentCache(cache, projectId, postId);
        return { success: true, postId, updatedFields: Object.keys(updateData) };
      },
    }),

    update_post_content: portfolioTool({
      description: 'Edit the Markdown BODY of an existing post — the only tool that changes post content itself (not title/status/dates; use update_post_fields for those). Requires `postId`; call get_post first if you don\'t already have the post\'s CURRENT content in context. Two modes, chosen by the `mode` field:\n' +
        '  • mode: "edit" — TARGETED EDIT, PREFERRED for small changes (a sentence, a paragraph, a heading). Replaces exactly one occurrence of `search` with `replace`, leaving the rest of the body untouched. `search` must be copied verbatim (including whitespace) from the post\'s current content and must be unique — pass `markdown` as undefined/omitted in this mode.\n' +
        '  • mode: "replace" — WHOLE-BODY REPLACE. Overwrites the entire Markdown body with `markdown` — anything not included is discarded. Use ONLY for a first draft or a large restructure touching most of the body — pass `search`/`replace` as undefined/omitted in this mode.\n' +
        'Snapshots a revision first, so edits are always recoverable.',
      inputSchema: z.object({
        postId: z.string().uuid().describe('The id of the post to edit, from list_posts or get_post.'),
        mode: z.enum(['replace', 'edit']).describe('"edit" for a targeted search/replace change, "replace" to overwrite the whole body.'),
        markdown: z.string().optional().describe('ONLY for mode "replace": the complete new Markdown body, replacing the entire current body. Omit when mode is "edit".'),
        search: z.string().optional().describe('ONLY for mode "edit": the exact existing text to find, copied verbatim (including whitespace) from the post\'s current body. Must appear exactly once. Omit when mode is "replace".'),
        replace: z.string().optional().describe('ONLY for mode "edit": the new text that replaces `search` in place. Omit when mode is "replace".'),
      }),
      execute: async ({ postId, mode, markdown, search, replace }) => {
        const existing = await prisma.content.findFirst({ where: { id: postId, projectId } });
        if (!existing) return { error: `No post with id ${postId} found in this project.` };

        let newContent;
        if (mode === 'replace') {
          if (!markdown) return { error: 'markdown is required when mode is "replace". If you meant to make a small targeted change instead, use mode "edit" with search/replace.' };
          newContent = markdown;
        } else {
          if (!search || replace === undefined) return { error: 'search and replace are required when mode is "edit". If you meant to overwrite the whole body, use mode "replace" with markdown.' };
          const occurrences = existing.content.split(search).length - 1;
          if (occurrences === 0) return { error: 'The search text was not found verbatim in the post content. Re-check whitespace/formatting against the post\'s current content (call get_post if unsure), or use mode "replace".' };
          if (occurrences > 1) return { error: `The search text matches ${occurrences} times — include more surrounding context so it uniquely identifies one location.` };
          newContent = existing.content.replace(search, replace);
        }

        await snapshotContentRevision(existing);
        await prisma.content.update({ where: { id: postId }, data: { content: newContent } });
        await invalidateContentCache(cache, projectId, postId);
        return { success: true, postId, mode, message: mode === 'replace' ? 'The entire post body was replaced.' : `Replaced the matched text with "${replace.length > 120 ? `${replace.slice(0, 120)}…` : replace}". The rest of the body is unchanged.` };
      },
    }),

    add_experience_role: portfolioTool({
      description: 'Add a new role to an EXPERIENCE post (e.g. a promotion or a distinct position held during the same job/education entry).',
      inputSchema: z.object({
        postId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().optional(),
        skills: z.array(skillInput).optional(),
      }),
      execute: async ({ postId, title, description, startDate, endDate, isCurrent, skills }) => {
        const post = await prisma.content.findFirst({ where: { id: postId, projectId, contentType: 'EXPERIENCE' } });
        if (!post) return { error: `No EXPERIENCE post with id ${postId} found in this project.` };
        const matchedSkills = await matchOrCreateSkills(prisma, skills || [], projectId);
        const role = await prisma.experienceRole.create({
          data: {
            contentId: postId,
            title,
            description: description || null,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            isCurrent: isCurrent || false,
            skills: { connect: matchedSkills.map((s) => ({ id: s.id })) },
          },
          include: { skills: true },
        });
        await invalidateContentCache(cache, projectId, postId);
        return { success: true, postId, role };
      },
    }),

    update_experience_role: portfolioTool({
      description: "Update an EXISTING experience role's title, description, dates, current-status, or skill list (skills, if passed, replaces the role's full skill list). Requires `roleId` from an already-existing role (get_post includes each EXPERIENCE post's roles) — use add_experience_role instead if the role doesn't exist yet.",
      inputSchema: z.object({
        roleId: z.string().uuid().describe('The id of the existing experience role to update, from get_post.'),
        title: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().nullable().optional(),
        isCurrent: z.boolean().optional(),
        skills: z.array(skillInput).optional(),
      }),
      execute: async ({ roleId, title, description, startDate, endDate, isCurrent, skills }) => {
        const role = await prisma.experienceRole.findFirst({ where: { id: roleId, content: { projectId } } });
        if (!role) return { error: `No experience role with id ${roleId} found in this project.` };

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (isCurrent !== undefined) updateData.isCurrent = isCurrent;
        if (skills !== undefined) {
          const matchedSkills = await matchOrCreateSkills(prisma, skills, projectId);
          updateData.skills = { set: matchedSkills.map((s) => ({ id: s.id })) };
        }

        const updated = await prisma.experienceRole.update({ where: { id: roleId }, data: updateData, include: { skills: true } });
        await invalidateContentCache(cache, projectId, role.contentId);
        return { success: true, postId: role.contentId, role: updated };
      },
    }),

    delete_experience_role: portfolioTool({
      description: 'Permanently remove a role from an experience post. (This is a role within a post, not a whole post — it does not require confirmation the way propose_delete_post does, since it can\'t be undone through this agent, confirm with the user before calling if removal wasn\'t explicitly requested.)',
      inputSchema: z.object({ roleId: z.string().uuid().describe('The id of the existing experience role to delete, from get_post.') }),
      execute: async ({ roleId }) => {
        const role = await prisma.experienceRole.findFirst({ where: { id: roleId, content: { projectId } } });
        if (!role) return { error: `No experience role with id ${roleId} found in this project.` };
        await prisma.experienceRole.delete({ where: { id: roleId } });
        await invalidateContentCache(cache, projectId, role.contentId);
        return { success: true, postId: role.contentId };
      },
    }),

    add_skills_to_post: portfolioTool({
      description: 'Attach one or more skills to a post\'s top-level skill list (finds an existing matching skill by name/category or creates a new one). This is separate from a role\'s own `skills` field on add_experience_role/update_experience_role — use this for the post overall, not for one specific role.',
      inputSchema: z.object({ postId: z.string().uuid().describe('The id of the post to attach skills to.'), skills: z.array(skillInput).min(1).describe('Skills to attach, e.g. [{ name: "TypeScript" }].') }),
      execute: async ({ postId, skills }) => {
        const post = await prisma.content.findFirst({ where: { id: postId, projectId } });
        if (!post) return { error: `No post with id ${postId} found in this project.` };
        const matched = await matchOrCreateSkills(prisma, skills, projectId);
        await prisma.content.update({ where: { id: postId }, data: { linkedSkills: { connect: matched.map((s) => ({ id: s.id })) } } });
        await invalidateContentCache(cache, projectId, postId);
        return { success: true, postId, skills: matched };
      },
    }),

    remove_skill_from_post: portfolioTool({
      description: 'Detach a skill from a post\'s top-level skill list (the skill itself is not deleted, only unlinked from this post). Requires the skill\'s id, not its name — get it from get_post.',
      inputSchema: z.object({ postId: z.string().uuid().describe('The id of the post to detach the skill from.'), skillId: z.string().uuid().describe("The id of the skill to unlink, from get_post's linked-skills list.") }),
      execute: async ({ postId, skillId }) => {
        const post = await prisma.content.findFirst({ where: { id: postId, projectId } });
        if (!post) return { error: `No post with id ${postId} found in this project.` };
        await prisma.content.update({ where: { id: postId }, data: { linkedSkills: { disconnect: { id: skillId } } } });
        await invalidateContentCache(cache, projectId, postId);
        return { success: true, postId };
      },
    }),

    add_tags_to_post: portfolioTool({
      description: 'Attach one or more tags to a post (finds an existing matching tag by name/category or creates a new one).',
      inputSchema: z.object({ postId: z.string().uuid().describe('The id of the post to attach tags to.'), tags: z.array(tagInput).min(1).describe('Tags to attach, e.g. [{ name: "Open Source" }].') }),
      execute: async ({ postId, tags }) => {
        const post = await prisma.content.findFirst({ where: { id: postId, projectId } });
        if (!post) return { error: `No post with id ${postId} found in this project.` };
        const matched = await matchOrCreateTags(prisma, tags, projectId);
        await prisma.content.update({ where: { id: postId }, data: { tags: { connect: matched.map((t) => ({ id: t.id })) } } });
        await invalidateContentCache(cache, projectId, postId);
        return { success: true, postId, tags: matched };
      },
    }),

    remove_tag_from_post: portfolioTool({
      description: 'Detach a tag from a post (the tag itself is not deleted, only unlinked from this post). Requires the tag\'s id, not its name — get it from get_post.',
      inputSchema: z.object({ postId: z.string().uuid().describe('The id of the post to detach the tag from.'), tagId: z.string().uuid().describe("The id of the tag to unlink, from get_post's tags list.") }),
      execute: async ({ postId, tagId }) => {
        const post = await prisma.content.findFirst({ where: { id: postId, projectId } });
        if (!post) return { error: `No post with id ${postId} found in this project.` };
        await prisma.content.update({ where: { id: postId }, data: { tags: { disconnect: { id: tagId } } } });
        await invalidateContentCache(cache, projectId, postId);
        return { success: true, postId };
      },
    }),

    propose_delete_post: portfolioTool({
      description: 'Propose deleting a post. This NEVER deletes anything itself — it only surfaces the post\'s details so the dashboard can show the user a Confirm/Cancel prompt; the user must click Confirm themselves before anything is removed. After calling this, stop and wait — do not tell the user the post was deleted, and do not call this tool again for the same post unless they explicitly ask again.',
      inputSchema: z.object({ postId: z.string().uuid() }),
      execute: async ({ postId }) => {
        const post = await prisma.content.findFirst({ where: { id: postId, projectId }, select: { id: true, title: true, contentType: true } });
        if (!post) return { error: `No post with id ${postId} found in this project.` };
        return { requiresConfirmation: true, kind: 'post', id: post.id, label: post.title, description: `${post.contentType} post`, deleteEndpoint: `/content/${post.id}` };
      },
    }),

    // ── GoApply: list + save_job_application + delete proposals ──
    // (get/save resume, cover letter, profile, saved answers, and skills
    // come from goApplyTools, merged in below.)

    list_resumes: portfolioTool({
      description: 'List the user\'s resumes (metadata only — id, name, linked job, template/default flags). Use get_resume for full LaTeX content.',
      inputSchema: z.object({}),
      execute: async () => {
        const resumes = await prisma.resumeDocument.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true, name: true, jobDescription: true, linkedJobId: true,
            linkedJob: { select: { id: true, company: true, position: true, category: true } },
            isTemplate: true, isDefault: true, updatedAt: true,
          },
        });
        return { resumes };
      },
    }),

    list_cover_letters: portfolioTool({
      description: 'List the user\'s cover letters (metadata only). Use get_cover_letter for full LaTeX content.',
      inputSchema: z.object({}),
      execute: async () => {
        const letters = await prisma.coverLetter.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true, title: true, jobId: true, isTemplate: true, isDefault: true, updatedAt: true,
            job: { select: { id: true, company: true, position: true, category: true } },
          },
        });
        return { coverLetters: letters };
      },
    }),

    list_job_applications: portfolioTool({
      description: 'List the user\'s tracked job applications (the GoApply kanban/tracker), optionally filtered by status.',
      inputSchema: z.object({
        status: z.enum(['saved', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn', 'archived']).optional(),
      }),
      execute: async ({ status }) => {
        const jobs = await prisma.jobApplication.findMany({
          where: { userId, ...(status ? { status } : {}) },
          orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        });
        return { jobApplications: jobs };
      },
    }),

    save_job_application: portfolioTool({
      description: 'Create a new tracked job application, or update an existing owned one. Omit jobId to create; include it to update. Company and position are required when creating.',
      inputSchema: z.object({
        jobId: z.string().uuid().optional(),
        company: z.string().min(1).optional(),
        position: z.string().min(1).optional(),
        url: z.string().optional(),
        status: z.enum(['saved', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn', 'archived']).optional(),
        notes: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).max(25).optional(),
        appliedAt: z.string().optional(),
        referredBy: z.string().optional(),
      }),
      execute: async ({ jobId, company, position, url, status, notes, category, tags, appliedAt, referredBy }) => {
        const normalizedTags = normalizeJobTags(tags);
        if (normalizedTags === null) return { error: 'Tags must be an array of strings.' };

        if (jobId) {
          const existing = await prisma.jobApplication.findFirst({ where: { id: jobId, userId } });
          if (!existing) return { error: `No job application with id ${jobId} found for this user.` };
          const data = {};
          if (company !== undefined) data.company = company;
          if (position !== undefined) data.position = position;
          if (url !== undefined) data.url = url;
          if (status !== undefined) data.status = status;
          if (notes !== undefined) data.notes = notes;
          if (category !== undefined) data.category = category.trim() || null;
          if (normalizedTags !== undefined) data.tags = normalizedTags;
          if (appliedAt !== undefined) data.appliedAt = appliedAt ? new Date(appliedAt) : null;
          if (referredBy !== undefined) data.referredBy = referredBy;
          const job = await prisma.jobApplication.update({ where: { id: jobId }, data });
          return { success: true, action: 'updated', jobApplication: job };
        }

        if (!company || !position) return { error: 'company and position are required to create a job application.' };
        const job = await prisma.jobApplication.create({
          data: {
            userId, company, position, url: url || null, status: status || 'saved',
            notes: notes || null, category: category?.trim() || null, tags: normalizedTags || [],
            referredBy: referredBy || null, appliedAt: appliedAt ? new Date(appliedAt) : null,
          },
        });
        return { success: true, action: 'created', jobApplication: job };
      },
    }),

    propose_delete_resume: portfolioTool({
      description: 'Propose deleting a resume. Never deletes itself — surfaces a Confirm/Cancel prompt; the user must confirm. After calling this, stop and wait.',
      inputSchema: z.object({ resumeId: z.string() }),
      execute: async ({ resumeId }) => {
        const resume = await prisma.resumeDocument.findFirst({ where: { id: resumeId, userId }, select: { id: true, name: true } });
        if (!resume) return { error: `No resume with id ${resumeId} found for this user.` };
        return { requiresConfirmation: true, kind: 'resume', id: resume.id, label: resume.name, description: 'resume', deleteEndpoint: `/resume/documents/${resume.id}` };
      },
    }),

    propose_delete_cover_letter: portfolioTool({
      description: 'Propose deleting a cover letter. Never deletes itself — surfaces a Confirm/Cancel prompt; the user must confirm. After calling this, stop and wait.',
      inputSchema: z.object({ coverLetterId: z.string() }),
      execute: async ({ coverLetterId }) => {
        const letter = await prisma.coverLetter.findFirst({ where: { id: coverLetterId, userId }, select: { id: true, title: true } });
        if (!letter) return { error: `No cover letter with id ${coverLetterId} found for this user.` };
        return { requiresConfirmation: true, kind: 'coverLetter', id: letter.id, label: letter.title, description: 'cover letter', deleteEndpoint: `/goapply/cover-letters/${letter.id}` };
      },
    }),

    propose_delete_job_application: portfolioTool({
      description: 'Propose deleting a tracked job application. Never deletes itself — surfaces a Confirm/Cancel prompt; the user must confirm. After calling this, stop and wait.',
      inputSchema: z.object({ jobId: z.string().uuid() }),
      execute: async ({ jobId }) => {
        const job = await prisma.jobApplication.findFirst({ where: { id: jobId, userId }, select: { id: true, company: true, position: true } });
        if (!job) return { error: `No job application with id ${jobId} found for this user.` };
        return { requiresConfirmation: true, kind: 'jobApplication', id: job.id, label: `${job.position} at ${job.company}`, description: 'job application', deleteEndpoint: `/goapply/jobs/${job.id}` };
      },
    }),

    propose_delete_saved_answer: portfolioTool({
      description: 'Propose deleting a saved GoApply answer. Never deletes itself — surfaces a Confirm/Cancel prompt; the user must confirm. After calling this, stop and wait.',
      inputSchema: z.object({ answerId: z.string() }),
      execute: async ({ answerId }) => {
        const answer = await prisma.savedAnswer.findFirst({ where: { id: answerId, userId }, select: { id: true, question: true } });
        if (!answer) return { error: `No saved answer with id ${answerId} found for this user.` };
        return { requiresConfirmation: true, kind: 'savedAnswer', id: answer.id, label: answer.question, description: 'saved answer', deleteEndpoint: `/goapply/answers/${answer.id}` };
      },
    }),

    navigate_to: portfolioTool({
      description: 'NAVIGATION ONLY: sends the user\'s browser to a page in the dashboard. It does not read, create, or modify any data — call this AFTER any get/list/create/update tool you need, once you have the ids it requires. Use it whenever the user asks to see, open, or go to something.\n' +
        'Portfolio targets: "content-editor"/"studio-content" (require `postId` — get it from list_posts/get_post/create_post first), "create-content-portfolio" (requires `contentType`), or list views "blogs"/"projects-content"/"experience"/"portfolios" (no params).\n' +
        'GoApply targets: "goapply-kanban"/"goapply-jobs" (job tracker), "goapply-resume" (resume gallery), "goapply-letters" (cover letters), "goapply-answers" (saved answers), "goapply-profile", "goapply-assistant" (job assistant chat) — none of these need params. "studio-resume" requires `resumeId` (from list_resumes) and "studio-cover-letter" requires `coverLetterId` (from list_cover_letters).',
      inputSchema: z.object({
        target: z.enum(NAV_TARGETS),
        postId: z.string().uuid().optional(),
        contentType: z.enum(['BLOG', 'PROJECT', 'EXPERIENCE']).optional(),
        resumeId: z.string().optional(),
        coverLetterId: z.string().optional(),
      }),
      execute: async ({ target, postId, contentType, resumeId, coverLetterId }) => {
        if (target === 'content-editor' || target === 'studio-content') {
          if (!postId) return { error: `Target "${target}" requires a postId — use list_posts or get_post to find it first.` };
          return { action: 'navigate', routeName: target, params: { projectId, id: postId } };
        }
        if (target === 'create-content-portfolio') {
          if (!contentType) return { error: `Target "${target}" requires a contentType.` };
          return { action: 'navigate', routeName: target, params: { projectId, type: contentType } };
        }
        if (target === 'studio-resume') {
          if (!resumeId) return { error: `Target "${target}" requires a resumeId — use list_resumes to find it first.` };
          return { action: 'navigate', routeName: target, params: { id: resumeId } };
        }
        if (target === 'studio-cover-letter') {
          if (!coverLetterId) return { error: `Target "${target}" requires a coverLetterId — use list_cover_letters to find it first.` };
          return { action: 'navigate', routeName: target, params: { id: coverLetterId } };
        }
        return { action: 'navigate', routeName: target, params: {} };
      },
    }),

    ...goApplyTools,
  };
}

module.exports = { createPortfolioAgentTools };
