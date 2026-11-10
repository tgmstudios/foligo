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
const attemptA = '9a95a824-8345-4d4b-98ea-2c1e708f6201';
const attemptB = '913a2a84-9229-421e-8850-e6a6ab1a59fd';
const stripeIdempotency = new Map();
const app = () => express().use('/webhook', router.webhook).use(express.json()).use((req, _res, next) => { req.user = { id: 'u1', email: 'a@b.c', name: 'A' }; next(); }).use('/billing', router);
const sub = (over = {}) => ({ id: 'sub_1', customer: 'cus_1', status: 'active', cancel_at_period_end: false, items: { data: [{ price: { id: 'price_pro' }, current_period_end: 1800000000 }] }, ...over });
const post = () => request(app()).post('/webhook').set('stripe-signature', 'sig').set('content-type', 'application/json');

beforeEach(() => {
  jest.clearAllMocks();
  stripeIdempotency.clear();
  mockStripe.checkout.sessions.create.mockReset().mockImplementation(async (params, options) => {
    const key = options.idempotencyKey;
    const existing = stripeIdempotency.get(key);
    if (existing) {
      if (existing.params !== JSON.stringify(params)) throw new Error('Idempotency parameter mismatch');
      return existing.session;
    }
    const session = { id: `cs_${stripeIdempotency.size + 1}`, status: 'open', url: `https://stripe/checkout/${stripeIdempotency.size + 1}` };
    stripeIdempotency.set(key, { params: JSON.stringify(params), session });
    return session;
  });
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

test('checkout uses server-side price and attempt-scoped idempotency', async () => {
  const response = await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId: attemptA }).expect(200);
  expect(response.body.url).toBe('https://stripe/checkout/1');
  expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({ customer: 'cus_1', line_items: [{ price: 'price_pro', quantity: 1 }] }), { idempotencyKey: `checkout:u1:price_pro:${attemptA}` });
  await request(app()).post('/billing/checkout').send({ planKey: 'free', attemptId: attemptA }).expect(400);
  await request(app()).post('/billing/checkout').send({ planKey: 'nope', attemptId: attemptA }).expect(400);
});

test('same attempt retries reuse key while a fresh attempt gets a distinct key', async () => {
  for (const attemptId of [attemptA, attemptA, attemptB]) await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId }).expect(200);
  expect(mockStripe.checkout.sessions.create.mock.calls.map(([, options]) => options.idempotencyKey)).toEqual([`checkout:u1:price_pro:${attemptA}`, `checkout:u1:price_pro:${attemptA}`, `checkout:u1:price_pro:${attemptB}`]);
});

test('checkout requires a UUID attempt ID', async () => {
  await request(app()).post('/billing/checkout').send({ planKey: 'pro' }).expect(400);
  await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId: 'bad/id' }).expect(400);
  expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
});

test('plan price drift creates a new price-scoped idempotency key', async () => {
  await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId: attemptA }).expect(200);
  process.env.BILLING_PLANS = JSON.stringify([{ ...PLANS[0], priceId: 'price_pro_v2' }]);
  await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId: attemptA }).expect(200);
  expect(mockStripe.checkout.sessions.create.mock.calls[0][0].line_items[0].price).toBe('price_pro');
  expect(mockStripe.checkout.sessions.create.mock.calls[1][0].line_items[0].price).toBe('price_pro_v2');
  expect(mockStripe.checkout.sessions.create.mock.calls[0][1].idempotencyKey).not.toBe(mockStripe.checkout.sessions.create.mock.calls[1][1].idempotencyKey);
});

test('a completed or expired session is not reused as an open checkout', async () => {
  mockStripe.checkout.sessions.create.mockResolvedValueOnce({ id: 'cs_complete', status: 'complete', url: 'https://stripe/done' });
  await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId: attemptA }).expect(409);
  mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_expired', status: 'expired', url: 'https://stripe/expired' });
  await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId: attemptB }).expect(409);
  await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId: attemptB }).expect(409);
});

test('customer creation returns the persisted customer after a concurrent create race', async () => {
  mockDb.userSubscription.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ userId: 'u1', stripeCustomerId: 'cus_existing', status: null });
  mockDb.userSubscription.upsert.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'cus_existing' });
  await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId: attemptA }).expect(200);
  expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
    expect.objectContaining({ customer: 'cus_existing' }), expect.anything(),
  );
});

test('checkout refuses a second active subscription', async () => {
  mockDb.userSubscription.findUnique.mockResolvedValue({ userId: 'u1', stripeCustomerId: 'cus_1', status: 'active' });
  await request(app()).post('/billing/checkout').send({ planKey: 'pro', attemptId: attemptA }).expect(409);
});

test('503 when Stripe is not configured', async () => {
  delete process.env.STRIPE_SECRET_KEY;
  jest.resetModules();
  await request(express().use(express.json()).use((req, _r, n) => { req.user = { id: 'u1' }; n(); }).use('/billing', require('./billing'))).post('/billing/portal').expect(503);
});
