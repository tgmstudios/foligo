const jwt = require('jsonwebtoken');
const { prisma } = require('../services/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
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
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.error('Auth middleware error:', error);
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
