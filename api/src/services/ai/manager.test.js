jest.mock('ai', () => ({
  generateText: jest.fn(),
  streamText: jest.fn(),
  stepCountIs: jest.fn(count => ({ count })),
}));

jest.mock('./providers', () => ({
  createProvider: jest.fn(),
  listProviders: jest.fn(() => []),
  isProviderConfigured: jest.fn(type => type === 'gemini'),
}));

jest.mock('./model-config', () => ({
  resolveModel: jest.fn(),
  listModelSelections: jest.fn(),
  ensureBootstrapModels: jest.fn(),
}));

jest.mock('../logger', () => ({
  createAILogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

jest.mock('../gemini-config', () => ({ SAFETY_SETTINGS: [] }));

const { streamText, stepCountIs } = require('ai');
const { createProvider, isProviderConfigured } = require('./providers');
const { resolveModel, listModelSelections } = require('./model-config');
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
