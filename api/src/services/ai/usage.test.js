const mockTx = {
  $executeRaw: jest.fn(), userAiUsagePolicy: { findUnique: jest.fn() },
  aiUsageEvent: { groupBy: jest.fn(), count: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
};
jest.mock('../core/database', () => ({ prisma: { ...mockTx, $transaction: jest.fn(fn => fn(mockTx)) } }));
const { AiQuotaError, monthWindow, normalizeUsage, calculateCost, reserveUsage, meteredModel } = require('./usage');
const rates = { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 3 };
const meta = { userId: 'u1', source: 'SERVER', selection: 'm1', providerType: 'openai', model: 'model', rates };
const params = { prompt: [{ role: 'user', content: 'Hello' }], maxOutputTokens: 100 };
const usage = { inputTokens: { total: 1000, cacheRead: 200, cacheWrite: 100 }, outputTokens: { total: 500, reasoning: 300 } };
beforeEach(() => {
  jest.clearAllMocks();
  mockTx.userAiUsagePolicy.findUnique.mockResolvedValue(null);
  mockTx.aiUsageEvent.groupBy.mockResolvedValue([]);
  mockTx.aiUsageEvent.count.mockResolvedValue(0);
  mockTx.aiUsageEvent.create.mockImplementation(({ data }) => Promise.resolve({ id: 'e1', ...data }));
  mockTx.aiUsageEvent.updateMany.mockResolvedValue({ count: 1 });
});
test('uses UTC calendar months including year rollover', () => {
  expect(monthWindow('2026-12-31T23:59:59Z')).toEqual({ start: new Date('2026-12-01T00:00:00Z'), end: new Date('2027-01-01T00:00:00Z') });
});
test('counts reasoning within output and cache within input, with separate rates', () => {
  const totals = normalizeUsage(usage);
  expect(totals.totalTokens).toBe(1500);
  expect(totals.reasoningTokens).toBe(300);
  expect(calculateCost(totals, rates)).toBe(0.00674);
  expect(calculateCost(totals, null)).toBeNull();
});
test.each([
  { monthlyRequests: 0, monthlyTokens: null, monthlyCostUsd: null },
  { monthlyRequests: null, monthlyTokens: 0, monthlyCostUsd: null },
  { monthlyRequests: null, monthlyTokens: null, monthlyCostUsd: 0 },
])('blocks exhausted allowances before dispatch: %j', async policy => {
  mockTx.userAiUsagePolicy.findUnique.mockResolvedValue({ unlimited: false, ...policy });
  const model = { doGenerate: jest.fn() };
  await expect(meteredModel(model, meta).doGenerate(params)).rejects.toBeInstanceOf(AiQuotaError);
  expect(model.doGenerate).not.toHaveBeenCalled();
  expect(mockTx.aiUsageEvent.create).not.toHaveBeenCalled();
});
test('pending and unknown reservations count toward limits', async () => {
  mockTx.userAiUsagePolicy.findUnique.mockResolvedValue({ unlimited: false, monthlyRequests: 2, monthlyTokens: null, monthlyCostUsd: null });
  mockTx.aiUsageEvent.groupBy.mockResolvedValue([{ source: 'SERVER', status: 'UNKNOWN', _count: { _all: 2 }, _sum: { totalTokens: 10000 } }]);
  await expect(reserveUsage(meta, params)).rejects.toBeInstanceOf(AiQuotaError);
  expect(mockTx.$executeRaw).toHaveBeenCalled();
});
test('unlimited users bypass caps but keep metering', async () => {
  mockTx.userAiUsagePolicy.findUnique.mockResolvedValue({ unlimited: true, monthlyRequests: 0, monthlyTokens: 0, monthlyCostUsd: 0 });
  const provider = { doGenerate: jest.fn().mockResolvedValue({ usage, content: [] }) };
  await meteredModel(provider, meta).doGenerate(params);
  expect(provider.doGenerate).toHaveBeenCalledTimes(1);
  expect(mockTx.aiUsageEvent.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED', totalTokens: 1500, costUsd: 0.00674 }) }));
});
test('personal usage is tracked separately and bypasses server allowance', async () => {
  mockTx.userAiUsagePolicy.findUnique.mockResolvedValue({ unlimited: false, monthlyRequests: 0, monthlyTokens: 0, monthlyCostUsd: 0 });
  const provider = { doGenerate: jest.fn().mockResolvedValue({ usage, content: [] }) };
  await meteredModel(provider, { ...meta, source: 'PERSONAL' }).doGenerate(params);
  expect(mockTx.aiUsageEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ source: 'PERSONAL', costUsd: null }) }));
  expect(mockTx.aiUsageEvent.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ costUsd: null }) }));
});
test('spend caps fail closed for missing rates or prior unpriced usage', async () => {
  mockTx.userAiUsagePolicy.findUnique.mockResolvedValue({ unlimited: false, monthlyRequests: null, monthlyTokens: null, monthlyCostUsd: 10 });
  await expect(reserveUsage({ ...meta, rates: undefined }, params)).rejects.toMatchObject({ code: 'AI_BILLING_RATES_REQUIRED' });
  mockTx.aiUsageEvent.count.mockResolvedValue(1);
  await expect(reserveUsage(meta, params)).rejects.toMatchObject({ code: 'AI_BILLING_RATES_REQUIRED' });
});
test('failed requests keep a flagged estimate when provider usage is unknown', async () => {
  const provider = { doGenerate: jest.fn().mockRejectedValue(new Error('Upstream disconnected')) };
  await expect(meteredModel(provider, meta).doGenerate(params)).rejects.toThrow('Upstream disconnected');
  expect(mockTx.aiUsageEvent.updateMany).toHaveBeenCalledWith({ where: { id: 'e1', status: 'RESERVED' }, data: { status: 'UNKNOWN', completedAt: expect.any(Date) } });
});
test('stream settlement records terminal usage exactly once', async () => {
  const provider = { doStream: jest.fn().mockResolvedValue({ stream: new ReadableStream({ start(c) {
    c.enqueue({ type: 'text-delta', delta: 'Hello' }); c.enqueue({ type: 'finish', usage }); c.close();
  } }) }) };
  const result = await meteredModel(provider, meta).doStream(params);
  for await (const part of result.stream) { void part; }
  expect(mockTx.aiUsageEvent.updateMany).toHaveBeenCalledTimes(1);
  expect(mockTx.aiUsageEvent.updateMany.mock.calls[0][0].data.totalTokens).toBe(1500);
});
test('cancelled streams keep their reservation instead of granting free retries', async () => {
  const provider = { doStream: jest.fn().mockResolvedValue({ stream: new ReadableStream({ pull() {} }) }) };
  const result = await meteredModel(provider, meta).doStream(params);
  await result.stream.cancel();
  expect(mockTx.aiUsageEvent.updateMany.mock.calls[0][0].data.status).toBe('UNKNOWN');
});
test('each retry/tool-step call receives its own reservation', async () => {
  const provider = { doGenerate: jest.fn().mockResolvedValue({ usage }) };
  const wrapped = meteredModel(provider, meta);
  await wrapped.doGenerate(params); await wrapped.doGenerate(params);
  expect(mockTx.aiUsageEvent.create).toHaveBeenCalledTimes(2);
});
test('stream ledger failure is non-retryable and attempts settlement once', async () => {
  mockTx.aiUsageEvent.updateMany.mockRejectedValueOnce(new Error('ledger unavailable'));
  const provider = { doStream: jest.fn().mockResolvedValue({ stream: new ReadableStream({ start(c) {
    c.enqueue({ type: 'finish', usage }); c.close();
  } }) }) };
  const result = await meteredModel(provider, meta).doStream(params);
  await expect((async () => { for await (const part of result.stream) { void part; } })())
    .rejects.toMatchObject({ code: 'AI_USAGE_SETTLEMENT_FAILED' });
  expect(mockTx.aiUsageEvent.updateMany).toHaveBeenCalledTimes(1);
});

test('successful inference whose ledger settlement fails is not misreported as provider failure', async () => {
  const provider = { doGenerate: jest.fn().mockResolvedValue({ usage, content: [] }) };
  mockTx.aiUsageEvent.updateMany.mockRejectedValueOnce(new Error('ledger unavailable'));
  await expect(meteredModel(provider, meta).doGenerate(params)).rejects.toMatchObject({ code: 'AI_USAGE_SETTLEMENT_FAILED' });
  expect(provider.doGenerate).toHaveBeenCalledTimes(1);
});
