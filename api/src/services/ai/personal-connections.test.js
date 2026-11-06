const mockTx = { $executeRaw: jest.fn(), userAiConnection: { findFirst: jest.fn(), update: jest.fn() } };
jest.mock('../core/database', () => ({ prisma: { $transaction: jest.fn(fn => fn(mockTx)) } }));
jest.mock('../../utils/encryption', () => ({ encrypt: value => `encrypted:${value}`, decrypt: value => value.replace(/^encrypted:/, '') }));
jest.mock('./oauth/openai-device-auth', () => ({ refreshTokens: jest.fn() }));
const { resolvePersonalConnection, safeConnection } = require('./personal-connections');
const { refreshTokens } = require('./oauth/openai-device-auth');
const row = { id: 'c1', userId: 'u1', providerType: 'openai', model: 'my-model', modelType: 'QUICK', apiKey: 'encrypted:personal-secret', enabled: true };
beforeEach(() => { jest.clearAllMocks(); delete process.env.AI_PERSONAL_CODEX_DEVICE_AUTH; });
test('resolves by both connection ID and trusted user ID', async () => {
  mockTx.userAiConnection.findFirst.mockResolvedValue(null);
  await expect(resolvePersonalConnection('other-user', 'personal:c1')).resolves.toBeNull();
  expect(mockTx.userAiConnection.findFirst).toHaveBeenCalledWith({ where: { id: 'c1', userId: 'other-user', enabled: true } });
});
test('personal overrides reset environment endpoints, headers and credentials', async () => {
  mockTx.userAiConnection.findFirst.mockResolvedValue(row);
  const result = await resolvePersonalConnection('u1', 'personal:c1');
  expect(result).toMatchObject({ source: 'PERSONAL', overrides: { apiKey: 'personal-secret', headers: {}, endpoint: 'https://api.openai.com/v1', baseUrl: 'https://api.openai.com/v1', model: 'my-model' } });
  expect(result.overrides).toHaveProperty('chatgptAccountId', undefined);
});
test('safe connection metadata never includes credentials or OAuth tokens', () => {
  const safe = safeConnection({ ...row, oauthRefreshToken: 'refresh-secret', oauthAccountId: 'account-secret' });
  expect(JSON.stringify(safe)).not.toMatch(/personal-secret|refresh-secret|account-secret/);
  expect(safe.authType).toBe('subscription');
});
test('expired subscription refresh persists rotated credentials under a database lock', async () => {
  process.env.AI_PERSONAL_CODEX_DEVICE_AUTH = 'true';
  const subscription = { ...row, providerType: 'codex', oauthRefreshToken: 'encrypted:old-refresh', oauthAccountId: 'account', oauthExpiresAt: new Date(0) };
  mockTx.userAiConnection.findFirst.mockResolvedValue(subscription);
  refreshTokens.mockResolvedValue({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600 });
  mockTx.userAiConnection.update.mockImplementation(({ data }) => ({ ...subscription, ...data }));
  const result = await resolvePersonalConnection('u1', 'personal:c1');
  expect(mockTx.$executeRaw).toHaveBeenCalled();
  expect(mockTx.userAiConnection.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ apiKey: 'encrypted:new-access', oauthRefreshToken: 'encrypted:new-refresh' }) }));
  expect(result.overrides.apiKey).toBe('new-access');
  expect(result.overrides.chatgptAccountId).toBe('account');
});
test('refresh failure requires reconnect rather than falling back to a server key', async () => {
  process.env.AI_PERSONAL_CODEX_DEVICE_AUTH = 'true';
  mockTx.userAiConnection.findFirst.mockResolvedValue({ ...row, oauthRefreshToken: 'encrypted:refresh', oauthExpiresAt: new Date(0) });
  refreshTokens.mockRejectedValue(new Error('Invalid refresh'));
  await expect(resolvePersonalConnection('u1', 'personal:c1')).rejects.toMatchObject({ code: 'PERSONAL_AI_RECONNECT_REQUIRED' });
});
test('existing subscription credentials cannot be used when deployment linking is disabled', async () => {
  mockTx.userAiConnection.findFirst.mockResolvedValue({ ...row, oauthRefreshToken: 'encrypted:refresh' });
  await expect(resolvePersonalConnection('u1', 'personal:c1')).rejects.toMatchObject({ code: 'PERSONAL_AI_RECONNECT_REQUIRED' });
  expect(refreshTokens).not.toHaveBeenCalled();
});
