jest.mock('./writing-style', () => ({ getWritingStylePrompt: jest.fn().mockResolvedValue('') }));

jest.mock('ai', () => ({
  generateText: jest.fn(),
  streamText: jest.fn(),
  stepCountIs: jest.fn(count => ({ count })),
}));

jest.mock('./providers', () => ({
  createProvider: jest.fn(),
  listProviders: jest.fn(() => []),
  isProviderConfigured: jest.fn(type => type === 'gemini'),
  listAvailableModels: jest.fn(),
}));

jest.mock('./model-config', () => {
  class UserModelAuthorizationError extends Error {
    constructor(message = 'The selected AI model is not available to this user') {
      super(message);
      this.name = 'UserModelAuthorizationError';
      this.code = 'USER_MODEL_ACCESS_DENIED';
    }
  }

  return {
    UserModelAuthorizationError,
    resolveModel: jest.fn(),
    resolveModelForUser: jest.fn(),
    listModelSelections: jest.fn(),
    listModelSelectionsForUser: jest.fn(),
    ensureBootstrapModels: jest.fn(),
    getDisabledProviderTypes: jest.fn(() => new Set()),
  };
});

jest.mock('../core/logger', () => ({
  createAILogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

const { generateText, streamText, stepCountIs } = require('ai');
const { createProvider, isProviderConfigured } = require('./providers');
const {
  UserModelAuthorizationError,
  resolveModel,
  resolveModelForUser,
  listModelSelections,
  listModelSelectionsForUser,
} = require('./model-config');
const manager = require('./manager');

function streamOf(parts) {
  return {
    fullStream: {
      async *[Symbol.asyncIterator]() {
        for (const part of parts) yield part;
      },
    },
  };
}

describe('AIManager streaming fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    manager.clearProviderCache();
    manager._fallbackChain = ['gemini', 'opencode'];
    listModelSelections.mockResolvedValue(['db-default']);

    resolveModel.mockImplementation(async selection => {
      if (!selection || selection === 'db-default') return { key: 'db-default', providerType: 'opencode', overrides: { model: 'deepseek-v4-flash' } };
      return { key: selection, providerType: selection, overrides: {} };
    });
    createProvider.mockImplementation((type, overrides) => ({
      name: type,
      displayName: type,
      model: { id: overrides.model || type },
      capabilities: { maxTokens: 4096 },
    }));
  });

  test('falls back when the first provider emits an error part before output', async () => {
    const upstreamError = new Error('Upstream request failed');
    streamText.mockImplementation(({ model }) => model.id === 'deepseek-v4-flash'
      ? streamOf([{ type: 'start' }, { type: 'start-step' }, { type: 'error', error: upstreamError }])
      : streamOf([{ type: 'start' }, { type: 'text-delta', text: 'fallback worked' }, { type: 'finish', finishReason: 'stop' }]));

    const parts = [];
    for await (const part of manager.streamChat([{ role: 'user', content: 'hello' }])) parts.push(part);

    expect(streamText).toHaveBeenCalledTimes(2);
    expect(parts).toEqual([
      { type: 'start' },
      { type: 'text-delta', text: 'fallback worked' },
      { type: 'finish', finishReason: 'stop' },
    ]);
  });

  test('stops the tool loop when an interview card needs a human answer', async () => {
    streamText.mockReturnValue(streamOf([{ type: 'text-delta', text: 'Question' }]));
    for await (const part of manager.streamChat([{ role: 'user', content: 'Interview me' }], { stopOnTools: ['ask_user', 'request_screenshots'] })) { void part; }
    const conditions = streamText.mock.calls[0][0].stopWhen;
    const humanInputCondition = conditions[1];
    expect(humanInputCondition({ steps: [{ toolCalls: [{ toolName: 'ask_user' }] }] })).toBe(true);
    expect(humanInputCondition({ steps: [{ toolCalls: [{ toolName: 'request_screenshots' }] }] })).toBe(true);
    expect(humanInputCondition({ steps: [{ toolCalls: [{ toolName: 'get_post' }] }] })).toBe(false);
  });

  test('does not switch providers after visible output has started', async () => {
    streamText.mockReturnValue(streamOf([
      { type: 'start' },
      { type: 'text-delta', text: 'partial' },
      { type: 'error', error: new Error('late failure') },
    ]));

    const parts = [];
    for await (const part of manager.streamChat([{ role: 'user', content: 'hello' }])) parts.push(part);

    expect(streamText).toHaveBeenCalledTimes(1);
    expect(parts.map(part => part.type)).toEqual(['start', 'text-delta', 'error']);
  });

  test('tries other enabled database models before environment providers', async () => {
    listModelSelections.mockResolvedValue(['flash-id', 'pro-id']);
    isProviderConfigured.mockReturnValue(false);
    resolveModel.mockImplementation(async selection => ({
      key: selection,
      providerType: 'opencode',
      overrides: { model: selection === 'flash-id' ? 'deepseek-v4-flash' : 'deepseek-v4-pro' },
    }));
    streamText.mockImplementation(({ model }) => model.id === 'deepseek-v4-flash'
      ? streamOf([{ type: 'start' }, { type: 'error', error: new Error('flash unavailable') }])
      : streamOf([{ type: 'text-delta', text: 'pro worked' }]));

    const parts = [];
    for await (const part of manager.streamChat([{ role: 'user', content: 'hello' }])) parts.push(part);

    expect(streamText).toHaveBeenCalledTimes(2);
    expect(createProvider.mock.calls.map(([, overrides]) => overrides.model)).toEqual([
      'deepseek-v4-flash',
      'deepseek-v4-pro',
    ]);
    expect(parts).toEqual([{ type: 'text-delta', text: 'pro worked' }]);
  });

  test('limits externally orchestrated tool loops to one SDK step', async () => {
    streamText.mockReturnValue(streamOf([{ type: 'finish', finishReason: 'stop' }]));

    for await (const _ of manager.streamChat(
      [{ role: 'user', content: 'hello' }],
      { externalToolLoop: true, maxSteps: 8 },
    )) {}

    expect(stepCountIs).toHaveBeenCalledWith(1);
  });
});

describe('AIManager user-scoped model selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    manager.clearProviderCache();
    resolveModelForUser.mockResolvedValue({
      key: 'granted-model-id',
      providerType: 'openai',
      overrides: { model: 'granted-model' },
    });
    createProvider.mockImplementation((type, overrides) => ({
      name: type,
      displayName: type,
      model: { id: overrides.model || type },
      capabilities: { maxTokens: 4096 },
    }));
  });

  test('uses a granted explicitly selected model for a user-scoped generation request', async () => {
    generateText.mockResolvedValue({ text: 'granted response' });

    await expect(manager.generateText('hello', { userId: 'user-1', provider: 'granted-model-id' }))
      .resolves.toEqual({ text: 'granted response', reasoning: null });

    expect(resolveModelForUser).toHaveBeenCalledWith('user-1', 'granted-model-id');
    expect(resolveModel).not.toHaveBeenCalled();
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ model: { id: 'granted-model' } }));
  });

  test('rejects an explicitly ungranted model without trying another provider', async () => {
    resolveModelForUser.mockRejectedValue(new UserModelAuthorizationError());

    await expect(manager.generateText('hello', { userId: 'user-1', provider: 'ungranted-model' }))
      .rejects.toMatchObject({ name: 'UserModelAuthorizationError', code: 'USER_MODEL_ACCESS_DENIED' });

    expect(listModelSelectionsForUser).not.toHaveBeenCalled();
    expect(createProvider).not.toHaveBeenCalled();
    expect(generateText).not.toHaveBeenCalled();
  });

  test('does not create an environment provider for a raw provider selection from a user-scoped request', async () => {
    resolveModelForUser.mockRejectedValue(new UserModelAuthorizationError());

    await expect(manager.generateText('hello', { userId: 'user-1', provider: 'openai' }))
      .rejects.toMatchObject({ code: 'USER_MODEL_ACCESS_DENIED' });

    expect(resolveModelForUser).toHaveBeenCalledWith('user-1', 'openai');
    expect(createProvider).not.toHaveBeenCalled();
    expect(resolveModel).not.toHaveBeenCalled();
  });

  test('rejects user-scoped defaults with NO_AI_MODEL_ACCESS when the user has no grants', async () => {
    listModelSelectionsForUser.mockResolvedValue([]);

    await expect(manager.generateChat([{ role: 'user', content: 'hello' }], { userId: 'user-1' }))
      .rejects.toMatchObject({ name: 'UserModelAuthorizationError', code: 'NO_AI_MODEL_ACCESS' });

    expect(resolveModelForUser).not.toHaveBeenCalled();
    expect(resolveModel).not.toHaveBeenCalled();
    expect(createProvider).not.toHaveBeenCalled();
  });

  test('preflights an explicit stream selection through the user resolver without creating a provider', async () => {
    await expect(manager.preflightStreamAccess({ userId: 'user-1', provider: 'granted-model-id' }))
      .resolves.toEqual(['granted-model-id']);

    expect(resolveModelForUser).toHaveBeenCalledWith('user-1', 'granted-model-id');
    expect(listModelSelectionsForUser).not.toHaveBeenCalled();
    expect(resolveModel).not.toHaveBeenCalled();
    expect(createProvider).not.toHaveBeenCalled();
  });

  test('preflights a default stream selection through user grants and rejects no-grant users', async () => {
    listModelSelectionsForUser.mockResolvedValue([]);

    await expect(manager.preflightStreamAccess({ userId: 'user-1', modelType: 'LONG' }))
      .rejects.toMatchObject({ name: 'UserModelAuthorizationError', code: 'NO_AI_MODEL_ACCESS' });

    expect(listModelSelectionsForUser).toHaveBeenCalledWith('user-1', 'LONG');
    expect(resolveModel).not.toHaveBeenCalled();
    expect(createProvider).not.toHaveBeenCalled();
  });

  test('uses only resolved user grant selections in a streaming fallback chain', async () => {
    listModelSelectionsForUser.mockResolvedValue(['user-flash', 'user-pro']);
    resolveModelForUser.mockImplementation(async (_userId, selection) => ({
      key: selection,
      providerType: 'opencode',
      overrides: { model: selection === 'user-flash' ? 'granted-flash' : 'granted-pro' },
    }));
    streamText.mockImplementation(({ model }) => model.id === 'granted-flash'
      ? streamOf([{ type: 'start' }, { type: 'error', error: new Error('granted flash failed') }])
      : streamOf([{ type: 'text-delta', text: 'granted pro worked' }]));

    const parts = [];
    for await (const part of manager.streamChat([{ role: 'user', content: 'hello' }], { userId: 'user-1' })) parts.push(part);

    expect(listModelSelectionsForUser).toHaveBeenCalledWith('user-1', 'QUICK');
    expect(listModelSelections).not.toHaveBeenCalled();
    expect(createProvider.mock.calls.map(([, overrides]) => overrides.model)).toEqual(['granted-flash', 'granted-pro']);
    expect(parts).toEqual([{ type: 'text-delta', text: 'granted pro worked' }]);
  });

  test('lists only records returned by the user-scoped model resolvers', async () => {
    listModelSelectionsForUser.mockResolvedValue(['granted-model-id']);
    resolveModelForUser.mockResolvedValue({
      key: 'granted-model-id',
      providerType: 'openai',
      overrides: { model: 'granted-model' },
      record: {
        id: 'granted-model-id',
        slug: 'granted-model',
        name: 'Granted model',
        model: 'granted-model',
        modelType: 'QUICK',
        isDefault: true,
      },
    });

    await expect(manager.listProviders({ userId: 'user-1' })).resolves.toEqual([{
      source: 'SERVER',
      type: 'granted-model-id',
      slug: 'granted-model',
      displayName: 'Granted model',
      model: 'granted-model',
      modelType: 'QUICK',
      isDefault: true,
      configured: true,
    }]);

    expect(listModelSelectionsForUser).toHaveBeenCalledWith('user-1');
    expect(resolveModelForUser).toHaveBeenCalledWith('user-1', 'granted-model-id');
    expect(resolveModel).not.toHaveBeenCalled();
  });

  test('retains the trusted admin provider test path without a user grant', async () => {
    resolveModel.mockResolvedValue({
      key: 'admin-openai',
      providerType: 'openai',
      overrides: { model: 'admin-model' },
    });
    generateText.mockResolvedValue({ text: 'pong' });

    await expect(manager.testProvider('openai')).resolves.toMatchObject({ ok: true });

    expect(resolveModel).toHaveBeenCalledWith('openai', 'QUICK');
    expect(resolveModelForUser).not.toHaveBeenCalled();
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ model: { id: 'admin-model' } }));
  });
});


test('passes authenticated writing preferences into generation system context', async () => {
  const { getWritingStylePrompt } = require('./writing-style');
  getWritingStylePrompt.mockResolvedValueOnce(' Preferred voice: concise.');
  const fallback = jest.spyOn(manager, '_withFallback').mockImplementation(async (_provider, _type, fn) => fn({ name: 'test' }));
  const call = jest.spyOn(manager, '_callModel').mockResolvedValue({ text: 'Draft', reasoning: null });
  try {
    await manager.generateChat([{ role: 'user', content: 'Write an introduction' }], { userId: 'u1', systemInstruction: 'Keep facts accurate.' });
    expect(getWritingStylePrompt).toHaveBeenLastCalledWith('u1', undefined);
    expect(call).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ system: 'Keep facts accurate. Preferred voice: concise.' }));
  } finally { fallback.mockRestore(); call.mockRestore(); }
});

describe('personal AI billing selection', () => {
  beforeEach(() => { jest.clearAllMocks(); manager.clearProviderCache(); });
  test('automatic fallback remains personal when personal and server models exist', async () => {
    listModelSelectionsForUser.mockResolvedValue(['personal:a', 'personal:b', 'server-model']);
    await expect(manager._fallbackSelections(null, 'QUICK', 'u1')).resolves.toEqual(['personal:a', 'personal:b']);
  });
  test('an explicit server selection remains available with personal connections', async () => {
    resolveModelForUser.mockResolvedValue({ key: 'server-model' });
    await expect(manager._fallbackSelections('server-model', 'QUICK', 'u1')).resolves.toEqual(['server-model']);
    expect(resolveModelForUser).toHaveBeenCalledWith('u1', 'server-model');
  });
  test('quota denials cannot be swallowed by the provider fallback chain', async () => {
    listModelSelectionsForUser.mockResolvedValue(['server-a', 'server-b']);
    resolveModelForUser.mockResolvedValue({ key: 'server-a', providerType: 'openai', record: { model: 'test' }, overrides: {} });
    createProvider.mockReturnValue({ name: 'openai', model: {} });
    const denial = Object.assign(new Error('Allowance exhausted'), { code: 'AI_USAGE_LIMIT_EXCEEDED' });
    const fn = jest.fn().mockRejectedValue(denial);
    await expect(manager._withFallback(null, 'QUICK', fn, 'u1')).rejects.toBe(denial);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  test('user providers are rebuilt instead of sharing cached credential instances', async () => {
    resolveModelForUser.mockImplementation(async user => ({ key: 'same-model', source: 'PERSONAL', providerType: 'openai', overrides: { apiKey: `${user}-secret` }, record: { model: 'test' } }));
    createProvider.mockImplementation(() => ({ name: 'openai', model: {} }));
    const first = await manager.getProvider('same-model', {}, 'QUICK', 'alice');
    const second = await manager.getProvider('same-model', {}, 'QUICK', 'bob');
    expect(first).not.toBe(second);
    expect(createProvider.mock.calls[0][1].apiKey).toBe('alice-secret');
    expect(createProvider.mock.calls[1][1].apiKey).toBe('bob-secret');
    expect(manager._providers.size).toBe(0);
  });
});
