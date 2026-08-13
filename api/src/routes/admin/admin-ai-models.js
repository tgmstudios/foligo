const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../../services/core/database');
const { requireAdmin } = require('../../middleware/auth');
const { encrypt } = require('../../utils/encryption');
const { ensureBootstrapModels, getProviderConfig, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES } = require('../../services/ai/model-config');
const { KNOWN_MODELS } = require('../../services/ai/providers');
const { catalogModelsFor } = require('../../services/ai/model-catalog');
const openaiDeviceAuth = require('../../services/ai/oauth/openai-device-auth');
const ai = require('../../services/ai/manager');

const router = express.Router();
router.use(requireAdmin);

const validators = [
  body('name').trim().isLength({ min: 1 }),
  body('slug').trim().matches(/^[a-z0-9-]+$/),
  body('providerType').isIn(VALID_PROVIDER_TYPES),
  body('model').trim().isLength({ min: 1 }),
  body('modelType').isIn(VALID_MODEL_TYPES),
  body('endpoint').optional({ nullable: true, checkFalsy: true }).isURL({ require_tld: false }),
  body('headers').optional({ nullable: true }).isObject(),
  body('capabilities').optional({ nullable: true }).isObject(),
  body('enabled').optional().isBoolean(),
  body('isDefault').optional().isBoolean(),
];

const discoverValidators = [
  body('providerType').isIn(VALID_PROVIDER_TYPES),
  body('endpoint').optional({ nullable: true, checkFalsy: true }).isURL({ require_tld: false }),
  body('apiKey').optional({ nullable: true }).isString(),
  body('headers').optional({ nullable: true }).isObject(),
];

function safe(model) {
  return { ...model, apiKey: undefined, hasApiKey: !!model.apiKey, oauthRefreshToken: undefined, oauthConnected: !!model.oauthRefreshToken };
}

// In-flight "Sign in with ChatGPT" device-code sessions, keyed by provider
// type. Transient by nature (a login attempt spans a handful of requests
// over at most 15 minutes) so an in-memory map is enough — no DB table.
const deviceAuthSessions = new Map();
const DEVICE_AUTH_TTL_MS = 15 * 60 * 1000;

/**
 * GET /admin/ai-models/providers
 * One row per known provider type, merging any saved AiProviderConfig with
 * defaults for types that have never been configured. Includes each
 * provider's known model IDs — sourced from the models.dev catalog (cached,
 * see services/ai/model-catalog.js), falling back to the tiny static
 * KNOWN_MODELS list — so the admin panel can show them immediately without a
 * discover round-trip.
 */
router.get('/providers', async (_req, res) => {
  const configs = await prisma.aiProviderConfig.findMany();
  const byType = Object.fromEntries(configs.map(c => [c.providerType, c]));
  const rows = await Promise.all(VALID_PROVIDER_TYPES.map(async providerType => {
    const saved = byType[providerType];
    const catalogModels = await catalogModelsFor(providerType);
    const knownModels = (catalogModels.length ? catalogModels : (KNOWN_MODELS[providerType] || []).map(id => ({ id }))).map(m => m.id);
    return saved
      ? { ...safe(saved), knownModels }
      : { id: null, providerType, endpoint: null, headers: {}, enabled: true, hasApiKey: false, knownModels };
  }));
  res.json(rows);
});

/**
 * PUT /admin/ai-models/providers/:type
 * Upsert a provider's shared endpoint/apiKey/headers/enabled state.
 * Body: { endpoint?, apiKey?, headers?, enabled? }
 */
router.put('/providers/:type', [
  body('endpoint').optional({ nullable: true, checkFalsy: true }).isURL({ require_tld: false }),
  body('headers').optional({ nullable: true }).isObject(),
  body('enabled').optional().isBoolean(),
], async (req, res) => {
  if (!VALID_PROVIDER_TYPES.includes(req.params.type)) {
    return res.status(400).json({ error: 'Unknown provider type' });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  try {
    const { endpoint, apiKey, headers, enabled = true } = req.body;
    const providerType = req.params.type;
    const config = await prisma.aiProviderConfig.upsert({
      where: { providerType },
      create: { providerType, endpoint: endpoint || null, apiKey: apiKey ? encrypt(apiKey) : null, headers: headers || undefined, enabled },
      update: { endpoint: endpoint || null, ...(apiKey ? { apiKey: encrypt(apiKey) } : {}), headers: headers || undefined, enabled },
    });
    ai.clearProviderCache();
    res.json(safe(config));
  } catch (error) {
    res.status(500).json({ error: 'Failed to save provider settings', message: error.message });
  }
});

/**
 * POST /admin/ai-models/providers/:type/device-auth/start
 * Begin "Sign in with ChatGPT" — currently only meaningful for codex, which
 * authenticates against a ChatGPT Plus/Pro/Team subscription instead of a
 * static API key. Returns a code for the admin to enter at verificationUrl.
 */
router.post('/providers/:type/device-auth/start', async (req, res) => {
  if (req.params.type !== 'codex') {
    return res.status(400).json({ error: 'Sign-in with ChatGPT is only available for the Codex provider' });
  }
  try {
    const session = await openaiDeviceAuth.requestUserCode();
    deviceAuthSessions.set(req.params.type, { ...session, startedAt: Date.now() });
    res.json({ userCode: session.userCode, verificationUrl: session.verificationUrl, interval: session.interval });
  } catch (error) {
    res.status(502).json({ error: 'Failed to start ChatGPT sign-in', message: error.message });
  }
});

/**
 * POST /admin/ai-models/providers/:type/device-auth/poll
 * One poll attempt against the in-progress session started above. The
 * client re-calls this every `interval` seconds until status !== 'pending'.
 */
router.post('/providers/:type/device-auth/poll', async (req, res) => {
  const session = deviceAuthSessions.get(req.params.type);
  if (!session) return res.status(404).json({ status: 'expired', error: 'No sign-in in progress' });
  if (Date.now() - session.startedAt > DEVICE_AUTH_TTL_MS) {
    deviceAuthSessions.delete(req.params.type);
    return res.status(410).json({ status: 'expired', error: 'Sign-in code expired — start again' });
  }

  try {
    const result = await openaiDeviceAuth.pollOnce(session.deviceAuthId, session.userCode);
    if (result.status === 'pending') return res.json({ status: 'pending' });

    deviceAuthSessions.delete(req.params.type);
    const { access_token, refresh_token, expires_in, id_token } = result.tokens;
    const accountId = openaiDeviceAuth.chatgptAccountIdFromIdToken(id_token);
    const providerType = req.params.type;
    await prisma.aiProviderConfig.upsert({
      where: { providerType },
      create: {
        providerType,
        apiKey: encrypt(access_token),
        oauthRefreshToken: refresh_token ? encrypt(refresh_token) : null,
        oauthExpiresAt: new Date(Date.now() + expires_in * 1000),
        oauthAccountId: accountId,
        enabled: true,
      },
      update: {
        apiKey: encrypt(access_token),
        oauthRefreshToken: refresh_token ? encrypt(refresh_token) : null,
        oauthExpiresAt: new Date(Date.now() + expires_in * 1000),
        ...(accountId ? { oauthAccountId: accountId } : {}),
        enabled: true,
      },
    });
    ai.clearProviderCache();
    res.json({ status: 'authorized' });
  } catch (error) {
    deviceAuthSessions.delete(req.params.type);
    res.status(502).json({ status: 'error', error: 'ChatGPT sign-in failed', message: error.message });
  }
});

/** DELETE /admin/ai-models/providers/:type/device-auth — cancel an in-progress sign-in. */
router.delete('/providers/:type/device-auth', (req, res) => {
  deviceAuthSessions.delete(req.params.type);
  res.json({ message: 'Cancelled' });
});

/**
 * GET /admin/ai-models/defaults
 * The explicit primary+fallback AiModel id order per modelType, set from the
 * "Default models & fallbacks" panel. Missing/empty means "not configured —
 * use the implicit isDefault/createdAt ordering" (see model-config.js).
 */
router.get('/defaults', async (_req, res) => {
  const rows = await prisma.aiModelDefaults.findMany();
  const byType = Object.fromEntries(rows.map(row => [row.modelType, row.order]));
  res.json(Object.fromEntries(VALID_MODEL_TYPES.map(modelType => [modelType, byType[modelType] || []])));
});

/**
 * PUT /admin/ai-models/defaults/:modelType
 * Body: { order: string[] } — AiModel ids, order[0] is primary, the rest are
 * fallbacks tried in sequence. Also mirrors order[0] onto that model's
 * isDefault flag (clearing it on siblings) so older code paths that still
 * read AiModel.isDefault directly stay consistent.
 */
router.put('/defaults/:modelType', [
  body('order').isArray({ max: 4 }),
  body('order.*').isString(),
], async (req, res) => {
  if (!VALID_MODEL_TYPES.includes(req.params.modelType)) {
    return res.status(400).json({ error: 'Invalid model type' });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  try {
    const modelType = req.params.modelType;
    const order = [...new Set(req.body.order)];
    const validCount = await prisma.aiModel.count({ where: { id: { in: order } } });
    if (validCount !== order.length) return res.status(400).json({ error: 'Unknown model id in order' });

    await prisma.$transaction(async tx => {
      await tx.aiModelDefaults.upsert({
        where: { modelType },
        create: { modelType, order },
        update: { order },
      });
      if (order[0]) {
        await tx.aiModel.updateMany({ where: { modelType, id: { not: order[0] } }, data: { isDefault: false } });
        await tx.aiModel.update({ where: { id: order[0] }, data: { isDefault: true } });
      }
    });
    ai.clearProviderCache();
    res.json({ modelType, order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save defaults', message: error.message });
  }
});

router.get('/', async (_req, res) => {
  await ensureBootstrapModels();
  const models = await prisma.aiModel.findMany({ orderBy: [{ modelType: 'asc' }, { name: 'asc' }] });
  res.json(models.map(safe));
});

router.post('/', validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  try {
    const { name, slug, providerType, model, endpoint, apiKey, headers, capabilities, modelType, enabled = true, isDefault = false } = req.body;
    const created = await prisma.$transaction(async tx => {
      if (isDefault) await tx.aiModel.updateMany({ where: { modelType }, data: { isDefault: false } });
      return tx.aiModel.create({ data: {
        name, slug, providerType, model, endpoint: endpoint || null,
        apiKey: apiKey ? encrypt(apiKey) : null, headers: headers || undefined,
        capabilities: capabilities || undefined,
        modelType, enabled, isDefault,
      } });
    });
    ai.clearProviderCache();
    res.status(201).json(safe(created));
  } catch (error) {
    res.status(error.code === 'P2002' ? 409 : 500).json({ error: 'Failed to create AI model', message: error.message });
  }
});

router.put('/:id', validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  try {
    const current = await prisma.aiModel.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'AI model not found' });
    const { name, slug, providerType, model, endpoint, apiKey, headers, capabilities, modelType, enabled, isDefault } = req.body;
    const updated = await prisma.$transaction(async tx => {
      if (isDefault) await tx.aiModel.updateMany({ where: { modelType, id: { not: current.id } }, data: { isDefault: false } });
      return tx.aiModel.update({ where: { id: current.id }, data: {
        name, slug, providerType, model, endpoint: endpoint || null,
        ...(apiKey ? { apiKey: encrypt(apiKey) } : {}), headers: headers || undefined,
        capabilities: capabilities || undefined,
        modelType, enabled, isDefault,
      } });
    });
    ai.clearProviderCache();
    res.json(safe(updated));
  } catch (error) {
    res.status(error.code === 'P2002' ? 409 : 500).json({ error: 'Failed to update AI model', message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  await prisma.aiModel.delete({ where: { id: req.params.id } });
  ai.clearProviderCache();
  res.json({ message: 'AI model deleted' });
});

router.post('/:id/test', async (req, res) => res.json(await ai.testProvider(req.params.id)));

/**
 * POST /admin/ai-models/discover
 * Query a provider's live OpenAI-compatible /models endpoint and return what
 * it reports. Body fields are optional overrides — anything left blank falls
 * back to that provider type's env/preset configuration.
 * Body: { providerType, endpoint?, apiKey?, headers? }
 */
router.post('/discover', discoverValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  try {
    const { providerType, endpoint, apiKey, headers } = req.body;
    const savedProviderConfig = await getProviderConfig(providerType) || {};
    const models = await ai.listAvailableModels(providerType, {
      ...savedProviderConfig,
      ...(endpoint ? { endpoint } : {}),
      ...(apiKey ? { apiKey } : {}),
      ...(headers ? { headers } : {}),
    });
    res.json({ models });
  } catch (error) {
    res.status(502).json({ error: 'Failed to discover models', message: error.message });
  }
});

function safeVoice(provider) {
  return provider ? { ...provider, apiKey: undefined, hasApiKey: !!provider.apiKey } : null;
}

async function ensureVoiceProvider() {
  let provider = await prisma.voiceProvider.findUnique({ where: { provider: 'elevenlabs' } });
  if (!provider && process.env.ELEVENLABS_AGENT_ID) {
    provider = await prisma.voiceProvider.create({
      data: {
        name: 'ElevenLabs',
        provider: 'elevenlabs',
        agentId: process.env.ELEVENLABS_AGENT_ID,
        apiKey: process.env.ELEVENLABS_API_KEY ? encrypt(process.env.ELEVENLABS_API_KEY) : null,
      },
    });
  }
  return provider;
}

router.get('/voice/elevenlabs', async (_req, res) => {
  res.json(safeVoice(await ensureVoiceProvider()));
});

router.put('/voice/elevenlabs', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('agentId').trim().isLength({ min: 1 }),
  body('voiceId').optional({ nullable: true }).isString(),
  body('modelId').optional({ nullable: true }).isString(),
  body('enabled').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  const { name = 'ElevenLabs', agentId, voiceId, modelId, apiKey, enabled = true } = req.body;
  const provider = await prisma.voiceProvider.upsert({
    where: { provider: 'elevenlabs' },
    create: { name, provider: 'elevenlabs', agentId, voiceId: voiceId || null, modelId: modelId || null, apiKey: apiKey ? encrypt(apiKey) : null, enabled },
    update: { name, agentId, voiceId: voiceId || null, modelId: modelId || null, ...(apiKey ? { apiKey: encrypt(apiKey) } : {}), enabled },
  });
  res.json(safeVoice(provider));
});

module.exports = router;
