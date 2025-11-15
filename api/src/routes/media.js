const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../services/database');
const { uploadFile, deleteFile, getFileUrl, minioClient, BUCKET_NAME } = require('../services/minio');
const { authenticateToken, authorizeProjectAccess } = require('../middleware/auth');

const router = express.Router();

// Note: Public routes /media/:id/file and /media/:id/view are registered directly in index.js
// to ensure they're accessible without authentication

// Configure multer for memory storage (we'll upload directly to MinIO)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common image, video, audio, and document types
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      // Audio
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      // Documents
      'application/pdf',
      'text/plain',
      'application/json',
      'text/markdown',
      'text/html'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/media:
 *   post:
 *     summary: Upload media file to a project
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               altText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Media uploaded successfully
 */
router.post('/projects/:projectId/media', 
  authorizeProjectAccess('EDITOR'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Please provide a file to upload'
        });
      }

      const { projectId } = req.params;
      const { altText } = req.body;
      const userId = req.user.id;

      // Generate UUID-based object name
      const fileExtension = path.extname(req.file.originalname);
      const objectName = `${uuidv4()}${fileExtension}`;

      // Upload to MinIO
      await uploadFile(
        req.file.buffer,
        objectName,
        req.file.mimetype
      );

      // Generate proxied URL
      const API_URL = process.env.API_URL || req.protocol + '://' + req.get('host');

      // Save to database (we'll update the URL after creation)
      const media = await prisma.media.create({
        data: {
          userId,
          projectId,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          objectName,
          publicUrl: `${API_URL}/api/media/PLACEHOLDER/file`,
          altText: altText || null
        }
      });

      // Update with correct URL
      const correctPublicUrl = `${API_URL}/api/media/${media.id}/file`;
      const updatedMedia = await prisma.media.update({
        where: { id: media.id },
        data: { publicUrl: correctPublicUrl }
      });

      res.status(201).json(updatedMedia);
    } catch (error) {
      console.error('Upload media error:', error);
      res.status(500).json({
        error: 'Media Upload Failed',
        message: error.message || 'Unable to upload media file'
      });
    }
  }
);

/**
 * @swagger
 * /api/media:
 *   post:
 *     summary: Upload media file (user-level, not tied to project)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               altText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Media uploaded successfully
 */
router.post('/media',
  authenticateToken, 
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Please provide a file to upload'
        });
      }

      const { altText } = req.body;
      const userId = req.user.id;

      // Generate UUID-based object name
      const fileExtension = path.extname(req.file.originalname);
      const objectName = `${uuidv4()}${fileExtension}`;

      // Upload to MinIO
      await uploadFile(
        req.file.buffer,
        objectName,
        req.file.mimetype
      );

      // Generate proxied URL
      const API_URL = process.env.API_URL || req.protocol + '://' + req.get('host');

      // Save to database (we'll update the URL after creation)
      const media = await prisma.media.create({
        data: {
          userId,
          projectId: null,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          objectName,
          publicUrl: `${API_URL}/api/media/PLACEHOLDER/file`,
          altText: altText || null
        }
      });

      // Update with correct URL
      const correctPublicUrl = `${API_URL}/api/media/${media.id}/file`;
      const updatedMedia = await prisma.media.update({
        where: { id: media.id },
        data: { publicUrl: correctPublicUrl }
      });

      res.status(201).json(updatedMedia);
    } catch (error) {
      console.error('Upload media error:', error);
      res.status(500).json({
        error: 'Media Upload Failed',
        message: error.message || 'Unable to upload media file'
      });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/media:
 *   get:
 *     summary: List media files for a project
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.get('/projects/:projectId/media', 
  authorizeProjectAccess('VIEWER'),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { mimeType, limit = 50, offset = 0 } = req.query;

      const where = {
        projectId
      };

      if (mimeType) {
        where.mimeType = {
          startsWith: mimeType
        };
      }

      const [media, total] = await Promise.all([
        prisma.media.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset),
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.media.count({ where })
      ]);

      // Update URLs to use proxy
      const API_URL = process.env.API_URL || req.protocol + '://' + req.get('host');
      const mediaWithProxiedUrls = media.map(m => ({
        ...m,
        publicUrl: `${API_URL}/api/media/${m.id}/file`
      }));

      res.json({
        media: mediaWithProxiedUrls,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('List media error:', error);
      res.status(500).json({
        error: 'Media Retrieval Failed',
        message: 'Unable to retrieve media files'
      });
    }
  }
);

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: List media files for the current user
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.get('/media', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId, mimeType, limit = 50, offset = 0 } = req.query;

    const where = {
      userId
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (mimeType) {
      where.mimeType = {
        startsWith: mimeType
      };
    }

      const [media, total] = await Promise.all([
        prisma.media.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset),
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        prisma.media.count({ where })
      ]);

      // Update URLs to use proxy
      const API_URL = process.env.API_URL || req.protocol + '://' + req.get('host');
      const mediaWithProxiedUrls = media.map(m => ({
        ...m,
        publicUrl: `${API_URL}/api/media/${m.id}/file`
      }));

      res.json({
        media: mediaWithProxiedUrls,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
  } catch (error) {
    console.error('List media error:', error);
    res.status(500).json({
      error: 'Media Retrieval Failed',
      message: 'Unable to retrieve media files'
    });
  }
});

/**
 * @swagger
 * /api/media/{id}:
 *   get:
 *     summary: Get a specific media file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.get('/media/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!media) {
      return res.status(404).json({
        error: 'Media Not Found',
        message: 'The requested media file does not exist'
      });
    }

    // Check if user has access (owner or project member)
    if (media.userId !== userId && media.projectId) {
      // Check project access
      const project = await prisma.project.findFirst({
        where: {
          id: media.projectId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId
                }
              }
            }
          ]
        }
      });

      if (!project) {
        return res.status(403).json({
          error: 'Access Denied',
          message: 'You do not have access to this media file'
        });
      }
    } else if (media.userId !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have access to this media file'
      });
    }

    // Update URL to use proxy
    const API_URL = process.env.API_URL || req.protocol + '://' + req.get('host');
    const mediaWithProxiedUrl = {
      ...media,
      publicUrl: `${API_URL}/api/media/${media.id}/file`
    };

    res.json(mediaWithProxiedUrl);
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({
      error: 'Media Retrieval Failed',
      message: 'Unable to retrieve media file'
    });
  }
});

/**
 * @swagger
 * /api/media/{id}:
 *   put:
 *     summary: Update media metadata (alt text, etc.)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.put('/media/:id', authenticateToken, [
  body('altText').optional().trim()
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
    const userId = req.user.id;
    const { altText } = req.body;

    const media = await prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      return res.status(404).json({
        error: 'Media Not Found',
        message: 'The requested media file does not exist'
      });
    }

    // Only owner can update
    if (media.userId !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only update your own media files'
      });
    }

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        altText: altText !== undefined ? altText : media.altText
      }
    });

    // Update URL to use proxy
    const API_URL = process.env.API_URL || req.protocol + '://' + req.get('host');
    const mediaWithProxiedUrl = {
      ...updatedMedia,
      publicUrl: `${API_URL}/api/media/${updatedMedia.id}/file`
    };

    res.json(mediaWithProxiedUrl);
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({
      error: 'Media Update Failed',
      message: 'Unable to update media file'
    });
  }
});

/**
 * @swagger
 * /api/media/{id}:
 *   delete:
 *     summary: Delete a media file
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/media/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const media = await prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      return res.status(404).json({
        error: 'Media Not Found',
        message: 'The requested media file does not exist'
      });
    }

    // Only owner can delete
    if (media.userId !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only delete your own media files'
      });
    }

    // Delete from MinIO
    try {
      await deleteFile(media.objectName);
    } catch (error) {
      console.error('Error deleting file from MinIO:', error);
      // Continue with database deletion even if MinIO deletion fails
    }

    // Delete from database
    await prisma.media.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      error: 'Media Deletion Failed',
      message: 'Unable to delete media file'
    });
  }
});

module.exports = router;

