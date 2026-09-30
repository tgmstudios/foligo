const USER_MODEL_ACCESS_CODES = new Set([
  'USER_MODEL_ACCESS_DENIED',
  'NO_AI_MODEL_ACCESS',
]);

function isUserModelAccessError(error) {
  return USER_MODEL_ACCESS_CODES.has(error?.code) || USER_MODEL_ACCESS_CODES.has(error?.cause?.code);
}

function sendAiRouteError(res, error, fallbackError) {
  const code = error?.code || error?.cause?.code;
  if (isUserModelAccessError(error)) {
    res.status(403).json({
      error: 'AI model access denied',
      code,
      message: error.message || error.cause?.message || 'You do not have access to an AI model.',
    });
    return true;
  }

  res.status(500).json({ ...fallbackError, message: error.message });
  return false;
}

/**
 * Validate the authenticated user's model selection before committing SSE
 * headers. This is intentionally caller-supplied AIManager access so the
 * helper has no alternate configuration path of its own.
 */
async function preflightSSEModelAccess(req, res, ai, {
  provider,
  modelType = 'QUICK',
  fallbackError = { error: 'AI request failed' },
} = {}) {
  try {
    await ai.preflightStreamAccess({ userId: req.user?.id, provider, modelType });
    return true;
  } catch (error) {
    sendAiRouteError(res, error, fallbackError);
    return false;
  }
}

module.exports = { isUserModelAccessError, sendAiRouteError, preflightSSEModelAccess };
