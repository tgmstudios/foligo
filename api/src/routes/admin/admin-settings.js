/**
 * Admin platform settings — simple key-value store for platform-level
 * configuration (SearXNG URL, etc.). Readable by anyone with a valid
 * session, writable only by admins.
 */
const express = require('express');
const { prisma } = require('../../services/core/database');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// Whitelist of keys that are safe to expose and update
const ALLOWED_KEYS = [
  'searxng_url',
];

// GET /api/admin/settings — return current values for all allowed keys
router.get('/', async (_req, res) => {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: { key: { in: ALLOWED_KEYS } },
    });
    const map = Object.fromEntries(
      ALLOWED_KEYS.map((k) => [k, settings.find((s) => s.key === k)?.value ?? process.env[k.toUpperCase()] ?? '']),
    );
    res.json(map);
  } catch (error) {
    console.error('Get platform settings error:', error);
    res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
});

// PUT /api/admin/settings — update one or more allowed keys (admin only)
router.put('/', requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const results = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_KEYS.includes(key)) {
        return res.status(400).json({ error: `Unknown setting: ${key}` });
      }
      if (typeof value !== 'string') {
        return res.status(400).json({ error: `Setting ${key} must be a string.` });
      }

      const setting = await prisma.platformSetting.upsert({
        where: { key },
        create: { key, value, updatedBy: req.user?.id },
        update: { value, updatedBy: req.user?.id },
      });
      results[key] = setting.value;
    }

    res.json(results);
  } catch (error) {
    console.error('Update platform settings error:', error);
    res.status(500).json({ error: 'Failed to save platform settings' });
  }
});

// POST /api/admin/settings/test — test a SearXNG connection (admin only)
router.post('/test', requireAdmin, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const searchUrl = new URL(`${url}/search`);
    searchUrl.searchParams.set('q', 'test');
    searchUrl.searchParams.set('format', 'json');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    const start = Date.now();
    const response = await fetch(searchUrl.toString(), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({ ok: false, error: `HTTP ${response.status} from SearXNG` });
    }

    const data = await response.json();
    const count = Array.isArray(data.results) ? data.results.length : 0;
    res.json({ ok: true, latency: Date.now() - start, count });
  } catch (error) {
    res.json({ ok: false, error: error.name === 'AbortError' ? 'Connection timed out' : error.message });
  }
});

module.exports = router;
