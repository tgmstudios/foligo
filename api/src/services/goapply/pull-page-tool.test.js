const dns = require('node:dns').promises;
const {
  htmlToText,
  isPrivateIp,
  pullPage,
  createPullPageTool,
} = require('./pull-page-tool');

afterEach(() => {
  jest.restoreAllMocks();
});

describe('pull-page-tool', () => {
  test.each([
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '::1',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
  ])('rejects private or reserved address %s', (address) => {
    expect(isPrivateIp(address)).toBe(true);
  });

  test.each(['1.1.1.1', '8.8.8.8', '2606:4700:4700::1111'])(
    'accepts public address %s',
    (address) => {
      expect(isPrivateIp(address)).toBe(false);
    },
  );

  test('turns HTML into compact readable text without scripts or styles', () => {
    const html = '<style>.x{display:none}</style><h1>Hello &amp; welcome</h1><script>bad()</script><p>Page text</p>';
    expect(htmlToText(html)).toBe('Hello & welcome Page text');
  });

  test('fetches a public HTML page and returns readable content', async () => {
    jest.spyOn(dns, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const fetchFn = jest.fn().mockResolvedValue(new Response(
      '<html><head><title>Example</title></head><body><h1>Hello</h1><p>World</p></body></html>',
      { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
    ));

    await expect(pullPage('https://example.com/docs', { fetchFn })).resolves.toMatchObject({
      url: 'https://example.com/docs',
      status: 200,
      title: 'Example',
      content: 'Example Hello World',
    });
    expect(fetchFn).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: 'manual' }));
  });

  test('validates redirects and refuses a redirect to a private address', async () => {
    jest.spyOn(dns, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const fetchFn = jest.fn().mockResolvedValue(new Response(null, {
      status: 302,
      headers: { location: 'http://127.0.0.1/admin' },
    }));

    await expect(pullPage('https://example.com', { fetchFn })).rejects.toThrow(
      'private or reserved network address',
    );
  });

  test('rejects a response larger than the configured limit', async () => {
    jest.spyOn(dns, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const fetchFn = jest.fn().mockResolvedValue(new Response('too large', {
      status: 200,
      headers: { 'content-type': 'text/plain', 'content-length': '9' },
    }));

    await expect(pullPage('https://example.com', { fetchFn, maxBytes: 4 })).rejects.toThrow(
      'response limit',
    );
  });

  test('creates an AI SDK-compatible pull_page definition', () => {
    const toolFn = jest.fn((definition) => definition);
    const z = require('zod');
    const definition = createPullPageTool({ toolFn, z });

    expect(toolFn).toHaveBeenCalledTimes(1);
    expect(definition.description).toContain('specific public HTTP(S) URL');
    expect(definition.execute).toEqual(expect.any(Function));
  });
});
