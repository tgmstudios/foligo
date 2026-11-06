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

const PROJECT_ROLE_LEVELS = Object.freeze({ VIEWER: 1, EDITOR: 2, ADMIN: 3, OWNER: 4 });

const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;

/**
 * Resolve the project identifier a request is authorizing against.
 *
 * - `:projectId` route params are authoritative (nested content routes also carry
 *   `:contentId`, which is never consulted).
 * - `:id` is a project id ONLY on routes mounted under `/projects` whose pattern
 *   starts with `/:id`; on any other route (`/content/:id`, `/media/:id`) it names
 *   a different resource and must not be treated as a project.
 * - A body `projectId` is used only when the route supplies no identifier
 *   (e.g. POST /ai/social-posts) and must agree with any route identifier.
 * Returns { projectId } or { error } (fail closed on missing/ambiguous/conflicting).
 */
function resolveProjectId(req) {
  const params = req.params || {};
  const candidates = [];

  if (params.projectId !== undefined) candidates.push(params.projectId);

  if (params.id !== undefined) {
    const routePath = (req.route && typeof req.route.path === 'string') ? req.route.path : '';
    const baseUrl = req.baseUrl || '';
    if (/\/projects\/?$/.test(baseUrl) && /^\/:id(\/|$)/.test(routePath)) {
      candidates.push(params.id);
    }
  }

  const bodyProjectId = req.body && typeof req.body === 'object' ? req.body.projectId : undefined;
  if (bodyProjectId !== undefined) candidates.push(bodyProjectId);

  if (candidates.length === 0) return { error: 'Project identifier required' };
  if (!candidates.every(isNonEmptyString)) return { error: 'Invalid project identifier' };
  if (new Set(candidates).size !== 1) return { error: 'Conflicting project identifiers' };
  return { projectId: candidates[0] };
}

const authorizeProjectAccess = (requiredRole = 'VIEWER') => {
  const requiredRoleLevel = PROJECT_ROLE_LEVELS[requiredRole];
  if (!requiredRoleLevel) {
    throw new Error(`authorizeProjectAccess: unknown required role "${requiredRole}"`);
  }

  return async (req, res, next) => {
    try {
      if (!req.user || !isNonEmptyString(req.user.id)) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const resolved = resolveProjectId(req);
      if (resolved.error) {
        return res.status(400).json({ error: resolved.error });
      }
      const { projectId } = resolved;
      const userId = req.user.id;

      // Check if user is the project owner
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          ownerId: userId
        },
        select: { id: true }
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

      // Check role permissions (unknown stored roles are denied)
      const userRoleLevel = PROJECT_ROLE_LEVELS[access.role];
      if (!userRoleLevel || userRoleLevel < requiredRoleLevel) {
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
