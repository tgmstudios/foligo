const { prisma } = require('./database');

/** Fetch a portfolio content item, scoped to the requesting user, for the fetch_portfolio_item tool. */
async function fetchPortfolioItem(userId, postId) {
  const post = await prisma.content.findFirst({
    where: {
      id: postId,
      project: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    },
    select: { id: true, title: true, contentType: true, content: true, excerpt: true },
  });
  return post;
}

/** Titles/excerpts of all the user's portfolio content, for grounding the agent's context. */
async function getPortfolioContext(userId) {
  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);
  if (projectIds.length === 0) return [];

  return prisma.content.findMany({
    where: {
      projectId: { in: projectIds },
      status: { not: 'REVISION' },
      revisionOf: null,
      contentType: { not: 'SKILL' },
    },
    select: { id: true, title: true, excerpt: true, contentType: true },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { fetchPortfolioItem, getPortfolioContext };
