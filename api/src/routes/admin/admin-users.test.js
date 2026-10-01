const express = require('express');
const request = require('supertest');

jest.mock('../../services/core/database', () => ({
  prisma: {
    user: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    aiModel: { findMany: jest.fn(), count: jest.fn() },
    aiProviderConfig: { findMany: jest.fn() },
    userAiModelGrant: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../services/core/redis', () => ({ cache: { del: jest.fn() } }));

const { prisma } = require('../../services/core/database');
const router = require('./admin-users');

const ADMIN_ID = 'a0a6c8d8-08c2-4bf4-865a-4f4bbfc6a267';
const MEMBER_ID = 'ceef77a7-7b3d-4160-9a44-dc63bc420030';
const MODEL_A = '7142e2a1-f35f-4501-83bb-2af1ea436e25';
const MODEL_B = 'c2d4f9e8-1a66-45ad-99d3-bf833c5d8055';
const MODEL_C = '1d37dce9-664e-4d51-8c0d-d27f05ff4fe3';

function app(authenticatedUser) {
  const instance = express();
  instance.use(express.json());
  if (authenticatedUser) {
    instance.use((req, _res, next) => {
      req.user = authenticatedUser;
      next();
    });
  }
  return instance.use('/api/admin', router);
}

function transactionClient({ user = { id: MEMBER_ID }, models = [{ id: MODEL_A }], grants = [], currentGrants = [] } = {}) {
  return {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
    aiModel: { findMany: jest.fn().mockResolvedValue(models) },
    userAiModelGrant: {
      findMany: jest.fn().mockResolvedValueOnce(grants).mockResolvedValueOnce(currentGrants),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };
}

function grant(aiModelId, name = 'Model') {
  return {
    id: `grant-${aiModelId}`,
    aiModelId,
    createdAt: '2026-09-30T00:00:00.000Z',
    aiModel: {
      id: aiModelId,
      slug: `model-${aiModelId.slice(0, 8)}`,
      name,
      providerType: 'openai',
      modelType: 'QUICK',
      enabled: true,
      apiKey: 'private-key',
      endpoint: 'https://models.example/v1',
      headers: { Authorization: 'private-header' },
      capabilities: { tools: true },
    },
  };
}

describe('admin user AI model grants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockImplementation(({ where }) => Promise.resolve({ isAdmin: where.id === ADMIN_ID }));
  });

  test('returns 401 when credentials are missing', async () => {
    await request(app()).get('/api/admin/users/ai-model-catalog').expect(401, { error: 'Authentication required' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  test('returns 403 when an authenticated user is not an admin', async () => {
    await request(app({ id: MEMBER_ID })).get('/api/admin/users/ai-model-catalog').expect(403, {
      error: 'Access denied', message: 'Admin privileges required',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: MEMBER_ID }, select: { isAdmin: true } });
  });

  test('allows an authenticated admin to view the safe model catalog', async () => {
    prisma.aiModel.findMany.mockResolvedValue([{
      id: MODEL_A, slug: 'safe-model', name: 'Safe Model', providerType: 'openai', modelType: 'QUICK', enabled: true,
      apiKey: 'private-key', endpoint: 'https://models.example/v1', headers: { Authorization: 'private-header' }, capabilities: { tools: true },
    }]);
    prisma.aiProviderConfig.findMany.mockResolvedValue([{ providerType: 'openai', enabled: false }]);

    const response = await request(app({ id: ADMIN_ID })).get('/api/admin/users/ai-model-catalog');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ models: [{
      id: MODEL_A, slug: 'safe-model', name: 'Safe Model', providerType: 'openai', modelType: 'QUICK', enabled: true, providerDisabled: true,
    }] });
    expect(JSON.stringify(response.body)).not.toMatch(/apiKey|endpoint|headers|capabilities|private/i);
  });

  test('replaces grants inside a serializable transaction and returns only safe current grants', async () => {
    const tx = transactionClient({
      models: [{ id: MODEL_A }, { id: MODEL_B }],
      grants: [{ aiModelId: MODEL_A }, { aiModelId: MODEL_C }],
      currentGrants: [grant(MODEL_A, 'Enabled Model'), grant(MODEL_B, 'Disabled Model')],
    });
    prisma.$transaction.mockImplementation(async callback => callback(tx));

    const response = await request(app({ id: ADMIN_ID }))
      .put(`/api/admin/users/${MEMBER_ID}/ai-model-grants`)
      .send({ modelIds: [MODEL_A, MODEL_B, MODEL_A] });

    expect(response.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(tx.user.findUnique).toHaveBeenCalledWith({ where: { id: MEMBER_ID }, select: { id: true } });
    expect(tx.aiModel.findMany).toHaveBeenCalledWith({ where: { id: { in: [MODEL_A, MODEL_B] } }, select: { id: true } });
    expect(tx.userAiModelGrant.deleteMany).toHaveBeenCalledWith({ where: { userId: MEMBER_ID, aiModelId: { in: [MODEL_C] } } });
    expect(tx.userAiModelGrant.createMany).toHaveBeenCalledWith({ data: [{ userId: MEMBER_ID, aiModelId: MODEL_B }], skipDuplicates: true });
    expect(response.body.aiModelGrants).toHaveLength(2);
    expect(JSON.stringify(response.body)).not.toMatch(/apiKey|endpoint|headers|capabilities|private/i);
  });

  test('retries a serializable transaction after a P2034 conflict', async () => {
    const firstTx = transactionClient({ models: [{ id: MODEL_A }], currentGrants: [grant(MODEL_A)] });
    const secondTx = transactionClient({ models: [{ id: MODEL_A }], currentGrants: [grant(MODEL_A)] });
    const conflict = Object.assign(new Error('write conflict'), { code: 'P2034' });
    prisma.$transaction
      .mockImplementationOnce(async callback => { await callback(firstTx); throw conflict; })
      .mockImplementationOnce(async callback => callback(secondTx));

    await request(app({ id: ADMIN_ID })).put(`/api/admin/users/${MEMBER_ID}/ai-model-grants`).send({ modelIds: [MODEL_A] }).expect(200);

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(firstTx.user.findUnique).toHaveBeenCalledTimes(1);
    expect(secondTx.user.findUnique).toHaveBeenCalledTimes(1);
    expect(secondTx.aiModel.findMany).toHaveBeenCalledTimes(1);
  });

  test('checks unknown models inside the transaction and makes no writes', async () => {
    const tx = transactionClient({ models: [{ id: MODEL_A }] });
    prisma.$transaction.mockImplementation(async callback => callback(tx));

    await request(app({ id: ADMIN_ID })).put(`/api/admin/users/${MEMBER_ID}/ai-model-grants`)
      .send({ modelIds: [MODEL_A, MODEL_B] }).expect(400, { error: 'Unknown AI model id' });

    expect(tx.user.findUnique).toHaveBeenCalledWith({ where: { id: MEMBER_ID }, select: { id: true } });
    expect(tx.aiModel.findMany).toHaveBeenCalledWith({ where: { id: { in: [MODEL_A, MODEL_B] } }, select: { id: true } });
    expect(tx.userAiModelGrant.deleteMany).not.toHaveBeenCalled();
    expect(tx.userAiModelGrant.createMany).not.toHaveBeenCalled();
  });

  test('returns 404 inside the transaction without validating models or writing grants for an unknown user', async () => {
    const tx = transactionClient({ user: null });
    prisma.$transaction.mockImplementation(async callback => callback(tx));

    await request(app({ id: ADMIN_ID })).put(`/api/admin/users/${MEMBER_ID}/ai-model-grants`).send({ modelIds: [MODEL_A] }).expect(404, {
      error: 'User Not Found', message: 'The requested user does not exist',
    });

    expect(tx.aiModel.findMany).not.toHaveBeenCalled();
    expect(tx.userAiModelGrant.deleteMany).not.toHaveBeenCalled();
    expect(tx.userAiModelGrant.createMany).not.toHaveBeenCalled();
  });

  test('rejects an invalid user id before starting a grant transaction', async () => {
    await request(app({ id: ADMIN_ID })).put('/api/admin/users/not-a-uuid/ai-model-grants').send({ modelIds: [MODEL_A] }).expect(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rejects more than 100 model ids before starting a grant transaction', async () => {
    await request(app({ id: ADMIN_ID })).put(`/api/admin/users/${MEMBER_ID}/ai-model-grants`)
      .send({ modelIds: Array.from({ length: 101 }, () => MODEL_A) }).expect(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rejects malformed model ids before starting a grant transaction', async () => {
    await request(app({ id: ADMIN_ID })).put(`/api/admin/users/${MEMBER_ID}/ai-model-grants`).send({ modelIds: ['not-a-uuid'] }).expect(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
