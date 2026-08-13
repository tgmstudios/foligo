/**
 * Foligo's model catalog, backed by models.dev — a community-maintained
 * public registry of AI provider/model metadata (the same source the Hermes
 * Agent project uses for its own model selection). Lets the admin panel show
 * every model a provider actually publishes, with real capability data
 * (reasoning/tools/vision/context limits), instead of the admin typing
 * model IDs by hand.
 *
 * Fetched once and cached in-memory — the full catalog is ~3.5MB across 180+
 * providers, far more than Foligo needs, so there's no reason to hit it on
 * every request.
 */

const MODELS_DEV_URL = 'https://models.dev/api.json';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Foligo provider type -> models.dev provider id(s) to source models from.
// 'codex' has no dedicated models.dev provider — signing in with a ChatGPT
// subscription (see oauth/openai-device-auth.js) grants access to the same
// model lineup as a regular OpenAI account, not just codex-branded ids, so
// it shares 'openai' as its source.
const PROVIDER_SOURCES = {
  gemini: ['google'],
  anthropic: ['anthropic'],
  openai: ['openai'],
  opencode: ['opencode-go'],
  ollama: ['ollama-cloud'],
  codex: ['openai'],
};

let cache = null; // { fetchedAt: number, data: object }

async function fetchRawCatalog() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data;
  const response = await fetch(MODELS_DEV_URL, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`models.dev responded with ${response.status}`);
  const data = await response.json();
  cache = { fetchedAt: Date.now(), data };
  return data;
}

function toEntry(id, model) {
  return {
    id,
    name: model.name,
    capabilities: {
      streaming: true,
      tools: !!model.tool_call,
      vision: !!model.modalities?.input?.includes('image'),
      json: !!model.structured_output,
      reasoning: !!model.reasoning,
      ...(model.limit?.output ? { maxTokens: model.limit.output } : {}),
    },
  };
}

function modelsFromSource(catalog, providerId) {
  const models = catalog[providerId]?.models || {};
  return Object.entries(models).map(([id, model]) => toEntry(id, model));
}

/**
 * Known models for a Foligo provider type, sourced from models.dev. Never
 * throws — returns [] on any failure (network down, models.dev unreachable,
 * unexpected shape) so callers can fall back to a static list instead of
 * breaking the admin panel over an enrichment feature.
 * @param {string} providerType
 * @returns {Promise<Array<{id: string, name?: string, capabilities?: object}>>}
 */
async function catalogModelsFor(providerType) {
  try {
    const catalog = await fetchRawCatalog();
    const merged = [];
    for (const sourceId of PROVIDER_SOURCES[providerType] || []) {
      for (const entry of modelsFromSource(catalog, sourceId)) {
        if (!merged.some(m => m.id === entry.id)) merged.push(entry);
      }
    }
    return merged;
  } catch {
    return [];
  }
}

module.exports = { catalogModelsFor };
