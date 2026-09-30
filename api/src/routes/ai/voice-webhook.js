const express = require('express');
const router = express.Router();

/**
 * POST /api/ai/voice-webhook
 *
 * This webhook remains public for its existing integration contract, but its
 * content-generation behavior is unavailable because a public webhook has no
 * trusted Foligo user identity to scope AI model grants.
 */
router.post('/', async (_req, res) => {
  return res.status(503).json({
    error: 'AI Feature Unavailable',
    code: 'USER_SCOPED_AI_REQUIRED',
    message: 'Voice webhook content generation is unavailable because user-scoped AI access is required.',
  });
});

module.exports = router;
