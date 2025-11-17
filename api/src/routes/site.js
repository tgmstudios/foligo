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
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items:
 *                         type: object
 *                     blogs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     experiences:
 *                       type: array
 *                       items:
 *                         type: object
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: object
 *                     other:
 *                       type: array
 *                       items:
 *                         type: object
 *                 contentLinks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       sourceId:
 *                         type: string
 *                       targetId:
 *                         type: string
 *                       sourceType:
 *                         type: string
 *                       targetType:
 *                         type: string
 *                       linkType:
 *                         type: string
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
            updatedAt: true,
            // Type-specific fields
            startDate: true,
            endDate: true,
            isOngoing: true,
            featuredImage: true,
            projectLinks: true,
            contributors: true,
            experienceCategory: true,
            location: true,
            locationType: true,
            // Relationships
            tags: {
              select: {
                id: true,
                name: true,
                category: true
              }
            },
            linkedSkills: {
              select: {
                id: true,
                name: true,
                category: true
              }
            },
            roles: {
              select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                isCurrent: true,
                skills: {
                  select: {
                    id: true,
                    name: true,
                    category: true
                  }
                }
              },
              orderBy: { startDate: 'desc' }
            }
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

    // Get all content IDs for fetching content links
    const contentIds = project.content.map(c => c.id);

    // Fetch content links for all published content
    let contentLinks = [];
    if (contentIds.length > 0) {
      contentLinks = await prisma.contentLink.findMany({
        where: {
          OR: [
            { sourceId: { in: contentIds }, sourceType: 'content' },
            { targetId: { in: contentIds }, targetType: 'content' }
          ]
        },
        select: {
          id: true,
          sourceId: true,
          targetId: true,
          sourceType: true,
          targetType: true,
          linkType: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
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
      skills: contentWithPublished.filter(c => c.contentType === 'SKILL'),
      other: contentWithPublished.filter(c => !['PROJECT', 'BLOG', 'EXPERIENCE', 'SKILL'].includes(c.contentType))
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
      content: contentByType,
      contentLinks: contentLinks
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
 *                 content:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                 linkedSkills:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 featuredImage:
 *                   type: string
 *                 projectLinks:
 *                   type: object
 *                 contributors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 experienceCategory:
 *                   type: string
 *                 location:
 *                   type: string
 *                 locationType:
 *                   type: string
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                 contentLinks:
 *                   type: array
 *                   items:
 *                     type: object
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

    // Find content by slug with all relationships
    const content = await prisma.content.findFirst({
      where: {
        projectId: project.id,
        slug: slug,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        projectId: true,
        type: true,
        contentType: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        metadata: true,
        order: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Type-specific fields
        startDate: true,
        endDate: true,
        isOngoing: true,
        featuredImage: true,
        projectLinks: true,
        contributors: true,
        experienceCategory: true,
        location: true,
        locationType: true,
        // Relationships
        tags: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        linkedSkills: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        roles: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            skills: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          },
          orderBy: { startDate: 'desc' }
        }
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Get content links for this content item
    const contentLinks = await prisma.contentLink.findMany({
      where: {
        OR: [
          { sourceId: content.id, sourceType: 'content' },
          { targetId: content.id, targetType: 'content' }
        ]
      },
      select: {
        id: true,
        sourceId: true,
        targetId: true,
        sourceType: true,
        targetType: true,
        linkType: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map status to isPublished for backward compatibility
    res.json({
      ...content,
      isPublished: content.status === 'PUBLISHED',
      contentLinks: contentLinks
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
