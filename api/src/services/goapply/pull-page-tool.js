/**
 * Fetch a public HTTP(S) page for an AI agent.
 *
 * The request is deliberately narrower than a general-purpose server-side
 * curl: private/link-local addresses and credentials are rejected to prevent
 * the tool from reaching internal services or cloud metadata endpoints.
 */
const dns = require('node:dns').promises;
const net = require('node:net');

const DEFAULT_MAX_BYTES = 500_000;
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;

function isPrivateIp(address) {
  if (address === '::1' || address === '::' || address.toLowerCase().startsWith('fe80:')) return true;

  // Normalize IPv4-mapped IPv6 addresses before applying the IPv4 rules.
  const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  const ipv4 = mapped ? mapped[1] : address;
  if (net.isIP(ipv4) === 4) {
    const [a, b] = ipv4.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }

  if (net.isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return normalized.startsWith('fc') || normalized.startsWith('fd');
  }
  return true;
}

async function assertPublicUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Invalid URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  if (url.username || url.password) throw new Error('URLs containing credentials are not allowed.');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) throw new Error('Local URLs are not allowed.');

  const addresses = net.isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('The URL resolves to a private or reserved network address.');
  }
  return url;
}

async function readLimitedBody(response, maxBytes) {
  if (!response.body?.getReader) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) throw new Error(`Page exceeds the ${maxBytes}-byte response limit.`);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error(`Page exceeds the ${maxBytes}-byte response limit.`);
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function pullPage(input, {
  maxBytes = DEFAULT_MAX_BYTES,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchFn = fetch,
} = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let currentUrl = input;

  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      const url = await assertPublicUrl(currentUrl);
      const response = await fetchFn(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html, text/plain, application/json, application/xml, text/xml;q=0.9, */*;q=0.1',
          'User-Agent': 'FoligoPagePull/1.0',
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error(`Redirect response ${response.status} did not include a Location header.`);
        if (redirects === MAX_REDIRECTS) throw new Error(`Page exceeded the ${MAX_REDIRECTS}-redirect limit.`);
        currentUrl = new URL(location, url).toString();
        continue;
      }
      if (!response.ok) throw new Error(`Page returned HTTP ${response.status}.`);

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const textual = !contentType || /^(text\/|application\/(json|xml|xhtml\+xml))/.test(contentType);
      if (!textual) throw new Error(`Unsupported content type: ${contentType.split(';')[0] || 'unknown'}.`);

      const declaredLength = Number(response.headers.get('content-length'));
      if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
        throw new Error(`Page exceeds the ${maxBytes}-byte response limit.`);
      }

      const raw = (await readLimitedBody(response, maxBytes)).toString('utf8');
      return {
        url: url.toString(),
        status: response.status,
        contentType: contentType || null,
        title: contentType.includes('html')
          ? (raw.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim()
          : '',
        content: contentType.includes('html') ? htmlToText(raw) : raw,
        bytes: Buffer.byteLength(raw),
      };
    }
  } catch (error) {
    throw new Error(`Pull page failed: ${error.name === 'AbortError' ? 'request timed out' : error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function createPullPageTool({ toolFn, z, maxBytes, timeoutMs }) {
  return toolFn({
    description:
      'Fetch and read the FULL text content of one already-known, specific public HTTP(S) URL, similar to curl. ' +
      'Use this after web_search — when one of its result URLs needs to be read in full — or whenever the user directly supplies a URL. ' +
      'Do NOT use this to discover a URL; use web_search for that first. HTML is converted to readable plain text. ' +
      'Private/internal network URLs, binary files, oversized responses, and unsafe redirects are rejected.',
    inputSchema: z.object({
      url: z.string().url().describe('The complete public HTTP or HTTPS URL to fetch.'),
    }),
    execute: async ({ url }) => JSON.stringify(await pullPage(url, { maxBytes, timeoutMs })),
  });
}

module.exports = { pullPage, createPullPageTool, isPrivateIp, htmlToText };
