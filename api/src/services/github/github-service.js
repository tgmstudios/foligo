/**
 * GitHub account access for the in-app AI agent tools (api/src/services/github-tools.js).
 *
 * Read-only by convention, not by GitHub-enforced scope: the connected token
 * (classic OAuth `repo` scope) is technically read/write-capable, so this
 * module must never call a GitHub write endpoint or a mutating git command.
 *
 * Repos are accessed via a shallow, per-session local clone rather than
 * per-file API calls — see ensureClone(). Clones live under CLONE_ROOT and
 * are not persistent: they're evicted by an idle TTL sweep or explicit
 * session/user cleanup.
 */
const { Octokit } = require('@octokit/rest');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { prisma } = require('../core/database');
const { decrypt } = require('../../utils/encryption');

const PROVIDER = 'github';
const CLONE_ROOT = process.env.GITHUB_CLONE_DIR || path.join(os.tmpdir(), 'github-clones');
const CLONE_TTL_MS = Number(process.env.GITHUB_CLONE_TTL_MS || 30 * 60 * 1000); // 30 min idle
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // mirrors sso-auth.js's sweep cadence
const MAX_REPO_SIZE_KB = Number(process.env.GITHUB_CLONE_MAX_REPO_SIZE_KB || 300000); // ~300MB (GitHub's repo.size is in KB)
const CLONE_TIMEOUT_MS = 60000;
const MAX_READ_FILE_BYTES = 512 * 1024; // 512KB — agent tool results should stay small
const MAX_SEARCH_MATCHES = 200;

// key: `${userId}:${sessionKey}:${owner}/${repo}@${ref}` -> { path, lastAccessed, promise? }
const cloneCache = new Map();

class GithubIntegrationError extends Error {
  constructor(message, { needsReconnect = false } = {}) {
    super(message);
    this.name = 'GithubIntegrationError';
    this.needsReconnect = needsReconnect;
  }
}

async function markRevoked(userId) {
  await prisma.userIntegration
    .updateMany({ where: { userId, provider: PROVIDER }, data: { status: 'revoked' } })
    .catch(() => {});
}

async function getIntegration(userId) {
  const integration = await prisma.userIntegration.findUnique({
    where: { userId_provider: { userId, provider: PROVIDER } },
  });

  if (!integration) {
    throw new GithubIntegrationError('No GitHub account is connected.', { needsReconnect: true });
  }
  if (integration.status === 'revoked') {
    throw new GithubIntegrationError('GitHub access was revoked.', { needsReconnect: true });
  }

  return integration;
}

async function getOctokitForUser(userId) {
  const integration = await getIntegration(userId);
  const token = decrypt(integration.accessToken);
  return { octokit: new Octokit({ auth: token }), token };
}

/** Runs a GitHub API call, marking the integration revoked on a 401 so future calls fail fast. */
async function withGithubErrorHandling(userId, fn) {
  try {
    return await fn();
  } catch (error) {
    if (error.status === 401) {
      await markRevoked(userId);
      throw new GithubIntegrationError('GitHub access was revoked. Reconnect GitHub from Settings.', {
        needsReconnect: true,
      });
    }
    if (error.status === 403) {
      throw new GithubIntegrationError('GitHub rate limit or permission error: ' + error.message);
    }
    if (error.status === 404) {
      throw new GithubIntegrationError('Repository not found or not accessible with the connected GitHub account.');
    }
    throw error;
  }
}

async function listRepos(userId, { query } = {}) {
  const { octokit } = await getOctokitForUser(userId);

  const repos = await withGithubErrorHandling(userId, async () => {
    const all = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
      per_page: 100,
      sort: 'updated',
      visibility: 'all',
    });
    return all.slice(0, 200);
  });

  await prisma.userIntegration.update({
    where: { userId_provider: { userId, provider: PROVIDER } },
    data: { lastValidatedAt: new Date() },
  });

  const filtered = query
    ? repos.filter((r) => r.full_name.toLowerCase().includes(query.toLowerCase()))
    : repos;

  return filtered.map((r) => ({
    owner: r.owner.login,
    repo: r.name,
    fullName: r.full_name,
    private: r.private,
    description: r.description,
    defaultBranch: r.default_branch,
    updatedAt: r.updated_at,
  }));
}

function cacheKey(userId, sessionKey, owner, repo, ref) {
  return `${userId}:${sessionKey}:${owner}/${repo}@${ref || 'default'}`;
}

/**
 * Ensures a shallow local clone of `owner/repo` at `ref` exists for this
 * (userId, sessionKey), cloning it if necessary, and returns its local path.
 * Concurrent calls for the same key await the same in-flight clone instead
 * of racing into duplicate clones.
 */
async function ensureClone({ userId, sessionKey, owner, repo, ref }) {
  const key = cacheKey(userId, sessionKey, owner, repo, ref);
  const cached = cloneCache.get(key);

  if (cached?.promise) return cached.promise;
  if (cached?.path) {
    cached.lastAccessed = Date.now();
    return cached.path;
  }

  const clonePromise = (async () => {
    const { octokit, token } = await getOctokitForUser(userId);

    const repoData = await withGithubErrorHandling(userId, async () => {
      const { data } = await octokit.rest.repos.get({ owner, repo });
      return data;
    });

    if (repoData.size > MAX_REPO_SIZE_KB) {
      throw new GithubIntegrationError(
        `Repository ${owner}/${repo} is too large to clone (${repoData.size}KB > ${MAX_REPO_SIZE_KB}KB limit).`
      );
    }

    const resolvedRef = ref || repoData.default_branch;
    const dest = path.join(CLONE_ROOT, `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(dest, { recursive: true });

    const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
    try {
      await runGit(
        ['clone', '--depth', '1', '--single-branch', '--branch', resolvedRef, '--no-tags', cloneUrl, dest],
        { cwd: CLONE_ROOT, timeout: CLONE_TIMEOUT_MS }
      );
    } catch (error) {
      await fs.rm(dest, { recursive: true, force: true }).catch(() => {});
      // The clone URL embeds the access token — never let it leak into an error message.
      throw new GithubIntegrationError(`Failed to clone ${owner}/${repo}@${resolvedRef}.`);
    }

    cloneCache.set(key, { path: dest, lastAccessed: Date.now() });
    return dest;
  })();

  cloneCache.set(key, { promise: clonePromise, lastAccessed: Date.now() });
  try {
    return await clonePromise;
  } catch (error) {
    cloneCache.delete(key);
    throw error;
  }
}

function runGit(args, { cwd, timeout }) {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, { cwd, timeout });
    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(stderr || `git exited with code ${code}`));
    });
  });
}

function resolveInClone(clonePath, relPath) {
  const resolved = path.resolve(clonePath, relPath || '.');
  if (resolved !== clonePath && !resolved.startsWith(clonePath + path.sep)) {
    throw new GithubIntegrationError('Path escapes the repository root.');
  }
  return resolved;
}

async function listDirFromClone(clonePath, relPath) {
  const target = resolveInClone(clonePath, relPath);
  const entries = await fs.readdir(target, { withFileTypes: true });
  return entries
    .filter((e) => e.name !== '.git')
    .map((e) => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }));
}

async function readFileFromClone(clonePath, relPath) {
  const target = resolveInClone(clonePath, relPath);
  const stat = await fs.stat(target);
  if (!stat.isFile()) {
    throw new GithubIntegrationError(`${relPath} is not a file.`);
  }
  if (stat.size > MAX_READ_FILE_BYTES) {
    throw new GithubIntegrationError(
      `${relPath} is too large to read (${stat.size} bytes > ${MAX_READ_FILE_BYTES} byte limit).`
    );
  }

  const buffer = await fs.readFile(target);
  if (buffer.subarray(0, 8000).includes(0)) {
    throw new GithubIntegrationError(`${relPath} appears to be a binary file and cannot be read as text.`);
  }
  return buffer.toString('utf8');
}

async function searchInClone(clonePath, query) {
  try {
    const output = await new Promise((resolve, reject) => {
      const proc = spawn('git', ['grep', '-n', '--', query], { cwd: clonePath });
      let stdout = '';
      proc.stdout.on('data', (d) => {
        stdout += d.toString();
      });
      proc.on('error', reject);
      proc.on('close', (code) => {
        // git grep exits 1 when there are no matches — not an error.
        if (code === 0 || code === 1) return resolve(stdout);
        reject(new Error(`git grep exited with code ${code}`));
      });
    });

    const lines = output.split('\n').filter(Boolean).slice(0, MAX_SEARCH_MATCHES);
    return lines.map((line) => {
      const [file, lineNumber, ...rest] = line.split(':');
      return { file, line: Number(lineNumber), text: rest.join(':').trim() };
    });
  } catch (error) {
    throw new GithubIntegrationError('Search failed: ' + error.message);
  }
}

async function cleanupSession(userId, sessionKey) {
  const prefix = `${userId}:${sessionKey}:`;
  await sweepKeys((key) => key.startsWith(prefix));
}

async function cleanupAllSessionsForUser(userId) {
  const prefix = `${userId}:`;
  await sweepKeys((key) => key.startsWith(prefix));
}

async function sweepKeys(matches) {
  const toDelete = [...cloneCache.entries()].filter(([key]) => matches(key));
  for (const [key, entry] of toDelete) {
    cloneCache.delete(key);
    if (entry.path) {
      await fs.rm(entry.path, { recursive: true, force: true }).catch(() => {});
    }
  }
}

async function sweepIdleClones() {
  const now = Date.now();
  const toDelete = [...cloneCache.entries()].filter(
    ([, entry]) => entry.path && now - entry.lastAccessed > CLONE_TTL_MS
  );
  for (const [key, entry] of toDelete) {
    cloneCache.delete(key);
    await fs.rm(entry.path, { recursive: true, force: true }).catch(() => {});
  }
}
setInterval(sweepIdleClones, SWEEP_INTERVAL_MS);

module.exports = {
  GithubIntegrationError,
  listRepos,
  ensureClone,
  listDirFromClone,
  readFileFromClone,
  searchInClone,
  cleanupSession,
  cleanupAllSessionsForUser,
};
