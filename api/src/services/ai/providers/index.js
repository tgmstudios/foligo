/**
 * AI Provider Registry & Factory
 * 
 * Creates provider instances from configuration. Supports:
 *   - gemini    → Google Gemini (native SDK)
 *   - openai    → OpenAI (via OpenAI-compatible provider)
 *   - opencode  → OpenCode Go (via OpenAI-compatible, default localhost:8080)
 *   - ollama    → Ollama (via OpenAI-compatible, default localhost:11434)
 *   - anthropic → Anthropic Claude (native REST API)
 *   - custom    → Any OpenAI-compatible endpoint
 * 
 * Precedence for each provider:
 *   1. Explicit config passed to factory
 *   2. Environment variables (AI_{PROVIDER}_*)
 *   3. Sensible defaults
 */

const GeminiProvider = require('./gemini');
const OpenAICompatibleProvider = require('./openai-compatible');
const AnthropicProvider = require('./anthropic');

/** Preset configurations for well-known providers */
const PRESETS = {
  opencode: {
    name: 'opencode',
    endpoint: process.env.AI_OPENCODE_ENDPOINT || 'http://127.0.0.1:8080/v1',
    apiKey: process.env.AI_OPENCODE_API_KEY || 'opencode',
    model: process.env.AI_OPENCODE_MODEL || 'opencode-go',
    headers: process.env.AI_OPENCODE_API_KEY ? {} : { 'X-API-Key': 'opencode' },
  },
  ollama: {
    name: 'ollama',
    endpoint: process.env.AI_OLLAMA_ENDPOINT || 'http://127.0.0.1:11434/v1',
    apiKey: process.env.AI_OLLAMA_API_KEY || 'ollama',
    model: process.env.AI_OLLAMA_MODEL || 'llama3.1',
  },
  openai: {
    name: 'openai',
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
    name: 'custom',
    endpoint: process.env.AI_CUSTOM_ENDPOINT || 'http://127.0.0.1:8080/v1',
    apiKey: process.env.AI_CUSTOM_API_KEY || null,
    model: process.env.AI_CUSTOM_MODEL || 'default',
    headers: process.env.AI_CUSTOM_HEADERS ? JSON.parse(process.env.AI_CUSTOM_HEADERS) : {},
  },
};

/**
 * Create a provider instance.
 * @param {string} type — 'gemini' | 'openai' | 'opencode' | 'ollama' | 'anthropic' | 'custom'
 * @param {object} overrides — optional config overrides
 */
function createProvider(type = 'gemini', overrides = {}) {
  const preset = PRESETS[type] || PRESETS.custom;
  const config = { ...preset, ...overrides };

  switch (type) {
    case 'gemini':
      return new GeminiProvider(config);

    case 'openai':
    case 'opencode':
    case 'ollama':
    case 'custom':
      return new OpenAICompatibleProvider({ ...config, name: type });

    case 'anthropic':
      return new AnthropicProvider(config);

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
    const configured = type === 'gemini' ? !!(preset.apiKey) :
                       type === 'anthropic' ? !!(preset.apiKey) :
                       !!(preset.endpoint);

    // Create lightweight instance just for display info
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
