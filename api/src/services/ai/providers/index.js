/**
 * AI Provider Registry & Factory
 *
 * Builds model-agnostic LanguageModel instances (from the `ai` SDK) for:
 *   - gemini    → Google Gemini (@ai-sdk/google)
 *   - openai    → OpenAI (@ai-sdk/openai-compatible)
 *   - opencode  → OpenCode Go — OpenCode Zen's hosted "Go" tier
 *                 (@ai-sdk/openai-compatible, default opencode.ai/zen/go/v1,
 *                 auth via OPENCODE_API_KEY — see models.dev's "opencode-go"
 *                 entry). Override AI_OPENCODE_ENDPOINT to talk to a local
 *                 `opencode serve` instead.
 *   - codex     → OpenAI Codex, via "Sign in with ChatGPT" (@ai-sdk/openai,
 *                 Responses API — codex-rs removed Chat Completions support
 *                 entirely, see codex-rs/model-provider-info). Hits
 *                 chatgpt.com/backend-api/codex when OAuth-authenticated
 *                 (see oauth/openai-device-auth.js), or api.openai.com/v1
 *                 with a plain API key.
 *   - ollama    → Ollama (@ai-sdk/openai-compatible, default localhost:11434)
 *   - anthropic → Anthropic Claude (@ai-sdk/anthropic)
 *   - custom    → Any OpenAI-compatible endpoint
 *
 * Every provider returns the same shape — { name, displayName, model, capabilities } —
 * so AIManager can call the SDK's generateText identically regardless of which
 * backend is actually serving the request. Tool schemas are defined once
 * (see ../ai/tools.js) and converted per-provider by the SDK itself.
 *
 * Precedence for each provider:
 *   1. Explicit config passed to factory
 *   2. Environment variables (AI_{PROVIDER}_*)
 *   3. Sensible defaults
 */

const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { createAnthropic } = require('@ai-sdk/anthropic');
const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');
const { createOpenAI } = require('@ai-sdk/openai');
const { catalogModelsFor } = require('../model-catalog');

// Real OpenAI endpoints for codex (see codex-rs/model-provider-info/src/lib.rs):
// ChatGPT-OAuth sessions call the ChatGPT backend; API-key sessions call the
// regular platform API. Both speak the Responses API, not Chat Completions.
const CHATGPT_CODEX_BASE_URL = 'https://chatgpt.com/backend-api/codex';
const OPENAI_API_BASE_URL = 'https://api.openai.com/v1';

/** Preset configurations for well-known providers */
const PRESETS = {
  opencode: {
    // Real hosted endpoint (opencode.ai/zen/go/v1) per models.dev's
    // "opencode-go" entry — not a self-hosted-only placeholder. Override
    // AI_OPENCODE_ENDPOINT if pointing at a local `opencode serve` instead.
    endpoint: process.env.AI_OPENCODE_ENDPOINT || 'https://opencode.ai/zen/go/v1',
    apiKey: process.env.AI_OPENCODE_API_KEY || null,
    model: process.env.AI_OPENCODE_MODEL || 'deepseek-v4-flash',
  },
  codex: {
    // No fixed default endpoint — createProvider() picks the real one
    // (ChatGPT backend vs. platform API) based on how this provider is
    // authenticated. Only set here if an admin explicitly overrides it.
    endpoint: process.env.AI_CODEX_ENDPOINT || null,
    apiKey: process.env.AI_CODEX_API_KEY || null,
    model: process.env.AI_CODEX_MODEL || 'gpt-5.1-codex',
  },
  ollama: {
    endpoint: process.env.AI_OLLAMA_ENDPOINT || 'http://127.0.0.1:11434/v1',
    apiKey: process.env.AI_OLLAMA_API_KEY || 'ollama',
    model: process.env.AI_OLLAMA_MODEL || 'llama3.1',
  },
  openai: {
    endpoint: process.env.AI_OPENAI_ENDPOINT || 'https://api.openai.com/v1',
    apiKey: process.env.AI_OPENAI_API_KEY,
    model: process.env.AI_OPENAI_MODEL || 'gpt-4o-mini',
  },
  gemini: {
    apiKey: process.env.AI_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    model: process.env.AI_GEMINI_MODEL || 'gemini-flash-latest',
    baseUrl: process.env.AI_GEMINI_BASE_URL,
  },
  anthropic: {
    apiKey: process.env.AI_ANTHROPIC_API_KEY,
    model: process.env.AI_ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    baseUrl: process.env.AI_ANTHROPIC_BASE_URL,
  },
  custom: {
    endpoint: process.env.AI_CUSTOM_ENDPOINT || 'http://127.0.0.1:8080/v1',
    apiKey: process.env.AI_CUSTOM_API_KEY || null,
    model: process.env.AI_CUSTOM_MODEL || 'default',
    headers: process.env.AI_CUSTOM_HEADERS ? JSON.parse(process.env.AI_CUSTOM_HEADERS) : {},
  },
};

const OPENAI_COMPATIBLE_LABEL = { opencode: 'OpenCode', ollama: 'Ollama', openai: 'OpenAI' };

/** Provider types that expose an OpenAI-compatible GET /models listing endpoint. */
const DISCOVERABLE_TYPES = ['openai', 'opencode', 'codex', 'ollama', 'custom'];

/**
 * Last-resort fallback model list, used only if the models.dev catalog
 * (see ../model-catalog.js) is unreachable too — e.g. no outbound internet
 * from this deployment. Keeps the admin panel showing *something* instead of
 * erroring out when neither the live provider endpoint nor models.dev can
 * be reached.
 */
const KNOWN_MODELS = {
  gemini: ['gemini-flash-latest'],
  anthropic: ['claude-sonnet-4-20250514'],
  opencode: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  codex: ['gpt-5.1-codex'],
};

// Safety settings: only consulted by the Google provider (passed through
// providerOptions.google.safetySettings); harmlessly ignored by others.
// Using BLOCK_ONLY_HIGH to be more permissive for portfolio content.
// These are plain string identifiers matching @google/generative-ai's
// HarmCategory/HarmBlockThreshold enums, hardcoded here so this module (and
// the rest of the provider-agnostic AI layer) doesn't need that SDK as a
// dependency just to build this config.
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

/**
 * Create a provider instance: { name, displayName, model, capabilities }
 * @param {string} type — 'gemini' | 'openai' | 'opencode' | 'codex' | 'ollama' | 'anthropic' | 'custom'
 * @param {object} overrides — optional config overrides
 */
function createProvider(type = 'gemini', overrides = {}) {
  const preset = PRESETS[type] || PRESETS.custom;
  const config = { ...preset, ...overrides };

  switch (type) {
    case 'gemini': {
      const google = createGoogleGenerativeAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
      return {
        name: 'gemini',
        displayName: `Gemini (${config.model})`,
        model: google(config.model),
        capabilities: {
          streaming: true,
          tools: true,
          vision: true,
          json: true,
          reasoning: config.model.includes('pro'),
          maxTokens: config.model.includes('pro') ? 8192 : 4096,
          ...config.capabilities,
        },
      };
    }

    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey: config.apiKey, baseURL: config.baseUrl });
      const reasoning = config.model.includes('opus') || config.model.includes('sonnet');
      return {
        name: 'anthropic',
        displayName: `Claude (${config.model})`,
        model: anthropic(config.model),
        capabilities: {
          streaming: true,
          tools: true,
          vision: true,
          json: false,
          reasoning,
          // Reasoning-capable models spend part of this budget on internal
          // thinking before ever producing text/tool-calls; a 4096 flat cap
          // lets long reasoning alone hit finishReason "length" mid-thought.
          maxTokens: reasoning ? 8192 : 4096,
          ...config.capabilities,
        },
      };
    }

    case 'openai':
    case 'opencode':
    case 'ollama':
    case 'custom': {
      const openaiCompatible = createOpenAICompatible({
        name: type,
        baseURL: config.endpoint,
        apiKey: config.apiKey || undefined,
        headers: config.headers,
      });
      return {
        name: type,
        displayName: `${OPENAI_COMPATIBLE_LABEL[type] || type} (${config.model})`,
        model: openaiCompatible(config.model),
        capabilities: {
          streaming: true,
          tools: true,
          vision: type !== 'ollama', // Ollama vision varies by model
          json: true,
          reasoning: false,
          // These are arbitrary self-hosted/proxied models (opencode-go can
          // route to reasoning models like DeepSeek), so there's no reliable
          // model name to key a bump off like the gemini/anthropic branches
          // do. A flat 4096 was letting long reasoning output alone exhaust
          // the budget and get cut off mid-thought before any reply or tool
          // call — same failure as the anthropic case, just provider-agnostic.
          maxTokens: 8192,
          // Per-model overrides configured in the admin panel (AiModel.capabilities)
          // win over these type-level defaults — see toOverrides() in model-config.js.
          ...config.capabilities,
        },
      };
    }

    // Codex speaks the Responses API, not Chat Completions, and (when
    // authenticated via "Sign in with ChatGPT") talks to the ChatGPT
    // backend rather than the regular platform API — @ai-sdk/openai-compatible
    // can't do either, so this gets its own branch on @ai-sdk/openai.
    case 'codex': {
      // overrides.chatgptAccountId is only set when this provider's stored
      // credentials came from the OAuth device-code flow (see
      // model-config.js's getProviderConfig()) — that's also the signal for
      // which real endpoint to hit, absent an explicit admin override.
      const usingChatGptBackend = !!config.chatgptAccountId;
      const baseURL = config.endpoint || (usingChatGptBackend ? CHATGPT_CODEX_BASE_URL : OPENAI_API_BASE_URL);
      const headers = { ...(config.headers || {}) };
      if (usingChatGptBackend) headers['chatgpt-account-id'] = config.chatgptAccountId;

      const openai = createOpenAI({ apiKey: config.apiKey || undefined, baseURL, headers });
      const capabilities = {
        streaming: true,
        tools: true,
        vision: true,
        json: true,
        reasoning: true,
        maxTokens: 8192,
        ...config.capabilities,
      };
      // The ChatGPT backend (chatgpt.com/backend-api/codex) rejects
      // max_output_tokens outright ("Unsupported parameter") — unlike the
      // regular platform API, which accepts it normally. This has to strip
      // it *after* the merge above, since a per-model capability saved from
      // the models.dev catalog (e.g. a real context-window maxTokens) would
      // otherwise win over any default and reintroduce it.
      if (usingChatGptBackend) delete capabilities.maxTokens;

      return {
        name: 'codex',
        displayName: `Codex (${config.model})`,
        model: openai.responses(config.model),
        capabilities,
      };
    }

    default:
      throw new Error(`Unknown AI provider type: ${type}. Supported: gemini, openai, opencode, codex, ollama, anthropic, custom`);
  }
}

/**
 * List all configured (available) providers.
 * Returns array of { type, displayName, configured, capabilities }
 */
function listProviders() {
  const types = ['gemini', 'openai', 'opencode', 'codex', 'ollama', 'anthropic', 'custom'];
  return types.map(type => {
    const preset = PRESETS[type];
    const configured = isProviderConfigured(type);

    let instance;
    try { instance = createProvider(type); } catch { instance = null; }

    return {
      type,
      displayName: instance?.displayName || type,
      model: preset.model || 'unknown',
      configured,
      capabilities: instance?.capabilities || {},
    };
  });
}

/** Environment presets are fallbacks only when explicitly configured. */
function isProviderConfigured(type) {
  switch (type) {
    case 'gemini': return Boolean(PRESETS.gemini.apiKey);
    case 'anthropic': return Boolean(PRESETS.anthropic.apiKey);
    case 'openai': return Boolean(PRESETS.openai.apiKey);
    case 'opencode': return Boolean(process.env.AI_OPENCODE_ENDPOINT || process.env.AI_OPENCODE_API_KEY);
    case 'codex': return Boolean(process.env.AI_CODEX_ENDPOINT || process.env.AI_CODEX_API_KEY);
    case 'ollama': return Boolean(process.env.AI_OLLAMA_ENDPOINT || process.env.AI_OLLAMA_MODEL);
    case 'custom': return Boolean(process.env.AI_CUSTOM_ENDPOINT || process.env.AI_CUSTOM_API_KEY);
    default: return false;
  }
}

/**
 * List models available for a provider. The baseline list comes from
 * models.dev (see ../model-catalog.js) — a public registry with real
 * capability metadata per model — falling back to the tiny static
 * KNOWN_MODELS if that's unreachable. For OpenAI-compatible providers this
 * also tries a live GET /models call and merges in anything the endpoint
 * reports that isn't already known. Live calls that fail (unreachable
 * endpoint, no network path to a self-hosted gateway, etc.) are silently
 * ignored — the known/catalog list is returned either way.
 *
 * @param {string} type — provider type
 * @param {object} overrides — { endpoint, apiKey, headers } — falls back to
 *   the type's PRESETS/env config for any field left unset, so a saved
 *   provider can be re-discovered without re-entering its endpoint.
 * @returns {Promise<Array<{ id: string, ownedBy?: string }>>}
 */
async function listAvailableModels(type, overrides = {}) {
  const catalogModels = await catalogModelsFor(type);
  const known = catalogModels.length ? catalogModels : (KNOWN_MODELS[type] || []).map(id => ({ id }));

  if (!DISCOVERABLE_TYPES.includes(type)) {
    if (known.length) return known;
    throw new Error(`No known models for provider type "${type}", and it doesn't expose a /models endpoint to discover more.`);
  }

  // 'custom' has no self-hosted convention to guess at (unlike opencode/codex/
  // ollama, which default to a real local port worth trying blind) and no
  // catalog of its own — attempting a live call before the admin has told us
  // an endpoint would just fail against a meaningless placeholder URL. Show
  // an empty list instead of a connection-refused error until they configure one.
  if (type === 'custom' && !overrides.endpoint && !known.length) {
    return known;
  }

  const preset = PRESETS[type] || PRESETS.custom;
  const config = { ...preset, ...overrides };
  if (!config.endpoint) {
    if (known.length) return known;
    throw new Error('No endpoint configured for this provider');
  }

  const url = `${String(config.endpoint).replace(/\/+$/, '')}/models`;
  const headers = { ...(config.headers || {}) };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  let response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  } catch (error) {
    if (known.length) return known;
    throw new Error(`Could not reach ${url}: ${error.message}`);
  }
  if (!response.ok) {
    if (known.length) return known;
    throw new Error(`Provider responded with ${response.status} ${response.statusText}`);
  }

  const body = await response.json();
  const list = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const live = list
    .map(item => (typeof item === 'string' ? { id: item } : { id: item?.id, ownedBy: item?.owned_by || item?.ownedBy || undefined }))
    .filter(item => item.id);

  const merged = [...known];
  for (const item of live) if (!merged.some(m => m.id === item.id)) merged.push(item);
  return merged;
}

module.exports = { createProvider, listProviders, isProviderConfigured, listAvailableModels, DISCOVERABLE_TYPES, KNOWN_MODELS, PRESETS, SAFETY_SETTINGS };
