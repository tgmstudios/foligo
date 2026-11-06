const { prisma } = require('../core/database');
const { encrypt, decrypt } = require('../../utils/encryption');
const oauth = require('./oauth/openai-device-auth');

const PERSONAL_PROVIDERS = ['openai', 'anthropic', 'gemini', 'opencode', 'codex'];
const PERSONAL_PREFIX = 'personal:';
const codexLinkEnabled = () => process.env.AI_PERSONAL_CODEX_DEVICE_AUTH === 'true';

function requireEncryption() {
  if (!process.env.ENCRYPTION_KEY) {
    const error = new Error('The administrator must configure a persistent ENCRYPTION_KEY before saving personal AI credentials.');
    error.status = 503;
    throw error;
  }
}

function safeConnection(row) {
  return {
    id: row.id, selection: `${PERSONAL_PREFIX}${row.id}`, providerType: row.providerType,
    model: row.model, modelType: row.modelType, enabled: row.enabled,
    authType: row.oauthRefreshToken ? 'subscription' : 'apiKey', hasApiKey: !!row.apiKey,
  };
}

async function listPersonalConnections(userId) {
  return prisma.userAiConnection.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
}

async function resolvePersonalConnection(userId, selection) {
  if (!selection?.startsWith(PERSONAL_PREFIX)) return null;
  // Serialize rotating refresh tokens across API workers; never log secrets.
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`personal-ai:${userId}`}))`;
    let row = await tx.userAiConnection.findFirst({ where: { id: selection.slice(PERSONAL_PREFIX.length), userId, enabled: true } });
    if (!row) return null;
    if (row.oauthRefreshToken) {
      if (!codexLinkEnabled()) throw Object.assign(new Error('Subscription linking is disabled for this deployment. Use a personal API key.'), { code: 'PERSONAL_AI_RECONNECT_REQUIRED' });
      if (!row.oauthExpiresAt || row.oauthExpiresAt.getTime() < Date.now() + 60000) {
        try {
          const tokens = await oauth.refreshTokens(decrypt(row.oauthRefreshToken));
          if (!tokens.access_token || !Number.isFinite(Number(tokens.expires_in))) throw new Error('Invalid tokens');
          row = await tx.userAiConnection.update({ where: { id: row.id }, data: {
            apiKey: encrypt(tokens.access_token),
            oauthRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : row.oauthRefreshToken,
            oauthExpiresAt: new Date(Date.now() + Number(tokens.expires_in) * 1000),
          } });
        } catch {
          throw Object.assign(new Error('Reconnect your personal Codex subscription in User Settings.'), { code: 'PERSONAL_AI_RECONNECT_REQUIRED' });
        }
      }
    }
    // Explicitly reset preset endpoints and headers: never inherit admin/env secrets.
    const endpoints = {
      openai: 'https://api.openai.com/v1', opencode: 'https://opencode.ai/zen/go/v1',
      codex: row.oauthRefreshToken ? 'https://chatgpt.com/backend-api/codex' : 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1', gemini: 'https://generativelanguage.googleapis.com/v1beta',
    };
    const overrides = {
      apiKey: decrypt(row.apiKey), model: row.model, headers: {},
      endpoint: endpoints[row.providerType], baseUrl: endpoints[row.providerType],
      chatgptAccountId: row.oauthAccountId || undefined,
    };
    return {
      key: selection, providerType: row.providerType, overrides,
      source: 'PERSONAL', record: {
        id: selection, slug: selection, name: `Personal ${row.providerType}: ${row.model}`,
        model: row.model, modelType: row.modelType, isDefault: false,
      },
    };
  }, { timeout: 25000 });
}

module.exports = { PERSONAL_PROVIDERS, PERSONAL_PREFIX, codexLinkEnabled, requireEncryption, safeConnection, listPersonalConnections, resolvePersonalConnection };
