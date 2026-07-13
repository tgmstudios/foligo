/**
 * AI Provider Management Routes
 * Endpoints for listing, testing, and configuring AI providers.
 * Used by the GoApply extension and Foligo dashboard.
 */
const express = require('express');
const router = express.Router();
const ai = require('../services/ai/manager');
const { authenticateToken } = require('../middleware/auth');
const { prisma } = require('../services/database');
const { generateCoverLetter, generateCustomAnswer } = require('../services/goapply-content-generation');

/**
 * GET /api/ai/providers
 * List all configured AI providers with capabilities.
 * Public-ish (extension tokens can call this too).
 */
router.get('/providers', authenticateToken, async (req, res) => {
  try {
    const providers = await ai.listProviders();
    res.json({ providers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list providers', message: error.message });
  }
});

/** Safe runtime voice settings for the authenticated content creator UI. */
router.get('/voice-config', authenticateToken, async (_req, res) => {
  try {
    const provider = await prisma.voiceProvider.findFirst({
      where: { provider: 'elevenlabs', enabled: true },
      select: { provider: true, name: true, agentId: true, voiceId: true, modelId: true },
    });
    res.json({ voice: provider });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load voice configuration', message: error.message });
  }
});

/**
 * POST /api/ai/test-provider
 * Test a specific provider's connectivity.
 * Body: { type: 'opencode' }
 */
router.post('/test-provider', authenticateToken, async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: 'Missing "type" field' });

    const result = await ai.testProvider(type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Provider test failed', message: error.message });
  }
});

/**
 * POST /api/ai/generate-text
 * Generic AI text generation endpoint for GoApply.
 * Body: { prompt, provider?, temperature?, maxTokens? }
 */
router.post('/generate-text', authenticateToken, async (req, res) => {
  try {
    const { prompt, provider, temperature, maxTokens } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing "prompt" field' });

    const result = await ai.generateText(prompt, { provider, temperature, maxTokens });
    res.json({ text: result.text, reasoning: result.reasoning || undefined });
  } catch (error) {
    res.status(500).json({ error: 'Generation failed', message: error.message });
  }
});

/**
 * POST /api/ai/chat
 * Chat completion with optional tools.
 * Body: { messages, provider?, temperature?, maxTokens?, tools? }
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { messages, provider, temperature, maxTokens, tools } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'Missing "messages" array' });

    const result = await ai.generateChat(messages, { provider, temperature, maxTokens, tools });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Chat failed', message: error.message });
  }
});

// ─── GoApply-specific AI endpoints ────────────────────────────────

/**
 * POST /api/ai/cover-letter
 * Generate a tailored cover letter.
 * Body: { jobDescription, company, role, templateId?, provider? }
 */
router.post('/cover-letter', authenticateToken, async (req, res) => {
  try {
    const { jobDescription, company, role, templateId, provider } = req.body;
    if (!jobDescription || !company || !role) {
      return res.status(400).json({ error: 'Missing required fields: jobDescription, company, role' });
    }

    const result = await generateCoverLetter(ai, { jobDescription, company, role, provider });
    res.json({ text: result.text, reasoning: result.reasoning || undefined });
  } catch (error) {
    res.status(500).json({ error: 'Cover letter generation failed', message: error.message });
  }
});

/**
 * POST /api/ai/tailor-resume
 * Tailor resume content to a job description.
 * Body: { jobDescription, resumeText, provider? }
 */
router.post('/tailor-resume', authenticateToken, async (req, res) => {
  try {
    const { jobDescription, resumeText, provider } = req.body;
    if (!jobDescription || !resumeText) {
      return res.status(400).json({ error: 'Missing required fields: jobDescription, resumeText' });
    }

    const prompt = `You are a professional resume writer. Tailor the following resume to match this job description. Rewrite bullet points to emphasize relevant skills and achievements. Keep all factual information unchanged. Return only the revised resume text.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resumeText}

TAILORED RESUME:`;

    const result = await ai.generateText(prompt, { provider, temperature: 0.5, maxTokens: 8192 });
    res.json({ text: result.text, reasoning: result.reasoning || undefined });
  } catch (error) {
    res.status(500).json({ error: 'Resume tailoring failed', message: error.message });
  }
});

/**
 * POST /api/ai/email
 * Generate an outreach/follow-up email.
 * Body: { type: 'follow-up'|'thank-you'|'referral-request'|'recruiter-outreach', company, role, recipient?, provider? }
 */
router.post('/email', authenticateToken, async (req, res) => {
  try {
    const { type, company, role, recipient, provider } = req.body;
    if (!type || !company || !role) {
      return res.status(400).json({ error: 'Missing required fields: type, company, role' });
    }

    const templates = {
      'follow-up': `Write a polite follow-up email for a ${role} application at ${company}. I applied about a week ago and want to check on the status. Keep it brief (3-4 sentences) and professional.`,
      'thank-you': `Write a thank-you email after an interview for a ${role} position at ${company}. Express gratitude, mention something from the conversation, and reaffirm interest.`,
      'referral-request': `Write a polite email requesting a referral for a ${role} position at ${company}. The recipient is ${recipient || 'a connection'}. Be respectful of their time and make it easy for them to refer.`,
      'recruiter-outreach': `Write a cold outreach email to a recruiter at ${company} about the ${role} position. Introduce myself briefly, express interest, and ask for a chat. Professional and concise.`,
    };

    const prompt = templates[type] || templates['follow-up'];
    const result = await ai.generateText(prompt, { provider, temperature: 0.7, maxTokens: 2048 });
    res.json({ text: result.text, reasoning: result.reasoning || undefined });
  } catch (error) {
    res.status(500).json({ error: 'Email generation failed', message: error.message });
  }
});

/**
 * POST /api/ai/custom-answer
 * Generate an answer to a custom application question.
 * Body: { question, jobDescription, provider? }
 */
router.post('/custom-answer', authenticateToken, async (req, res) => {
  try {
    const { question, jobDescription, provider } = req.body;
    if (!question) return res.status(400).json({ error: 'Missing "question" field' });

    const result = await generateCustomAnswer(ai, { question, jobDescription, provider });
    res.json({ text: result.text, reasoning: result.reasoning || undefined });
  } catch (error) {
    res.status(500).json({ error: 'Answer generation failed', message: error.message });
  }
});

module.exports = router;
