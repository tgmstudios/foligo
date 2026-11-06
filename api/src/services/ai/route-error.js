const USER_MODEL_ACCESS_CODES = new Set([
  'USER_MODEL_ACCESS_DENIED',
  'NO_AI_MODEL_ACCESS',
]);

function isUserModelAccessError(error) {
  return USER_MODEL_ACCESS_CODES.has(error?.code) || USER_MODEL_ACCESS_CODES.has(error?.cause?.code);
}

const POLICY_CODES = new Set(['AI_USAGE_LIMIT_EXCEEDED', 'AI_BILLING_RATES_REQUIRED', 'PERSONAL_AI_RECONNECT_REQUIRED']);
function findPolicyError(error) {
  if (!error) return null;
  if (POLICY_CODES.has(error.code)) return error;
  return findPolicyError(error.cause) || (Array.isArray(error.errors) ? error.errors.map(findPolicyError).find(Boolean) : null);
}
function isAiPolicyError(error) { return !!findPolicyError(error); }

function sendAiRouteError(res, error, fallbackError) {
  const policyError = findPolicyError(error);
  if (policyError) {
    res.status(policyError.code === 'AI_USAGE_LIMIT_EXCEEDED' ? 429 : 403).json({ error: policyError.message, message: policyError.message, code: policyError.code });
    return true;
  }
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

module.exports = { isAiPolicyError, isUserModelAccessError, sendAiRouteError, preflightSSEModelAccess };
