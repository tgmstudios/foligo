jest.mock('../core/database', () => ({
  prisma: {
    aiModel: {
      count: jest.fn(),
      createMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    aiModelDefaults: {
      findUnique: jest.fn(),
    },
    aiProviderConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../utils/encryption', () => ({
  decrypt: jest.fn(value => value),
  encrypt: jest.fn(value => value),
}));

const { prisma } = require('../core/database');
const {
  UserModelAuthorizationError,
  listModelSelectionsForUser,
  resolveModelForUser,
} = require('./model-config');

describe('user-scoped AI model resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.aiProviderConfig.findMany.mockResolvedValue([]);
    prisma.aiProviderConfig.findUnique.mockResolvedValue(null);
  });

  test('orders default and fallback candidates using only the user eligible grants', async () => {
    prisma.aiModel.findMany.mockResolvedValue([
      { id: 'quick-default-id', enabled: true, providerType: 'openai', modelType: 'QUICK', isDefault: true },
      { id: 'quick-fallback-id', enabled: true, providerType: 'openai', modelType: 'QUICK', isDefault: false },
      { id: 'long-fallback-id', enabled: true, providerType: 'openai', modelType: 'LONG', isDefault: true },
    ]);
    prisma.aiModelDefaults.findUnique.mockResolvedValue({
      order: ['ungranted-model-id', 'quick-fallback-id'],
    });

    await expect(listModelSelectionsForUser('user-id', 'QUICK')).resolves.toEqual([
      'quick-fallback-id',
      'quick-default-id',
      'long-fallback-id',
    ]);
    expect(prisma.aiModel.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userAiModelGrants: { some: { userId: 'user-id' } } }),
    }));
  });

  test('excludes models whose provider is explicitly disabled from user fallback candidates', async () => {
    prisma.aiProviderConfig.findMany.mockResolvedValue([{ providerType: 'disabled-provider' }]);
    prisma.aiModel.findMany.mockResolvedValue([
      { id: 'disabled-provider-model-id', enabled: true, providerType: 'disabled-provider', modelType: 'QUICK', isDefault: true },
      { id: 'available-model-id', enabled: true, providerType: 'openai', modelType: 'QUICK', isDefault: false },
    ]);
    prisma.aiModelDefaults.findUnique.mockResolvedValue(null);

    await expect(listModelSelectionsForUser('user-id', 'QUICK')).resolves.toEqual(['available-model-id']);
    expect(prisma.aiModel.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ providerType: { notIn: ['disabled-provider'] } }),
    }));
  });

  test('excludes disabled models from user fallback candidates', async () => {
    prisma.aiModel.findMany.mockResolvedValue([
      { id: 'disabled-model-id', enabled: false, providerType: 'openai', modelType: 'QUICK', isDefault: true },
      { id: 'enabled-model-id', enabled: true, providerType: 'openai', modelType: 'QUICK', isDefault: false },
    ]);
    prisma.aiModelDefaults.findUnique.mockResolvedValue(null);

    await expect(listModelSelectionsForUser('user-id', 'QUICK')).resolves.toEqual(['enabled-model-id']);
    expect(prisma.aiModel.findMany).toHaveBeenCalledWith({
      where: {
        enabled: true,
        providerType: { notIn: [] },
        userAiModelGrants: { some: { userId: 'user-id' } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  });

  test('does not fall back to a global provider configuration for user-scoped lookup', async () => {
    prisma.aiModel.findFirst.mockResolvedValue(null);
    prisma.aiProviderConfig.findUnique.mockResolvedValue({
      providerType: 'openai',
      enabled: true,
      apiKey: 'admin-only-secret',
    });

    await expect(resolveModelForUser('user-id', 'openai')).rejects.toEqual(
      expect.objectContaining({ code: 'USER_MODEL_ACCESS_DENIED' }),
    );
    expect(prisma.aiProviderConfig.findUnique).not.toHaveBeenCalled();
  });

  test('denies an explicitly selected model that is not granted to the user', async () => {
    prisma.aiModel.findFirst.mockResolvedValue(null);

    await expect(resolveModelForUser('user-id', 'ungranted-model')).rejects.toEqual(
      expect.objectContaining({
        name: 'UserModelAuthorizationError',
        code: 'USER_MODEL_ACCESS_DENIED',
      }),
    );
    expect(UserModelAuthorizationError).toBeDefined();
    expect(prisma.aiModel.findFirst).toHaveBeenCalledTimes(1);
  });

  test('resolves an explicitly selected enabled model granted to the user', async () => {
    const model = {
      id: 'granted-model-id',
      slug: 'granted-model',
      providerType: 'openai',
      model: 'gpt-4.1-mini',
      enabled: true,
    };
    prisma.aiModel.findFirst.mockResolvedValue(model);

    await expect(resolveModelForUser('user-id', 'granted-model')).resolves.toMatchObject({
      key: 'granted-model-id',
      providerType: 'openai',
      record: model,
    });
    expect(prisma.aiModel.findFirst).toHaveBeenCalledWith({
      where: {
        enabled: true,
        OR: [{ id: 'granted-model' }, { slug: 'granted-model' }],
        userAiModelGrants: { some: { userId: 'user-id' } },
      },
    });
  });
});
