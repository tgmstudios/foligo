const request = require('supertest');
const express = require('express');

const mockGenerateFinalContent = jest.fn();
jest.mock('../../services/ai-session', () => ({ generateFinalContent: mockGenerateFinalContent }));
jest.mock('../../services/core/database', () => ({ prisma: { content: { findFirst: jest.fn(), create: jest.fn() } } }));
jest.mock('../../services/core/redis', () => ({ cache: { del: jest.fn(), delPattern: jest.fn() } }));

const router = require('./voice-webhook');

describe('voice webhook', () => {
  test('does not run unauthenticated AI generation without a trusted user identity', async () => {
    const app = express().use(express.json()).use('/api/ai/voice-webhook', router);

    await request(app)
      .post('/api/ai/voice-webhook')
      .send({ summary: 'A project summary', projectId: 'project-1' })
      .expect(503, {
        error: 'AI Feature Unavailable',
        code: 'USER_SCOPED_AI_REQUIRED',
        message: 'Voice webhook content generation is unavailable because user-scoped AI access is required.',
      });

    expect(mockGenerateFinalContent).not.toHaveBeenCalled();
  });
});
