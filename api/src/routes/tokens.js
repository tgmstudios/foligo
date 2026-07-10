const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All token management routes require authentication
router.use(authenticateToken);

// Token format: foligo_ + 48 random hex chars
// Example: foligo_a1b2c3d4e5f6...
const TOKEN_PREFIX = 'foligo_';
const TOKEN_HEX_LENGTH = 48;

/**
 * Generate a cryptographically secure API token.
 * Format: foligo_<48 hex chars>
 * Returns both the raw token and the SHA-256 hash + prefix (first 8 chars of hex part).
 */
function generateToken() {
  const randomBytes = crypto.randomBytes(TOKEN_HEX_LENGTH / 2); // 24 bytes = 48 hex chars
  const hexPart = randomBytes.toString('hex');
  const rawToken = `${TOKEN_PREFIX}${hexPart}`;
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const prefix = hexPart.substring(0, 8); // First 8 chars of the hex part
  return { rawToken, hash, prefix };
}

/**
 * Mask a token for display: show prefix and last 4 chars.
 * E.g., "foligo_a1b2c3d4..."
 */
function maskToken(prefix) {
  return `${TOKEN_PREFIX}${prefix}...`;
}

// =============================================================================
// GET /api/auth/tokens — List all API tokens for the authenticated user
// =============================================================================
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const tokens = await prisma.apiToken.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to include a masked display string
    const result = tokens.map((t) => ({
      id: t.id,
      name: t.name,
      masked: maskToken(t.prefix),
      prefix: t.prefix,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
    }));

    res.json({ tokens: result });
  } catch (error) {
    console.error('List tokens error:', error);
    res.status(500).json({
      error: 'Token Retrieval Failed',
      message: 'Unable to retrieve API tokens',
    });
  }
});

// =============================================================================
// POST /api/auth/tokens — Generate a new API token
// =============================================================================
router.post(
  '/',
  [body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Token name is required (1-100 chars)')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors.array(),
        });
      }

      const userId = req.user.id;
      const { name } = req.body;

      const { rawToken, hash, prefix } = generateToken();

      const token = await prisma.apiToken.create({
        data: {
          userId,
          name,
          prefix,
          hash,
        },
        select: {
          id: true,
          name: true,
          prefix: true,
          createdAt: true,
        },
      });

      // Return the raw token ONCE — it cannot be recovered later
      res.status(201).json({
        token: {
          id: token.id,
          name: token.name,
          prefix: token.prefix,
          createdAt: token.createdAt,
        },
        rawToken, // ⚠️ Only returned here — store it safely
      });
    } catch (error) {
      console.error('Create token error:', error);
      res.status(500).json({
        error: 'Token Creation Failed',
        message: 'Unable to create API token',
      });
    }
  }
);

// =============================================================================
// DELETE /api/auth/tokens — Revoke ALL API tokens for the authenticated user
// (must be defined BEFORE the /:id route to avoid matching "all" as an id)
// =============================================================================
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await prisma.apiToken.deleteMany({
      where: { userId },
    });

    res.json({
      message: 'All API tokens revoked',
      revokedCount: result.count,
    });
  } catch (error) {
    console.error('Revoke all tokens error:', error);
    res.status(500).json({
      error: 'Token Revocation Failed',
      message: 'Unable to revoke all API tokens',
    });
  }
});

// =============================================================================
// DELETE /api/auth/tokens/:id — Revoke a specific API token
// =============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify the token belongs to the user
    const token = await prisma.apiToken.findFirst({
      where: { id, userId },
    });

    if (!token) {
      return res.status(404).json({
        error: 'Token Not Found',
        message: 'API token not found or does not belong to you',
      });
    }

    await prisma.apiToken.delete({
      where: { id },
    });

    res.json({
      message: 'API token revoked successfully',
    });
  } catch (error) {
    console.error('Revoke token error:', error);
    res.status(500).json({
      error: 'Token Revocation Failed',
      message: 'Unable to revoke API token',
    });
  }
});

module.exports = router;
