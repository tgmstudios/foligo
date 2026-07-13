/**
 * Shared Content include shape (tags/meta/blocks/roles/linkedSkills), and the
 * owner/member/canEdit access-check + cache-invalidation patterns duplicated
 * across content.js's get/update/update-fields/delete/reorder/chat handlers.
 */
const CONTENT_INCLUDE = {
  tags: true,
  meta: true,
  blocks: {
    orderBy: { order: 'asc' }
  },
  roles: {
    include: { skills: true },
    orderBy: { startDate: 'desc' }
  },
  linkedSkills: true
};

/**
 * Load a Content row (with project/owner/member info needed for the access
 * check) and compute whether the given user can view/edit it.
 *
 * @param {object} prisma
 * @param {string} id - content id
 * @param {string} userId
 * @returns {Promise<null|{content: object, isOwner: boolean, isMember: boolean, canEdit: boolean}>}
 *   null if the content does not exist
 */
async function getContentWithAccess(prisma, id, userId) {
  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          owner: true,
          members: { where: { userId } }
        }
      },
      ...CONTENT_INCLUDE
    }
  });

  if (!content) return null;

  const isOwner = content.project.ownerId === userId;
  const memberAccess = content.project.members[0];
  const isMember = Boolean(memberAccess);
  const canEdit = isOwner || (memberAccess && ['ADMIN', 'EDITOR'].includes(memberAccess.role));

  return { content, isOwner, isMember, canEdit: Boolean(canEdit) };
}

/**
 * Clear the project/content cache keys touched by a content mutation.
 * Extracted from the `cache.del` triples repeated across content.js.
 */
async function invalidateContentCache(cache, projectId, contentId) {
  await cache.del(`project:${projectId}`);
  await cache.del(`project:${projectId}:content`);
  if (contentId) {
    await cache.del(`content:${contentId}`);
  }
}

module.exports = { CONTENT_INCLUDE, getContentWithAccess, invalidateContentCache };
