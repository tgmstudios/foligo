const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common image, video, and document types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [File Upload]
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
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: Project ID to associate the file with
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 url:
 *                   type: string
 *                 filename:
 *                   type: string
 *                 fileType:
 *                   type: string
 *                 size:
 *                   type: integer
 *       400:
 *         description: No file provided or invalid file type
 *       413:
 *         description: File too large
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No File Provided',
        message: 'Please provide a file to upload'
      });
    }

    const { projectId } = req.body;
    const userId = req.user.id;

    // If projectId is provided, verify user has access to the project
    if (projectId) {
      const { prisma } = require('../services/database');
      
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: { userId }
              }
            }
          ]
        }
      });

      if (!project) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(403).json({
          error: 'Access Denied',
          message: 'You do not have access to this project'
        });
      }
    }

    // Create asset record in database
    const { prisma } = require('../services/database');
    const asset = await prisma.asset.create({
      data: {
        projectId: projectId || null,
        url: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype,
        size: req.file.size
      }
    });

    res.status(201).json({
      id: asset.id,
      url: asset.url,
      filename: req.file.filename,
      fileType: asset.fileType,
      size: asset.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File Too Large',
        message: 'The uploaded file exceeds the maximum allowed size'
      });
    }

    res.status(500).json({
      error: 'Upload Failed',
      message: 'Unable to upload file'
    });
  }
});

/**
 * @swagger
 * /api/upload/{id}:
 *   delete:
 *     summary: Delete an uploaded file
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Asset ID
 *     responses:
 *       204:
 *         description: File deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: File not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { prisma } = require('../services/database');
    
    // Get asset with project info to check permissions
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({
        error: 'File Not Found',
        message: 'The requested file does not exist'
      });
    }

    // Check permissions
    const isOwner = asset.project?.ownerId === userId;
    const memberAccess = asset.project?.members?.[0];
    const canDelete = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

    if (!canDelete) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You do not have permission to delete this file'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.env.UPLOAD_PATH || './uploads', path.basename(asset.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete asset record from database
    await prisma.asset.delete({
      where: { id }
    });

    // Clear project cache if applicable
    if (asset.projectId) {
      const { cache } = require('../services/redis');
      await cache.del(`project:${asset.projectId}`);
    }

    res.status(204).send();
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      error: 'Deletion Failed',
      message: 'Unable to delete file'
    });
  }
});

module.exports = router;
