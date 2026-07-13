const crypto = require('crypto');

const MAX_BATCH_SIZE = 100;
const EVENT_NAME = /^[a-zA-Z][a-zA-Z0-9_.:-]{0,63}$/;

function hash(value, salt = process.env.ANALYTICS_HASH_SALT || process.env.JWT_SECRET || 'foligo-analytics') {
  return value ? crypto.createHmac('sha256', salt).update(String(value)).digest('hex') : null;
}

function createWriteKey() {
  return `fa_${crypto.randomBytes(24).toString('base64url')}`;
}

function normalizeOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

function originAllowed(origin, allowedOrigins) {
  if (!origin || allowedOrigins.length === 0) return true;
  const normalized = normalizeOrigin(origin);
  return allowedOrigins.some(entry => {
    if (entry === '*') return true;
    if (entry.startsWith('*.')) {
      try {
        const host = new URL(normalized).hostname;
        const suffix = entry.slice(1).toLowerCase();
        return host.endsWith(suffix) && host.length > suffix.length;
      } catch {
        return false;
      }
    }
    return normalizeOrigin(entry) === normalized;
  });
}

function cleanString(value, maxLength) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function normalizeEvent(input, propertyId) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Each event must be an object');
  const name = input.name || input.event;
  if (typeof name !== 'string' || !EVENT_NAME.test(name)) throw new Error('Event name must be 1-64 letters, numbers, dots, colons, underscores, or hyphens');

  const occurredAt = input.timestamp ? new Date(input.timestamp) : new Date();
  if (Number.isNaN(occurredAt.getTime())) throw new Error('timestamp must be a valid ISO 8601 date');
  if (occurredAt.getTime() > Date.now() + 5 * 60 * 1000) throw new Error('timestamp cannot be more than five minutes in the future');

  const url = cleanString(input.url, 2048);
  let path = cleanString(input.path, 512);
  if (!path && url) {
    try { path = new URL(url).pathname.slice(0, 512); } catch { /* URL is optional metadata */ }
  }
  const metadata = input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata) ? input.metadata : undefined;
  if (metadata && Buffer.byteLength(JSON.stringify(metadata)) > 8192) throw new Error('metadata must be at most 8 KB');

  return {
    propertyId,
    name,
    occurredAt,
    visitorHash: hash(cleanString(input.visitorId, 256)),
    sessionHash: hash(cleanString(input.sessionId, 256)),
    url,
    path,
    title: cleanString(input.title, 512),
    referrer: cleanString(input.referrer, 2048),
    country: cleanString(input.country, 2)?.toUpperCase(),
    device: cleanString(input.device, 32),
    metadata,
  };
}

module.exports = { MAX_BATCH_SIZE, hash, createWriteKey, normalizeOrigin, originAllowed, normalizeEvent };
