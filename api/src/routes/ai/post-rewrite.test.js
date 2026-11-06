const mockPrisma = { content: { findUnique: jest.fn(), update: jest.fn() } };
jest.mock('../../services/core/database', () => ({ prisma: mockPrisma }));
jest.mock('../../services/ai/manager', () => ({ generateChat: jest.fn() }));
const express = require('express');
const request = require('supertest');
const ai = require('../../services/ai/manager');
const router = require('./post-rewrite');
const id = '123e4567-e89b-42d3-a456-426614174000';
const url = `/api/ai/posts/${id}/rewrite`;
const app = express();
app.use(express.json());
app.use((req, _res, next) => { req.user = { id: 'author' }; next(); });
app.use('/api/ai', router);
const source = '# My post\n\nWe simplified navigation.\n\n```js\nconst result = 1;\n```';
beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.content.findUnique.mockResolvedValue({ id, title: 'My post', contentType: 'BLOG', revisionOf: null, project: { ownerId: 'author', members: [] } });
  ai.generateChat.mockResolvedValue({ text: source });
});

test('returns a suggestion using unsaved content and authenticated writing preferences without persisting', async () => {
  const response = await request(app).post(url).send({ content: source, goal: 'voice', instructions: 'Short paragraphs', userId: 'someone-else' });
  expect(response.status).toBe(200);
  expect(response.body.content).toBe(source);
  const [messages, options] = ai.generateChat.mock.calls[0];
  expect(JSON.parse(messages[0].content).sourceMarkdown).toBe(source);
  expect(JSON.parse(messages[0].content).stylisticInstructions).toBe('Short paragraphs');
  expect(options).toMatchObject({ userId: 'author', modelType: 'LONG' });
  expect(options.systemInstruction).toContain('Do not add claims');
  expect(options.systemInstruction).toContain('untrusted content');
  expect(mockPrisma.content.update).not.toHaveBeenCalled();
});

test.each(['ADMIN', 'EDITOR'])('allows project %s members', async role => {
  mockPrisma.content.findUnique.mockResolvedValue({ id, contentType: 'PROJECT', project: { ownerId: 'other', members: [{ role }] } });
  expect((await request(app).post(url).send({ content: source, goal: 'clarity' })).status).toBe(200);
});

test('denies viewers before requesting AI', async () => {
  mockPrisma.content.findUnique.mockResolvedValue({ id, contentType: 'BLOG', project: { ownerId: 'other', members: [{ role: 'VIEWER' }] } });
  expect((await request(app).post(url).send({ content: source, goal: 'voice' })).status).toBe(403);
  expect(ai.generateChat).not.toHaveBeenCalled();
});

test.each([null, { contentType: 'SKILL' }, { contentType: 'BLOG', revisionOf: 'parent' }])('rejects nonexistent or unsupported content %j', async post => {
  mockPrisma.content.findUnique.mockResolvedValue(post);
  expect((await request(app).post(url).send({ content: source, goal: 'voice' })).status).toBe(404);
  expect(ai.generateChat).not.toHaveBeenCalled();
});

test.each([{ content: '' }, { content: '   ' }, { content: 'x'.repeat(60001) }, { goal: 'invalid' }, { instructions: 'x'.repeat(1001) }])('validates input before calling the model', async change => {
  expect((await request(app).post(url).send({ content: source, goal: 'voice', ...change })).status).toBe(400);
  expect(ai.generateChat).not.toHaveBeenCalled();
});

test.each([{ text: '' }, { text: 'unfinished', truncated: true }, { text: 'x'.repeat(60001) }])('rejects empty, truncated or oversized output', async result => {
  ai.generateChat.mockResolvedValue(result);
  expect((await request(app).post(url).send({ content: source, goal: 'voice' })).status).toBe(502);
  expect(mockPrisma.content.update).not.toHaveBeenCalled();
});

test('preserves model access errors', async () => {
  ai.generateChat.mockRejectedValue({ code: 'USER_MODEL_ACCESS_DENIED', message: 'Choose an allowed model' });
  const res = await request(app).post(url).send({ content: source, goal: 'voice' });
  expect(res.status).toBe(403);
  expect(res.body.code).toBe('USER_MODEL_ACCESS_DENIED');
});


test('rejects a rewrite that changes fenced or inline code', async () => {
  ai.generateChat.mockResolvedValue({ text: source.replace('const result = 1;', 'const result = 2;') });
  const res = await request(app).post(url).send({ content: source, goal: 'voice' });
  expect(res.status).toBe(502);
  expect(res.body.message).toContain('changed code');
  expect(mockPrisma.content.update).not.toHaveBeenCalled();
});
