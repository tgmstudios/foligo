const { prisma } = require('../database');
const { decrypt } = require('../../utils/encryption');

const VALID_MODEL_TYPES = ['QUICK', 'LONG'];
const VALID_PROVIDER_TYPES = ['gemini', 'openai', 'opencode', 'ollama', 'anthropic', 'custom'];
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

function toOverrides(record) {
  const overrides = { model: record.model };
  if (record.endpoint) {
    overrides.endpoint = record.endpoint;
    overrides.baseUrl = record.endpoint;
  }
  if (record.apiKey) overrides.apiKey = decrypt(record.apiKey);
  if (record.headers && typeof record.headers === 'object' && Object.keys(record.headers).length) {
    overrides.headers = record.headers;
  }
  return overrides;
}

async function resolveModel(selection, modelType = 'QUICK') {
  await ensureBootstrapModels();
  const normalizedType = VALID_MODEL_TYPES.includes(String(modelType).toUpperCase())
    ? String(modelType).toUpperCase()
    : 'QUICK';

  if (selection) {
    const record = await prisma.aiModel.findFirst({
      where: { enabled: true, OR: [{ id: selection }, { slug: selection }] },
    });
    if (record) return { key: record.id, providerType: record.providerType, overrides: toOverrides(record), record };
    // Preserve compatibility with callers that still send an environment
    // provider name such as "gemini" or "opencode".
    if (VALID_PROVIDER_TYPES.includes(selection)) return { key: selection, providerType: selection, overrides: {}, record: null };
  }

  const record = await prisma.aiModel.findFirst({
    where: { enabled: true, modelType: normalizedType },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return record
    ? { key: record.id, providerType: record.providerType, overrides: toOverrides(record), record }
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
  const records = await prisma.aiModel.findMany({
    where: { enabled: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return records
    .sort((a, b) => Number(b.modelType === normalizedType) - Number(a.modelType === normalizedType))
    .map(record => record.id);
}

module.exports = { resolveModel, listModelSelections, ensureBootstrapModels, VALID_MODEL_TYPES, VALID_PROVIDER_TYPES };
