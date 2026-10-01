const express = require('express');
const { body, param, query } = require('express-validator');
const { prisma } = require('../../services/core/database');
const { cache } = require('../../services/core/redis');
const { requireAdmin } = require('../../middleware/auth');
const { handleValidation } = require('../../middleware/handle-validation');
const { paginate, buildPaginationResponse } = require('../../utils/pagination');
const { buildSearchWhere } = require('../../utils/search-where');

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAdmin);

function safeAiModel(model) {
  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    providerType: model.providerType,
    modelType: model.modelType,
    enabled: model.enabled,
  };
}

function safeAiModelGrant(grant) {
  return {
    id: grant.id,
    aiModelId: grant.aiModelId,
    createdAt: grant.createdAt,
    aiModel: safeAiModel(grant.aiModel),
  };
}

const safeAiModelGrantSelect = {
  id: true,
  aiModelId: true,
  createdAt: true,
  aiModel: {
    select: {
      id: true,
      slug: true,
      name: true,
      providerType: true,
      modelType: true,
      enabled: true,
    },
  },
};

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  handleValidation
], async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req);
    const search = req.query.search || '';

    const where = buildSearchWhere(search, ['name', 'email']);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          hasCompletedOnboarding: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projectsOwned: true,
              projectAccess: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: buildPaginationResponse(total, page, limit)
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: 'Unable to fetch users'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/ai-model-catalog:
 *   get:
 *     summary: List safe AI model metadata for user-grant assignment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Model catalog without credentials or provider configuration secrets
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin privileges required
 */
router.get('/users/ai-model-catalog', async (_req, res) => {
  try {
    const [models, disabledProviders] = await Promise.all([
      prisma.aiModel.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          providerType: true,
          modelType: true,
          enabled: true,
        },
        orderBy: [{ modelType: 'asc' }, { name: 'asc' }],
      }),
      prisma.aiProviderConfig.findMany({
        where: { enabled: false },
        select: { providerType: true },
      }),
    ]);
    const disabledProviderTypes = new Set(disabledProviders.map(({ providerType }) => providerType));
    res.json({
      models: models.map(model => ({
        ...safeAiModel(model),
        providerDisabled: disabledProviderTypes.has(model.providerType),
      })),
    });
  } catch (error) {
    console.error('Admin get AI model catalog error:', error);
    res.status(500).json({ error: 'Failed to retrieve AI model catalog' });
  }
});

const MAX_MODEL_IDS_PER_USER = 100;
const GRANT_REPLACEMENT_MAX_ATTEMPTS = 3;

function isTransactionConflict(error) {
  return error && error.code === 'P2034';
}

/**
 * @swagger
 * /api/admin/users/{id}/ai-model-grants:
 *   put:
 *     summary: Replace all AI model grants for a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [modelIds]
 *             properties:
 *               modelIds:
 *                 type: array
 *                 maxItems: 100
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Replacement completed; returns safe current grants only
 *       400:
 *         description: Invalid user/model identifier, too many model IDs, or unknown model
 *       404:
 *         description: User not found
 */
router.put('/users/:id/ai-model-grants', [
  param('id').isUUID(),
  body('modelIds').isArray({ max: MAX_MODEL_IDS_PER_USER }),
  body('modelIds.*').isUUID(),
  handleValidation,
], async (req, res) => {
  const { id: userId } = req.params;
  const modelIds = [...new Set(req.body.modelIds)];

  try {
    let result;
    for (let attempt = 0; attempt < GRANT_REPLACEMENT_MAX_ATTEMPTS; attempt += 1) {
      try {
        result = await prisma.$transaction(async tx => {
          const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
          if (!user) return { status: 404 };

          const models = await tx.aiModel.findMany({
            where: { id: { in: modelIds } },
            select: { id: true },
          });
          if (models.length !== modelIds.length) return { status: 400 };

          const existingGrants = await tx.userAiModelGrant.findMany({
            where: { userId },
            select: { aiModelId: true },
          });
          const existingModelIds = new Set(existingGrants.map(grant => grant.aiModelId));
          const desiredModelIds = new Set(modelIds);
          const obsoleteModelIds = [...existingModelIds].filter(modelId => !desiredModelIds.has(modelId));
          const missingModelIds = modelIds.filter(modelId => !existingModelIds.has(modelId));

          if (obsoleteModelIds.length) {
            await tx.userAiModelGrant.deleteMany({
              where: { userId, aiModelId: { in: obsoleteModelIds } },
            });
          }
          if (missingModelIds.length) {
            await tx.userAiModelGrant.createMany({
              data: missingModelIds.map(aiModelId => ({ userId, aiModelId })),
              skipDuplicates: true,
            });
          }

          const aiModelGrants = await tx.userAiModelGrant.findMany({
            where: { userId },
            select: safeAiModelGrantSelect,
            orderBy: { createdAt: 'asc' },
          });
          return { status: 200, aiModelGrants };
        }, { isolationLevel: 'Serializable' });
        break;
      } catch (error) {
        if (!isTransactionConflict(error) || attempt === GRANT_REPLACEMENT_MAX_ATTEMPTS - 1) throw error;
      }
    }

    if (result.status === 404) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'The requested user does not exist',
      });
    }
    if (result.status === 400) return res.status(400).json({ error: 'Unknown AI model id' });
    res.json({ aiModelGrants: result.aiModelGrants.map(safeAiModelGrant) });
  } catch (error) {
    console.error('Admin replace user AI model grants error:', error);
    res.status(500).json({ error: 'Failed to replace AI model grants' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true,
        projectsOwned: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            isPublished: true,
            createdAt: true,
            _count: {
              select: {
                content: true,
                members: true
              }
            }
          }
        },
        projectAccess: {
          select: {
            id: true,
            role: true,
            project: {
              select: {
                id: true,
                name: true,
                subdomain: true,
                isPublished: true
              }
            }
          }
        },
        aiModelGrants: {
          select: safeAiModelGrantSelect,
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            projectsOwned: true,
            projectAccess: true,
            media: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'The requested user does not exist'
      });
    }

    res.json({
      ...user,
      aiModelGrants: user.aiModelGrants.map(grant => ({
        ...grant,
        aiModel: safeAiModel(grant.aiModel),
      })),
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user',
      message: 'Unable to fetch user details'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/users/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('isAdmin').optional().isBoolean(),
  body('hasCompletedOnboarding').optional().isBoolean(),
  handleValidation
], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isAdmin, hasCompletedOnboarding } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'The requested user does not exist'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }
        }
      });

      if (emailExists) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'A user with this email already exists'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (hasCompletedOnboarding !== undefined) updateData.hasCompletedOnboarding = hasCompletedOnboarding;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Clear user cache
    await cache.del(`user:${id}`);
    await cache.del(`user:public:${id}`);

    res.json(updatedUser);
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'Unable to update user'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot Delete Self',
        message: 'You cannot delete your own account'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'The requested user does not exist'
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    // Clear user cache
    await cache.del(`user:${id}`);
    await cache.del(`user:public:${id}`);
    await cache.del(`user:projects:${id}`);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'Unable to delete user'
    });
  }
});

module.exports = router;
