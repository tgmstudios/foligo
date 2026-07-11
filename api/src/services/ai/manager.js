/**
 * AI Manager — unified model-agnostic AI service.
 *
 * Central entry point for ALL AI operations across Foligo.
 * Routes requests to the configured provider, with optional fallback.
 * Calls go through the `ai` SDK's generateText() against whichever
 * provider's LanguageModel is selected — one call path for every backend.
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
 *   - Fallback across providers on real call failure
 *   - Per-request provider selection
 *   - Model listing for UIs
 */

const { generateText: sdkGenerateText } = require('ai');
const { createProvider, listProviders } = require('./providers');
const { createAILogger } = require('../logger');
const { SAFETY_SETTINGS } = require('../gemini-config');

class AIManager {
  constructor() {
    this.logger = createAILogger({ service: 'AIManager' });
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
   * Run an operation against the default provider, falling back to the next
   * provider in the chain if the *actual call* fails — not just a health
   * check. A provider can pass a cheap health check (e.g. respond to "ping")
   * and still fail on a real request (e.g. malformed tool schema, upstream
   * rejecting a specific payload), so fallback has to cover real failures too.
   */
  async _withFallback(requestedProvider, fn) {
    const types = requestedProvider
      ? [requestedProvider]
      : [this._defaultProvider, ...this._fallbackChain.filter(p => p !== this._defaultProvider)];

    let lastError;
    for (const type of types) {
      const provider = this.getProvider(type);
      if (!provider) continue;
      try {
        return await fn(provider);
      } catch (e) {
        lastError = e;
        this.logger.warn(`Provider "${type}" call failed, trying next in chain: ${e.message}`);
        // Drop the cached instance in case it's the source of the failure
        this._providers.delete(type);
      }
    }

    throw new Error(`No healthy AI provider available. Tried: ${types.join(', ')}. Last error: ${lastError?.message}`);
  }

  /**
   * Run a single generateText call against a provider's LanguageModel and
   * normalize the SDK result into Foligo's { text, reasoning, functionCalls } shape.
   */
  async _callModel(provider, { messages, system, tools, toolChoice, temperature, maxTokens }) {
    const result = await sdkGenerateText({
      model: provider.model,
      system,
      messages,
      tools,
      toolChoice,
      temperature,
      maxOutputTokens: maxTokens ?? provider.capabilities?.maxTokens,
      // Only consulted by the Google provider; harmlessly ignored by others.
      providerOptions: { google: { safetySettings: SAFETY_SETTINGS } },
    });

    const functionCalls = result.toolCalls?.length
      ? result.toolCalls.map(tc => ({ name: tc.toolName, args: tc.input }))
      : null;

    return {
      text: result.text || null,
      reasoning: result.reasoningText || null,
      functionCalls,
    };
  }

  // ─── Public API ────────────────────────────────────────────────

  /**
   * Generate text from a prompt.
   * @param {string} prompt
   * @param {object} options — { temperature, maxTokens, provider, ... }
   * @returns {Promise<{text:string, reasoning:string|null}>}
   */
  async generateText(prompt, options = {}) {
    const { provider: reqProvider, ...genOpts } = options;
    return this._withFallback(reqProvider, async (prov) => {
      this.logger.debug(`generateText via ${prov.name}`, { promptLen: prompt.length });
      const { text, reasoning } = await this._callModel(prov, {
        ...genOpts,
        messages: [{ role: 'user', content: prompt }],
      });
      return { text: text || '', reasoning };
    });
  }

  /**
   * Generate from chat messages.
   * @param {Array<{role:string, content:string}>} messages
   * @param {object} options — { temperature, maxTokens, tools, systemInstruction, provider, ... }
   * @returns {Promise<{text:string|null, functionCalls:Array|null}>}
   */
  async generateChat(messages, options = {}) {
    const { provider: reqProvider, systemInstruction, ...genOpts } = options;
    return this._withFallback(reqProvider, (prov) => {
      this.logger.debug(`generateChat via ${prov.name}`, { msgCount: messages.length });
      return this._callModel(prov, { ...genOpts, messages, system: systemInstruction });
    });
  }

  /**
   * Generate with tool/function calling.
   * @returns {Promise<{text:string|null, functionCalls:Array|null}>}
   */
  async generateWithTools(prompt, tools, options = {}) {
    const { provider: reqProvider, systemInstruction, ...genOpts } = options;
    return this._withFallback(reqProvider, (prov) => {
      this.logger.debug(`generateWithTools via ${prov.name}`, { toolCount: Object.keys(tools || {}).length });
      return this._callModel(prov, {
        ...genOpts,
        messages: [{ role: 'user', content: prompt }],
        system: systemInstruction,
        tools,
      });
    });
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
      await this._callModel(provider, { messages: [{ role: 'user', content: 'pong' }], maxTokens: 5 });
      return { ok: true, latency: Date.now() - start };
    } catch (e) {
      return { ok: false, latency: Date.now() - start, error: e.message };
    }
  }
}

// Singleton
module.exports = new AIManager();
