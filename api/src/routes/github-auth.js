const express = require('express');
const crypto = require('crypto');
const { prisma } = require('../services/database');
const { encrypt } = require('../utils/encryption');
const { authenticateToken } = require('../middleware/auth');
const githubService = require('../services/github-service');

const router = express.Router();

const PROVIDER = 'github';
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
// Read-only for GitHub AI tools: only `repo`+`read:user` are requested, and
// api/src/services/github-service.js must never call a write endpoint with
// this token — classic GitHub OAuth tokens have no scope that enforces
// read-only access at GitHub's side.
const GITHUB_SCOPES = 'repo read:user';

// Maps OAuth `state` -> { userId, timestamp } while the user is off on GitHub's
// authorize page. Same Map + sweep shape as api/src/routes/sso-auth.js's
// sessionStore, needed because the callback is a public browser redirect with
// no Authorization header — the userId has to come from server-side state.
const stateStore = new Map();

function cleanupExpiredState() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  for (const [key, value] of stateStore.entries()) {
    if (now - value.timestamp > maxAge) {
      stateStore.delete(key);
    }
  }
}
setInterval(cleanupExpiredState, 5 * 60 * 1000);

function getRedirectUri() {
  if (process.env.GITHUB_OAUTH_REDIRECT_URI) return process.env.GITHUB_OAUTH_REDIRECT_URI;
  return `${process.env.API_URL}/api/integrations/github/callback`;
}

// =============================================================================
// POST /api/integrations/github/connect — start the OAuth flow (authenticated)
// Returns { authUrl } as JSON rather than redirecting, since the dashboard is
// a localStorage-JWT SPA and can't carry an Authorization header through a
// browser navigation.
// =============================================================================
router.post('/connect', authenticateToken, (req, res) => {
  if (!process.env.GITHUB_OAUTH_CLIENT_ID || !process.env.GITHUB_OAUTH_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'GitHub Integration Not Configured',
      message: 'GITHUB_OAUTH_CLIENT_ID/SECRET are not set',
    });
  }

  const state = crypto.randomBytes(24).toString('hex');
  stateStore.set(state, { userId: req.user.id, timestamp: Date.now() });

  const authUrl = new URL(GITHUB_AUTHORIZE_URL);
  authUrl.searchParams.set('client_id', process.env.GITHUB_OAUTH_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', getRedirectUri());
  authUrl.searchParams.set('scope', GITHUB_SCOPES);
  authUrl.searchParams.set('state', state);

  res.json({ authUrl: authUrl.href });
});

// =============================================================================
// GET /api/integrations/github/callback — GitHub redirects the browser here
// (public route — identity comes from the `state` lookup, not a header)
// =============================================================================
router.get('/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${frontendUrl}/settings?github=error&reason=${encodeURIComponent(oauthError)}`);
    }
    if (!code || !state) {
      return res.redirect(`${frontendUrl}/settings?github=error&reason=missing_parameters`);
    }

    const stateData = stateStore.get(state);
    if (!stateData) {
      return res.redirect(`${frontendUrl}/settings?github=error&reason=invalid_state`);
    }
    stateStore.delete(state);
    const { userId } = stateData;

    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: getRedirectUri(),
      }),
    });
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('GitHub token exchange failed:', tokenData.error, tokenData.error_description);
      return res.redirect(`${frontendUrl}/settings?github=error&reason=token_exchange_failed`);
    }

    const userResponse = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    const githubUser = await userResponse.json();

    if (!userResponse.ok || !githubUser.id) {
      console.error('GitHub /user lookup failed:', githubUser);
      return res.redirect(`${frontendUrl}/settings?github=error&reason=github_user_lookup_failed`);
    }

    await prisma.userIntegration.upsert({
      where: { userId_provider: { userId, provider: PROVIDER } },
      create: {
        userId,
        provider: PROVIDER,
        accessToken: encrypt(tokenData.access_token),
        tokenType: tokenData.token_type || 'bearer',
        scopes: (tokenData.scope || '').split(',').filter(Boolean),
        externalId: String(githubUser.id),
        externalLogin: githubUser.login,
        status: 'active',
        lastValidatedAt: new Date(),
      },
      update: {
        accessToken: encrypt(tokenData.access_token),
        tokenType: tokenData.token_type || 'bearer',
        scopes: (tokenData.scope || '').split(',').filter(Boolean),
        externalId: String(githubUser.id),
        externalLogin: githubUser.login,
        status: 'active',
        lastValidatedAt: new Date(),
      },
    });

    res.redirect(`${frontendUrl}/settings?github=connected`);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.redirect(`${frontendUrl}/settings?github=error&reason=callback_failed`);
  }
});

// =============================================================================
// GET /api/integrations/github/status — connection status (authenticated)
// =============================================================================
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const integration = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId: req.user.id, provider: PROVIDER } },
      select: { externalLogin: true, scopes: true, status: true, lastValidatedAt: true, createdAt: true },
    });

    if (!integration) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      login: integration.externalLogin,
      scopes: integration.scopes,
      status: integration.status,
      lastValidatedAt: integration.lastValidatedAt,
      connectedAt: integration.createdAt,
    });
  } catch (error) {
    console.error('GitHub status error:', error);
    res.status(500).json({ error: 'Status Check Failed', message: 'Unable to check GitHub connection status' });
  }
});

// =============================================================================
// DELETE /api/integrations/github — disconnect (authenticated)
// =============================================================================
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.userIntegration.deleteMany({ where: { userId, provider: PROVIDER } });
    await githubService.cleanupAllSessionsForUser(userId).catch((err) => {
      console.error('GitHub clone cleanup on disconnect failed (non-fatal):', err);
    });

    res.json({ message: 'GitHub account disconnected' });
  } catch (error) {
    console.error('GitHub disconnect error:', error);
    res.status(500).json({ error: 'Disconnect Failed', message: 'Unable to disconnect GitHub account' });
  }
});

module.exports = router;
