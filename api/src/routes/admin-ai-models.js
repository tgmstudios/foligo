const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { requireAdmin } = require('../middleware/auth');
const { encrypt } = require('../utils/encryption');
const { ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES } = require('../services/ai/model-config');
const ai = require('../services/ai/manager');

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
  body('enabled').optional().isBoolean(),
  body('isDefault').optional().isBoolean(),
];

function safe(model) {
  return { ...model, apiKey: undefined, hasApiKey: !!model.apiKey };
}

router.get('/', async (_req, res) => {
  await ensureBootstrapModels();
  const models = await prisma.aiModel.findMany({ orderBy: [{ modelType: 'asc' }, { name: 'asc' }] });
  res.json(models.map(safe));
});

router.post('/', validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  try {
    const { name, slug, providerType, model, endpoint, apiKey, headers, modelType, enabled = true, isDefault = false } = req.body;
    const created = await prisma.$transaction(async tx => {
      if (isDefault) await tx.aiModel.updateMany({ where: { modelType }, data: { isDefault: false } });
      return tx.aiModel.create({ data: {
        name, slug, providerType, model, endpoint: endpoint || null,
        apiKey: apiKey ? encrypt(apiKey) : null, headers: headers || undefined,
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
    const { name, slug, providerType, model, endpoint, apiKey, headers, modelType, enabled, isDefault } = req.body;
    const updated = await prisma.$transaction(async tx => {
      if (isDefault) await tx.aiModel.updateMany({ where: { modelType, id: { not: current.id } }, data: { isDefault: false } });
      return tx.aiModel.update({ where: { id: current.id }, data: {
        name, slug, providerType, model, endpoint: endpoint || null,
        ...(apiKey ? { apiKey: encrypt(apiKey) } : {}), headers: headers || undefined,
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
