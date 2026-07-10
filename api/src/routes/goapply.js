const express = require('express');
const jwt = require('jsonwebtoken');
const { prisma } = require('../services/database');
const { cache } = require('../services/redis');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All goapply routes require authentication
router.use(authenticateToken);

// =============================================================================
// PROFILE
// =============================================================================

// GET /api/goapply/profile — get logged-in user's profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.json(null);
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Profile Retrieval Failed',
      message: 'Unable to retrieve profile'
    });
  }
});

// PUT /api/goapply/profile — upsert profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName, email, phone, location,
      linkedin, github, portfolio, resumeUrl, skills
    } = req.body;

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: fullName || null,
        email: email || null,
        phone: phone || null,
        location: location || null,
        linkedin: linkedin || null,
        github: github || null,
        portfolio: portfolio || null,
        resumeUrl: resumeUrl || null,
        skills: skills ? (typeof skills === 'string' ? skills : JSON.stringify(skills)) : null
      },
      update: {
        fullName: fullName !== undefined ? (fullName || null) : undefined,
        email: email !== undefined ? (email || null) : undefined,
        phone: phone !== undefined ? (phone || null) : undefined,
        location: location !== undefined ? (location || null) : undefined,
        linkedin: linkedin !== undefined ? (linkedin || null) : undefined,
        github: github !== undefined ? (github || null) : undefined,
        portfolio: portfolio !== undefined ? (portfolio || null) : undefined,
        resumeUrl: resumeUrl !== undefined ? (resumeUrl || null) : undefined,
        skills: skills !== undefined ? (typeof skills === 'string' ? skills : JSON.stringify(skills)) : undefined
      }
    });

    res.json(profile);
  } catch (error) {
    console.error('Upsert profile error:', error);
    res.status(500).json({
      error: 'Profile Update Failed',
      message: 'Unable to update profile'
    });
  }
});

// =============================================================================
// JOB APPLICATIONS
// =============================================================================

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
    const { company, position, url, status, notes, appliedAt, referredBy, sortOrder } = req.body;

    if (!company || !position) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Company and position are required'
      });
    }

    const job = await prisma.jobApplication.create({
      data: {
        userId,
        company,
        position,
        url: url || null,
        status: status || 'saved',
        notes: notes || null,
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

    // Verify ownership and update each job in a transaction
    const results = await prisma.$transaction(
      items.map((item) => {
        const data = { sortOrder: item.sortOrder };
        if (item.status) data.status = item.status;
        return prisma.jobApplication.updateMany({
          where: { id: item.id, userId },
          data
        });
      })
    );

    res.json({ success: true, updated: results.length });
  } catch (error) {
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
    const { company, position, url, status, notes, appliedAt, referredBy, sortOrder } = req.body;

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

    const data = {};
    if (company !== undefined) data.company = company;
    if (position !== undefined) data.position = position;
    if (url !== undefined) data.url = url;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
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
    const statuses = ['saved', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn', 'archived'];
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

// =============================================================================
// SAVED ANSWERS
// =============================================================================

// GET /api/goapply/answers — list saved answers
router.get('/answers', async (req, res) => {
  try {
    const userId = req.user.id;

    const answers = await prisma.savedAnswer.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(answers);
  } catch (error) {
    console.error('List answers error:', error);
    res.status(500).json({
      error: 'Answers Retrieval Failed',
      message: 'Unable to retrieve saved answers'
    });
  }
});

// POST /api/goapply/answers — create saved answer
router.post('/answers', async (req, res) => {
  try {
    const userId = req.user.id;
    const { question, answer, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Question and answer are required'
      });
    }

    const savedAnswer = await prisma.savedAnswer.create({
      data: {
        userId,
        question,
        answer,
        category: category || null
      }
    });

    res.status(201).json(savedAnswer);
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({
      error: 'Answer Creation Failed',
      message: 'Unable to create saved answer'
    });
  }
});

// PUT /api/goapply/answers/:id — update saved answer
router.put('/answers/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { question, answer, category } = req.body;

    // Verify ownership
    const existing = await prisma.savedAnswer.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Answer Not Found',
        message: 'Saved answer not found'
      });
    }

    const data = {};
    if (question !== undefined) data.question = question;
    if (answer !== undefined) data.answer = answer;
    if (category !== undefined) data.category = category;

    const updated = await prisma.savedAnswer.update({
      where: { id },
      data
    });

    res.json(updated);
  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({
      error: 'Answer Update Failed',
      message: 'Unable to update saved answer'
    });
  }
});

// DELETE /api/goapply/answers/:id — delete saved answer
router.delete('/answers/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.savedAnswer.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Answer Not Found',
        message: 'Saved answer not found'
      });
    }

    await prisma.savedAnswer.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Saved answer deleted' });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({
      error: 'Answer Deletion Failed',
      message: 'Unable to delete saved answer'
    });
  }
});

// =============================================================================
// COVER LETTERS
// =============================================================================

// GET /api/goapply/cover-letters — list cover letters
router.get('/cover-letters', async (req, res) => {
  try {
    const userId = req.user.id;

    const letters = await prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(letters);
  } catch (error) {
    console.error('List cover letters error:', error);
    res.status(500).json({
      error: 'Cover Letters Retrieval Failed',
      message: 'Unable to retrieve cover letters'
    });
  }
});

// POST /api/goapply/cover-letters — create cover letter
router.post('/cover-letters', async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId, title, content, generatedBy } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title and content are required'
      });
    }

    const letter = await prisma.coverLetter.create({
      data: {
        userId,
        jobId: jobId || null,
        title,
        content,
        generatedBy: generatedBy || null
      }
    });

    res.status(201).json(letter);
  } catch (error) {
    console.error('Create cover letter error:', error);
    res.status(500).json({
      error: 'Cover Letter Creation Failed',
      message: 'Unable to create cover letter'
    });
  }
});

// DELETE /api/goapply/cover-letters/:id — delete cover letter
router.delete('/cover-letters/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.coverLetter.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Cover Letter Not Found',
        message: 'Cover letter not found'
      });
    }

    await prisma.coverLetter.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Cover letter deleted' });
  } catch (error) {
    console.error('Delete cover letter error:', error);
    res.status(500).json({
      error: 'Cover Letter Deletion Failed',
      message: 'Unable to delete cover letter'
    });
  }
});

module.exports = router;
