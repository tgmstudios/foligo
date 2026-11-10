'use strict';

const { ProxyAgent } = require('undici');

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
  const dispatcher = new ProxyAgent(proxyUrl);
  return async (input, init = {}) => {
    const url = input instanceof Request ? new URL(input.url) : new URL(String(input));
    if (url.protocol !== 'https:') throw new Error('AI egress only permits HTTPS requests');
    if (url.port && url.port !== '443') throw new Error('AI egress only permits HTTPS port 443');
    if (url.username || url.password) throw new Error('AI egress URLs must not contain credentials');
    if (!hosts.has(url.hostname.toLowerCase())) throw new Error(`AI egress host is not in the allowlist: ${url.hostname}`);
    const { dispatcher: _callerDispatcher, ...safeInit } = init;
    const request = input instanceof Request ? input : new Request(input, safeInit);
    return globalThis.fetch(request, { ...(input instanceof Request ? safeInit : {}), dispatcher });
  };
}

module.exports = { createAIProxyFetch, DEFAULT_ALLOWED_HOSTS };
