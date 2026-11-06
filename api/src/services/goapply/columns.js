const defaults = [
  ['saved', 'Saved', 'bg-gray-500'], ['applied', 'Applied', 'bg-blue-500'],
  ['screening', 'Screening', 'bg-indigo-500'], ['interview', 'Interview', 'bg-purple-500'],
  ['offer', 'Offer', 'bg-yellow-500'], ['accepted', 'Accepted', 'bg-green-500'],
  ['rejected', 'Rejected', 'bg-red-500'], ['withdrawn', 'Withdrawn', 'bg-orange-500'],
  ['archived', 'Archived', 'bg-gray-700']
].map(([status, label, color]) => ({ status, label, color }));
const colors = new Set(defaults.map(column => column.color));
async function getColumns(db, userId) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { goapplyColumns: true } });
  return user?.goapplyColumns ?? defaults.map(column => ({ ...column }));
}
module.exports = { defaults, colors, getColumns };
