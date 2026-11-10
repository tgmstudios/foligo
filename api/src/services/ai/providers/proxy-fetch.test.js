jest.mock('undici', () => ({ ProxyAgent: jest.fn(function(url) { this.url = url; }), fetch: jest.fn() }));
const { fetch: transportFetch } = require('undici');
const { createAIProxyFetch } = require('./proxy-fetch');

test('uses the matching undici fetch implementation and preserves request data', async () => {
  transportFetch.mockResolvedValue({ status: 200 });
  const controller = new AbortController();
  const fetch = createAIProxyFetch({ proxyUrl: 'http://proxy:3128', allowedHosts: 'opencode.ai' });
  await fetch('https://opencode.ai/v1', { method: 'POST', body: 'hello', signal: controller.signal });
  expect(transportFetch).toHaveBeenCalled();
  const [url, options] = transportFetch.mock.calls.at(-1);
  expect(String(url)).toBe('https://opencode.ai/v1');
  expect(options.method).toBe('POST');
  expect(options.dispatcher.url).toBe('http://proxy:3128');
});

test('preserves Request streams and abort signals without buffering', async () => {
  const controller = new AbortController();
  const request = new Request('https://opencode.ai/v1', { method: 'POST', body: 'stream', signal: controller.signal });
  const fetch = createAIProxyFetch({ proxyUrl: 'http://proxy:3128', allowedHosts: 'opencode.ai' });
  await fetch(request, { dispatcher: { invalid: true } });
  const [, options] = transportFetch.mock.calls.at(-1);
  expect(options.body).toBe(request.body);
  expect(options.signal).toBe(request.signal);
  expect(options.duplex).toBe('half');
  expect(options.dispatcher.url).toBe('http://proxy:3128');
});
