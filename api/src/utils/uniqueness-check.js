/**
 * Check whether a subdomain is available (i.e. not used by another project).
 * Extracted from the duplicated findFirst({ subdomain, NOT: { id } }) checks
 * in projects.js (create/update) and admin.js (PUT /projects/:id).
 *
 * @param {object} prisma
 * @param {string} subdomain
 * @param {string} [excludeId] - project id to exclude from the uniqueness check (for updates)
 * @returns {Promise<boolean>} true if the subdomain is available
 */
async function checkSubdomainAvailable(prisma, subdomain, excludeId) {
  const existing = await prisma.project.findFirst({
    where: {
      subdomain,
      ...(excludeId ? { NOT: { id: excludeId } } : {})
    }
  });
  return !existing;
}

module.exports = { checkSubdomainAvailable };
