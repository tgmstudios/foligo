const mockPrisma = {
  user: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
};
jest.mock('../services/core/database', () => ({ prisma: mockPrisma }));
jest.mock('../services/core/redis', () => ({ cache: { del: jest.fn().mockResolvedValue(1) } }));

jest.mock('../services/ai/manager', () => ({ generateChat: jest.fn() }));
const express = require('express');
const request = require('supertest');
const { cache } = require('../services/core/redis');
const usersRouter = require('./users');

function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.user = { id: 'u1', isAdmin: false }; next(); });
  a.use('/api/users', usersRouter);
  return a;
}

const returned = { id: 'u1', email: 'a@b.co', name: 'N', hasCompletedOnboarding: true, isAdmin: false };

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.findFirst.mockResolvedValue(null);
  mockPrisma.user.update.mockResolvedValue(returned);
});

describe('PUT /api/users/me', () => {
  test('only one PUT /me handler is registered', () => {
    const layers = usersRouter.stack.filter((l) => l.route && l.route.path === '/me' && l.route.methods.put);
    expect(layers).toHaveLength(1);
  });

  test('persists hasCompletedOnboarding: true', async () => {
    const res = await request(app()).put('/api/users/me').send({ hasCompletedOnboarding: true });
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { hasCompletedOnboarding: true } }),
    );
    expect(res.body.hasCompletedOnboarding).toBe(true);
    expect(cache.del).toHaveBeenCalledWith('user:u1');
  });

  test('never writes isAdmin or unknown fields, even if supplied', async () => {
    const res = await request(app()).put('/api/users/me')
      .send({ name: 'New', isAdmin: true, id: 'other', passwordHash: 'x', ssoProviderId: 'y' });
    expect(res.status).toBe(200);
    const { data } = mockPrisma.user.update.mock.calls[0][0];
    expect(data).toEqual({ name: 'New' });
  });

  test('isAdmin-only body is rejected as no data and writes nothing', async () => {
    const res = await request(app()).put('/api/users/me').send({ isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No Data Provided');
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test('response selection does not change shape and includes onboarding flag', async () => {
    await request(app()).put('/api/users/me').send({ name: 'x' });
    expect(mockPrisma.user.update.mock.calls[0][0].select).toEqual({
      id: true, email: true, name: true, hasCompletedOnboarding: true, isAdmin: true,
      createdAt: true, updatedAt: true,
    });
  });

  test('validation: empty name and non-boolean onboarding flag -> 400', async () => {
    const r1 = await request(app()).put('/api/users/me').send({ name: '   ' });
    expect(r1.status).toBe(400);
    expect(r1.body.error).toBe('Validation Error');
    const r2 = await request(app()).put('/api/users/me').send({ hasCompletedOnboarding: 'maybe' });
    expect(r2.status).toBe(400);
    const r3 = await request(app()).put('/api/users/me').send({ email: 'nope' });
    expect(r3.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test('email conflict -> 409 and no update; email change clears caches', async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce({ id: 'u2' });
    const conflict = await request(app()).put('/api/users/me').send({ email: 'taken@b.co' });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error).toBe('Email Already Exists');
    expect(mockPrisma.user.update).not.toHaveBeenCalled();

    const ok = await request(app()).put('/api/users/me').send({ email: 'free@b.co', name: 'Z' });
    expect(ok.status).toBe(200);
    expect(mockPrisma.user.update.mock.calls[0][0].data).toEqual({ name: 'Z', email: 'free@b.co' });
    expect(cache.del).toHaveBeenCalledWith('user:u1');
    expect(cache.del).toHaveBeenCalledWith('user:public:u1');
  });

  test('hasCompletedOnboarding false is persisted (not dropped as falsy)', async () => {
    await request(app()).put('/api/users/me').send({ hasCompletedOnboarding: false });
    expect(mockPrisma.user.update.mock.calls[0][0].data).toEqual({ hasCompletedOnboarding: false });
  });

  test.each(['1', '0', 'true', 'false', 1, 0, null, {}, []])('hasCompletedOnboarding %p is rejected with 400 and nothing is stored', async (value) => {
    const res = await request(app()).put('/api/users/me').send({ hasCompletedOnboarding: value });
    expect(res.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test('strict boolean true/false stored as-is; isAdmin in body is never written', async () => {
    await request(app()).put('/api/users/me').send({ hasCompletedOnboarding: true, isAdmin: true });
    expect(mockPrisma.user.update.mock.calls[0][0].data).toEqual({ hasCompletedOnboarding: true });
    await request(app()).put('/api/users/me').send({ hasCompletedOnboarding: false });
    expect(mockPrisma.user.update.mock.calls[1][0].data).toEqual({ hasCompletedOnboarding: false });
  });

  test('db failure -> 500 contract', async () => {
    mockPrisma.user.update.mockRejectedValueOnce(new Error('boom'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app()).put('/api/users/me').send({ name: 'x' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Profile Update Failed');
  });
});

describe('private writing style preferences', () => {
  const style = { tone: 'formal', detail: 'balanced', structure: 'paragraphs', vocabulary: 'plain', sample: 'My writing.' };

  test('reads only the authenticated user preferences', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ writingStyle: style });
    const res = await request(app()).get('/api/users/me/writing-style');
    expect(res.status).toBe(200);
    expect(res.body.writingStyle).toEqual(style);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, select: { writingStyle: true } });
  });

  test('saves validated preferences for the authenticated user', async () => {
    const res = await request(app()).put('/api/users/me/writing-style').send({ writingStyle: style, userId: 'u2' });
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { writingStyle: { ...style, version: 1 } } });
  });

  test('rejects incomplete preferences without writing', async () => {
    const res = await request(app()).put('/api/users/me/writing-style').send({ writingStyle: { tone: 'formal' } });
    expect(res.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test('removes preferences with a database null', async () => {
    const res = await request(app()).put('/api/users/me/writing-style').send({ writingStyle: null });
    expect(res.status).toBe(200);
    expect(res.body.writingStyle).toBeNull();
    expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { writingStyle: require('@prisma/client').Prisma.DbNull } });
  });
});


describe('writing profile calibration', () => {
  const ai = require('../services/ai/manager');
  const profile = { tone: 'formal', detail: 'balanced', structure: 'paragraphs', vocabulary: 'plain', sample: 'My writing.' };
  test('returns the canonical research-informed questionnaire with a private profile', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ writingStyle: null });
    const res = await request(app()).get('/api/users/me/writing-style');
    expect(res.body.questionnaire.questions).toHaveLength(12);
    expect(res.body.questionnaire.questions.every(q => q.options.some(o => o.value === 'unspecified'))).toBe(true);
  });
  test('tests unsaved preferences without writing them and uses the authenticated model identity', async () => {
    ai.generateChat.mockResolvedValue({ text: 'Our team tested the website and simplified the navigation. Next, we will prepare for launch.' });
    const res = await request(app()).post('/api/users/me/writing-style/preview').send({ writingStyle: profile, userId: 'u2' });
    expect(res.status).toBe(200);
    expect(ai.generateChat).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ userId: 'u1', writingStyle: { ...profile, version: 1 } }));
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
  test('rejects an invalid profile before calling AI', async () => {
    const res = await request(app()).post('/api/users/me/writing-style/preview').send({ writingStyle: null });
    expect(res.status).toBe(400);
    expect(ai.generateChat).not.toHaveBeenCalled();
  });
  test.each([{ text: '' }, { text: 'Partial', truncated: true }])('rejects unusable preview output', async output => {
    ai.generateChat.mockResolvedValue(output);
    const res = await request(app()).post('/api/users/me/writing-style/preview').send({ writingStyle: profile });
    expect(res.status).toBe(502);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
