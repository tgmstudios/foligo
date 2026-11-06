const express = require('express');
const request = require('supertest');

jest.mock('../../services/core/database', () => ({
  prisma: {
    project: { findUnique: jest.fn() },
    content: { findMany: jest.fn() },
  },
}));
jest.mock('../../services/core/redis', () => {
  const store = new Map();
  return {
    __store: store,
    cache: {
      get: jest.fn(async (k) => (store.has(k) ? JSON.parse(store.get(k)) : null)),
      set: jest.fn(async (k, v) => { store.set(k, JSON.stringify(v)); return true; }),
      del: jest.fn(async (k) => store.delete(k)),
    },
  };
});

const { prisma } = require('../../services/core/database');
const redis = require('../../services/core/redis');
const router = require('./public-content');

const PID = 'proj-1';
const app = express().use('/api', router);

// In-memory table so filters are really applied, not just asserted on.
let rows;
const matchWhere = (r, w) => Object.entries(w).every(([k, v]) => r[k] === v);
const row = (id, status, extra = {}) => ({
  id, projectId: PID, type: 'BLOG', contentType: 'BLOG', title: id, slug: id, excerpt: null,
  content: 'body', metadata: null, order: 0, status, revisionOf: null, revisionNumber: null,
  revisedAt: null, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02'), ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  redis.__store.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  rows = [
    row('pub', 'PUBLISHED', { order: 2 }),
    row('pub0', 'PUBLISHED', { order: 1 }),
    row('draft', 'DRAFT'),
    row('hidden', 'HIDDEN'),
    row('rev', 'REVISION', { revisionOf: 'pub' }),
    row('pub-rev', 'PUBLISHED', { revisionOf: 'pub' }),
  ];
  prisma.project.findUnique.mockResolvedValue({ id: PID, isPublished: true });
  prisma.content.findMany.mockImplementation(async ({ where, select }) =>
    rows.filter((r) => matchWhere(r, where))
      .sort((a, b) => a.order - b.order || String(a.id).localeCompare(String(b.id)))
      .map((r) => Object.fromEntries(Object.keys(select).map((k) => [k, r[k]]))));
});

test('unpublished or unknown project returns 404 and reads no content', async () => {
  prisma.project.findUnique.mockResolvedValue({ id: PID, isPublished: false });
  expect((await request(app).get(`/api/projects/${PID}/content`)).status).toBe(404);
  prisma.project.findUnique.mockResolvedValue(null);
  expect((await request(app).get(`/api/projects/nope/content`)).status).toBe(404);
  expect(prisma.content.findMany).not.toHaveBeenCalled();
});

test('published project returns only PUBLISHED non-revision rows, ordered, without revision fields', async () => {
  const res = await request(app).get(`/api/projects/${PID}/content`);
  expect(res.status).toBe(200);
  expect(res.body.map((r) => r.id)).toEqual(['pub0', 'pub']);
  for (const r of res.body) {
    expect(r.status).toBe('PUBLISHED');
    expect(r).not.toHaveProperty('revisionOf');
    expect(r).not.toHaveProperty('revisionNumber');
  }
  expect(prisma.content.findMany.mock.calls[0][0].where).toEqual({ projectId: PID, status: 'PUBLISHED', revisionOf: null });
});

test('replace with identical count and max(updatedAt) is reflected immediately (no fingerprint collision)', async () => {
  const first = await request(app).get(`/api/projects/${PID}/content`);
  expect(first.body.map((r) => r.id)).toEqual(['pub0', 'pub']);
  // swap 'pub' for a different row with the same updatedAt: count and max are unchanged
  rows = rows.filter((r) => r.id !== 'pub');
  rows.push(row('pub-new', 'PUBLISHED', { order: 2 }));
  const second = await request(app).get(`/api/projects/${PID}/content`);
  expect(second.body.map((r) => r.id)).toEqual(['pub0', 'pub-new']);
});

test('unpublish + publish of another row with tied timestamps never serves the old row', async () => {
  await request(app).get(`/api/projects/${PID}/content`);
  rows.find((r) => r.id === 'pub').status = 'DRAFT';
  rows.find((r) => r.id === 'draft').status = 'PUBLISHED';
  const res = await request(app).get(`/api/projects/${PID}/content`);
  expect(res.body.map((r) => r.id).sort()).toEqual(['draft', 'pub0']);
});

test('a poisoned redis entry is never read or served, under any key', async () => {
  redis.__store.set(`project:${PID}:public-content:v2`, JSON.stringify({ fingerprint: '2:2026-01-02T00:00:00.000Z', rows: [row('draft', 'DRAFT')] }));
  const res = await request(app).get(`/api/projects/${PID}/content`);
  expect(res.body.map((r) => r.id)).toEqual(['pub0', 'pub']);
  expect(redis.cache.get).not.toHaveBeenCalled();
  expect(redis.cache.set).not.toHaveBeenCalled();
});

test('responses are Cache-Control: no-store so revocation is immediate for browsers and CDNs', async () => {
  const res = await request(app).get(`/api/projects/${PID}/content`);
  expect(res.headers['cache-control']).toBe('no-store');
  expect(res.headers['cache-control']).not.toMatch(/public|max-age/);
});

test('every selected field exists on the real Prisma Content model', () => {
  const { Prisma } = require('@prisma/client');
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === 'Content');
  const scalars = new Set(model.fields.filter((f) => f.kind !== 'object').map((f) => f.name));
  const { PUBLIC_CONTENT_SELECT, PUBLIC_CONTENT_WHERE } = router._internals;
  for (const k of Object.keys(PUBLIC_CONTENT_SELECT)) expect(scalars.has(k)).toBe(true);
  for (const k of Object.keys(PUBLIC_CONTENT_WHERE('x'))) expect(scalars.has(k)).toBe(true);
  for (const banned of ['revisionOf', 'revisionNumber', 'revisedAt']) expect(PUBLIC_CONTENT_SELECT).not.toHaveProperty(banned);
});

test('unpublishing the project hides warm-cached content immediately', async () => {
  await request(app).get(`/api/projects/${PID}/content`);
  prisma.project.findUnique.mockResolvedValue({ id: PID, isPublished: false });
  expect((await request(app).get(`/api/projects/${PID}/content`)).status).toBe(404);
});

test('database failure returns generic 500', async () => {
  prisma.project.findUnique.mockRejectedValue(new Error('db password leak'));
  const res = await request(app).get(`/api/projects/${PID}/content`);
  expect(res.status).toBe(500);
  expect(JSON.stringify(res.body)).not.toMatch(/leak/);
});
