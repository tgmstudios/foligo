const { prisma } = require('../core/database');
const { encrypt, decrypt } = require('../../utils/encryption');
const { refreshTokens, chatgptAccountIdFromIdToken } = require('./oauth/openai-device-auth');

const VALID_MODEL_TYPES = ['QUICK', 'LONG'];
const VALID_PROVIDER_TYPES = ['gemini', 'openai', 'opencode', 'codex', 'ollama', 'anthropic', 'custom'];
let bootstrapComplete = false;

async function ensureBootstrapModels() {
  if (bootstrapComplete) return;
  if (await prisma.aiModel.count() === 0) {
    await prisma.aiModel.createMany({
      data: [
        { id: '4ea2a1bc-963a-4df1-b7b9-b96fe4a2b930', name: 'OpenCode Go DeepSeek Flash', slug: 'opencode-go-deepseek-flash', providerType: 'opencode', model: 'deepseek-v4-flash', modelType: 'QUICK', enabled: true, isDefault: true },
        { id: 'a46d8501-553d-47e9-a01f-49700579db0a', name: 'OpenCode Go DeepSeek Pro', slug: 'opencode-go-deepseek-pro', providerType: 'opencode', model: 'deepseek-v4-pro', modelType: 'LONG', enabled: true, isDefault: true },
      ],
      skipDuplicates: true,
    });
  }
  bootstrapComplete = true;
}

const OAUTH_REFRESH_MARGIN_MS = 60 * 1000; // renew a little before actual expiry

/**
 * If this provider authenticated via OAuth device-code login (e.g. "Sign in
 * with ChatGPT" for codex) and its access token is at/near expiry, silently
 * renew it with the stored refresh token and persist the new tokens. Renewal
 * failures are swallowed here — the caller proceeds with the stale token and
 * gets a real, actionable auth error from the provider itself if it's dead.
 * @returns the (possibly refreshed) config row
 */
async function refreshOAuthTokenIfNeeded(config) {
  if (!config.oauthRefreshToken || !config.oauthExpiresAt) return config;
  if (config.oauthExpiresAt.getTime() - OAUTH_REFRESH_MARGIN_MS > Date.now()) return config;

  try {
    const refreshed = await refreshTokens(decrypt(config.oauthRefreshToken));
    const accountId = chatgptAccountIdFromIdToken(refreshed.id_token);
    return prisma.aiProviderConfig.update({
      where: { providerType: config.providerType },
      data: {
        apiKey: encrypt(refreshed.access_token),
        oauthRefreshToken: refreshed.refresh_token ? encrypt(refreshed.refresh_token) : config.oauthRefreshToken,
        oauthExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        ...(accountId ? { oauthAccountId: accountId } : {}),
      },
    });
  } catch {
    return config;
  }
}

/**
 * Provider-level endpoint/apiKey/headers an admin can set once (via the
 * "Edit provider" panel) instead of re-entering them on every AiModel under
 * that provider. Returns null if unset or the provider has been disabled.
 */
async function getProviderConfig(providerType) {
  let config = await prisma.aiProviderConfig.findUnique({ where: { providerType } });
  if (!config || config.enabled === false) return null;
  config = await refreshOAuthTokenIfNeeded(config);
  const overrides = {};
  if (config.endpoint) {
    overrides.endpoint = config.endpoint;
    overrides.baseUrl = config.endpoint;
  }
  if (config.apiKey) overrides.apiKey = decrypt(config.apiKey);
  if (config.headers && typeof config.headers === 'object' && Object.keys(config.headers).length) {
    overrides.headers = config.headers;
  }
  if (config.oauthAccountId) overrides.chatgptAccountId = config.oauthAccountId;
  return overrides;
}

/** Provider types an admin has explicitly disabled in the "Edit provider" panel. */
async function getDisabledProviderTypes() {
  const disabled = await prisma.aiProviderConfig.findMany({ where: { enabled: false }, select: { providerType: true } });
  return new Set(disabled.map(d => d.providerType));
}

/**
 * Explicit primary+fallback AiModel id order for a modelType, configured via
 * the "Default models & fallbacks" panel. Empty array means unconfigured —
 * callers fall back to the implicit isDefault/createdAt ordering.
 */
async function getModelOrder(modelType) {
  const row = await prisma.aiModelDefaults.findUnique({ where: { modelType } });
  return Array.isArray(row?.order) ? row.order : [];
}

/**
 * Build the override chain for a saved AiModel record: provider-level
 * defaults first, then the record's own fields on top (a model can always
 * override its provider's shared endpoint/key/headers).
 */
async function toOverrides(record) {
  const providerOverrides = await getProviderConfig(record.providerType) || {};
  const overrides = { ...providerOverrides, model: record.model };
  if (record.endpoint) {
    overrides.endpoint = record.endpoint;
    overrides.baseUrl = record.endpoint;
  }
  if (record.apiKey) overrides.apiKey = decrypt(record.apiKey);
  if (record.headers && typeof record.headers === 'object' && Object.keys(record.headers).length) {
    overrides.headers = record.headers;
  }
  if (record.capabilities && typeof record.capabilities === 'object' && Object.keys(record.capabilities).length) {
    overrides.capabilities = record.capabilities;
  }
  return overrides;
}

async function resolveModel(selection, modelType = 'QUICK') {
  await ensureBootstrapModels();
  const normalizedType = VALID_MODEL_TYPES.includes(String(modelType).toUpperCase())
    ? String(modelType).toUpperCase()
    : 'QUICK';
  const disabledProviders = await getDisabledProviderTypes();

  if (selection) {
    const record = await prisma.aiModel.findFirst({
      where: { enabled: true, OR: [{ id: selection }, { slug: selection }] },
    });
    if (record && !disabledProviders.has(record.providerType)) {
      return { key: record.id, providerType: record.providerType, overrides: await toOverrides(record), record };
    }
    // Preserve compatibility with callers that still send an environment
    // provider name such as "gemini" or "opencode".
    if (VALID_PROVIDER_TYPES.includes(selection) && !disabledProviders.has(selection)) {
      return { key: selection, providerType: selection, overrides: await getProviderConfig(selection) || {}, record: null };
    }
  }

  // An explicit primary/fallback order (see "Default models & fallbacks")
  // wins over the implicit isDefault/createdAt ordering below.
  const explicitOrder = await getModelOrder(normalizedType);
  for (const id of explicitOrder) {
    const record = await prisma.aiModel.findFirst({ where: { id, enabled: true, providerType: { notIn: [...disabledProviders] } } });
    if (record) return { key: record.id, providerType: record.providerType, overrides: await toOverrides(record), record };
  }

  const record = await prisma.aiModel.findFirst({
    where: { enabled: true, modelType: normalizedType, providerType: { notIn: [...disabledProviders] } },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return record
    ? { key: record.id, providerType: record.providerType, overrides: await toOverrides(record), record }
    : null;
}

/**
 * Return enabled database models in fallback order: requested model class
 * first, then the other class. Database IDs are returned as selections so
 * AIManager reuses the normal decryption/cache path in resolveModel().
 */
async function listModelSelections(modelType = 'QUICK') {
  await ensureBootstrapModels();
  const normalizedType = VALID_MODEL_TYPES.includes(String(modelType).toUpperCase())
    ? String(modelType).toUpperCase()
    : 'QUICK';
  const disabledProviders = await getDisabledProviderTypes();
  const records = await prisma.aiModel.findMany({
    where: { enabled: true, providerType: { notIn: [...disabledProviders] } },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });

  // The explicit primary/fallback chain (if configured) goes first, in the
  // order the admin set — remaining enabled models follow as further
  // fallback, same-type-first, same as before.
  const validIds = new Set(records.map(record => record.id));
  const explicitOrder = (await getModelOrder(normalizedType)).filter(id => validIds.has(id));
  const explicitSet = new Set(explicitOrder);
  const rest = records
    .filter(record => !explicitSet.has(record.id))
    .sort((a, b) => Number(b.modelType === normalizedType) - Number(a.modelType === normalizedType))
    .map(record => record.id);
  return [...explicitOrder, ...rest];
}

module.exports = {
  resolveModel, listModelSelections, ensureBootstrapModels,
  getProviderConfig, getDisabledProviderTypes, getModelOrder,
  VALID_MODEL_TYPES, VALID_PROVIDER_TYPES,
};
