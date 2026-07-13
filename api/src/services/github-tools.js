/**
 * Read-only GitHub tools for the in-app AI agents (cover letter, resume,
 * content, and job assistant chats — see api/src/routes/{goapply,resume,content}.js).
 * Backed by api/src/services/github-service.js, which clones repos locally
 * per chat session rather than fetching files one at a time.
 */
const { tool } = require('ai');
const { z } = require('zod');
const githubService = require('./github-service');

function createGithubTools({ userId, sessionKey }) {
  return {
    github_list_repos: tool({
      description:
        'List GitHub repositories accessible to the user’s connected GitHub account (their own and any they collaborate on, public and private). Use this first to find a repo’s exact owner/name before browsing or reading it.',
      inputSchema: z.object({
        query: z.string().optional().describe('Optional substring to filter repo names (e.g. "portfolio").'),
      }),
      execute: async ({ query }) => githubService.listRepos(userId, { query }),
    }),
    github_browse_files: tool({
      description:
        'List files and folders in a GitHub repository at a given path and ref (branch/tag/commit). Omit path for the repo root, omit ref for the default branch.',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner/organization login.'),
        repo: z.string().describe('Repository name.'),
        ref: z.string().optional().describe('Branch, tag, or commit SHA. Defaults to the repo default branch.'),
        path: z.string().optional().default('').describe('Directory path within the repo. Defaults to the root.'),
      }),
      execute: async ({ owner, repo, ref, path }) => {
        const clonePath = await githubService.ensureClone({ userId, sessionKey, owner, repo, ref });
        return githubService.listDirFromClone(clonePath, path);
      },
    }),
    github_read_file: tool({
      description:
        'Read the contents of a single file from a GitHub repository at a given ref. Large files (>512KB) and binary files are refused.',
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        ref: z.string().optional(),
        path: z.string().describe('File path within the repo, e.g. "src/index.js".'),
      }),
      execute: async ({ owner, repo, ref, path }) => {
        const clonePath = await githubService.ensureClone({ userId, sessionKey, owner, repo, ref });
        const content = await githubService.readFileFromClone(clonePath, path);
        return { path, content };
      },
    }),
    github_search_code: tool({
      description:
        'Search for a text pattern across files in a GitHub repository at a given ref (like grep). Use to locate where something is defined or used before reading specific files.',
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        ref: z.string().optional(),
        query: z.string().describe('Text or pattern to search for.'),
      }),
      execute: async ({ owner, repo, ref, query }) => {
        const clonePath = await githubService.ensureClone({ userId, sessionKey, owner, repo, ref });
        return githubService.searchInClone(clonePath, query);
      },
    }),
  };
}

module.exports = { createGithubTools };
