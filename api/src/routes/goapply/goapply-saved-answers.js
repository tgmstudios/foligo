const express = require('express');
const { prisma } = require('../../services/core/database');

const router = express.Router();

// =============================================================================
// SAVED ANSWERS
// =============================================================================

const savedAnswerJobsSelect = { id: true, company: true, position: true };

async function ownedJobConnections(userId, jobIds) {
  if (!Array.isArray(jobIds)) return undefined;
  const uniqueIds = [...new Set(jobIds.filter((id) => typeof id === 'string' && id))];
  const jobs = await prisma.jobApplication.findMany({
    where: { userId, id: { in: uniqueIds } },
    select: { id: true },
  });
  if (jobs.length !== uniqueIds.length) throw new Error('INVALID_JOB_IDS');
  return jobs.map(({ id }) => ({ id }));
}

// GET /api/goapply/answers — list saved answers
router.get('/answers', async (req, res) => {
  try {
    const userId = req.user.id;

    const answers = await prisma.savedAnswer.findMany({
      where: { userId },
      include: { jobs: { select: savedAnswerJobsSelect } },
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
    const { question, answer, category, jobIds } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Question and answer are required'
      });
    }

    const jobs = await ownedJobConnections(userId, jobIds);
    const savedAnswer = await prisma.savedAnswer.create({
      data: {
        userId,
        question,
        answer,
        category: category || null,
        ...(jobs !== undefined ? { jobs: { connect: jobs } } : {}),
      },
      include: { jobs: { select: savedAnswerJobsSelect } },
    });

    res.status(201).json(savedAnswer);
  } catch (error) {
    if (error.message === 'INVALID_JOB_IDS') return res.status(400).json({ error: 'Validation Error', message: 'One or more selected jobs are not accessible.' });
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
    const { question, answer, category, jobIds } = req.body;

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
    const jobs = await ownedJobConnections(userId, jobIds);
    if (jobs !== undefined) data.jobs = { set: jobs };

    const updated = await prisma.savedAnswer.update({
      where: { id },
      data,
      include: { jobs: { select: savedAnswerJobsSelect } },
    });

    res.json(updated);
  } catch (error) {
    if (error.message === 'INVALID_JOB_IDS') return res.status(400).json({ error: 'Validation Error', message: 'One or more selected jobs are not accessible.' });
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

module.exports = router;
