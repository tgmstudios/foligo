jest.mock('@ai-sdk/google', () => ({ createGoogleGenerativeAI: jest.fn(options => Object.assign(() => ({ options }), { options })) }));
jest.mock('@ai-sdk/anthropic', () => ({ createAnthropic: jest.fn(options => Object.assign(() => ({ options }), { options })) }));
jest.mock('@ai-sdk/openai-compatible', () => ({ createOpenAICompatible: jest.fn(options => Object.assign(() => ({ options }), { options })) }));
jest.mock('@ai-sdk/openai', () => ({ createOpenAI: jest.fn(options => Object.assign(() => ({ options, responses: () => ({ options }) }), { options, responses: () => ({ options }) })) }));
const { createProvider } = require('./index');

const originalProxy = process.env.AI_HTTPS_PROXY;
const originalAllow = process.env.AI_EGRESS_ALLOWED_HOSTS;
afterEach(() => {
  if (originalProxy === undefined) delete process.env.AI_HTTPS_PROXY; else process.env.AI_HTTPS_PROXY = originalProxy;
  if (originalAllow === undefined) delete process.env.AI_EGRESS_ALLOWED_HOSTS; else process.env.AI_EGRESS_ALLOWED_HOSTS = originalAllow;
});

test('providers receive explicit proxy fetch and direct fetch remains direct without proxy env', async () => {
  delete process.env.AI_HTTPS_PROXY;
  const direct = jest.fn();
  global.fetch = direct;
  const { createGoogleGenerativeAI } = require('@ai-sdk/google');
  createProvider('gemini', { fetch: direct });
  expect(createGoogleGenerativeAI.mock.calls.at(-1)[0].fetch).toBe(direct);
});

test('proxy fetch rejects HTTP and hosts outside explicit allowlist', async () => {
  process.env.AI_HTTPS_PROXY = 'http://127.0.0.1:33128';
  process.env.AI_EGRESS_ALLOWED_HOSTS = 'generativelanguage.googleapis.com,api.openai.com,opencode.ai';
  const { createAIProxyFetch } = require('./proxy-fetch');
  await expect(createAIProxyFetch()('http://api.openai.com/v1', {})).rejects.toThrow(/HTTPS/);
  await expect(createAIProxyFetch()('https://example.com/', {})).rejects.toThrow(/allowlist/);
});

test('provider factory accepts explicit fetch override when proxy configured', () => {
  process.env.AI_HTTPS_PROXY = 'http://127.0.0.1:33128';
  process.env.AI_EGRESS_ALLOWED_HOSTS = 'generativelanguage.googleapis.com,api.openai.com,opencode.ai';
  const { createGoogleGenerativeAI } = require('@ai-sdk/google');
  const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');
  createProvider('gemini');
  createProvider('openai');
  expect(createGoogleGenerativeAI.mock.calls.at(-1)[0].fetch).toBeInstanceOf(Function);
  expect(createOpenAICompatible.mock.calls.at(-1)[0].fetch).toBeInstanceOf(Function);
});
