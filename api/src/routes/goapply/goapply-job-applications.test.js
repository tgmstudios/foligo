jest.mock('../../services/core/database', () => ({
  prisma: {
    user: { findUnique: jest.fn().mockResolvedValue({ goapplyColumns: null }), update: jest.fn() },
    $queryRaw: jest.fn(),
    jobApplication: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(async (operations) => typeof operations === 'function' ? operations(require('../../services/core/database').prisma) : Promise.all(operations)),
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


describe('GoApply columns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ goapplyColumns: null });
  });

  test('returns default columns for existing accounts', async () => {
    const response = await request(app()).get('/columns');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(9);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' }, select: { goapplyColumns: true } });
  });

  test('creates a persistent custom column', async () => {
    const response = await request(app()).post('/columns').send({ label: 'Technical round', color: 'bg-blue-500' });
    expect(response.status).toBe(201);
    expect(response.body.label).toBe('Technical round');
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' }, data: { goapplyColumns: expect.arrayContaining([response.body]) }
    }));
  });

  test.each([{ label: ' ', color: 'bg-blue-500' }, { label: 'Test', color: 'invalid' }])('rejects invalid column data', async data => {
    expect((await request(app()).post('/columns').send(data)).status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('rejects duplicate names', async () => {
    expect((await request(app()).post('/columns').send({ label: 'SAVED', color: 'bg-blue-500' })).status).toBe(409);
  });

  test('renames a column without changing job status identifiers', async () => {
    const response = await request(app()).put('/columns/saved').send({ label: 'Wishlist', color: 'bg-green-500' });
    expect(response.body).toEqual({ status: 'saved', label: 'Wishlist', color: 'bg-green-500' });
  });

  test('deletes a column and moves only the current user jobs', async () => {
    const response = await request(app()).delete('/columns/saved').send({ moveTo: 'applied' });
    expect(response.status).toBe(200);
    expect(prisma.jobApplication.updateMany).toHaveBeenCalledWith({ where: { userId: 'user-1', status: 'saved' }, data: { status: 'applied' } });
    expect(prisma.user.update.mock.calls[0][0].data.goapplyColumns.some(c => c.status === 'saved')).toBe(false);
  });

  test('rejects a missing or foreign column', async () => {
    expect((await request(app()).delete('/columns/foreign').send({ moveTo: 'saved' })).status).toBe(404);
    expect(prisma.jobApplication.updateMany).not.toHaveBeenCalled();
  });

  test('keeps the last column', async () => {
    prisma.user.findUnique.mockResolvedValue({ goapplyColumns: [{ status: 'saved', label: 'Saved', color: 'bg-gray-500' }] });
    expect((await request(app()).delete('/columns/saved').send({ moveTo: 'saved' })).status).toBe(400);
  });

  test('rejects deletion without a valid destination', async () => {
    expect((await request(app()).delete('/columns/saved').send({ moveTo: 'foreign' })).status).toBe(400);
    expect(prisma.jobApplication.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('groups custom columns in the Kanban response', async () => {
    prisma.user.findUnique.mockResolvedValue({ goapplyColumns: [{ status: 'custom', label: 'Custom', color: 'bg-blue-500' }] });
    prisma.jobApplication.findMany.mockResolvedValue([{ id: 'job-1', status: 'custom' }]);
    const response = await request(app()).get('/kanban');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ custom: [{ id: 'job-1', status: 'custom' }] });
  });

  test('allows dragging jobs to custom columns', async () => {
    prisma.user.findUnique.mockResolvedValue({ goapplyColumns: [{ status: 'custom', label: 'Custom', color: 'bg-blue-500' }] });
    const response = await request(app()).put('/jobs/reorder').send({ items: [{ id: 'job-1', sortOrder: 0, status: 'custom' }] });
    expect(response.status).toBe(200);
    expect(prisma.jobApplication.updateMany).toHaveBeenCalledWith({ where: { id: 'job-1', userId: 'user-1' }, data: { sortOrder: 0, status: 'custom' } });
  });

  test('accepts custom statuses and rejects deleted defaults', async () => {
    prisma.user.findUnique.mockResolvedValue({ goapplyColumns: [{ status: 'custom', label: 'Custom', color: 'bg-blue-500' }] });
    prisma.jobApplication.create.mockImplementation(async ({ data }) => ({ id: 'job-1', ...data }));
    expect((await request(app()).post('/jobs').send({ company: 'Example', position: 'Engineer', status: 'custom' })).status).toBe(201);
    expect((await request(app()).post('/jobs').send({ company: 'Example', position: 'Engineer', status: 'saved' })).status).toBe(400);
    const response = await request(app()).post('/jobs').send({ company: 'Example', position: 'Engineer' });
    expect(response.body.status).toBe('custom');
  });
});
