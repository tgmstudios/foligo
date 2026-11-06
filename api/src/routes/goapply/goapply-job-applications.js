const express = require('express');
const { prisma } = require('../../services/core/database');

const router = express.Router();
const { randomUUID } = require('crypto');
const { colors, getColumns } = require('../../services/goapply/columns');

async function normalizeJobStatus(status, userId) {
  if (status === undefined || status === null || status === '') return undefined;
  if (typeof status !== 'string') return null;
  const normalized = status.trim().toLowerCase();
  return (await getColumns(prisma, userId)).some(column => column.status === normalized) ? normalized : null;
}

// Serialize column changes per user, including job migration on deletion.
async function changeColumns(userId, change) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const columns = await getColumns(tx, userId);
    const result = await change(columns, tx);
    await tx.user.update({ where: { id: userId }, data: { goapplyColumns: columns } });
    return result;
  });
}

router.get('/columns', async (req, res) => {
  try { res.json(await getColumns(prisma, req.user.id)); }
  catch (error) { res.status(500).json({ message: 'Unable to retrieve columns' }); }
});

function columnError(res, error) {
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to save columns' });
}
function fail(status, message) { throw Object.assign(new Error(message), { status }); }
function validateColumn(body) {
  if (typeof body.label !== 'string' || !body.label.trim() || body.label.trim().length > 60) fail(400, 'Column name must contain 1–60 characters');
  if (!colors.has(body.color)) fail(400, 'Choose a supported column color');
  return { label: body.label.trim(), color: body.color };
}
router.post('/columns', async (req, res) => {
  try {
    const data = validateColumn(req.body);
    const column = await changeColumns(req.user.id, async columns => {
      if (columns.some(c => c.label.toLowerCase() === data.label.toLowerCase())) fail(409, 'A column with this name already exists');
      const column = { status: randomUUID(), ...data };
      columns.push(column);
      return column;
    });
    res.status(201).json(column);
  } catch (error) { columnError(res, error); }
});
router.put('/columns/:status', async (req, res) => {
  try {
    const data = validateColumn(req.body);
    const column = await changeColumns(req.user.id, async columns => {
      const column = columns.find(c => c.status === req.params.status);
      if (!column) fail(404, 'Column not found');
      if (columns.some(c => c.status !== column.status && c.label.toLowerCase() === data.label.toLowerCase())) fail(409, 'A column with this name already exists');
      Object.assign(column, data);
      return column;
    });
    res.json(column);
  } catch (error) { columnError(res, error); }
});
router.delete('/columns/:status', async (req, res) => {
  try {
    await changeColumns(req.user.id, async (columns, tx) => {
      const index = columns.findIndex(c => c.status === req.params.status);
      if (index < 0) fail(404, 'Column not found');
      if (columns.length === 1) fail(400, 'Keep at least one column');
      if (!columns.some(c => c.status === req.body.moveTo && c.status !== req.params.status)) fail(400, 'Choose another column for existing jobs');
      await tx.jobApplication.updateMany({ where: { userId: req.user.id, status: req.params.status }, data: { status: req.body.moveTo } });
      columns.splice(index, 1);
    });
    res.json({ success: true });
  } catch (error) { columnError(res, error); }
});

// =============================================================================
// JOB APPLICATIONS
// =============================================================================

function normalizeJobTags(tags) {
  if (tags === undefined) return undefined;
  if (!Array.isArray(tags)) return null;
  return [...new Set(tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean))].slice(0, 25);
}

// GET /api/goapply/jobs — list jobs (filter query param: ?status=saved)
router.get('/jobs', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const jobs = await prisma.jobApplication.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
    });

    res.json(jobs);
  } catch (error) {
    console.error('List jobs error:', error);
    res.status(500).json({
      error: 'Job List Retrieval Failed',
      message: 'Unable to retrieve job applications'
    });
  }
});

// POST /api/goapply/jobs — create job application
router.post('/jobs', async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, position, url, status, notes, description, category, tags, appliedAt, referredBy, sortOrder } = req.body;

    if (!company || !position) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Company and position are required'
      });
    }
    const normalizedTags = normalizeJobTags(tags);
    if (normalizedTags === null) return res.status(400).json({ error: 'Validation Error', message: 'Tags must be an array of strings' });
    const normalizedStatus = await normalizeJobStatus(status, userId);
    if (normalizedStatus === null) return res.status(400).json({ error: 'Validation Error', message: 'Unsupported job status' });

    const job = await prisma.jobApplication.create({
      data: {
        userId,
        company,
        position,
        url: url || null,
        status: normalizedStatus || (await getColumns(prisma, userId))[0].status,
        notes: notes || null,
        description: typeof description === 'string' ? description : null,
        category: typeof category === 'string' ? category.trim() || null : null,
        tags: normalizedTags || [],
        referredBy: referredBy || null,
        sortOrder: sortOrder ?? 0,
        appliedAt: appliedAt ? new Date(appliedAt) : null
      }
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      error: 'Job Creation Failed',
      message: 'Unable to create job application'
    });
  }
});

// PUT /api/goapply/jobs/reorder — bulk reorder (updates sortOrder + optional status)
// MUST be defined before /jobs/:id to prevent Express from matching "reorder" as an :id param
router.put('/jobs/reorder', async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // [{ id, sortOrder, status? }]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'items array is required'
      });
    }

    for (const item of items) {
      if (item.status !== undefined) {
        const status = await normalizeJobStatus(item.status, userId);
        if (!status) return res.status(400).json({ message: 'Unsupported job status' });
        item.status = status;
      }
    }
    // Verify ownership and update each job in a transaction
    const results = await prisma.$transaction(
      items.map((item) => {
        const data = { sortOrder: item.sortOrder };
        if (item.status) {
          const normalizedStatus = item.status;
          if (!normalizedStatus) throw new Error(`INVALID_JOB_STATUS:${item.status}`);
          data.status = normalizedStatus;
        }
        return prisma.jobApplication.updateMany({
          where: { id: item.id, userId },
          data
        });
      })
    );

    res.json({ success: true, updated: results.length });
  } catch (error) {
    if (String(error.message || '').startsWith('INVALID_JOB_STATUS:')) {
      return res.status(400).json({ error: 'Validation Error', message: 'Unsupported job status' });
    }
    console.error('Bulk reorder error:', error);
    res.status(500).json({
      error: 'Reorder Failed',
      message: 'Unable to reorder job applications'
    });
  }
});

// PUT /api/goapply/jobs/:id — update job (status, notes, etc.)
router.put('/jobs/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { company, position, url, status, notes, description, category, tags, appliedAt, referredBy, sortOrder } = req.body;

    // Verify ownership
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Job Not Found',
        message: 'Job application not found'
      });
    }
    const normalizedTags = normalizeJobTags(tags);
    if (normalizedTags === null) return res.status(400).json({ error: 'Validation Error', message: 'Tags must be an array of strings' });
    const normalizedStatus = await normalizeJobStatus(status, userId);
    if (normalizedStatus === null) return res.status(400).json({ error: 'Validation Error', message: 'Unsupported job status' });

    const data = {};
    if (company !== undefined) data.company = company;
    if (position !== undefined) data.position = position;
    if (url !== undefined) data.url = url;
    if (normalizedStatus !== undefined) data.status = normalizedStatus;
    if (notes !== undefined) data.notes = notes;
    if (description !== undefined) data.description = typeof description === 'string' ? description : null;
    if (category !== undefined) data.category = typeof category === 'string' ? category.trim() || null : null;
    if (normalizedTags !== undefined) data.tags = normalizedTags;
    if (appliedAt !== undefined) data.appliedAt = appliedAt ? new Date(appliedAt) : null;
    if (referredBy !== undefined) data.referredBy = referredBy;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const job = await prisma.jobApplication.update({
      where: { id },
      data
    });

    res.json(job);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      error: 'Job Update Failed',
      message: 'Unable to update job application'
    });
  }
});

// DELETE /api/goapply/jobs/:id — delete job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.jobApplication.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Job Not Found',
        message: 'Job application not found'
      });
    }

    await prisma.jobApplication.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Job application deleted' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      error: 'Job Deletion Failed',
      message: 'Unable to delete job application'
    });
  }
});

// GET /api/goapply/kanban — get all jobs grouped by status for kanban
router.get('/kanban', async (req, res) => {
  try {
    const userId = req.user.id;

    const jobs = await prisma.jobApplication.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }]
    });

    // Group by status
    const statuses = (await getColumns(prisma, userId)).map(column => column.status);
    const kanban = {};

    for (const status of statuses) {
      kanban[status] = jobs.filter(job => job.status === status);
    }

    res.json(kanban);
  } catch (error) {
    console.error('Kanban error:', error);
    res.status(500).json({
      error: 'Kanban Retrieval Failed',
      message: 'Unable to retrieve kanban data'
    });
  }
});

module.exports = router;
