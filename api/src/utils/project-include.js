/**
 * Shared Prisma `include` shape for Project queries (owner/members/content/_count),
 * extracted from the near-identical include blocks duplicated across projects.js's
 * create/list/get/update handlers. The content filter and extra counts vary slightly
 * across call sites, so both are parameterized.
 *
 * @param {object} [options]
 * @param {object|boolean} [options.content] - override for the `content` include.
 *   Pass `false` to omit content entirely, an object to use as the content include,
 *   or omit for the default (non-revision, non-REVISION-status content ordered by order asc).
 * @param {boolean} [options.siteConfig] - include siteConfig (default false)
 * @param {object} [options.countSelect] - override the `_count.select` shape
 *   (default: { content: true, members: true })
 */
function projectInclude(options = {}) {
  const {
    content = {
      where: { status: { not: 'REVISION' }, revisionOf: null },
      orderBy: { order: 'asc' }
    },
    siteConfig = false,
    countSelect = { content: true, members: true }
  } = options;

  const include = {
    owner: {
      select: { id: true, name: true, email: true }
    },
    members: {
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    },
    _count: { select: countSelect }
  };

  if (content !== false) {
    include.content = content;
  }
  if (siteConfig) {
    include.siteConfig = true;
  }

  return include;
}

module.exports = { projectInclude };
