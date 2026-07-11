/**
 * AI Provider Registry & Factory
 *
 * Builds model-agnostic LanguageModel instances (from the `ai` SDK) for:
 *   - gemini    → Google Gemini (@ai-sdk/google)
 *   - openai    → OpenAI (@ai-sdk/openai-compatible)
 *   - opencode  → OpenCode Go (@ai-sdk/openai-compatible, default localhost:8080)
 *   - ollama    → Ollama (@ai-sdk/openai-compatible, default localhost:11434)
 *   - anthropic → Anthropic Claude (@ai-sdk/anthropic)
 *   - custom    → Any OpenAI-compatible endpoint
 *
 * Every provider returns the same shape — { name, displayName, model, capabilities } —
 * so AIManager can call the SDK's generateText identically regardless of which
 * backend is actually serving the request. Tool schemas are defined once
 * (see ../../gemini-tools.js) and converted per-provider by the SDK itself.
 *
 * Precedence for each provider:
 *   1. Explicit config passed to factory
 *   2. Environment variables (AI_{PROVIDER}_*)
 *   3. Sensible defaults
 */

const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { createAnthropic } = require('@ai-sdk/anthropic');
const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');

/** Preset configurations for well-known providers */
const PRESETS = {
  opencode: {
    endpoint: process.env.AI_OPENCODE_ENDPOINT || 'http://127.0.0.1:8080/v1',
    apiKey: process.env.AI_OPENCODE_API_KEY || 'opencode',
    model: process.env.AI_OPENCODE_MODEL || 'opencode-go',
    headers: process.env.AI_OPENCODE_API_KEY ? {} : { 'X-API-Key': 'opencode' },
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

/**
 * Create a provider instance: { name, displayName, model, capabilities }
 * @param {string} type — 'gemini' | 'openai' | 'opencode' | 'ollama' | 'anthropic' | 'custom'
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
        },
      };
    }

    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey: config.apiKey, baseURL: config.baseUrl });
      return {
        name: 'anthropic',
        displayName: `Claude (${config.model})`,
        model: anthropic(config.model),
        capabilities: {
          streaming: true,
          tools: true,
          vision: true,
          json: false,
          reasoning: config.model.includes('opus') || config.model.includes('sonnet'),
          maxTokens: 4096,
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
          maxTokens: 4096,
        },
      };
    }

    default:
      throw new Error(`Unknown AI provider type: ${type}. Supported: gemini, openai, opencode, ollama, anthropic, custom`);
  }
}

/**
 * List all configured (available) providers.
 * Returns array of { type, displayName, configured, capabilities }
 */
function listProviders() {
  const types = ['gemini', 'openai', 'opencode', 'ollama', 'anthropic', 'custom'];
  return types.map(type => {
    const preset = PRESETS[type];
    const configured = (type === 'gemini' || type === 'anthropic') ? !!preset.apiKey : !!preset.endpoint;

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

module.exports = { createProvider, listProviders, PRESETS };
