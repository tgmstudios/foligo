const express = require('express');
const {
  discovery,
  randomState,
  randomNonce,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  fetchUserInfo,
  ClientSecretPost
} = require('openid-client');
const { prisma } = require('../services/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Store session data in memory (in production, use Redis)
const sessionStore = new Map();

// Cache for discovered configurations (Configuration instances)
const configCache = new Map();

/**
 * Get or discover OpenID configuration for a provider
 */
async function getOpenIDConfig(provider, clientId, clientSecret) {
  const cacheKey = `${provider.id}-${clientId}`;
  
  // Check cache first
  if (configCache.has(cacheKey)) {
    const cached = configCache.get(cacheKey);
    // Cache for 1 hour
    if (Date.now() - cached.timestamp < 3600000) {
      return cached.config;
    }
    configCache.delete(cacheKey);
  }

  try {
    // Discover issuer configuration - returns a Configuration instance
    const config = await discovery(new URL(provider.issuer), clientId, clientSecret);
    
    // Cache the Configuration instance
    configCache.set(cacheKey, {
      config,
      timestamp: Date.now()
    });
    
    return config;
  } catch (discoverError) {
    console.error('OpenID discovery failed:', discoverError.message);
    throw new Error(`Failed to discover OpenID configuration: ${discoverError.message}`);
  }
}

/**
 * Clean up expired sessions (older than 10 minutes)
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  
  for (const [key, value] of sessionStore.entries()) {
    if (now - value.timestamp > maxAge) {
      sessionStore.delete(key);
    }
  }
}

// Clean up expired sessions every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

/**
 * Get the redirect URI for SSO callback
 */
function getRedirectUri(providerId) {
  // Use API_URL if set, otherwise construct from request
  const baseUrl = process.env.API_URL;
  
  const redirectUri = `${baseUrl}/api/auth/sso/callback/${providerId}`;
  return redirectUri;
}

/**
 * @swagger
 * /api/auth/sso/providers:
 *   get:
 *     summary: Get enabled SSO providers for login
 *     tags: [SSO Auth]
 */
router.get('/providers', async (req, res) => {
  try {
    // Check if SsoProvider model exists (in case migration hasn't been run)
    if (!prisma.ssoProvider) {
      return res.json([]);
    }

    const providers = await prisma.ssoProvider.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
        providerId: true,
        icon: true,
        buttonColor: true,
        buttonText: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(providers);
  } catch (error) {
    console.error('Get SSO providers error:', error);
    // If table doesn't exist yet, return empty array
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return res.json([]);
    }
    res.status(500).json({
      error: 'Failed to retrieve SSO providers',
      message: 'Unable to fetch providers'
    });
  }
});

/**
 * @swagger
 * /api/auth/sso/login/{providerId}:
 *   get:
 *     summary: Initiate SSO login
 *     tags: [SSO Auth]
 */
router.get('/login/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const redirectUrl = req.query.redirect || '/';

    // Check if SsoProvider model exists
    if (!prisma.ssoProvider) {
      return res.status(503).json({
        error: 'SSO Not Available',
        message: 'SSO providers are not configured yet'
      });
    }

    // Find provider
    const provider = await prisma.ssoProvider.findUnique({
      where: { providerId, enabled: true }
    });

    if (!provider) {
      return res.status(404).json({
        error: 'Provider Not Found',
        message: 'SSO provider not found or disabled'
      });
    }

    // Validate required fields
    if (!provider.clientId || !provider.clientSecret) {
      console.error('Provider missing credentials:', {
        id: provider.id,
        providerId: provider.providerId
      });
      return res.status(500).json({
        error: 'SSO Configuration Error',
        message: 'Provider credentials incomplete'
      });
    }

    // Get client secret (no decryption for now)
    const clientSecret = provider.clientSecret;

    // Get OpenID configuration (pass client ID and secret)
    const config = await getOpenIDConfig(provider, provider.clientId, clientSecret);

    // Generate state and nonce
    const state = randomState();
    const nonce = randomNonce();
    
    // Generate code verifier for PKCE
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

    // Determine redirect URI
    const redirectUri = getRedirectUri(providerId);

    // Store session data
    sessionStore.set(state, {
      providerId,
      redirectUrl,
      codeVerifier,
      nonce,
      timestamp: Date.now()
    });

    // Build authorization URL using openid-client v6 API
    const authUrl = buildAuthorizationUrl(config, {
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      scope: provider.scopes || 'openid profile email',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    res.redirect(authUrl.href);
  } catch (error) {
    console.error('SSO login error:', error);
    res.status(500).json({
      error: 'SSO Login Failed',
      message: error.message || 'Unable to initiate SSO login'
    });
  }
});

/**
 * @swagger
 * /api/auth/sso/callback/{providerId}:
 *   get:
 *     summary: Handle SSO callback
 *     tags: [SSO Auth]
 */
router.get('/callback/:providerId', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  try {
    const { providerId } = req.params;
    const params = req.query;

    // Check for error from provider
    if (params.error) {
      console.error('SSO provider error:', params.error, params.error_description);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(params.error)}`);
    }

    // Validate required parameters
    if (!params.code || !params.state) {
      return res.redirect(`${frontendUrl}/login?error=missing_parameters`);
    }

    // Verify state and get session data
    const sessionData = sessionStore.get(params.state);
    if (!sessionData) {
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    if (sessionData.providerId !== providerId) {
      return res.redirect(`${frontendUrl}/login?error=provider_mismatch`);
    }

    const { redirectUrl, codeVerifier, nonce } = sessionData;

    // Clean up session data
    sessionStore.delete(params.state);

    // Check if SsoProvider model exists
    if (!prisma.ssoProvider) {
      return res.redirect(`${frontendUrl}/login?error=sso_not_configured`);
    }

    // Find provider
    const provider = await prisma.ssoProvider.findUnique({
      where: { providerId }
    });

    if (!provider) {
      return res.redirect(`${frontendUrl}/login?error=provider_not_found`);
    }

    // Get client secret (no decryption for now)
    const clientSecret = provider.clientSecret;

    // Get OpenID configuration (pass client ID and secret)
    const config = await getOpenIDConfig(provider, provider.clientId, clientSecret);

    // Determine redirect URI (must match what was sent in login)
    const redirectUri = getRedirectUri(providerId);

    // Build the current URL (callback URL with query parameters)
    const currentUrl = new URL(`${redirectUri}?${new URLSearchParams(params).toString()}`);

    // Exchange authorization code for tokens using openid-client v6 API
    // Use ClientSecretPost authentication (sends credentials in POST body)
    const tokens = await authorizationCodeGrant(
      config,
      currentUrl,
      {
        pkceCodeVerifier: codeVerifier,
        expectedNonce: nonce,
        expectedState: params.state, // Pass the state we already validated
      },
      undefined,
      {
        clientAuthentication: ClientSecretPost,
      }
    );

    // Get user info
    let userInfo;
    
    // Try to get claims from ID token first (more efficient)
    if (tokens.claims) {
      userInfo = tokens.claims();
    } else if (tokens.access_token) {
      // Fallback to userinfo endpoint
      userInfo = await fetchUserInfo(config, tokens.access_token, nonce);
    }

    if (!userInfo || !userInfo.sub) {
      return res.redirect(`${frontendUrl}/login?error=userinfo_failed`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: {
        sso_provider_subject: {
          ssoProviderId: provider.id,
          ssoSubject: userInfo.sub
        }
      }
    });

    if (!user) {
      // Check if user with same email exists
      if (userInfo.email) {
        user = await prisma.user.findUnique({
          where: { email: userInfo.email }
        });

        if (user) {
          // Link SSO to existing user
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              ssoProviderId: provider.id,
              ssoSubject: userInfo.sub
            }
          });
        }
      }

      // Create new user if still doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: userInfo.email || `${userInfo.sub}@${provider.providerId}.sso`,
            name: userInfo.name || userInfo.preferred_username || userInfo.email || 'SSO User',
            ssoProviderId: provider.id,
            ssoSubject: userInfo.sub,
            password: null // No password for SSO users
          }
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`);
  } catch (error) {
    console.error('SSO callback error:', error);
    const errorMsg = error.message || 'callback_failed';
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
  }
});

module.exports = router;

