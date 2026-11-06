const express = require('express');
const { body, param, query } = require('express-validator');
const { prisma } = require('../../services/core/database');
const { requireAdmin } = require('../../middleware/auth');
const { handleValidation } = require('../../middleware/handle-validation');
const { getUsageSummary, monthWindow, validRates, userLock } = require('../../services/ai/usage');
const router = express.Router();
router.use(requireAdmin);
const userExists = async (userId, res) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) res.status(404).json({ error: 'User not found' });
  return !!user;
};
const periodValidator = query('month').optional().matches(/^\d{4}-(0[1-9]|1[0-2])$/);
router.get('/users/:id', [param('id').isUUID(), periodValidator, handleValidation], async (req, res) => {
  try {
    if (!await userExists(req.params.id, res)) return;
    res.json(await getUsageSummary(req.params.id, req.query.month ? `${req.query.month}-01T00:00:00Z` : new Date()));
  } catch { res.status(500).json({ error: 'Unable to load AI usage' }); }
});
router.put('/users/:id/policy', [
  param('id').isUUID(), body('unlimited').custom(value => typeof value === 'boolean'),
  body('monthlyRequests').exists({ checkNull: false }).custom(value => value === null || (Number.isInteger(value) && value >= 0 && value <= 2147483647)),
  body('monthlyTokens').exists({ checkNull: false }).custom(value => value === null || (Number.isInteger(value) && value >= 0 && value <= 2147483647)),
  body('monthlyCostUsd').exists({ checkNull: false }).custom(value => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1000000000)),
  handleValidation,
], async (req, res) => {
  try {
    if (!await userExists(req.params.id, res)) return;
    const { unlimited, monthlyRequests, monthlyTokens, monthlyCostUsd } = req.body;
    const data = { unlimited, monthlyRequests, monthlyTokens, monthlyCostUsd };
    await prisma.$transaction(async tx => {
      await userLock(tx, req.params.id);
      await tx.userAiUsagePolicy.upsert({ where: { userId: req.params.id }, create: { userId: req.params.id, ...data }, update: data });
    });
    res.json(await getUsageSummary(req.params.id));
  } catch { res.status(500).json({ error: 'Unable to save AI policy' }); }
});
router.get('/users/:id/events', [
  param('id').isUUID(), periodValidator,
  query('page').optional().isInt({ min: 1, max: 100000 }), handleValidation,
], async (req, res) => {
  try {
    if (!await userExists(req.params.id, res)) return;
    const { start, end } = monthWindow(req.query.month ? `${req.query.month}-01T00:00:00Z` : new Date());
    const where = { userId: req.params.id, createdAt: { gte: start, lt: end } };
    const page = Number(req.query.page) || 1;
    const [events, total] = await Promise.all([
      prisma.aiUsageEvent.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * 100, take: 100 }),
      prisma.aiUsageEvent.count({ where }),
    ]);
    res.json({ events, total, page, pages: Math.ceil(total / 100) });
  } catch { res.status(500).json({ error: 'Unable to load usage events' }); }
});
router.get('/models', async (_req, res) => {
  try { res.json({ models: await prisma.aiModel.findMany({ select: { id: true, name: true, model: true, billingRates: true }, orderBy: { name: 'asc' } }) }); }
  catch { res.status(500).json({ error: 'Unable to load billing rates' }); }
});
router.put('/models/:id/rates', [param('id').isUUID(), body('rates').custom(value => value === null || validRates(value)), handleValidation], async (req, res) => {
  try {
    const model = await prisma.aiModel.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!model) return res.status(404).json({ error: 'Model not found' });
    const { Prisma } = require('@prisma/client');
    await prisma.aiModel.update({ where: { id: req.params.id }, data: { billingRates: req.body.rates === null ? Prisma.DbNull : req.body.rates } });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Unable to save billing rates' }); }
});
module.exports = router;
