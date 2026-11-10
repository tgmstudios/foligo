'use strict';

const { ProxyAgent, fetch: transportFetch } = require('undici');
const agents = new Map();

const DEFAULT_ALLOWED_HOSTS = [
  'generativelanguage.googleapis.com',
  'api.openai.com',
  'chatgpt.com',
  'opencode.ai',
  'api.anthropic.com',
];

function createAIProxyFetch({ proxyUrl = process.env.AI_HTTPS_PROXY, allowedHosts = process.env.AI_EGRESS_ALLOWED_HOSTS } = {}) {
  if (!proxyUrl) return globalThis.fetch;
  const proxy = new URL(proxyUrl);
  if (!['http:', 'https:'].includes(proxy.protocol) || proxy.username || proxy.password) {
    throw new Error('AI_HTTPS_PROXY must be an HTTP(S) proxy URL without credentials');
  }
  const hosts = new Set((allowedHosts ? allowedHosts.split(',') : DEFAULT_ALLOWED_HOSTS).map(h => h.trim().toLowerCase()).filter(Boolean));
  if (!agents.has(proxyUrl)) agents.set(proxyUrl, new ProxyAgent(proxyUrl));
  const dispatcher = agents.get(proxyUrl);
  return async (input, init = {}) => {
    const url = input instanceof Request ? new URL(input.url) : new URL(String(input));
    if (url.protocol !== 'https:') throw new Error('AI egress only permits HTTPS requests');
    if (url.port && url.port !== '443') throw new Error('AI egress only permits HTTPS port 443');
    if (url.username || url.password) throw new Error('AI egress URLs must not contain credentials');
    if (!hosts.has(url.hostname.toLowerCase())) throw new Error(`AI egress host is not in the allowlist: ${url.hostname}`);
    const { dispatcher: _callerDispatcher, ...safeInit } = init;
    // Use fetch and ProxyAgent from the same undici version. Node's bundled
    // dispatcher protocol can differ from an installed undici major version.
    // Normalize Request objects across implementations without consuming streams.
    const requestInit = input instanceof Request ? {
      method: input.method, headers: input.headers, body: input.body,
      signal: input.signal, redirect: input.redirect,
    } : {};
    const options = { ...requestInit, ...safeInit, dispatcher };
    if (options.body && typeof options.body.getReader === 'function') options.duplex = 'half';
    return transportFetch(url, options);
  };
}

module.exports = { createAIProxyFetch, DEFAULT_ALLOWED_HOSTS };
