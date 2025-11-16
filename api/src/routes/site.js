const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/site/{subdomain}:
 *   get:
 *     summary: Get site data for a subdomain
 *     tags: [Site]
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *         description: The subdomain of the site
 *     responses:
 *       200:
 *         description: Site data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     subdomain:
 *                       type: string
 *                     isPublished:
 *                       type: boolean
 *                 siteConfig:
 *                   type: object
 *                   properties:
 *                     siteName:
 *                       type: string
 *                     siteDescription:
 *                       type: string
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *                     accentColor:
 *                       type: string
 *                     backgroundColor:
 *                       type: string
 *                     textColor:
 *                       type: string
 *                     indexLayout:
 *                       type: string
 *                     archiveLayout:
 *                       type: string
 *                     singleLayout:
 *                       type: string
 *                     metaTitle:
 *                       type: string
 *                     metaDescription:
 *                       type: string
 *                     favicon:
 *                       type: string
 *                 content:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       excerpt:
 *                         type: string
 *                       contentType:
 *                         type: string
 *                       isPublished:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Site not found
 *       500:
 *         description: Server error
 */
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Find project by subdomain
    const project = await prisma.project.findUnique({
      where: { subdomain },
      include: {
        siteConfig: true,
        content: {
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            contentType: true,
            content: true,
            metadata: true,
            status: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (!project.isPublished) {
      return res.status(404).json({ error: 'Site not published' });
    }

    // Group content by type for easier frontend consumption
    // Map status to isPublished for backward compatibility
    const contentWithPublished = project.content.map(c => ({
      ...c,
      isPublished: c.status === 'PUBLISHED'
    }));
    
    const contentByType = {
      projects: contentWithPublished.filter(c => c.contentType === 'PROJECT'),
      blogs: contentWithPublished.filter(c => c.contentType === 'BLOG'),
      experiences: contentWithPublished.filter(c => c.contentType === 'EXPERIENCE'),
      other: contentWithPublished.filter(c => !['PROJECT', 'BLOG', 'EXPERIENCE'].includes(c.contentType))
    };

    // Debug: Log the siteConfig being returned
    console.log('Site Config Data:', {
      hasSiteConfig: !!project.siteConfig,
      profileImage: project.siteConfig?.profileImage,
      profileName: project.siteConfig?.profileName,
      profileBio: project.siteConfig?.profileBio
    });

    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        subdomain: project.subdomain,
        isPublished: project.isPublished
      },
      siteConfig: project.siteConfig || {
        siteName: project.name,
        siteDescription: project.description,
        profileName: project.name,
        profileBio: project.description,
        profileImage: null,
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        indexLayout: 'grid',
        archiveLayout: 'list',
        singleLayout: 'standard'
      },
      content: contentByType
    });
  } catch (error) {
    console.error('Error fetching site data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/site/{subdomain}/content/{slug}:
 *   get:
 *     summary: Get full content by slug
 *     tags: [Site]
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *         description: The subdomain of the site
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the content
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 excerpt:
 *                   type: string
 *                 contentType:
 *                   type: string
 *                 data:
 *                   type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 */
router.get('/:subdomain/content/:slug', async (req, res) => {
  try {
    const { subdomain, slug } = req.params;

    // Find project by subdomain
    const project = await prisma.project.findUnique({
      where: { subdomain },
      select: { id: true, isPublished: true }
    });

    if (!project || !project.isPublished) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Find content by slug
    const content = await prisma.content.findFirst({
      where: {
        projectId: project.id,
        slug: slug,
        status: 'PUBLISHED'
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Map status to isPublished for backward compatibility
    res.json({
      ...content,
      isPublished: content.status === 'PUBLISHED'
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
