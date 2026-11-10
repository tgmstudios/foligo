const { meteredModel } = require('./usage');
const { PERSONAL_PREFIX } = require('./personal-connections');
const { isAiPolicyError } = require('./route-error');
const { getWritingStylePrompt } = require('./writing-style');
/**
 * AI Manager — unified model-agnostic AI service.
 *
 * Central entry point for ALL AI operations across Foligo. User-scoped calls
 * resolve only models granted to their trusted user ID. Admin/internal provider
 * configuration operations use the legacy global configuration path.
 */

const { generateText: sdkGenerateText, streamText: sdkStreamText, stepCountIs } = require('ai');
const { createProvider, listProviders, isProviderConfigured, listAvailableModels, SAFETY_SETTINGS } = require('./providers');
const {
  UserModelAuthorizationError,
  resolveModel,
  resolveModelForUser,
  listModelSelections,
  listModelSelectionsForUser,
  ensureBootstrapModels,
  getDisabledProviderTypes,
} = require('./model-config');
const { createAILogger } = require('../core/logger');

function buildProviderOptions(provider) {
  return {
    google: { safetySettings: SAFETY_SETTINGS },
    openai: {
      store: false,
      ...(provider.capabilities?.reasoning ? { reasoningSummary: 'detailed' } : {}),
    },
  };
}

function noAiModelAccessError() {
  const error = new UserModelAuthorizationError('No AI models are available to this user');
  error.code = 'NO_AI_MODEL_ACCESS';
  return error;
}

class AIManager {
  constructor() {
    this.logger = createAILogger({ service: 'AIManager' });
    this._providers = new Map();
    this._defaultProvider = process.env.AI_DEFAULT_PROVIDER || 'gemini';
    this._fallbackChain = (process.env.AI_FALLBACK_CHAIN || 'gemini,opencode')
      .split(',').map(s => s.trim()).filter(Boolean);
  }

  /**
   * Get or create a cached provider instance. A user-scoped call must supply a
   * concrete granted model selection; it never reaches the global resolver.
   */
  async getProvider(selection = null, overrides = {}, modelType = 'QUICK', userId = null) {
    let resolved = null;
    if (userId) {
      resolved = await resolveModelForUser(userId, selection);
    } else {
      try {
        resolved = await resolveModel(selection, modelType);
      } catch (error) {
        this.logger.warn(`Database AI model lookup failed; using environment configuration: ${error.message}`);
      }
    }

    const type = resolved?.providerType || selection || this._defaultProvider;
    const mergedOverrides = { ...(resolved?.overrides || {}), ...overrides };
    const key = resolved?.key || type;

    if (userId) {
      // Fresh instances prevent credentials/refreshes from leaking through a shared cache.
      const provider = createProvider(type, mergedOverrides);
      provider.cacheKey = `${userId}:${key}`;
      provider.model = meteredModel(provider.model, {
        userId, source: resolved.source || 'SERVER', selection: key,
        providerType: type, model: resolved.record?.model || type,
        rates: resolved.record?.billingRates,
      });
      return provider;
    }

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

  /** Default provider for legacy internal callers only. */
  get defaultProvider() { return this.getProvider(); }

  async _fallbackSelections(requestedProvider, modelType, userId = null) {
    if (userId) {
      if (requestedProvider) {
        // Resolve before provider creation so an unauthorized explicit model
        // cannot be silently replaced by a fallback or environment provider.
        await resolveModelForUser(userId, requestedProvider);
        return [requestedProvider];
      }

      const selections = await listModelSelectionsForUser(userId, modelType);
      if (!selections.length) throw noAiModelAccessError();
      const personal = selections.filter(selection => selection.startsWith(PERSONAL_PREFIX));
      return personal.length ? personal : selections;
    }

    if (requestedProvider) return [requestedProvider];

    let databaseSelections = [];
    try {
      databaseSelections = await listModelSelections(modelType);
    } catch (error) {
      this.logger.warn(`Could not build database AI fallback chain: ${error.message}`);
    }

    let disabledProviders = new Set();
    try {
      disabledProviders = await getDisabledProviderTypes();
    } catch (error) {
      this.logger.warn(`Could not check disabled AI providers: ${error.message}`);
    }
    const environmentSelections = [this._defaultProvider, ...this._fallbackChain]
      .filter((selection, index, all) => all.indexOf(selection) === index)
      .filter(isProviderConfigured)
      .filter(selection => !disabledProviders.has(selection));

    return databaseSelections.length
      ? [...databaseSelections, ...environmentSelections]
      : (environmentSelections.length ? environmentSelections : [null]);
  }

  /**
   * Validate a streaming request before an SSE response commits its headers.
   * This deliberately consults only user-scoped grant resolvers and creates no
   * provider, so it cannot fall back to environment configuration or infer.
   */
  async preflightStreamAccess({ userId, provider, modelType = 'QUICK' } = {}) {
    if (!userId) throw new UserModelAuthorizationError('An authenticated user is required for AI model access');
    return this._fallbackSelections(provider, modelType, userId);
  }

  async _withFallback(requestedProvider, modelType, fn, userId = null) {
    const types = await this._fallbackSelections(requestedProvider, modelType, userId);

    let lastError;
    for (const type of types) {
      const provider = await this.getProvider(type, {}, modelType, userId);
      if (!provider) continue;
      try {
        return await fn(provider);
      } catch (e) {
        if (isAiPolicyError(e) || e.code === 'AI_USAGE_SETTLEMENT_FAILED') throw e;
        lastError = e;
        this.logger.warn(`Provider "${type}" call failed, trying next in chain: ${e.message}`);
        this._providers.delete(provider?.cacheKey || type);
      }
    }

    throw new Error(`No healthy AI provider available. Tried: ${types.join(', ')}. Last error: ${lastError?.message}`);
  }

  async _callModel(provider, { messages, system, tools, toolChoice, temperature, maxTokens }) {
    const result = await sdkGenerateText({
      model: provider.model,
      system,
      messages,
      tools,
      toolChoice,
      temperature,
      maxOutputTokens: maxTokens ?? provider.capabilities?.maxTokens,
      providerOptions: buildProviderOptions(provider),
    });

    const functionCalls = result.toolCalls?.length
      ? result.toolCalls.map(tc => ({ name: tc.toolName, args: tc.input }))
      : null;

    return {
      text: result.text || null,
      reasoning: result.reasoningText || null,
      functionCalls,
      ...(result.finishReason === 'length' ? { truncated: true } : {}),
    };
  }

  // ─── Public generation API ────────────────────────────────────────

  async generateText(prompt, options = {}) {
    const writingStyle = await getWritingStylePrompt(options.userId, options.writingStyle);
    if (writingStyle) options = { ...options, system: (options.system || '') + writingStyle, systemInstruction: (options.systemInstruction || '') + writingStyle };
    const { provider: reqProvider, modelType = 'QUICK', userId, ...genOpts } = options;
    return this._withFallback(reqProvider, modelType, async (prov) => {
      this.logger.debug(`generateText via ${prov.name}`, { promptLen: prompt.length });
      const { text, reasoning } = await this._callModel(prov, {
        ...genOpts,
        messages: [{ role: 'user', content: prompt }],
      });
      return { text: text || '', reasoning };
    }, userId);
  }

  async generateChat(messages, options = {}) {
    const writingStyle = await getWritingStylePrompt(options.userId, options.writingStyle);
    if (writingStyle) options = { ...options, system: (options.system || '') + writingStyle, systemInstruction: (options.systemInstruction || '') + writingStyle };
    const { provider: reqProvider, modelType = 'QUICK', userId, systemInstruction, ...genOpts } = options;
    return this._withFallback(reqProvider, modelType, (prov) => {
      this.logger.debug(`generateChat via ${prov.name}`, { msgCount: messages.length });
      return this._callModel(prov, { ...genOpts, messages, system: systemInstruction });
    }, userId);
  }

  async generateWithTools(prompt, tools, options = {}) {
    const writingStyle = await getWritingStylePrompt(options.userId, options.writingStyle);
    if (writingStyle) options = { ...options, system: (options.system || '') + writingStyle, systemInstruction: (options.systemInstruction || '') + writingStyle };
    const { provider: reqProvider, modelType = 'QUICK', userId, systemInstruction, ...genOpts } = options;
    return this._withFallback(reqProvider, modelType, (prov) => {
      this.logger.debug(`generateWithTools via ${prov.name}`, { toolCount: Object.keys(tools || {}).length });
      return this._callModel(prov, {
        ...genOpts,
        messages: [{ role: 'user', content: prompt }],
        system: systemInstruction,
        tools,
      });
    }, userId);
  }

  async *streamChat(messages, options = {}) {
    const writingStyle = await getWritingStylePrompt(options.userId, options.writingStyle);
    if (writingStyle) options = { ...options, system: (options.system || '') + writingStyle, systemInstruction: (options.systemInstruction || '') + writingStyle };
    const {
      provider: reqProvider, modelType = 'QUICK', userId, systemInstruction, tools,
      maxSteps, temperature, maxTokens, externalToolLoop = false,
    } = options;
    const types = await this._fallbackSelections(reqProvider, modelType, userId);

    let lastError;
    const attemptedProviders = new Set();
    for (const type of types) {
      const prov = await this.getProvider(type, {}, modelType, userId);
      if (!prov) continue;
      const providerKey = prov.cacheKey || type || prov.name;
      if (attemptedProviders.has(providerKey)) continue;
      attemptedProviders.add(providerKey);

      const result = sdkStreamText({
        model: prov.model,
        system: systemInstruction,
        messages,
        tools,
        stopWhen: [
          stepCountIs(externalToolLoop ? 1 : (maxSteps ?? 30)),
          ({ steps }) => steps.some(step => (step.toolCalls || []).some(call => options.stopOnTools?.includes(call.toolName))),
        ],
        temperature,
        maxOutputTokens: maxTokens ?? prov.capabilities?.maxTokens,
        providerOptions: buildProviderOptions(prov),
      });

      const iterator = result.fullStream[Symbol.asyncIterator]();
      const buffered = [];
      let committed = false;
      let retryProvider = false;
      try {
        while (true) {
          const { value, done } = await iterator.next();
          if (done) break;

          if (!committed && (value?.type === 'error' || (value?.type === 'finish' && (value.finishReason === 'error' || value.finishReason === 'length')))) {
            if (isAiPolicyError(value.error)) throw value.error;
            lastError = value.error || new Error(
              value?.finishReason === 'length'
                ? 'Provider ran out of output tokens before producing any response.'
                : 'Provider stream finished with an error before producing output.',
            );
            this.logger.warn(`Provider "${type}" stream failed before output, trying next: ${lastError?.message || lastError}`);
            this._providers.delete(providerKey);
            retryProvider = true;
            break;
          }

          if (!committed) {
            buffered.push(value);
            if (['text-delta', 'reasoning-delta', 'tool-call', 'tool-result', 'tool-error'].includes(value?.type)) {
              committed = true;
              for (const part of buffered) yield part;
              buffered.length = 0;
            }
          } else {
            yield value;
            if (value?.type === 'finish' && value.finishReason === 'length') {
              yield { type: 'error', error: new Error('Response was cut off before finishing — it ran out of output space (often mid-reasoning). Try again, or ask for a smaller, more targeted change.') };
            }
          }
        }
      } catch (e) {
        if (isAiPolicyError(e)) throw e;
        lastError = e;
        if (!committed) {
          this.logger.warn(`Provider "${type}" stream failed before output, trying next: ${e.message}`);
          this._providers.delete(providerKey);
          retryProvider = true;
        } else {
          this.logger.warn(`Provider "${type}" stream failed mid-stream: ${e.message}`);
          yield { type: 'error', error: e };
          return;
        }
      }

      if (retryProvider) continue;
      this.logger.debug(`streamChat via ${prov.name}`, { msgCount: messages.length });
      for (const part of buffered) yield part;
      return;
    }

    throw new Error(`No healthy AI provider available for streaming. Tried: ${types.join(', ')}. Last error: ${lastError?.message}`);
  }

  async *streamGenerate(prompt, options = {}) {
    const writingStyle = await getWritingStylePrompt(options.userId, options.writingStyle);
    if (writingStyle) options = { ...options, system: (options.system || '') + writingStyle, systemInstruction: (options.systemInstruction || '') + writingStyle };
    const { provider: reqProvider, modelType = 'LONG', userId, system, temperature, maxTokens } = options;
    const types = await this._fallbackSelections(reqProvider, modelType, userId);

    let lastError;
    for (const type of types) {
      const prov = await this.getProvider(type, {}, modelType, userId);
      if (!prov) continue;

      try {
        const result = sdkStreamText({
          model: prov.model,
          system,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          maxOutputTokens: maxTokens ?? prov.capabilities?.maxTokens,
          providerOptions: buildProviderOptions(prov),
        });

        for await (const part of result.fullStream) {
          if (part.type === 'text-delta' || part.type === 'reasoning-delta') yield part;
          else if (part.type === 'error') {
            if (isAiPolicyError(part.error)) throw part.error;
            lastError = part.error;
            break;
          }
        }
        return;
      } catch (e) {
        if (isAiPolicyError(e)) throw e;
        lastError = e;
        this.logger.warn(`Provider "${type}" streamGenerate failed: ${e.message}`);
      }
    }

    throw new Error(`No healthy AI provider for streaming generation. Last error: ${lastError?.message}`);
  }

  /**
   * User-scoped lists contain only granted model records. Without a userId,
   * retain the legacy global listing for trusted admin/internal callers.
   */
  async listProviders(options = {}) {
    const { userId } = options;
    if (userId) {
      const selections = await listModelSelectionsForUser(userId);
      return Promise.all(selections.map(async selection => {
        const { record } = await resolveModelForUser(userId, selection);
        return {
          type: record.id,
          slug: record.slug,
          displayName: record.name,
          model: record.model,
          modelType: record.modelType,
          isDefault: record.isDefault,
          configured: true,
          source: record.id.startsWith(PERSONAL_PREFIX) ? 'PERSONAL' : 'SERVER',
        };
      }));
    }

    try {
      await ensureBootstrapModels();
      const models = await require('../core/database').prisma.aiModel.findMany({
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

  /** Trusted admin/internal provider discovery path. */
  async listAvailableModels(type, overrides = {}) {
    return listAvailableModels(type, overrides);
  }

  /** Trusted admin/internal provider health-check path. */
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

module.exports = new AIManager();
