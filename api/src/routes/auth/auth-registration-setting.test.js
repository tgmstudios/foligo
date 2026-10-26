jest.mock('../../services/core/database', () => ({
  prisma: {
    platformSetting: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../services/core/redis', () => ({ cache: {} }));

const express = require('express');
const request = require('supertest');
const { prisma } = require('../../services/core/database');
const authRouter = require('./auth');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('POST /auth/register public signup setting', () => {
  const originalAllowPublicSignups = process.env.ALLOW_PUBLIC_SIGNUPS;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ALLOW_PUBLIC_SIGNUPS;
  });

  afterAll(() => {
    if (originalAllowPublicSignups === undefined) {
      delete process.env.ALLOW_PUBLIC_SIGNUPS;
    } else {
      process.env.ALLOW_PUBLIC_SIGNUPS = originalAllowPublicSignups;
    }
  });

  it('rejects registration when the persisted setting is false', async () => {
    prisma.platformSetting.findUnique.mockResolvedValue({ value: 'false' });

    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'password123', name: 'New User' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Registration Disabled');
    expect(prisma.platformSetting.findUnique).toHaveBeenCalledWith({
      where: { key: 'allow_public_signups' },
      select: { value: true },
    });
  });

  it('honors ALLOW_PUBLIC_SIGNUPS=false as a hard override', async () => {
    process.env.ALLOW_PUBLIC_SIGNUPS = 'false';
    prisma.platformSetting.findUnique.mockResolvedValue({ value: 'true' });

    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'password123', name: 'New User' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Registration Disabled');
  });

  it('continues past the gate when signups are enabled', async () => {
    prisma.platformSetting.findUnique.mockResolvedValue({ value: 'true' });

    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'New User' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });
});
