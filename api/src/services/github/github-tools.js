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
        'STEP 1 of any GitHub lookup. List GitHub repositories accessible to the user’s connected GitHub account (their own and any they collaborate on, public and private). Call this FIRST whenever you need to browse, read, or search code and do not already know the exact `owner` and `repo` values — every other github_* tool requires those two strings and will fail on a guess.',
      inputSchema: z.object({
        query: z.string().optional().describe('Optional substring to filter repo names by, e.g. "portfolio". Omit to list all accessible repos.'),
      }),
      execute: async ({ query }) => githubService.listRepos(userId, { query }),
    }),
    github_browse_files: tool({
      description:
        'List files and folders in a GitHub repository at a given path and ref, like `ls`. Use this to explore a repo\'s structure or confirm a file\'s exact path BEFORE calling github_read_file — do not guess a path. Requires `owner`/`repo`; call github_list_repos first if you don\'t already have them. Omit `path` for the repo root, omit `ref` for the repo\'s default branch.',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner or organization login, e.g. "octocat". Get this from github_list_repos.'),
        repo: z.string().describe('Repository name only, without the owner prefix, e.g. "hello-world". Get this from github_list_repos.'),
        ref: z.string().optional().describe('Branch, tag, or commit SHA to browse. Omit to use the repository\'s default branch.'),
        path: z.string().optional().default('').describe('Directory path within the repo to list, e.g. "src/components". Omit to list the repo root.'),
      }),
      execute: async ({ owner, repo, ref, path }) => {
        const clonePath = await githubService.ensureClone({ userId, sessionKey, owner, repo, ref });
        return githubService.listDirFromClone(clonePath, path);
      },
    }),
    github_read_file: tool({
      description:
        'Read the full contents of ONE specific file from a GitHub repository at a given ref. Use this once you already know the exact file path (from github_browse_files or github_search_code) and need to see its contents — it does not list directories or search across files. Large files (>512KB) and binary files are refused.',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner or organization login, e.g. "octocat". Get this from github_list_repos.'),
        repo: z.string().describe('Repository name only, without the owner prefix, e.g. "hello-world". Get this from github_list_repos.'),
        ref: z.string().optional().describe('Branch, tag, or commit SHA to read from. Omit to use the repository\'s default branch.'),
        path: z.string().describe('Exact file path within the repo, e.g. "src/index.js".'),
      }),
      execute: async ({ owner, repo, ref, path }) => {
        const clonePath = await githubService.ensureClone({ userId, sessionKey, owner, repo, ref });
        const content = await githubService.readFileFromClone(clonePath, path);
        return { path, content };
      },
    }),
    github_search_code: tool({
      description:
        'Search for a text pattern across every file in a GitHub repository at a given ref, like `grep -r`. Use this to locate where a symbol, string, or pattern is defined or used when you do NOT already know the file path — then follow up with github_read_file to view the matching file(s). Not for reading a file you\'ve already located; use github_read_file for that.',
      inputSchema: z.object({
        owner: z.string().describe('Repository owner or organization login, e.g. "octocat". Get this from github_list_repos.'),
        repo: z.string().describe('Repository name only, without the owner prefix, e.g. "hello-world". Get this from github_list_repos.'),
        ref: z.string().optional().describe('Branch, tag, or commit SHA to search. Omit to use the repository\'s default branch.'),
        query: z.string().describe('Text or pattern to search for across all files in the repo.'),
      }),
      execute: async ({ owner, repo, ref, query }) => {
        const clonePath = await githubService.ensureClone({ userId, sessionKey, owner, repo, ref });
        return githubService.searchInClone(clonePath, query);
      },
    }),
  };
}

module.exports = { createGithubTools };
