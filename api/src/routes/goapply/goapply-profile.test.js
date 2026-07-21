jest.mock('../../services/core/database', () => ({
  prisma: {
    userProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const express = require('express');
const request = require('supertest');
const { prisma } = require('../../services/core/database');
const router = require('./goapply-profile');

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use((req, _res, next) => {
    req.user = { id: 'user-1' };
    next();
  });
  instance.use(router);
  return instance;
}

describe('GoApply profile jobCategories', () => {
  beforeEach(() => jest.clearAllMocks());

  test('trims, dedupes, and persists jobCategories', async () => {
    prisma.userProfile.upsert.mockImplementation(async ({ update }) => ({ id: 'p1', userId: 'user-1', ...update, linkedJobs: [], linkedEducation: [], linkedSkills: [] }));

    const response = await request(app()).put('/profile').send({
      jobCategories: ['  Summer 2026  ', 'Summer 2026', 'Fall 2026', '', '   '],
    });

    expect(response.status).toBe(200);
    expect(response.body.jobCategories).toEqual(['Summer 2026', 'Fall 2026']);
    expect(prisma.userProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ jobCategories: ['Summer 2026', 'Fall 2026'] }),
    }));
  });

  test('rejects a non-array jobCategories', async () => {
    const response = await request(app()).put('/profile').send({ jobCategories: 'Summer 2026' });

    expect(response.status).toBe(400);
    expect(prisma.userProfile.upsert).not.toHaveBeenCalled();
  });
});
