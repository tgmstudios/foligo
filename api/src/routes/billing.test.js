const express = require('express');
const request = require('supertest');
const mockDb = {
  $executeRaw: jest.fn(),
  userSubscription: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
  userAiUsagePolicy: { upsert: jest.fn() },
  stripeEvent: { findUnique: jest.fn(), upsert: jest.fn() },
};
mockDb.$transaction = jest.fn(fn => fn(mockDb));
jest.mock('../services/core/database', () => ({ prisma: mockDb }));
jest.mock('../services/ai/usage', () => ({ userLock: jest.fn(), getUsageSummary: jest.fn().mockResolvedValue({}) }));
const mockStripe = {
  webhooks: { constructEvent: jest.fn() },
  customers: { create: jest.fn().mockResolvedValue({ id: 'cus_1' }) },
  checkout: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://stripe/checkout' }) } },
  billingPortal: { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://stripe/portal' }) } },
  subscriptions: { retrieve: jest.fn() },
};
jest.mock('stripe', () => jest.fn(() => mockStripe));
const router = require('./billing');

const PLANS = [{ key: 'pro', name: 'Pro', priceId: 'price_pro', monthlyRequests: 100, monthlyTokens: null, monthlyCostUsd: 5 }, { key: 'free', name: 'Free', monthlyRequests: 5 }];
const app = () => express().use('/webhook', router.webhook).use(express.json()).use((req, _res, next) => { req.user = { id: 'u1', email: 'a@b.c', name: 'A' }; next(); }).use('/billing', router);
const sub = (over = {}) => ({ id: 'sub_1', customer: 'cus_1', status: 'active', cancel_at_period_end: false, items: { data: [{ price: { id: 'price_pro' }, current_period_end: 1800000000 }] }, ...over });
const post = () => request(app()).post('/webhook').set('stripe-signature', 'sig').set('content-type', 'application/json');

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(process.env, { STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: 'whsec', BILLING_PLANS: JSON.stringify(PLANS) });
  mockDb.userSubscription.findUnique.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'cus_1', stripeSubscriptionId: null });
  mockDb.stripeEvent.findUnique.mockResolvedValue(null);
});

test('webhook rejects bad signatures and missing signature', async () => {
  mockStripe.webhooks.constructEvent.mockImplementation(() => { const e = new Error('bad'); e.type = 'StripeSignatureVerificationError'; throw e; });
  await post().send('{}').expect(400);
  await request(app()).post('/webhook').send('{}').expect(400);
  expect(mockDb.userAiUsagePolicy.upsert).not.toHaveBeenCalled();
});

test('active subscription applies the plan limits to the usage policy', async () => {
  mockStripe.webhooks.constructEvent.mockReturnValue({ id: 'evt_1', type: 'customer.subscription.updated', data: { object: sub() } });
  await post().send('{}').expect(200);
  expect(mockDb.userAiUsagePolicy.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { unlimited: false, monthlyRequests: 100, monthlyTokens: null, monthlyCostUsd: 5 } }));
  expect(mockDb.stripeEvent.upsert).toHaveBeenCalled();
});

test('canceled subscription falls back to the free plan', async () => {
  mockStripe.webhooks.constructEvent.mockReturnValue({ id: 'evt_2', type: 'customer.subscription.deleted', data: { object: sub({ status: 'canceled' }) } });
  await post().send('{}').expect(200);
  expect(mockDb.userAiUsagePolicy.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ unlimited: false, monthlyRequests: 5 }) }));
});

test('replayed events are not reprocessed', async () => {
  mockStripe.webhooks.constructEvent.mockReturnValue({ id: 'evt_1', type: 'customer.subscription.updated', data: { object: sub() } });
  mockDb.stripeEvent.findUnique.mockResolvedValue({ id: 'evt_1' });
  await post().send('{}').expect(200);
  expect(mockDb.userAiUsagePolicy.upsert).not.toHaveBeenCalled();
});

test('checkout uses server-side price for a known plan only', async () => {
  const response = await request(app()).post('/billing/checkout').send({ planKey: 'pro' }).expect(200);
  expect(response.body.url).toBe('https://stripe/checkout');
  expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({ customer: 'cus_1', line_items: [{ price: 'price_pro', quantity: 1 }] }), expect.objectContaining({ idempotencyKey: 'checkout:u1:pro' }));
  await request(app()).post('/billing/checkout').send({ planKey: 'free' }).expect(400);
  await request(app()).post('/billing/checkout').send({ planKey: 'nope' }).expect(400);
});

test('checkout creation is idempotent per user and plan', async () => {
  await request(app()).post('/billing/checkout').send({ planKey: 'pro' }).expect(200);
  expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
    expect.any(Object), { idempotencyKey: 'checkout:u1:pro' },
  );
});

test('customer creation returns the persisted customer after a concurrent create race', async () => {
  mockDb.userSubscription.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ userId: 'u1', stripeCustomerId: 'cus_existing' });
  mockDb.userSubscription.upsert.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'cus_existing' });
  await request(app()).post('/billing/checkout').send({ planKey: 'pro' }).expect(200);
  expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
    expect.objectContaining({ customer: 'cus_existing' }), expect.anything(),
  );
});

test('checkout refuses a second active subscription', async () => {
  mockDb.userSubscription.findUnique.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'cus_1', status: 'active' });
  await request(app()).post('/billing/checkout').send({ planKey: 'pro' }).expect(409);
});

test('503 when Stripe is not configured', async () => {
  delete process.env.STRIPE_SECRET_KEY;
  jest.resetModules();
  await request(express().use(express.json()).use((req, _r, n) => { req.user = { id: 'u1' }; n(); }).use('/billing', require('./billing'))).post('/billing/portal').expect(503);
});
