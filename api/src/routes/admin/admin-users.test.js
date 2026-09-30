const express = require('express');
const request = require('supertest');

jest.mock('../../services/core/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    aiModel: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    aiProviderConfig: {
      findMany: jest.fn(),
    },
    userAiModelGrant: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../services/core/redis', () => ({
  cache: { del: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  requireAdmin: (req, res, next) => {
    if (req.get('x-admin') !== 'true') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = { id: 'admin-1', isAdmin: true };
    next();
  },
}));

const { prisma } = require('../../services/core/database');
const router = require('./admin-users');

function app() {
  return express().use(express.json()).use('/api/admin', router);
}

describe('admin user AI model grants', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns a safe catalog with disabled-provider status', async () => {
    prisma.aiModel.findMany.mockResolvedValue([
      {
        id: '7142e2a1-f35f-4501-83bb-2af1ea436e25',
        slug: 'safe-model',
        name: 'Safe Model',
        providerType: 'openai',
        modelType: 'QUICK',
        enabled: true,
        apiKey: 'model-secret',
        endpoint: 'https://models.example/v1',
        headers: { Authorization: 'Bearer model-secret' },
        capabilities: { tools: true },
      },
    ]);
    prisma.aiProviderConfig.findMany.mockResolvedValue([
      {
        providerType: 'openai',
        enabled: false,
        apiKey: 'provider-secret',
        endpoint: 'https://provider.example/v1',
        headers: { Authorization: 'Bearer provider-secret' },
      },
    ]);

    const response = await request(app())
      .get('/api/admin/users/ai-model-catalog')
      .set('x-admin', 'true');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      models: [{
        id: '7142e2a1-f35f-4501-83bb-2af1ea436e25',
        slug: 'safe-model',
        name: 'Safe Model',
        providerType: 'openai',
        modelType: 'QUICK',
        enabled: true,
        providerDisabled: true,
      }],
    });
    expect(JSON.stringify(response.body)).not.toMatch(/apiKey|endpoint|headers|capabilities|secret/i);
  });

  test('returns user grants with only safe AI model metadata', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'ceef77a7-7b3d-4160-9a44-dc63bc420030',
      email: 'member@example.com',
      name: 'Member',
      isAdmin: false,
      hasCompletedOnboarding: true,
      createdAt: '2026-09-30T00:00:00.000Z',
      updatedAt: '2026-09-30T00:00:00.000Z',
      projectsOwned: [],
      projectAccess: [],
      _count: { projectsOwned: 0, projectAccess: 0, media: 0 },
      aiModelGrants: [{
        id: 'grant-1',
        aiModelId: '7142e2a1-f35f-4501-83bb-2af1ea436e25',
        createdAt: '2026-09-30T00:00:00.000Z',
        aiModel: {
          id: '7142e2a1-f35f-4501-83bb-2af1ea436e25',
          slug: 'safe-model',
          name: 'Safe Model',
          providerType: 'openai',
          modelType: 'QUICK',
          enabled: true,
          apiKey: 'model-secret',
          endpoint: 'https://models.example/v1',
          headers: { Authorization: 'Bearer model-secret' },
          capabilities: { tools: true },
        },
      }],
    });

    const response = await request(app())
      .get('/api/admin/users/ceef77a7-7b3d-4160-9a44-dc63bc420030')
      .set('x-admin', 'true');

    expect(response.status).toBe(200);
    expect(response.body.aiModelGrants).toEqual([{
      id: 'grant-1',
      aiModelId: '7142e2a1-f35f-4501-83bb-2af1ea436e25',
      createdAt: '2026-09-30T00:00:00.000Z',
      aiModel: {
        id: '7142e2a1-f35f-4501-83bb-2af1ea436e25',
        slug: 'safe-model',
        name: 'Safe Model',
        providerType: 'openai',
        modelType: 'QUICK',
        enabled: true,
      },
    }]);
    expect(JSON.stringify(response.body)).not.toMatch(/apiKey|endpoint|headers|capabilities|secret/i);
  });

  test('denies non-admin users from viewing or changing grants', async () => {
    await request(app())
      .get('/api/admin/users/ai-model-catalog')
      .expect(403, { error: 'Admin access required' });

    await request(app())
      .put('/api/admin/users/ceef77a7-7b3d-4160-9a44-dc63bc420030/ai-model-grants')
      .send({ modelIds: ['7142e2a1-f35f-4501-83bb-2af1ea436e25'] })
      .expect(403, { error: 'Admin access required' });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('replaces grants, dedupes IDs, persists disabled models, and returns safe current grants', async () => {
    const userId = 'ceef77a7-7b3d-4160-9a44-dc63bc420030';
    const modelA = '7142e2a1-f35f-4501-83bb-2af1ea436e25';
    const modelB = 'c2d4f9e8-1a66-45ad-99d3-bf833c5d8055';
    const modelC = '1d37dce9-664e-4d51-8c0d-d27f05ff4fe3';

    prisma.user.findUnique.mockResolvedValue({ id: userId });
    prisma.aiModel.findMany.mockResolvedValue([
      { id: modelA, slug: 'enabled-model', name: 'Enabled Model', providerType: 'openai', modelType: 'QUICK', enabled: true },
      { id: modelB, slug: 'disabled-model', name: 'Disabled Model', providerType: 'anthropic', modelType: 'LONG', enabled: false },
    ]);
    prisma.$transaction.mockImplementation(async callback => callback(prisma));
    prisma.userAiModelGrant.findMany
      .mockResolvedValueOnce([{ aiModelId: modelA }, { aiModelId: modelC }])
      .mockResolvedValueOnce([
        {
          id: 'grant-a', aiModelId: modelA, createdAt: '2026-09-30T00:00:00.000Z',
          aiModel: { id: modelA, slug: 'enabled-model', name: 'Enabled Model', providerType: 'openai', modelType: 'QUICK', enabled: true, apiKey: 'secret-a' },
        },
        {
          id: 'grant-b', aiModelId: modelB, createdAt: '2026-09-30T00:00:00.000Z',
          aiModel: { id: modelB, slug: 'disabled-model', name: 'Disabled Model', providerType: 'anthropic', modelType: 'LONG', enabled: false, headers: { Authorization: 'secret-b' } },
        },
      ]);

    const response = await request(app())
      .put(`/api/admin/users/${userId}/ai-model-grants`)
      .set('x-admin', 'true')
      .send({ modelIds: [modelA, modelB, modelA] });

    expect(response.status).toBe(200);
    expect(prisma.userAiModelGrant.deleteMany).toHaveBeenCalledWith({
      where: { userId, aiModelId: { in: [modelC] } },
    });
    expect(prisma.userAiModelGrant.createMany).toHaveBeenCalledWith({
      data: [{ userId, aiModelId: modelB }],
      skipDuplicates: true,
    });
    expect(response.body.aiModelGrants).toEqual([
      {
        id: 'grant-a', aiModelId: modelA, createdAt: '2026-09-30T00:00:00.000Z',
        aiModel: { id: modelA, slug: 'enabled-model', name: 'Enabled Model', providerType: 'openai', modelType: 'QUICK', enabled: true },
      },
      {
        id: 'grant-b', aiModelId: modelB, createdAt: '2026-09-30T00:00:00.000Z',
        aiModel: { id: modelB, slug: 'disabled-model', name: 'Disabled Model', providerType: 'anthropic', modelType: 'LONG', enabled: false },
      },
    ]);
    expect(JSON.stringify(response.body)).not.toMatch(/apiKey|endpoint|headers|capabilities|secret/i);
  });

  test('returns 404 before mutating grants for an unknown user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await request(app())
      .put('/api/admin/users/ceef77a7-7b3d-4160-9a44-dc63bc420030/ai-model-grants')
      .set('x-admin', 'true')
      .send({ modelIds: ['7142e2a1-f35f-4501-83bb-2af1ea436e25'] })
      .expect(404, {
        error: 'User Not Found',
        message: 'The requested user does not exist',
      });

    expect(prisma.aiModel.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rejects unknown models atomically without changing existing grants', async () => {
    const userId = 'ceef77a7-7b3d-4160-9a44-dc63bc420030';
    prisma.user.findUnique.mockResolvedValue({ id: userId });
    prisma.aiModel.findMany.mockResolvedValue([{ id: '7142e2a1-f35f-4501-83bb-2af1ea436e25' }]);

    await request(app())
      .put(`/api/admin/users/${userId}/ai-model-grants`)
      .set('x-admin', 'true')
      .send({
        modelIds: [
          '7142e2a1-f35f-4501-83bb-2af1ea436e25',
          'c2d4f9e8-1a66-45ad-99d3-bf833c5d8055',
        ],
      })
      .expect(400, { error: 'Unknown AI model id' });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.userAiModelGrant.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userAiModelGrant.createMany).not.toHaveBeenCalled();
  });

  test('rejects a malformed model ID array before changing grants', async () => {
    await request(app())
      .put('/api/admin/users/ceef77a7-7b3d-4160-9a44-dc63bc420030/ai-model-grants')
      .set('x-admin', 'true')
      .send({ modelIds: ['not-a-uuid'] })
      .expect(400);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('is idempotent when the requested grants already match', async () => {
    const userId = 'ceef77a7-7b3d-4160-9a44-dc63bc420030';
    const modelId = '7142e2a1-f35f-4501-83bb-2af1ea436e25';
    const grant = {
      id: 'grant-a', aiModelId: modelId, createdAt: '2026-09-30T00:00:00.000Z',
      aiModel: { id: modelId, slug: 'enabled-model', name: 'Enabled Model', providerType: 'openai', modelType: 'QUICK', enabled: true },
    };

    prisma.user.findUnique.mockResolvedValue({ id: userId });
    prisma.aiModel.findMany.mockResolvedValue([{ id: modelId }]);
    prisma.$transaction.mockImplementation(async callback => callback(prisma));
    prisma.userAiModelGrant.findMany.mockResolvedValue([grant]);

    const first = await request(app())
      .put(`/api/admin/users/${userId}/ai-model-grants`)
      .set('x-admin', 'true')
      .send({ modelIds: [modelId] });
    const second = await request(app())
      .put(`/api/admin/users/${userId}/ai-model-grants`)
      .set('x-admin', 'true')
      .send({ modelIds: [modelId] });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(prisma.userAiModelGrant.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userAiModelGrant.createMany).not.toHaveBeenCalled();
    expect(second.body).toEqual({
      aiModelGrants: [{
        id: 'grant-a', aiModelId: modelId, createdAt: '2026-09-30T00:00:00.000Z',
        aiModel: { id: modelId, slug: 'enabled-model', name: 'Enabled Model', providerType: 'openai', modelType: 'QUICK', enabled: true },
      }],
    });
  });
});
