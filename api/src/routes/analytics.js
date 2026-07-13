const express = require('express');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../services/core/database');
const { authorizeProjectAccess } = require('../middleware/auth');
const {
  MAX_BATCH_SIZE,
  hash,
  createWriteKey,
  normalizeOrigin,
  originAllowed,
  normalizeEvent,
} = require('../services/analytics/analytics');

const publicRouter = express.Router();
const router = express.Router();

function getWriteKey(req) {
  const authorization = req.get('authorization');
  return req.get('x-analytics-key') || (authorization?.startsWith('Bearer ') ? authorization.slice(7) : null);
}

/**
 * @swagger
 * /api/analytics/events:
 *   post:
 *     summary: Ingest analytics events from a website
 *     tags: [Analytics]
 *     parameters:
 *       - in: header
 *         name: X-Analytics-Key
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/AnalyticsEventInput'
 *               - type: object
 *                 properties:
 *                   events:
 *                     type: array
 *                     maxItems: 100
 *                     items: { $ref: '#/components/schemas/AnalyticsEventInput' }
 *     responses:
 *       202: { description: Events accepted }
 *       400: { description: Invalid event }
 *       401: { description: Invalid write key }
 *       403: { description: Origin is not allowed }
 */
publicRouter.post('/', async (req, res) => {
  try {
    const writeKey = getWriteKey(req);
    if (!writeKey) return res.status(401).json({ error: 'X-Analytics-Key is required' });

    const property = await prisma.analyticsProperty.findUnique({ where: { writeKeyHash: hash(writeKey, 'analytics-write-key') } });
    if (!property) return res.status(401).json({ error: 'Invalid analytics write key' });
    if (!originAllowed(req.get('origin'), property.allowedOrigins)) {
      return res.status(403).json({ error: 'This origin is not allowed for the analytics property' });
    }

    const inputs = Array.isArray(req.body?.events) ? req.body.events : [req.body];
    if (inputs.length === 0 || inputs.length > MAX_BATCH_SIZE) {
      return res.status(400).json({ error: `A batch must contain 1-${MAX_BATCH_SIZE} events` });
    }
    const events = inputs.map(input => normalizeEvent(input, property.id));
    await prisma.analyticsEvent.createMany({ data: events });
    return res.status(202).json({ accepted: events.length });
  } catch (error) {
    if (error.message?.includes('Event name') || error.message?.includes('timestamp') || error.message?.includes('metadata') || error.message?.includes('event must')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Analytics ingestion error:', error);
    return res.status(500).json({ error: 'Unable to ingest analytics events' });
  }
});

router.get('/projects/:projectId/property', authorizeProjectAccess('VIEWER'), async (req, res) => {
  const property = await prisma.analyticsProperty.findUnique({ where: { projectId: req.params.projectId } });
  res.json(property ? {
    configured: true,
    writeKeyPrefix: property.writeKeyPrefix,
    allowedOrigins: property.allowedOrigins,
    createdAt: property.createdAt,
  } : { configured: false, allowedOrigins: [] });
});

router.put('/projects/:projectId/property', authorizeProjectAccess('ADMIN'), async (req, res) => {
  try {
    const origins = req.body?.allowedOrigins;
    if (!Array.isArray(origins) || origins.length > 50) return res.status(400).json({ error: 'allowedOrigins must be an array of at most 50 origins' });
    const allowedOrigins = origins.map(value => value === '*' || String(value).startsWith('*.') ? String(value).toLowerCase() : normalizeOrigin(value));
    if (allowedOrigins.some(value => !value)) return res.status(400).json({ error: 'Every allowed origin must be a valid origin, wildcard domain, or *' });

    const existing = await prisma.analyticsProperty.findUnique({ where: { projectId: req.params.projectId } });
    const rotateKey = !existing || req.body.rotateKey === true;
    const writeKey = rotateKey ? createWriteKey() : null;
    const property = await prisma.analyticsProperty.upsert({
      where: { projectId: req.params.projectId },
      create: {
        projectId: req.params.projectId,
        allowedOrigins,
        writeKeyHash: hash(writeKey, 'analytics-write-key'),
        writeKeyPrefix: writeKey.slice(0, 10),
      },
      update: {
        allowedOrigins,
        ...(writeKey ? { writeKeyHash: hash(writeKey, 'analytics-write-key'), writeKeyPrefix: writeKey.slice(0, 10) } : {}),
      },
    });
    res.json({ configured: true, writeKey, writeKeyPrefix: property.writeKeyPrefix, allowedOrigins: property.allowedOrigins });
  } catch (error) {
    console.error('Analytics property update error:', error);
    res.status(500).json({ error: 'Unable to update analytics property' });
  }
});

router.get('/projects/:projectId/summary', authorizeProjectAccess('VIEWER'), async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number.parseInt(req.query.days, 10) || 30));
    const property = await prisma.analyticsProperty.findUnique({ where: { projectId: req.params.projectId } });
    if (!property) return res.json({ configured: false, days, totals: { events: 0, pageViews: 0, visitors: 0, sessions: 0 }, series: [], topPages: [], topReferrers: [], topEvents: [], topCountries: [], topDomains: [], topTransitions: [], deviceBreakdown: [], osBreakdown: [], browserBreakdown: [], returnRate: [], avgTimeOnPage: 0 });
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - days + 1);
    const propertyId = property.id;

    const [totals] = await prisma.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::int AS events,
        COUNT(*) FILTER (WHERE name = 'page_view')::int AS "pageViews",
        COUNT(DISTINCT "visitorHash")::int AS visitors,
        COUNT(DISTINCT "sessionHash")::int AS sessions
      FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since}
    `);
    const [series, topPages, topReferrers, topEvents, topCountries, topDomains, topTransitions, deviceBreakdown, osBreakdown, browserBreakdown, returnRate, avgTimeResult] = await Promise.all([
      prisma.$queryRaw(Prisma.sql`SELECT to_char(date_trunc('day', "occurredAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date, COUNT(*) FILTER (WHERE name = 'page_view')::int AS views, COUNT(DISTINCT "visitorHash")::int AS visitors FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} GROUP BY 1 ORDER BY 1`),
      prisma.$queryRaw(Prisma.sql`SELECT COALESCE(path, '/') AS label, COUNT(*)::int AS value, COALESCE(AVG(duration)::int, 0) AS "avgDuration" FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} AND name = 'page_view' GROUP BY 1 ORDER BY value DESC LIMIT 10`),
      prisma.$queryRaw(Prisma.sql`SELECT referrer AS label, COUNT(*)::int AS value FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} AND referrer IS NOT NULL GROUP BY 1 ORDER BY value DESC LIMIT 10`),
      prisma.$queryRaw(Prisma.sql`SELECT name AS label, COUNT(*)::int AS value FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} GROUP BY 1 ORDER BY value DESC LIMIT 10`),
      prisma.$queryRaw(Prisma.sql`SELECT country AS label, COUNT(*)::int AS value, COUNT(DISTINCT "visitorHash")::int AS visitors FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} AND country IS NOT NULL GROUP BY country ORDER BY value DESC LIMIT 10`),
      prisma.$queryRaw(Prisma.sql`SELECT domain AS label, COUNT(*)::int AS value FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} AND domain IS NOT NULL GROUP BY domain ORDER BY value DESC LIMIT 10`),
      prisma.$queryRaw(Prisma.sql`SELECT "previousPath" || ' → ' || path AS label, COUNT(*)::int AS value FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} AND "previousPath" IS NOT NULL GROUP BY label ORDER BY value DESC LIMIT 10`),
      prisma.$queryRaw(Prisma.sql`SELECT COALESCE("deviceType", device, 'unknown') AS label, COUNT(*)::int AS value FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} GROUP BY 1 ORDER BY value DESC`),
      prisma.$queryRaw(Prisma.sql`SELECT os AS label, COUNT(*)::int AS value FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} AND os IS NOT NULL GROUP BY os ORDER BY value DESC`),
      prisma.$queryRaw(Prisma.sql`SELECT browser AS label, COUNT(*)::int AS value FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} AND browser IS NOT NULL GROUP BY browser ORDER BY value DESC`),
      prisma.$queryRaw(Prisma.sql`SELECT CASE WHEN "visitCount" > 1 THEN 'returning' ELSE 'new' END AS label, COUNT(DISTINCT "visitorHash")::int AS value FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} AND "visitorHash" IS NOT NULL AND "visitCount" IS NOT NULL GROUP BY 1`),
      prisma.$queryRaw(Prisma.sql`SELECT COALESCE(AVG(duration)::int, 0) AS "avgDuration" FROM analytics_events WHERE "propertyId" = ${propertyId} AND "occurredAt" >= ${since} AND name = 'page_view' AND duration IS NOT NULL`),
    ]);
    const avgTimeOnPage = avgTimeResult[0]?.avgDuration || 0;
    res.json({ configured: true, days, totals, series, topPages, topReferrers, topEvents, topCountries, topDomains, topTransitions, deviceBreakdown, osBreakdown, browserBreakdown, returnRate, avgTimeOnPage });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Unable to load analytics summary' });
  }
});

module.exports = { publicRouter, router };
