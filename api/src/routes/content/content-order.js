const express = require('express');
const { body } = require('express-validator');
const { prisma } = require('../../services/core/database');
const { cache } = require('../../services/core/redis');
const { authorizeProjectAccess } = require('../../middleware/auth');
const { handleValidation } = require('../../middleware/handle-validation');
const { getContentWithAccess, invalidateContentCache } = require('../../utils/content-access');

const router = express.Router();

/**
 * @swagger
 * /api/content/{id}/reorder:
 *   put:
 *     summary: Reorder content blocks
 *     tags: [CMS Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newOrder
 *             properties:
 *               newOrder:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Content reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Content not found
 */
router.put('/content/:id/reorder', [
  body('newOrder').isInt({ min: 0 }),
  handleValidation
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { newOrder } = req.body;

    const access = await getContentWithAccess(prisma, id, userId);

    if (!access) {
      return res.status(404).json({
        error: 'Content Not Found',
        message: 'The requested content block does not exist'
      });
    }

    if (!access.canEdit) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to reorder this content'
      });
    }

    // Update content order
    const content = await prisma.content.update({
      where: { id },
      data: { order: newOrder }
    });

    // Clear project and content caches
    await invalidateContentCache(cache, access.content.projectId);

    res.json(content);
  } catch (error) {
    console.error('Reorder content error:', error);
    res.status(500).json({
      error: 'Content Reorder Failed',
      message: 'Unable to reorder content block'
    });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/content/order:
 *   put:
 *     summary: Update post order for all posts in a project
 *     tags: [CMS Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order
 *             properties:
 *               order:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - contentId
 *                     - order
 *                   properties:
 *                     contentId:
 *                       type: string
 *                       format: uuid
 *                     order:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Post order updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.put('/projects/:projectId/content/order', [
  body('order').isArray().withMessage('Order must be an array'),
  body('order.*.contentId').isUUID().withMessage('Each order item must have a valid contentId'),
  body('order.*.order').isInt({ min: 0 }).withMessage('Each order item must have a valid order number'),
  handleValidation
], authorizeProjectAccess('EDITOR'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { order } = req.body;

    // Get all posts for this project (excluding revisions)
    const allPosts = await prisma.content.findMany({
      where: {
        projectId,
        status: { not: 'REVISION' },
        revisionOf: null
      },
      select: { id: true }
    });

    const postIds = allPosts.map(p => p.id);
    const orderContentIds = order.map(o => o.contentId);

    // Verify all content IDs belong to this project
    const invalidIds = orderContentIds.filter(id => !postIds.includes(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Some content IDs do not belong to this project',
        invalidIds
      });
    }

    // Use a transaction to update all orders atomically
    await prisma.$transaction(async (tx) => {
      // Delete existing post orders for this project
      await tx.postOrder.deleteMany({
        where: { projectId }
      });

      // Create new post orders
      await tx.postOrder.createMany({
        data: order.map(item => ({
          projectId,
          contentId: item.contentId,
          order: item.order
        }))
      });

      // Also update the order field in Content table for backward compatibility
      for (const item of order) {
        await tx.content.update({
          where: { id: item.contentId },
          data: { order: item.order }
        });
      }
    });

    // Clear project cache
    await cache.del(`project:${projectId}`);
    await cache.delPattern(`project:${projectId}:content*`);

    res.json({ success: true, message: 'Post order updated successfully' });
  } catch (error) {
    console.error('Update post order error:', error);
    res.status(500).json({
      error: 'Post Order Update Failed',
      message: 'Unable to update post order'
    });
  }
});

module.exports = router;
