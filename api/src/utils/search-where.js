/**
 * Build a Prisma `OR` where-clause for a case-insensitive substring search
 * across a set of string fields. Extracted from the repeated search-building
 * blocks in admin.js (users/projects/content list endpoints).
 *
 * @param {string} search - the raw search term (falsy => no clause)
 * @param {string[]} fields - field names to search across
 * @returns {object} a Prisma where fragment, e.g. { OR: [...] }, or {} if no search term
 */
function buildSearchWhere(search, fields) {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({ [field]: { contains: search, mode: 'insensitive' } }))
  };
}

module.exports = { buildSearchWhere };
