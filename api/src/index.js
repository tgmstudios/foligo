const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const projectAccessRoutes = require('./routes/projectAccess');
const contentRoutes = require('./routes/content');
const publicContentRoutes = require('./routes/public-content');
// const aiRoutes = require('./routes/ai');
const aiContentRoutes = require('./routes/ai-content');
const voiceWebhookRoutes = require('./routes/voice-webhook');
const uploadRoutes = require('./routes/upload');
const siteRoutes = require('./routes/site');
const contentLinksRoutes = require('./routes/content-links');
const contentTagsRoutes = require('./routes/content-tags');
const contentMetaRoutes = require('./routes/content-meta');
const contentBlocksRoutes = require('./routes/content-blocks');
const skillsRoutes = require('./routes/skills');
const experienceRolesRoutes = require('./routes/experience-roles');
const revisionsRoutes = require('./routes/revisions');
const mediaRoutes = require('./routes/media');
const adminRoutes = require('./routes/admin');
const adminSsoRoutes = require('./routes/admin-sso');
const ssoAuthRoutes = require('./routes/sso-auth');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Import services
const { connectRedis } = require('./services/redis');
const { connectDatabase } = require('./services/database');
const { ensureBucket } = require('./services/minio');
const { prisma } = require('./services/database');
const { minioClient, BUCKET_NAME } = require('./services/minio');

const app = express();
const PORT = process.env.PORT || 80;

const additionalCorsOrigins = (process.env.ADDITIONAL_CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3001',
  'http://localhost:9010', // Dashboard dev server
  'http://localhost:9011', // Sites dev server
  'https://foligo.tech',
  'https://www.foligo.tech',
  /^https:\/\/.*\.foligo\.tech$/,
  /^http:\/\/localhost:\d+$/ // Allow any localhost port for development
];

const corsOrigins = allowedOrigins.concat(additionalCorsOrigins);

const publicCors = cors({
  origin: true,
  credentials: false
});

// Security middleware
// Configure Helmet to allow cross-origin resources for media files
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Rate limiting - DISABLED FOR NOW
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Foligo API',
      version: '1.0.0',
      description: 'Portfolio generation website and AI-powered CMS API',
    },
    servers: [
      {
        url: 'https://api.foligo.tech',
        description: 'Production server',
      },
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/sso', ssoAuthRoutes); // SSO authentication routes (public)
app.use('/api/site', publicCors, siteRoutes); // Public site routes (no auth required)
app.use('/api/ai/voice-webhook', publicCors, voiceWebhookRoutes); // Public voice webhook (called by ElevenLabs)
app.use('/api', publicCors, publicContentRoutes); // Public content GET endpoint (no auth required)

// Public media file endpoints (must be before authenticated routes)
// Use CORS middleware specifically for media files (allow all origins)
const mediaCors = publicCors;

const mediaCorsWithMethods = cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

// Handle OPTIONS request for CORS preflight
app.options('/api/media/:id/file', mediaCorsWithMethods, (req, res) => {
  res.status(204).send();
});

app.get('/api/media/:id/file', mediaCorsWithMethods, async (req, res) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      return res.status(404).json({
        error: 'Media Not Found',
        message: 'The requested media file does not exist'
      });
    }

    // Get file from MinIO and stream it
    try {
      const dataStream = await minioClient.getObject(BUCKET_NAME, media.objectName);
      
      // Set appropriate headers
      res.setHeader('Content-Type', media.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${media.filename}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Stream the file
      dataStream.pipe(res);
    } catch (minioError) {
      console.error('Error fetching file from MinIO:', minioError);
      return res.status(500).json({
        error: 'File Retrieval Failed',
        message: 'Unable to retrieve file from storage'
      });
    }
  } catch (error) {
    console.error('Get media file error:', error);
    res.status(500).json({
      error: 'Media Retrieval Failed',
      message: 'Unable to retrieve media file'
    });
  }
});

app.get('/api/media/:id/view', mediaCorsWithMethods, async (req, res) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      return res.status(404).json({
        error: 'Media Not Found',
        message: 'The requested media file does not exist'
      });
    }

    // Return media info with proxied URL
    const API_URL = process.env.API_URL || req.protocol + '://' + req.get('host');
    const proxiedUrl = `${API_URL}/api/media/${media.id}/file`;

    res.json({
      id: media.id,
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
      publicUrl: proxiedUrl,
      altText: media.altText,
      createdAt: media.createdAt
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({
      error: 'Media Retrieval Failed',
      message: 'Unable to retrieve media file'
    });
  }
});

// All other routes require authentication
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/projects', authenticateToken, projectAccessRoutes);
app.use('/api', authenticateToken, contentRoutes); // Protected content routes
app.use('/api', authenticateToken, contentLinksRoutes); // Content links routes
app.use('/api', authenticateToken, contentTagsRoutes); // Content tags routes
app.use('/api', authenticateToken, contentMetaRoutes); // Content meta routes
app.use('/api', authenticateToken, contentBlocksRoutes); // Content blocks routes
app.use('/api', authenticateToken, skillsRoutes); // Skills routes
app.use('/api', authenticateToken, experienceRolesRoutes); // Experience roles routes
app.use('/api', authenticateToken, revisionsRoutes); // Revisions routes
// app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/ai', authenticateToken, aiContentRoutes);
// Old upload route deprecated - use /api/media instead
// app.use('/api/upload', authenticateToken, uploadRoutes);
// Media routes - most require auth, but /view endpoint is public
app.use('/api', mediaRoutes);
// Admin routes - require authentication and admin privileges
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/admin/sso', authenticateToken, adminSsoRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected');

    // Connect to Redis
    await connectRedis();
    console.log('✅ Redis connected');

    // Ensure MinIO bucket exists
    await ensureBucket();
    console.log('✅ MinIO bucket ready');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;
