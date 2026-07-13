const express = require('express');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { requireAdmin } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');
const https = require('https');
const http = require('http');

const router = express.Router();

// All routes require admin authentication
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/sso/discover:
 *   post:
 *     summary: Discover OpenID configuration from well-known endpoint
 *     tags: [Admin SSO]
 *     security:
 *       - bearerAuth: []
 */
router.post('/discover', [
  body('issuer').trim().isURL().withMessage('Issuer must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid issuer URL',
        details: errors.array()
      });
    }

    let issuerUrl = req.body.issuer.trim();
    if (!issuerUrl.endsWith('/')) {
      issuerUrl += '/';
    }

    const wellKnownUrl = `${issuerUrl}.well-known/openid-configuration`;
    
    // Use Node's http/https modules to avoid CORS issues
    const url = new URL(wellKnownUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    const config = await new Promise((resolve, reject) => {
      const request = client.get(wellKnownUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch OpenID configuration: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Invalid JSON response from OpenID configuration endpoint'));
          }
        });
      });

      request.on('error', (error) => {
        reject(new Error(`Failed to fetch OpenID configuration: ${error.message}`));
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    // Validate required fields
    if (!config.issuer || !config.authorization_endpoint || !config.token_endpoint || !config.userinfo_endpoint) {
      return res.status(400).json({
        error: 'Invalid Configuration',
        message: 'OpenID configuration is missing required endpoints'
      });
    }

    // Return discovered configuration
    res.json({
      issuer: config.issuer,
      authorizationEndpoint: config.authorization_endpoint,
      tokenEndpoint: config.token_endpoint,
      userInfoEndpoint: config.userinfo_endpoint,
      scopes: config.scopes_supported ? config.scopes_supported.join(' ') : 'openid profile email',
      jwksUri: config.jwks_uri,
      endSessionEndpoint: config.end_session_endpoint,
      responseTypesSupported: config.response_types_supported,
      grantTypesSupported: config.grant_types_supported,
      codeChallengeMethodsSupported: config.code_challenge_methods_supported
    });
  } catch (error) {
    console.error('OpenID discovery error:', error);
    res.status(500).json({
      error: 'Discovery Failed',
      message: error.message || 'Failed to discover OpenID configuration'
    });
  }
});

/**
 * @swagger
 * /api/admin/sso/providers:
 *   get:
 *     summary: Get all SSO providers
 *     tags: [Admin SSO]
 *     security:
 *       - bearerAuth: []
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = await prisma.ssoProvider.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Don't return client secrets
    const safeProviders = providers.map(p => ({
      ...p,
      clientSecret: undefined
    }));

    res.json(safeProviders);
  } catch (error) {
    console.error('Get SSO providers error:', error);
    res.status(500).json({
      error: 'Failed to retrieve SSO providers',
      message: 'Unable to fetch providers'
    });
  }
});

/**
 * @swagger
 * /api/admin/sso/providers/{id}:
 *   get:
 *     summary: Get SSO provider details
 *     tags: [Admin SSO]
 *     security:
 *       - bearerAuth: []
 */
router.get('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await prisma.ssoProvider.findUnique({
      where: { id }
    });

    if (!provider) {
      return res.status(404).json({
        error: 'Provider Not Found',
        message: 'The requested SSO provider does not exist'
      });
    }

    // Decrypt client secret for editing
    const decryptedSecret = provider.clientSecret ? decrypt(provider.clientSecret) : '';

    res.json({
      ...provider,
      clientSecret: decryptedSecret
    });
  } catch (error) {
    console.error('Get SSO provider error:', error);
    res.status(500).json({
      error: 'Failed to retrieve SSO provider',
      message: 'Unable to fetch provider details'
    });
  }
});

/**
 * @swagger
 * /api/admin/sso/providers:
 *   post:
 *     summary: Create new SSO provider
 *     tags: [Admin SSO]
 *     security:
 *       - bearerAuth: []
 */
router.post('/providers', [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('providerId').trim().isLength({ min: 1 }).matches(/^[a-z0-9-]+$/).withMessage('Provider ID must be lowercase alphanumeric with hyphens'),
  body('clientId').trim().isLength({ min: 1 }).withMessage('Client ID is required'),
  body('clientSecret').trim().isLength({ min: 1 }).withMessage('Client Secret is required'),
  body('issuer').trim().isURL().withMessage('Issuer must be a valid URL'),
  body('authorizationEndpoint').trim().isURL().withMessage('Authorization endpoint must be a valid URL'),
  body('tokenEndpoint').trim().isURL().withMessage('Token endpoint must be a valid URL'),
  body('userInfoEndpoint').trim().isURL().withMessage('UserInfo endpoint must be a valid URL'),
  body('scopes').optional().trim(),
  body('enabled').optional().isBoolean(),
  body('icon').optional().trim(),
  body('buttonColor').optional().trim(),
  body('buttonText').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const {
      name,
      providerId,
      clientId,
      clientSecret,
      issuer,
      authorizationEndpoint,
      tokenEndpoint,
      userInfoEndpoint,
      scopes = 'openid profile email',
      enabled = true,
      icon,
      buttonColor,
      buttonText
    } = req.body;

    // Check if providerId already exists
    const existing = await prisma.ssoProvider.findUnique({
      where: { providerId }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Provider ID Already Exists',
        message: 'A provider with this ID already exists'
      });
    }

    // Store client secret unencrypted (for development)
    // const encryptedSecret = encrypt(clientSecret);

    const provider = await prisma.ssoProvider.create({
      data: {
        name,
        providerId,
        clientId,
        clientSecret: clientSecret,
        issuer,
        authorizationEndpoint,
        tokenEndpoint,
        userInfoEndpoint,
        scopes,
        enabled,
        icon,
        buttonColor,
        buttonText
      }
    });

    // Don't return client secret
    const { clientSecret: _, ...safeProvider } = provider;

    res.status(201).json(safeProvider);
  } catch (error) {
    console.error('Create SSO provider error:', error);
    res.status(500).json({
      error: 'Failed to create SSO provider',
      message: 'Unable to create provider'
    });
  }
});

/**
 * @swagger
 * /api/admin/sso/providers/{id}:
 *   put:
 *     summary: Update SSO provider
 *     tags: [Admin SSO]
 *     security:
 *       - bearerAuth: []
 */
router.put('/providers/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('clientId').optional().trim().isLength({ min: 1 }),
  body('clientSecret').optional().trim().isLength({ min: 1 }),
  body('issuer').optional().trim().isURL(),
  body('authorizationEndpoint').optional().trim().isURL(),
  body('tokenEndpoint').optional().trim().isURL(),
  body('userInfoEndpoint').optional().trim().isURL(),
  body('scopes').optional().trim(),
  body('enabled').optional().isBoolean(),
  body('icon').optional().trim(),
  body('buttonColor').optional().trim(),
  body('buttonText').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if provider exists
    const existing = await prisma.ssoProvider.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Provider Not Found',
        message: 'The requested SSO provider does not exist'
      });
    }

    // Store client secret unencrypted (for development)
    // if (updateData.clientSecret) {
    //   updateData.clientSecret = encrypt(updateData.clientSecret);
    // }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const provider = await prisma.ssoProvider.update({
      where: { id },
      data: updateData
    });

    // Don't return client secret
    const { clientSecret: _, ...safeProvider } = provider;

    res.json(safeProvider);
  } catch (error) {
    console.error('Update SSO provider error:', error);
    res.status(500).json({
      error: 'Failed to update SSO provider',
      message: 'Unable to update provider'
    });
  }
});

/**
 * @swagger
 * /api/admin/sso/providers/{id}:
 *   delete:
 *     summary: Delete SSO provider
 *     tags: [Admin SSO]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await prisma.ssoProvider.findUnique({
      where: { id }
    });

    if (!provider) {
      return res.status(404).json({
        error: 'Provider Not Found',
        message: 'The requested SSO provider does not exist'
      });
    }

    await prisma.ssoProvider.delete({
      where: { id }
    });

    res.json({ message: 'SSO provider deleted successfully' });
  } catch (error) {
    console.error('Delete SSO provider error:', error);
    res.status(500).json({
      error: 'Failed to delete SSO provider',
      message: 'Unable to delete provider'
    });
  }
});

module.exports = router;

