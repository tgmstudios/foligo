/**
 * Shared page/limit/skip parsing and pagination response shape, extracted
 * from the near-identical blocks previously duplicated across admin.js's
 * users/projects/content list endpoints.
 */
function paginate(req) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPaginationResponse(total, page, limit) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}

module.exports = { paginate, buildPaginationResponse };
