const express = require('express');
const request = require('supertest');
const mockDb = { $executeRaw: jest.fn(), user: { findUnique: jest.fn() }, userAiUsagePolicy: { upsert: jest.fn() }, aiUsageEvent: { findMany: jest.fn(), count: jest.fn() }, aiModel: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() } };
mockDb.$transaction = jest.fn(fn => fn(mockDb));
jest.mock('../../services/core/database', () => ({ prisma: mockDb }));
jest.mock('../../middleware/auth', () => ({ requireAdmin: (req, res, next) => req.user.isAdmin ? next() : res.status(403).json({ error: 'Admin required' }) }));
jest.mock('../../services/ai/usage', () => ({ ...jest.requireActual('../../services/ai/usage'), getUsageSummary: jest.fn().mockResolvedValue({ groups: [] }) }));
const router = require('./admin-ai-billing');
function app(admin = true) { return express().use(express.json()).use((req, _res, next) => { req.user = { isAdmin: admin }; next(); }).use('/billing', router); }
const id = '123e4567-e89b-42d3-a456-426614174000';
const policy = { unlimited: false, monthlyRequests: 0, monthlyTokens: null, monthlyCostUsd: 0 };
beforeEach(() => { jest.clearAllMocks(); mockDb.user.findUnique.mockResolvedValue({ id }); });
test('billing controls, usage exports, and rates require admin rights', async () => {
  await request(app(false)).get(`/billing/users/${id}`).expect(403);
  await request(app(false)).put(`/billing/users/${id}/policy`).send(policy).expect(403);
  await request(app(false)).get(`/billing/users/${id}/events`).expect(403);
  await request(app(false)).put(`/billing/models/${id}/rates`).send({ rates: null }).expect(403);
  expect(mockDb.$transaction).not.toHaveBeenCalled();
});
test('preserves explicit zero limits, null caps, and an unlimited override', async () => {
  await request(app()).put(`/billing/users/${id}/policy`).send(policy).expect(200);
  expect(mockDb.userAiUsagePolicy.upsert).toHaveBeenCalledWith({ where: { userId: id }, create: { userId: id, ...policy }, update: policy });
  await request(app()).put(`/billing/users/${id}/policy`).send({ ...policy, unlimited: true }).expect(200);
  expect(mockDb.userAiUsagePolicy.upsert.mock.calls[1][0].update.unlimited).toBe(true);
});
test.each([{ ...policy, monthlyTokens: -1 }, { ...policy, monthlyRequests: 1.2 }, { ...policy, unlimited: 'false' }, { unlimited: false }])('rejects malformed policies: %j', async invalid => {
  await request(app()).put(`/billing/users/${id}/policy`).send(invalid).expect(400);
  expect(mockDb.userAiUsagePolicy.upsert).not.toHaveBeenCalled();
});
test('unknown users cannot receive policies', async () => {
  mockDb.user.findUnique.mockResolvedValue(null);
  await request(app()).put(`/billing/users/${id}/policy`).send(policy).expect(404);
  expect(mockDb.$transaction).not.toHaveBeenCalled();
});
test('ledger is paginated, calendar-scoped and never includes credentials', async () => {
  mockDb.aiUsageEvent.findMany.mockResolvedValue([]); mockDb.aiUsageEvent.count.mockResolvedValue(0);
  await request(app()).get(`/billing/users/${id}/events?month=2026-12&page=2`).expect(200);
  expect(mockDb.aiUsageEvent.findMany).toHaveBeenCalledWith({ where: { userId: id, createdAt: { gte: new Date('2026-12-01T00:00:00Z'), lt: new Date('2027-01-01T00:00:00Z') } }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: 100, take: 100 });
});
test('requires all rate dimensions and supports zero/free models', async () => {
  mockDb.aiModel.findUnique.mockResolvedValue({ id });
  await request(app()).put(`/billing/models/${id}/rates`).send({ rates: { input: 2, output: 10 } }).expect(400);
  await request(app()).put(`/billing/models/${id}/rates`).send({ rates: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } }).expect(200);
  expect(mockDb.aiModel.update).toHaveBeenCalledWith({ where: { id }, data: { billingRates: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } } });
});
