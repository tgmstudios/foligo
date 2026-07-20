/**
 * Web search tool powered by SearXNG.
 *
 * Provides a `web_search` function that calls a SearXNG instance's JSON API.
 * Configuration priority:
 *   1. `baseUrl` passed explicitly to createWebSearchTool()
 *   2. SEARXNG_URL environment variable
 *   3. platform_settings table entry for 'searxng_url'
 *
 * Usage in Foligo agent tool sets:
 *   const { createWebSearchTool } = require('./web-search-tool');
 *   const webSearch = createWebSearchTool({ toolFn: tool, z });
 */

let _prisma = null;
function getPrisma() {
  if (!_prisma) {
    try {
      _prisma = require('../core/database').prisma;
    } catch { /* not available during tests */ }
  }
  return _prisma;
}

/**
 * @param {string} query
 * @param {object} options
 * @param {string} [options.baseUrl] - explicit override
 * @param {number} [options.limit=10] - max results
 * @returns {Promise<object>}
 */
async function webSearch(query, { baseUrl, limit = 10 } = {}) {
  let searxngUrl = baseUrl || process.env.SEARXNG_URL;

  // Fallback: try DB platform_settings
  if (!searxngUrl) {
    try {
      const prisma = getPrisma();
      if (prisma) {
        const setting = await prisma.platformSetting.findUnique({ where: { key: 'searxng_url' } });
        if (setting?.value) searxngUrl = setting.value;
      }
    } catch { /* ignore — will report not configured below */ }
  }

  if (!searxngUrl) {
    return { query, results: [], count: 0, error: 'SEARXNG_URL is not configured. Ask an admin to set it in Settings → Site Settings.' };
  }

  const url = new URL(`${searxngUrl}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('categories', 'general');
  url.searchParams.set('language', 'en');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return { query, results: [], count: 0, error: `Search returned HTTP ${response.status}` };
    }

    const data = await response.json();

    const results = (data.results || [])
      .slice(0, limit)
      .map((r) => ({
        title: r.title || '',
        url: r.url || '',
        content: r.content || '',
        engine: r.engine || (r.engines ? r.engines.join(',') : ''),
        score: typeof r.score === 'number' ? Math.round(r.score * 100) / 100 : null,
        publishedDate: r.publishedDate || null,
      }));

    return { query, results, count: results.length };
  } catch (error) {
    return { query, results: [], count: 0, error: `Search failed: ${error.name === 'AbortError' ? 'Timeout' : error.message}` };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Create a web_search tool compatible with the `ai` SDK's tool() function.
 *
 * @param {object} deps
 * @param {Function} deps.toolFn  - `tool()` from the `ai` SDK
 * @param {object}   deps.z       - `z` from `zod`
 * @param {string}   [deps.baseUrl] - override SEARXNG_URL (falls back to env)
 * @param {number}   [deps.limit=10] - max results per search
 * @returns {object} ai-sdk-compatible tool
 */
function createWebSearchTool({ toolFn, z, baseUrl, limit = 10 }) {
  return toolFn({
    description:
      'Search the public web (like a search engine) for current information, facts, documentation, or examples. ' +
      'Use this when you need up-to-date information that may not be in your training data, ' +
      'or when you need to verify technical details, look up APIs, or find real-world examples. ' +
      'Returns a list of result snippets with title, URL, source engine, and relevance score — it does NOT fetch a full page. ' +
      'To read the full content of one of the returned URLs (or any URL the user gives you), call pull_page next with that URL. ' +
      'Not for searching code inside a specific GitHub repository — use github_search_code for that.',
    inputSchema: z.object({
      query: z.string().min(1).max(500).describe('The search query — be specific and include relevant keywords.'),
    }),
    execute: async ({ query }) => {
      const result = await webSearch(query, { baseUrl, limit });
      return JSON.stringify(result);
    },
  });
}

module.exports = { webSearch, createWebSearchTool };
