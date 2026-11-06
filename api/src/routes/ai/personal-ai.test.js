const express = require('express');
const request = require('supertest');
const mockDb = {
  $executeRaw: jest.fn(),
  userAiConnection: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
  userAiDeviceLogin: { deleteMany: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn(), upsert: jest.fn() },
};
mockDb.$transaction = jest.fn(fn => fn(mockDb));
jest.mock('../../services/core/database', () => ({ prisma: mockDb }));
jest.mock('../../services/ai/oauth/openai-device-auth', () => ({ requestUserCode: jest.fn(), pollOnce: jest.fn(), chatgptAccountIdFromIdToken: jest.fn() }));
jest.mock('../../services/ai/usage', () => ({ getUsageSummary: jest.fn().mockResolvedValue({ policy: { unlimited: true }, groups: [] }) }));
jest.mock('../../utils/encryption', () => ({ encrypt: value => `sealed:${value}`, decrypt: value => value.replace(/^sealed:/, '') }));
const router = require('./personal-ai');
const oauth = require('../../services/ai/oauth/openai-device-auth');
const { getUsageSummary } = require('../../services/ai/usage');
function app() {
  return express().use(express.json()).use((req, _res, next) => { req.user = { id: 'trusted-user' }; next(); }).use('/personal', router);
}
const payload = { apiKey: 'my-api-secret', model: 'my-model', modelType: 'QUICK', enabled: true, userId: 'attacker-chosen-user' };
beforeEach(() => {
  jest.clearAllMocks(); process.env.ENCRYPTION_KEY = 'persistent-test-key'; delete process.env.AI_PERSONAL_CODEX_DEVICE_AUTH;
  mockDb.userAiConnection.findUnique.mockResolvedValue(null);
  mockDb.userAiConnection.upsert.mockImplementation(({ create }) => ({ id: 'c1', ...create }));
  mockDb.userAiConnection.findMany.mockResolvedValue([]);
});
afterAll(() => { delete process.env.ENCRYPTION_KEY; });
test('saves encrypted credentials against authenticated identity and returns safe metadata', async () => {
  const response = await request(app()).put('/personal/connections/openai').send(payload).expect(200);
  expect(mockDb.userAiConnection.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_providerType: { userId: 'trusted-user', providerType: 'openai' } }, create: expect.objectContaining({ userId: 'trusted-user', apiKey: 'sealed:my-api-secret' }) }));
  expect(JSON.stringify(response.body)).not.toContain('my-api-secret');
});
test('blank credentials preserve an existing connection and do not create a missing one', async () => {
  const { apiKey, ...withoutKey } = payload;
  await request(app()).put('/personal/connections/openai').send(withoutKey).expect(400);
  mockDb.userAiConnection.findUnique.mockResolvedValue({ apiKey: 'sealed:old-secret' });
  await request(app()).put('/personal/connections/openai').send(withoutKey).expect(200);
  expect(mockDb.userAiConnection.upsert.mock.calls[0][0].update).not.toHaveProperty('apiKey');
  expect(mockDb.userAiConnection.upsert.mock.calls[0][0].create.apiKey).toBe('sealed:old-secret');
});
test('validates keys, models and booleans without echoing a rejected credential', async () => {
  const apiKey = 'sensitive'.repeat(2000);
  const response = await request(app()).put('/personal/connections/anthropic').send({ ...payload, apiKey, enabled: 'false' }).expect(400);
  expect(JSON.stringify(response.body)).not.toContain('sensitive');
  expect(mockDb.userAiConnection.upsert).not.toHaveBeenCalled();
});
test('rejects credential persistence without a stable encryption key', async () => {
  delete process.env.ENCRYPTION_KEY;
  await request(app()).put('/personal/connections/openai').send(payload).expect(503);
  expect(mockDb.userAiConnection.upsert).not.toHaveBeenCalled();
});
test('disconnect only touches the authenticated user and cancels pending logins', async () => {
  await request(app()).delete('/personal/connections/codex').expect(200);
  expect(mockDb.userAiConnection.deleteMany).toHaveBeenCalledWith({ where: { userId: 'trusted-user', providerType: 'codex' } });
  expect(mockDb.userAiDeviceLogin.deleteMany).toHaveBeenCalledWith({ where: { userId: 'trusted-user' } });
});
test('subscription linking is explicitly unavailable by default', async () => {
  await request(app()).post('/personal/codex/start').expect(403);
  expect(oauth.requestUserCode).not.toHaveBeenCalled();
  const { body } = await request(app()).get('/personal/connections').expect(200);
  expect(body.codexLinkEnabled).toBe(false);
  expect(body.claudeLinkReason).toMatch(/API key/);
});
test('poll cannot consume another user login or a missing/expired login', async () => {
  process.env.AI_PERSONAL_CODEX_DEVICE_AUTH = 'true';
  mockDb.userAiDeviceLogin.findUnique.mockResolvedValue(null);
  await request(app()).post('/personal/codex/poll').expect(200, { status: 'expired' });
  expect(mockDb.userAiDeviceLogin.findUnique).toHaveBeenCalledWith({ where: { userId: 'trusted-user' } });
  expect(oauth.pollOnce).not.toHaveBeenCalled();
});
test('usage is always scoped to trusted identity', async () => {
  await request(app()).get('/personal/usage?userId=other').expect(200);
  expect(getUsageSummary).toHaveBeenCalledWith('trusted-user');
});
