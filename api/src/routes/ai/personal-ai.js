const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { prisma } = require('../../services/core/database');
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid AI connection settings', details: errors.array().map(({ value, ...error }) => error) });
  next();
}
async function personalLock(tx, userId) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`personal-ai:${userId}`}))`;
}
const { encrypt, decrypt } = require('../../utils/encryption');
const { PERSONAL_PROVIDERS, codexLinkEnabled, requireEncryption, safeConnection, listPersonalConnections } = require('../../services/ai/personal-connections');
const { getUsageSummary } = require('../../services/ai/usage');
const oauth = require('../../services/ai/oauth/openai-device-auth');
const router = express.Router();

// Mounted behind authenticateToken; all lookups use the trusted identity.
router.get('/connections', async (req, res) => {
  try {
    const rows = await listPersonalConnections(req.user.id);
    res.json({ connections: rows.map(safeConnection), codexLinkEnabled: codexLinkEnabled(),
      codexLinkReason: codexLinkEnabled() ? null : 'Subscription linking requires a supported local/open-source deployment. Hosted services require an approved OpenAI integration. A personal OpenAI API key works here.',
      claudeLinkReason: 'Claude subscriptions cannot be linked to third-party apps. Use an Anthropic API key, billed separately by Anthropic.',
    });
  } catch { res.status(500).json({ error: 'Unable to load personal AI connections' }); }
});

router.put('/connections/:type', [
  param('type').isIn(PERSONAL_PROVIDERS),
  body('apiKey').optional().isString().trim().isLength({ min: 1, max: 8192 }),
  body('model').isString().trim().isLength({ min: 1, max: 200 }).matches(/^[a-zA-Z0-9._:/-]+$/),
  body('modelType').isIn(['QUICK', 'LONG']),
  body('enabled').custom(value => typeof value === 'boolean'), handleValidation,
], async (req, res) => {
  try {
    requireEncryption();
    const userId = req.user.id; const providerType = req.params.type;
    const { apiKey, model, modelType, enabled } = req.body;
    const row = await prisma.$transaction(async tx => {
      await personalLock(tx, userId);
      const existing = await tx.userAiConnection.findUnique({ where: { userId_providerType: { userId, providerType } } });
      if (!apiKey && !existing) throw Object.assign(new Error('An API key is required for a new connection'), { status: 400 });
      const data = { model, modelType, enabled, ...(apiKey ? { apiKey: encrypt(apiKey), oauthRefreshToken: null, oauthExpiresAt: null, oauthAccountId: null } : {}) };
      const saved = await tx.userAiConnection.upsert({
        where: { userId_providerType: { userId, providerType } },
        create: { userId, providerType, apiKey: existing?.apiKey, ...data }, update: data,
      });
      // Saving a connection invalidates a pending subscription login.
      await tx.userAiDeviceLogin.deleteMany({ where: { userId } });
      return saved;
    });
    res.json({ connection: safeConnection(row) });
  } catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to save personal AI connection' }); }
});

router.delete('/connections/:type', [param('type').isIn(PERSONAL_PROVIDERS), handleValidation], async (req, res) => {
  try {
    await prisma.$transaction(async tx => {
      await personalLock(tx, req.user.id);
      await tx.userAiConnection.deleteMany({ where: { userId: req.user.id, providerType: req.params.type } });
      await tx.userAiDeviceLogin.deleteMany({ where: { userId: req.user.id } });
    });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Unable to remove connection' }); }
});

router.get('/usage', async (req, res) => {
  try { res.json(await getUsageSummary(req.user.id)); }
  catch { res.status(500).json({ error: 'Unable to load AI usage' }); }
});

router.post('/codex/start', async (req, res) => {
  if (!codexLinkEnabled()) return res.status(403).json({ error: 'Subscription linking is not enabled for this deployment.' });
  try {
    requireEncryption();
    const session = await oauth.requestUserCode();
    await prisma.$transaction(async tx => {
      await personalLock(tx, req.user.id);
      await tx.userAiDeviceLogin.upsert({ where: { userId: req.user.id },
      create: { userId: req.user.id, session: encrypt(JSON.stringify(session)), expiresAt: new Date(Date.now() + 900000), nextPollAt: new Date(Date.now() + session.interval * 1000) },
      update: { session: encrypt(JSON.stringify(session)), expiresAt: new Date(Date.now() + 900000), nextPollAt: new Date(Date.now() + session.interval * 1000) },
    });
    });
    res.json({ userCode: session.userCode, verificationUrl: session.verificationUrl, interval: session.interval, expiresIn: 900 });
  } catch (error) { res.status(error.status || 502).json({ error: error.status ? error.message : 'Unable to start Codex sign-in' }); }
});

router.post('/codex/poll', async (req, res) => {
  if (!codexLinkEnabled()) return res.status(403).json({ error: 'Subscription linking is disabled.' });
  try {
    const result = await prisma.$transaction(async tx => {
      await personalLock(tx, req.user.id);
      const login = await tx.userAiDeviceLogin.findUnique({ where: { userId: req.user.id } });
      if (!login || login.expiresAt < new Date()) return { status: 'expired' };
      const session = JSON.parse(decrypt(login.session));
      const claimed = await tx.userAiDeviceLogin.updateMany({
        where: { userId: req.user.id, session: login.session, nextPollAt: { lte: new Date() } },
        data: { nextPollAt: new Date(Date.now() + Math.max(5, session.interval) * 1000) },
      });
      if (!claimed.count) return { status: 'pending' };
      const authorization = await oauth.pollOnce(session.deviceAuthId, session.userCode);
      if (authorization.status === 'pending') return { status: 'pending' };
      const { access_token, refresh_token, expires_in, id_token } = authorization.tokens;
      const accountId = oauth.chatgptAccountIdFromIdToken(id_token);
      if (!access_token || !refresh_token || !accountId || !Number.isFinite(Number(expires_in))) throw new Error('Incomplete authorization');
      const data = { apiKey: encrypt(access_token), oauthRefreshToken: encrypt(refresh_token), oauthAccountId: accountId,
        oauthExpiresAt: new Date(Date.now() + Number(expires_in) * 1000), enabled: true };
      await tx.userAiConnection.upsert({ where: { userId_providerType: { userId: req.user.id, providerType: 'codex' } },
        create: { userId: req.user.id, providerType: 'codex', model: 'gpt-5.1-codex', modelType: 'LONG', ...data }, update: data });
      await tx.userAiDeviceLogin.deleteMany({ where: { userId: req.user.id, session: login.session } });
      return { status: 'authorized' };
    }, { timeout: 40000 });
    res.json(result);
  } catch { res.status(502).json({ error: 'Codex sign-in failed. Start again.' }); }
});

router.delete('/codex/login', async (req, res) => {
  try { await prisma.$transaction(async tx => { await personalLock(tx, req.user.id); await tx.userAiDeviceLogin.deleteMany({ where: { userId: req.user.id } }); }); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Unable to cancel sign-in' }); }
});
module.exports = router;
