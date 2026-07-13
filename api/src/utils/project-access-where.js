/**
 * Prisma where-predicate for "projects this user can access with at least one
 * of the given roles" — true either by ownership, or by a ProjectAccess row
 * with a matching role. Extracted from job-assistant-tools.js's
 * assertWritableProject and the inline OR-clauses in goapply.js.
 *
 * @param {string} userId
 * @param {string[]} roles - ProjectAccess roles that satisfy the predicate (e.g. ['ADMIN', 'EDITOR'])
 */
function projectAccessWhere(userId, roles) {
  return {
    OR: [
      { ownerId: userId },
      { members: { some: { userId, role: { in: roles } } } }
    ]
  };
}

module.exports = { projectAccessWhere };
