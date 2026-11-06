const express = require('express');
const request = require('supertest');

jest.mock('../services/core/database', () => ({
  prisma: {
    project: { findFirst: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    projectAccess: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    projectSiteConfig: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
  },
}));
jest.mock('../services/core/redis', () => ({
  cache: { get: jest.fn().mockResolvedValue(null), set: jest.fn(), del: jest.fn(), delPattern: jest.fn() },
}));

const { prisma } = require('../services/core/database');
const { authorizeProjectAccess } = require('./auth');
const projectsCrud = require('../routes/projects/projects-crud');
const projectAccessRoutes = require('../routes/projects/projectAccess');

const ATTACKER = 'u-attacker';
const MEMBER = 'u-member';
const ATTACKER_PROJECT = 'p-attacker';
const VICTIM_PROJECT = 'p-victim';

// Faithful to Prisma: an `undefined` filter value is dropped, not matched-as-null.
const matches = (row, where = {}) =>
  Object.entries(where).every(([k, v]) => v === undefined || row[k] === v);

const projects = [
  { id: ATTACKER_PROJECT, ownerId: ATTACKER },
  { id: VICTIM_PROJECT, ownerId: 'u-victim' },
];
let accessRows;

function appFor(userId, { mount = true } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = { id: userId }; next(); });
  if (mount) {
    app.use('/api/projects', projectsCrud);
    app.use('/api/projects', projectAccessRoutes);
  }
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  accessRows = [{ projectId: VICTIM_PROJECT, userId: MEMBER, role: 'VIEWER' }];
  prisma.project.findFirst.mockImplementation(async ({ where }) => projects.find((p) => matches(p, where)) || null);
  prisma.projectAccess.findFirst.mockImplementation(async ({ where }) => accessRows.find((a) => matches(a, where)) || null);
  prisma.project.delete.mockResolvedValue({});
  prisma.project.findUnique.mockResolvedValue({ id: VICTIM_PROJECT, ownerId: 'u-victim' });
  prisma.projectAccess.findMany.mockResolvedValue([]);
});

describe('authorizeProjectAccess on real /api/projects/:id routes', () => {
  test('owner of project A cannot DELETE project B (IDOR)', async () => {
    const res = await request(appFor(ATTACKER)).delete(`/api/projects/${VICTIM_PROJECT}`);
    expect(res.status).toBe(403);
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  test('owner of project A cannot read, list or add members of project B', async () => {
    const app = appFor(ATTACKER);
    expect((await request(app).get(`/api/projects/${VICTIM_PROJECT}/members`)).status).toBe(403);
    expect((await request(app).get(`/api/projects/${VICTIM_PROJECT}`)).status).toBe(403);
    const add = await request(app).post(`/api/projects/${VICTIM_PROJECT}/members`).send({ email: 'x@example.com', role: 'ADMIN' });
    expect(add.status).toBe(403);
    expect(prisma.projectAccess.create).not.toHaveBeenCalled();
  });

  test('the owner can still delete their own project', async () => {
    const res = await request(appFor(ATTACKER)).delete(`/api/projects/${ATTACKER_PROJECT}`);
    expect(res.status).toBe(204);
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: ATTACKER_PROJECT } });
  });

  test('an ADMIN member cannot delete (route requires OWNER)', async () => {
    accessRows = [{ projectId: VICTIM_PROJECT, userId: MEMBER, role: 'ADMIN' }];
    const res = await request(appFor(MEMBER)).delete(`/api/projects/${VICTIM_PROJECT}`);
    expect(res.status).toBe(403);
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  test('a VIEWER member may list members but not add them', async () => {
    const app = appFor(MEMBER);
    expect((await request(app).get(`/api/projects/${VICTIM_PROJECT}/members`)).status).toBe(200);
    const add = await request(app).post(`/api/projects/${VICTIM_PROJECT}/members`).send({ email: 'x@example.com', role: 'VIEWER' });
    expect(add.status).toBe(403);
  });
});

describe('authorizeProjectAccess unit semantics', () => {
  function probe(role, path, route, { mountPath = '/', body } = {}) {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: ATTACKER }; next(); });
    const router = express.Router();
    router.all(route, authorizeProjectAccess(role), (req, res) => res.json({ role: req.userRole }));
    app.use(mountPath, router);
    return request(app).post(mountPath === '/' ? path : mountPath + path).send(body || {});
  }

  test('nested /projects/:projectId/content/:contentId uses projectId, never contentId', async () => {
    const ok = await probe('EDITOR', `/projects/${ATTACKER_PROJECT}/content/${VICTIM_PROJECT}`, '/projects/:projectId/content/:contentId', { mountPath: '/api' });
    expect(ok.status).toBe(200);
    expect(ok.body.role).toBe('OWNER');
    const bad = await probe('EDITOR', `/projects/${VICTIM_PROJECT}/content/${ATTACKER_PROJECT}`, '/projects/:projectId/content/:contentId', { mountPath: '/api' });
    expect(bad.status).toBe(403);
  });

  test('a content-level /content/:id route is NOT treated as a project id (fails closed)', async () => {
    const res = await probe('VIEWER', `/content/${ATTACKER_PROJECT}`, '/content/:id', { mountPath: '/api' });
    expect(res.status).toBe(400);
    expect(prisma.project.findFirst).not.toHaveBeenCalled();
  });

  test('missing identifier fails closed without touching Prisma', async () => {
    const res = await probe('VIEWER', '/anything', '/anything');
    expect(res.status).toBe(400);
    expect(prisma.project.findFirst).not.toHaveBeenCalled();
    expect(prisma.projectAccess.findFirst).not.toHaveBeenCalled();
  });

  test('conflicting projectId param vs body projectId fails closed', async () => {
    const res = await probe('VIEWER', `/projects/${ATTACKER_PROJECT}/x`, '/projects/:projectId/x', { body: { projectId: VICTIM_PROJECT } });
    expect(res.status).toBe(400);
  });

  test('body projectId is used only when no route identifier exists (social-posts shape)', async () => {
    const own = await probe('VIEWER', '/social-posts', '/social-posts', { body: { projectId: ATTACKER_PROJECT } });
    expect(own.status).toBe(200);
    const other = await probe('VIEWER', '/social-posts', '/social-posts', { body: { projectId: VICTIM_PROJECT } });
    expect(other.status).toBe(403);
    const arr = await probe('VIEWER', '/social-posts', '/social-posts', { body: { projectId: [ATTACKER_PROJECT] } });
    expect(arr.status).toBe(400);
  });

  test('role hierarchy: EDITOR passes EDITOR/VIEWER, fails ADMIN/OWNER; unknown stored role denied', async () => {
    accessRows = [{ projectId: VICTIM_PROJECT, userId: ATTACKER, role: 'EDITOR' }];
    const r = (role) => probe(role, `/projects/${VICTIM_PROJECT}/x`, '/projects/:projectId/x');
    expect((await r('VIEWER')).status).toBe(200);
    expect((await r('EDITOR')).status).toBe(200);
    expect((await r('ADMIN')).status).toBe(403);
    expect((await r('OWNER')).status).toBe(403);
    accessRows = [{ projectId: VICTIM_PROJECT, userId: ATTACKER, role: 'SUPERUSER' }];
    expect((await r('VIEWER')).status).toBe(403);
  });

  test('an unknown required role is a programming error and fails closed', async () => {
    expect(() => authorizeProjectAccess('NOPE')).toThrow();
  });

  test('missing req.user is rejected, not a 500 crash', async () => {
    const app = express();
    app.get('/projects/:projectId/x', authorizeProjectAccess('VIEWER'), (_req, res) => res.json({}));
    expect((await request(app).get('/projects/p/x')).status).toBe(401);
  });
});
