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

const { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs } = require('ai');
const { createProvider, listProviders } = require('./providers');
const { resolveModel, ensureBootstrapModels } = require('./model-config');
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
  async getProvider(selection = null, overrides = {}, modelType = 'QUICK') {
    let resolved = null;
    try {
      resolved = await resolveModel(selection, modelType);
    } catch (error) {
      // Environment configuration remains a safe bootstrap/fallback while a
      // migration is being deployed or before an administrator adds models.
      this.logger.warn(`Database AI model lookup failed; using environment configuration: ${error.message}`);
    }
    const type = resolved?.providerType || selection || this._defaultProvider;
    const mergedOverrides = { ...(resolved?.overrides || {}), ...overrides };
    const key = resolved?.key || type;

    // If overrides provided, don't cache — create fresh (for custom endpoints)
    if (Object.keys(mergedOverrides).length > 0 && !resolved) {
      return createProvider(type, mergedOverrides);
    }

    if (!this._providers.has(key)) {
      try {
        const provider = createProvider(type, mergedOverrides);
        provider.cacheKey = key;
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
  async _withFallback(requestedProvider, modelType, fn) {
    const types = requestedProvider ? [requestedProvider] : [null, ...this._fallbackChain];

    let lastError;
    for (const type of types) {
      const provider = await this.getProvider(type, {}, modelType);
      if (!provider) continue;
      try {
        return await fn(provider);
      } catch (e) {
        lastError = e;
        this.logger.warn(`Provider "${type}" call failed, trying next in chain: ${e.message}`);
        // Drop the cached instance in case it's the source of the failure
      this._providers.delete(provider?.cacheKey || type);
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
    const { provider: reqProvider, modelType = 'QUICK', ...genOpts } = options;
    return this._withFallback(reqProvider, modelType, async (prov) => {
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
    const { provider: reqProvider, modelType = 'QUICK', systemInstruction, ...genOpts } = options;
    return this._withFallback(reqProvider, modelType, (prov) => {
      this.logger.debug(`generateChat via ${prov.name}`, { msgCount: messages.length });
      return this._callModel(prov, { ...genOpts, messages, system: systemInstruction });
    });
  }

  /**
   * Generate with tool/function calling.
   * @returns {Promise<{text:string|null, functionCalls:Array|null}>}
   */
  async generateWithTools(prompt, tools, options = {}) {
    const { provider: reqProvider, modelType = 'QUICK', systemInstruction, ...genOpts } = options;
    return this._withFallback(reqProvider, modelType, (prov) => {
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
   * Stream a chat completion, driving a multi-step agentic tool-calling loop.
   * Yields raw `ai` SDK `fullStream` parts (text-delta, reasoning-delta, tool-call,
   * tool-result, tool-error, finish, ...) so callers can forward them (e.g. as SSE)
   * as they arrive.
   *
   * Fallback only applies *before* the first chunk arrives — once a provider has
   * started streaming, a later failure is yielded as an `{ type: 'error' }` part
   * rather than silently retried, since a partial response may already be visible
   * to the caller.
   *
   * @param {Array<{role:string, content:string}>} messages
   * @param {object} options — { temperature, maxTokens, tools, systemInstruction, maxSteps, provider }
   * @returns {AsyncGenerator<object>}
   */
  async *streamChat(messages, options = {}) {
    const { provider: reqProvider, modelType = 'QUICK', systemInstruction, tools, maxSteps, temperature, maxTokens } = options;
    const types = reqProvider ? [reqProvider] : [null, ...this._fallbackChain];

    let lastError;
    for (const type of types) {
      const prov = await this.getProvider(type, {}, modelType);
      if (!prov) continue;

      const result = sdkStreamText({
        model: prov.model,
        system: systemInstruction,
        messages,
        tools,
        stopWhen: stepCountIs(maxSteps ?? 6),
        temperature,
        maxOutputTokens: maxTokens ?? prov.capabilities?.maxTokens,
        providerOptions: { google: { safetySettings: SAFETY_SETTINGS } },
      });

      const iterator = result.fullStream[Symbol.asyncIterator]();
      let first;
      try {
        first = await iterator.next();
      } catch (e) {
        lastError = e;
        this.logger.warn(`Provider "${type}" stream failed before first chunk, trying next: ${e.message}`);
        this._providers.delete(type);
        continue;
      }

      this.logger.debug(`streamChat via ${prov.name}`, { msgCount: messages.length });
      if (!first.done) yield first.value;

      try {
        while (true) {
          const { value, done } = await iterator.next();
          if (done) break;
          yield value;
        }
      } catch (e) {
        this.logger.warn(`Provider "${type}" stream failed mid-stream: ${e.message}`);
        yield { type: 'error', error: e.message || String(e) };
      }
      return;
    }

    throw new Error(`No healthy AI provider available for streaming. Tried: ${types.join(', ')}. Last error: ${lastError?.message}`);
  }

  /**
   * List all configured providers with status.
   */
  async listProviders() {
    try {
      await ensureBootstrapModels();
      const models = await require('../database').prisma.aiModel.findMany({
        where: { enabled: true }, orderBy: [{ modelType: 'asc' }, { name: 'asc' }],
      });
      if (models.length) return models.map(model => ({
        type: model.id,
        slug: model.slug,
        displayName: model.name,
        model: model.model,
        modelType: model.modelType,
        isDefault: model.isDefault,
        configured: true,
      }));
    } catch (error) {
      this.logger.warn(`Could not list database AI models: ${error.message}`);
    }
    return listProviders();
  }

  clearProviderCache() {
    this._providers.clear();
  }

  /**
   * Test a specific provider.
   * @returns {{ ok: boolean, latency: number, error?: string }}
   */
  async testProvider(type) {
    const start = Date.now();
    try {
      const provider = await this.getProvider(type);
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
