const request = require('supertest');
const express = require('express');

const mockListProviders = jest.fn();
const mockTestProvider = jest.fn();
const mockGenerateText = jest.fn();
const mockGenerateChat = jest.fn();

jest.mock('../../services/ai/manager', () => ({
  listProviders: mockListProviders,
  testProvider: mockTestProvider,
  generateText: mockGenerateText,
  generateChat: mockGenerateChat,
}));
jest.mock('../../services/core/database', () => ({ prisma: { voiceProvider: { findFirst: jest.fn() } } }));
jest.mock('../../services/goapply/goapply-content-generation', () => ({
  generateCoverLetter: jest.fn(),
  generateCustomAnswer: jest.fn(),
}));
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'user-1', isAdmin: false };
    next();
  },
  requireAdmin: (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
  },
}));

const router = require('./ai-providers');

function app() {
  return express().use(express.json()).use('/api/ai', router);
}

describe('AI provider routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lists only provider metadata granted to the authenticated user', async () => {
    mockListProviders.mockResolvedValue([{ type: 'granted-model-id', configured: true }]);

    await request(app()).get('/api/ai/providers').expect(200, {
      providers: [{ type: 'granted-model-id', configured: true }],
    });

    expect(mockListProviders).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  test('returns a stable 403 grant error instead of a generic server error', async () => {
    const error = Object.assign(new Error('No AI model access'), { code: 'NO_AI_MODEL_ACCESS' });
    mockGenerateText.mockRejectedValue(error);

    await request(app())
      .post('/api/ai/generate-text')
      .send({ prompt: 'Draft this', provider: 'ungranted-model' })
      .expect(403, {
        error: 'AI model access denied',
        code: 'NO_AI_MODEL_ACCESS',
        message: 'No AI model access',
      });
  });

  test('restricts provider connectivity tests to administrators', async () => {
    await request(app())
      .post('/api/ai/test-provider')
      .send({ type: 'openai' })
      .expect(403, { error: 'Admin access required' });

    expect(mockTestProvider).not.toHaveBeenCalled();
  });
});
