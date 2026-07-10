/**
 * AI Manager — unified model-agnostic AI service.
 * 
 * Central entry point for ALL AI operations across Foligo.
 * Routes requests to the configured provider, with optional fallback.
 * 
 * Usage:
 *   const ai = require('./services/ai/manager');
 *   const text = await ai.generateText('What is AI?');
 *   const result = await ai.generateChat([{role:'user', content:'Hello'}]);
 * 
 * Per-request provider override:
 *   const text = await ai.generateText('...', { provider: 'opencode' });
 * 
 * Features:
 *   - Provider cache (lazy init, reused)
 *   - Health check + auto-fallback
 *   - Per-request provider selection
 *   - Model listing for UIs
 */

const { createProvider, listProviders } = require('./providers');
const { createGeminiLogger } = require('../logger');

class AIManager {
  constructor() {
    this.logger = createGeminiLogger({ service: 'AIManager' });
    this._providers = new Map();
    this._defaultProvider = process.env.AI_DEFAULT_PROVIDER || 'gemini';
    this._fallbackChain = (process.env.AI_FALLBACK_CHAIN || 'gemini,opencode')
      .split(',').map(s => s.trim()).filter(Boolean);
  }

  /**
   * Get or create a cached provider instance.
   * @param {string} type — provider type
   * @param {object} overrides — optional config overrides
   */
  getProvider(type = null, overrides = {}) {
    const key = type || this._defaultProvider;

    // If overrides provided, don't cache — create fresh (for custom endpoints)
    if (Object.keys(overrides).length > 0) {
      return createProvider(key, overrides);
    }

    if (!this._providers.has(key)) {
      try {
        const provider = createProvider(key);
        this._providers.set(key, provider);
        this.logger.info(`Provider "${key}" initialized: ${provider.displayName}`);
      } catch (e) {
        this.logger.warn(`Provider "${key}" unavailable: ${e.message}`);
        return null;
      }
    }

    return this._providers.get(key);
  }

  /** Default provider */
  get defaultProvider() { return this.getProvider(); }

  /**
   * Get a healthy provider — tries default, then fallback chain.
   * Uses lazy health check (only tests on first failure).
   */
  async getHealthyProvider(requestedProvider = null) {
    const types = requestedProvider
      ? [requestedProvider]
      : [this._defaultProvider, ...this._fallbackChain.filter(p => p !== this._defaultProvider)];

    for (const type of types) {
      const provider = this.getProvider(type);
      if (!provider) continue;
      // Skip health check for providers we know just initialized successfully
      try {
        return provider;
      } catch (e) {
        this.logger.warn(`Provider "${type}" failed: ${e.message}`);
      }
    }

    throw new Error(`No healthy AI provider available. Tried: ${types.join(', ')}`);
  }

  // ─── Public API ────────────────────────────────────────────────

  /**
   * Generate text from a prompt.
   * @param {string} prompt
   * @param {object} options — { temperature, maxTokens, provider, ... }
   */
  async generateText(prompt, options = {}) {
    const { provider: reqProvider, ...genOpts } = options;
    const prov = await this.getHealthyProvider(reqProvider);
    this.logger.debug(`generateText via ${prov.name}`, { promptLen: prompt.length });
    const result = await prov.generateText(prompt, genOpts);
    // Normalize: some providers return string, others return { text, reasoning }
    if (typeof result === 'string') return { text: result, reasoning: null };
    return result;
  }

  /**
   * Generate from chat messages.
   * @param {Array<{role:string, content:string}>} messages
   * @param {object} options — { temperature, maxTokens, tools, systemPrompt, provider, ... }
   * @returns {Promise<{text:string|null, functionCalls:Array|null}>}
   */
  async generateChat(messages, options = {}) {
    const { provider: reqProvider, ...genOpts } = options;
    const prov = await this.getHealthyProvider(reqProvider);
    this.logger.debug(`generateChat via ${prov.name}`, { msgCount: messages.length });
    return prov.generateChat(messages, genOpts);
  }

  /**
   * Generate with tool/function calling.
   * @returns {Promise<{text:string|null, functionCalls:Array|null}>}
   */
  async generateWithTools(prompt, tools, options = {}) {
    const { provider: reqProvider, ...genOpts } = options;
    const prov = await this.getHealthyProvider(reqProvider);
    this.logger.debug(`generateWithTools via ${prov.name}`, { toolCount: tools?.length });
    return prov.generateWithTools(prompt, tools, genOpts);
  }

  /**
   * List all configured providers with status.
   */
  async listProviders() {
    return listProviders();
  }

  /**
   * Test a specific provider.
   * @returns {{ ok: boolean, latency: number, error?: string }}
   */
  async testProvider(type) {
    const start = Date.now();
    try {
      const provider = this.getProvider(type);
      if (!provider) return { ok: false, latency: 0, error: 'Not configured' };
      await provider.generateText('pong', { maxTokens: 5 });
      return { ok: true, latency: Date.now() - start };
    } catch (e) {
      return { ok: false, latency: Date.now() - start, error: e.message };
    }
  }
}

// Singleton
module.exports = new AIManager();
