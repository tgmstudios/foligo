const request = require('supertest');
const express = require('express');

const mockPreflightStreamAccess = jest.fn();
const mockStreamChat = jest.fn();

jest.mock('../../services/ai/manager', () => ({
  preflightStreamAccess: mockPreflightStreamAccess,
  streamChat: mockStreamChat,
}));
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'user-1' };
    next();
  },
}));
jest.mock('../../services/core/database', () => ({ prisma: {} }));
jest.mock('../../services/extension/extension-agent-tools', () => ({
  CLIENT_AGENT_TOOL_DEFS: {},
  createExtensionAgentServerTools: jest.fn(() => ({})),
  getExtensionAgentCapabilities: jest.fn(() => ({ protocolVersion: '1' })),
}));
jest.mock('../../services/ai/message-history', () => ({
  flattenToolMessages: jest.fn(messages => messages),
}));

const router = require('./extension-agent');

function streamOf(parts) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const part of parts) yield part;
    },
  };
}

function app() {
  return express().use(express.json()).use('/api/extension-agent', router);
}

describe('extension agent SSE model access preflight', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPreflightStreamAccess.mockResolvedValue(['granted-model']);
    mockStreamChat.mockReturnValue(streamOf([{ type: 'text-delta', text: 'granted response' }]));
  });

  test.each([
    ['no grant', undefined, 'NO_AI_MODEL_ACCESS'],
    ['explicit ungranted selection', 'ungranted-model', 'USER_MODEL_ACCESS_DENIED'],
  ])('returns JSON 403 before SSE headers for %s', async (_label, provider, code) => {
    mockPreflightStreamAccess.mockRejectedValue(Object.assign(new Error('AI model access denied'), { code }));

    const response = await request(app())
      .post('/api/extension-agent/turn')
      .send({ mode: 'chat', messages: [{ role: 'user', content: 'Hello' }], provider })
      .expect(403)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({
      error: 'AI model access denied',
      code,
      message: 'AI model access denied',
    });
    expect(response.headers['content-type']).not.toMatch(/text\/event-stream/);
    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  test('keeps granted requests on the normal SSE path and forwards the authenticated user ID', async () => {
    const response = await request(app())
      .post('/api/extension-agent/turn')
      .send({ mode: 'chat', messages: [{ role: 'user', content: 'Hello' }], provider: 'granted-model' })
      .expect(200)
      .expect('Content-Type', /text\/event-stream/);

    expect(mockPreflightStreamAccess).toHaveBeenCalledWith({
      userId: 'user-1', provider: 'granted-model', modelType: 'LONG',
    });
    expect(mockStreamChat).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({
      userId: 'user-1', provider: 'granted-model', modelType: 'LONG',
    }));
    expect(response.text).toContain('granted response');
  });
});
