const express = require('express');
const { body } = require('express-validator');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authorizeProjectAccess } = require('../middleware/auth');
const { handleValidation } = require('../middleware/handle-validation');

const router = express.Router();

/**
 * @swagger
 * /api/projects/{id}/site-config:
 *   get:
 *     summary: Get site configuration for a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Site configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 siteName:
 *                   type: string
 *                 siteDescription:
 *                   type: string
 *                 primaryColor:
 *                   type: string
 *                 secondaryColor:
 *                   type: string
 *                 accentColor:
 *                   type: string
 *                 backgroundColor:
 *                   type: string
 *                 textColor:
 *                   type: string
 *                 indexLayout:
 *                   type: string
 *                 archiveLayout:
 *                   type: string
 *                 singleLayout:
 *                   type: string
 *                 metaTitle:
 *                   type: string
 *                 metaDescription:
 *                   type: string
 *                 favicon:
 *                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.get('/:id/site-config', authorizeProjectAccess('VIEWER'), async (req, res) => {
  try {
    const projectId = req.params.id;

    const siteConfig = await prisma.siteConfig.findUnique({
      where: { projectId }
    });

    if (!siteConfig) {
      // Create default site config if it doesn't exist
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, description: true }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const newSiteConfig = await prisma.siteConfig.create({
        data: {
          projectId,
          siteName: project.name,
          siteDescription: project.description
        }
      });

      return res.json(newSiteConfig);
    }

    res.json(siteConfig);
  } catch (error) {
    console.error('Error fetching site config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/projects/{id}/site-config:
 *   put:
 *     summary: Update site configuration for a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               siteName:
 *                 type: string
 *               siteDescription:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *               accentColor:
 *                 type: string
 *               backgroundColor:
 *                 type: string
 *               textColor:
 *                 type: string
 *               indexLayout:
 *                 type: string
 *                 enum: [grid, list, masonry]
 *               archiveLayout:
 *                 type: string
 *                 enum: [grid, list, masonry]
 *               singleLayout:
 *                 type: string
 *                 enum: [standard, wide, minimal]
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               favicon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Site configuration updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.put('/:id/site-config', [
  authorizeProjectAccess('EDITOR'),
  body('siteName').optional().trim(),
  body('siteDescription').optional().trim(),
  body('primaryColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('secondaryColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('accentColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('backgroundColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('textColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
  body('indexLayout').optional().isIn(['grid', 'list', 'masonry']),
  body('archiveLayout').optional().isIn(['grid', 'list', 'masonry']),
  body('singleLayout').optional().isIn(['standard', 'wide', 'minimal']),
  body('metaTitle').optional().trim(),
  body('metaDescription').optional().trim(),
  body('favicon').optional().trim(),
  handleValidation
], async (req, res) => {
  try {
    const projectId = req.params.id;
    const updateData = req.body;

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const siteConfig = await prisma.siteConfig.upsert({
      where: { projectId },
      update: {
        ...updateData,
        layoutConfig: updateData.layoutConfig || {}
      },
      create: {
        projectId,
        ...updateData,
        layoutConfig: updateData.layoutConfig || {}
      }
    });

    // Clear project cache
    await cache.del(`project:${projectId}`);

    res.json(siteConfig);
  } catch (error) {
    console.error('Error updating site config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/projects/{id}/publish:
 *   post:
 *     summary: Publish or unpublish a project site
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - isPublished
 *             properties:
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Project publish status updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.post('/:id/publish', [
  authorizeProjectAccess('ADMIN'),
  body('isPublished').isBoolean(),
  handleValidation
], async (req, res) => {
  try {
    const projectId = req.params.id;
    const { isPublished } = req.body;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { isPublished },
      select: {
        id: true,
        name: true,
        subdomain: true,
        isPublished: true
      }
    });

    // Clear project cache
    await cache.del(`project:${projectId}`);

    res.json({
      message: `Project ${isPublished ? 'published' : 'unpublished'} successfully`,
      project
    });
  } catch (error) {
    console.error('Error updating publish status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
