/**
 * Tool set for the agentic Markdown content editor (Editor Studio's "content"
 * adapter). Mirrors resume-editor-tools.js's shape: the Markdown-body tools
 * close over a shared mutable `doc` box so edits apply immediately and are
 * visible to later tool calls within the same agent run.
 *
 * The structured-field tools below (metadata, roles, skills, tags) are
 * scoped to this one post (`contentId`, closed over from the factory args)
 * and commit straight to Prisma — unlike `doc.content`, they aren't diffed
 * against the original at the end of the turn, so each call is immediate.
 * `list_other_posts` is read-only and project-scoped so the agent can be
 * useful for cross-referencing, but nothing here can write to any post
 * other than the one currently open in Studio.
 */
const { tool } = require('ai');
const { z } = require('zod');
const { createWebSearchTool } = require('../goapply/web-search-tool');
const { createPullPageTool } = require('../goapply/pull-page-tool');
const { prisma } = require('../core/database');
const { cache } = require('../core/redis');
const { invalidateContentCache } = require('../../utils/content-access');
const { snapshotContentRevision, buildContentFieldUpdate } = require('../../routes/content/content-crud');
const { matchOrCreateSkills, matchOrCreateTags } = require('./skill-tag-matcher');

const skillInput = z.object({ name: z.string(), category: z.string().optional() });
const tagInput = z.object({ name: z.string(), category: z.string().optional() });

// Tool results are replayed as ModelMessage content on the next agent step,
// which the AI SDK validates as JSON — Prisma rows carry Date instances
// (startDate/endDate/createdAt/updatedAt) that aren't JSON-safe on their own.
function toJsonCompatible(value) {
  return JSON.parse(JSON.stringify(value));
}

function jsonSafeTool(definition) {
  const execute = definition.execute;
  return tool({ ...definition, execute: async (...args) => toJsonCompatible(await execute(...args)) });
}

/**
 * @param {{ content: string }} doc - mutable box holding the current Markdown source
 * @param {{ contentId: string, projectId: string }} scope - the post this editor is open on
 */
function createContentEditorTools(doc, { contentId, projectId }) {
  const webSearch = createWebSearchTool({ toolFn: tool, z });
  const pullPage = createPullPageTool({ toolFn: tool, z });

  return {
    web_search: webSearch,
    pull_page: pullPage,
    write_content: tool({
      description: 'Replace the ENTIRE content body with new Markdown. Use this for a first draft or a large restructure where a targeted edit would be unwieldy.',
      inputSchema: z.object({
        markdown: z.string().describe('The complete new Markdown source for the content body.'),
      }),
      execute: async ({ markdown }) => {
        doc.content = markdown;
        return 'Content replaced.';
      },
    }),

    edit_content_section: tool({
      description: 'Make a targeted edit by replacing one exact, unique occurrence of existing Markdown text with new text. Prefer this over write_content for small changes. `search` must match the current content exactly and appear exactly once — quote it verbatim, whitespace included.',
      inputSchema: z.object({
        search: z.string().describe('The exact existing text to find (must be unique in the content).'),
        replace: z.string().describe('The text to replace it with.'),
      }),
      execute: async ({ search, replace }) => {
        const occurrences = doc.content.split(search).length - 1;
        if (occurrences === 0) {
          return `Edit failed: the search text was not found verbatim in the content. Re-check whitespace/formatting and try again, or use write_content.`;
        }
        if (occurrences > 1) {
          return `Edit failed: the search text matches ${occurrences} times. Include more surrounding context so it uniquely identifies one location.`;
        }
        doc.content = doc.content.replace(search, replace);
        return 'Edit applied.';
      },
    }),

    update_post_metadata: jsonSafeTool({
      description: 'Update this post\'s own fields: title, slug, excerpt, status (DRAFT/PUBLISHED/HIDDEN), and — for PROJECT/EXPERIENCE posts — dates, location, links, etc. Only the fields you pass are changed. Snapshots a revision first.',
      inputSchema: z.object({
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
      execute: async (fields) => {
        const existing = await prisma.content.findUnique({ where: { id: contentId } });
        await snapshotContentRevision(existing);
        const updateData = buildContentFieldUpdate(fields);
        await prisma.content.update({ where: { id: contentId }, data: updateData });
        await invalidateContentCache(cache, projectId, contentId);
        return { success: true, updatedFields: Object.keys(updateData) };
      },
    }),

    add_experience_role: jsonSafeTool({
      description: 'Add a new role to this EXPERIENCE post (e.g. a promotion or a distinct position held during the same job/education entry). Only valid on EXPERIENCE posts.',
      inputSchema: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().optional(),
        skills: z.array(skillInput).optional(),
      }),
      execute: async ({ title, description, startDate, endDate, isCurrent, skills }) => {
        const matchedSkills = await matchOrCreateSkills(prisma, skills || [], projectId);
        const role = await prisma.experienceRole.create({
          data: {
            contentId,
            title,
            description: description || null,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            isCurrent: isCurrent || false,
            skills: { connect: matchedSkills.map((s) => ({ id: s.id })) },
          },
          include: { skills: true },
        });
        await invalidateContentCache(cache, projectId, contentId);
        return { success: true, role };
      },
    }),

    update_experience_role: jsonSafeTool({
      description: "Update one of this post's existing experience roles: title, description, dates, current-status, or skill list (skills, if passed, replaces the role's full skill list).",
      inputSchema: z.object({
        roleId: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().nullable().optional(),
        isCurrent: z.boolean().optional(),
        skills: z.array(skillInput).optional(),
      }),
      execute: async ({ roleId, title, description, startDate, endDate, isCurrent, skills }) => {
        const role = await prisma.experienceRole.findFirst({ where: { id: roleId, contentId } });
        if (!role) return { error: `No role with id ${roleId} on this post.` };

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
        await invalidateContentCache(cache, projectId, contentId);
        return { success: true, role: updated };
      },
    }),

    delete_experience_role: jsonSafeTool({
      description: "Remove a role from this post.",
      inputSchema: z.object({ roleId: z.string().uuid() }),
      execute: async ({ roleId }) => {
        const role = await prisma.experienceRole.findFirst({ where: { id: roleId, contentId } });
        if (!role) return { error: `No role with id ${roleId} on this post.` };
        await prisma.experienceRole.delete({ where: { id: roleId } });
        await invalidateContentCache(cache, projectId, contentId);
        return { success: true };
      },
    }),

    add_skills_to_post: jsonSafeTool({
      description: 'Attach one or more skills to this post (finds an existing matching skill by name/category or creates it).',
      inputSchema: z.object({ skills: z.array(skillInput).min(1) }),
      execute: async ({ skills }) => {
        const matched = await matchOrCreateSkills(prisma, skills, projectId);
        await prisma.content.update({ where: { id: contentId }, data: { linkedSkills: { connect: matched.map((s) => ({ id: s.id })) } } });
        await invalidateContentCache(cache, projectId, contentId);
        return { success: true, skills: matched };
      },
    }),

    remove_skill_from_post: jsonSafeTool({
      description: 'Detach a skill from this post (the skill itself is not deleted, only unlinked from this post).',
      inputSchema: z.object({ skillId: z.string().uuid() }),
      execute: async ({ skillId }) => {
        await prisma.content.update({ where: { id: contentId }, data: { linkedSkills: { disconnect: { id: skillId } } } });
        await invalidateContentCache(cache, projectId, contentId);
        return { success: true };
      },
    }),

    add_tags_to_post: jsonSafeTool({
      description: 'Attach one or more tags to this post (finds an existing matching tag by name/category or creates it).',
      inputSchema: z.object({ tags: z.array(tagInput).min(1) }),
      execute: async ({ tags }) => {
        const matched = await matchOrCreateTags(prisma, tags, projectId);
        await prisma.content.update({ where: { id: contentId }, data: { tags: { connect: matched.map((t) => ({ id: t.id })) } } });
        await invalidateContentCache(cache, projectId, contentId);
        return { success: true, tags: matched };
      },
    }),

    remove_tag_from_post: jsonSafeTool({
      description: 'Detach a tag from this post (the tag itself is not deleted, only unlinked from this post).',
      inputSchema: z.object({ tagId: z.string().uuid() }),
      execute: async ({ tagId }) => {
        await prisma.content.update({ where: { id: contentId }, data: { tags: { disconnect: { id: tagId } } } });
        await invalidateContentCache(cache, projectId, contentId);
        return { success: true };
      },
    }),

    list_other_posts: jsonSafeTool({
      description: 'Search other posts in this portfolio project (read-only — for cross-referencing/context only; this editor can only ever modify the post currently open).',
      inputSchema: z.object({
        query: z.string().optional().describe('Case-insensitive substring to match against title or excerpt.'),
        contentType: z.enum(['BLOG', 'PROJECT', 'EXPERIENCE']).optional(),
      }),
      execute: async ({ query, contentType }) => {
        const posts = await prisma.content.findMany({
          where: {
            projectId,
            revisionOf: null,
            id: { not: contentId },
            ...(contentType ? { contentType } : {}),
            ...(query ? { OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { excerpt: { contains: query, mode: 'insensitive' } },
            ] } : {}),
          },
          select: { id: true, title: true, contentType: true, status: true, excerpt: true },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        });
        return { posts };
      },
    }),
  };
}

module.exports = { createContentEditorTools };
