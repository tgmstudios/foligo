const express = require('express');
const { prisma } = require('../services/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalProjects, totalContent, recentUsers, recentProjects] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.content.count({ where: { revisionOf: null } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          subdomain: true,
          createdAt: true,
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProjects,
        totalContent
      },
      recentUsers,
      recentProjects
    });
  } catch (error) {
    console.error('Admin get stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: 'Unable to fetch dashboard statistics'
    });
  }
});

module.exports = router;
