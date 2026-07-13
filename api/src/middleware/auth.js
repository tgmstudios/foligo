const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../services/core/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // First try JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    req.user = user;
    return next();
  } catch (jwtError) {
    // JWT verification failed — try API token authentication
    if (jwtError.name === 'TokenExpiredError' || jwtError.name === 'JsonWebTokenError') {
      try {
        // Hash the provided token and look it up
        const hash = crypto.createHash('sha256').update(token).digest('hex');
        
        const apiToken = await prisma.apiToken.findFirst({
          where: { hash },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                isAdmin: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });

        if (apiToken) {
          // Update lastUsedAt
          await prisma.apiToken.update({
            where: { id: apiToken.id },
            data: { lastUsedAt: new Date() },
          });

          req.user = apiToken.user;
          return next();
        }

        // Neither JWT nor API token matched
        return res.status(401).json({ error: 'Invalid token' });
      } catch (apiTokenError) {
        console.error('API token auth error:', apiTokenError);
        return res.status(500).json({ error: 'Authentication error' });
      }
    }

    console.error('Auth middleware error:', jwtError);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const authorizeProjectAccess = (requiredRole = 'VIEWER') => {
  return async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Check if user is the project owner
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          ownerId: userId
        }
      });

      if (project) {
        req.userRole = 'OWNER';
        return next();
      }

      // Check project access
      const access = await prisma.projectAccess.findFirst({
        where: {
          projectId,
          userId
        }
      });

      if (!access) {
        return res.status(403).json({ error: 'Access denied - not a project member' });
      }

      // Check role permissions
      const roleHierarchy = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };
      const userRoleLevel = roleHierarchy[access.role];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          error: `Access denied - requires ${requiredRole} role or higher` 
        });
      }

      req.userRole = access.role;
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

const requireAdmin = async (req, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true }
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Admin privileges required' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    return res.status(500).json({ error: 'Authorization error' });
  }
};

module.exports = {
  authenticateToken,
  authorizeProjectAccess,
  requireAdmin
};
