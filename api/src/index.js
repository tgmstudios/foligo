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
const aiRoutes = require('./routes/ai');
const aiContentRoutes = require('./routes/ai-content');
const voiceWebhookRoutes = require('./routes/voice-webhook');
const uploadRoutes = require('./routes/upload');
const siteRoutes = require('./routes/site');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Import services
const { connectRedis } = require('./services/redis');
const { connectDatabase } = require('./services/database');

const app = express();
const PORT = process.env.PORT || 80;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'https://foligo.tech',
    'https://www.foligo.tech',
    'https://foligo.tech',
    /^https:\/\/.*\.foligo\.tech$/
  ],
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
app.use('/api/site', siteRoutes); // Public site routes (no auth required)
app.use('/api/ai/voice-webhook', voiceWebhookRoutes); // Public voice webhook (called by ElevenLabs)
app.use('/api', publicContentRoutes); // Public content GET endpoint (no auth required)

// All other routes require authentication
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/projects', authenticateToken, projectAccessRoutes);
app.use('/api', authenticateToken, contentRoutes); // Protected content routes
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/ai', authenticateToken, aiContentRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);

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
