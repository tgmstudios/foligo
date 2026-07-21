jest.mock('../../services/core/database', () => ({
  prisma: {
    jobApplication: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(async (operations) => Promise.all(operations)),
  },
}));

const express = require('express');
const request = require('supertest');
const { prisma } = require('../../services/core/database');
const router = require('./goapply-job-applications');

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

describe('GoApply job status validation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('normalizes supported statuses when tracking a job', async () => {
    prisma.jobApplication.create.mockImplementation(async ({ data }) => ({ id: 'job-1', ...data }));

    const response = await request(app()).post('/jobs').send({
      company: 'Example',
      position: 'Engineer',
      status: 'INTERVIEW',
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('interview');
    expect(prisma.jobApplication.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'interview' }),
    }));
  });

  test('rejects an unsupported status on create', async () => {
    const response = await request(app()).post('/jobs').send({
      company: 'Example',
      position: 'Engineer',
      status: 'maybe',
    });

    expect(response.status).toBe(400);
    expect(prisma.jobApplication.create).not.toHaveBeenCalled();
  });

  test('rejects an unsupported status on update', async () => {
    prisma.jobApplication.findFirst.mockResolvedValue({ id: 'job-1', userId: 'user-1', status: 'saved' });

    const response = await request(app()).put('/jobs/job-1').send({ status: 'maybe' });

    expect(response.status).toBe(400);
    expect(prisma.jobApplication.update).not.toHaveBeenCalled();
  });

  test('persists the full role description on create', async () => {
    prisma.jobApplication.create.mockImplementation(async ({ data }) => ({ id: 'job-1', ...data }));

    const response = await request(app()).post('/jobs').send({
      company: 'Example',
      position: 'Engineer',
      description: 'Build delightful things.\nRequirements: coffee.',
      category: 'Summer 2026 Internships',
    });

    expect(response.status).toBe(201);
    expect(prisma.jobApplication.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        description: 'Build delightful things.\nRequirements: coffee.',
        category: 'Summer 2026 Internships',
      }),
    }));
  });

  test('updates the role description', async () => {
    prisma.jobApplication.findFirst.mockResolvedValue({ id: 'job-1', userId: 'user-1', status: 'saved' });
    prisma.jobApplication.update.mockImplementation(async ({ data }) => ({ id: 'job-1', ...data }));

    const response = await request(app()).put('/jobs/job-1').send({ description: 'Updated role text.' });

    expect(response.status).toBe(200);
    expect(prisma.jobApplication.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ description: 'Updated role text.' }),
    }));
  });
});
