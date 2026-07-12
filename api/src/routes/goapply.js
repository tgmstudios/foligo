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

// Everything beyond the original core fields (name/email/phone/location/
// linkedin/github/portfolio/resumeUrl) mirrors the extension's autofill field
// taxonomy (Personal Info, Location, EEO, Work Authorization, Social & Links,
// Other) 1:1 with matching Prisma columns, so it can pass straight through
// without translation. Education/Experience/Skills fields are NOT here — those
// are fully derived from linkedJobs/linkedEducation/linkedSkills (see
// computeDerivedFields) instead of being stored as flat text.
const PROFILE_PASSTHROUGH_FIELDS = [
  'firstName', 'lastName', 'middleName', 'preferredName', 'legalName', 'username',
  'phoneType', 'phoneCountry', 'birthday', 'pronouns',
  'address', 'address2', 'city', 'state', 'country', 'postalCode',
  'language',
  'gender', 'ethnicity', 'hispanicLatino', 'veteranStatus', 'disabilityStatus', 'lgbtStatus',
  'over18', 'over21', 'hasDriversLicense',
  'workAuthUS', 'workAuth', 'sponsorshipRequired',
  'twitter', 'behance', 'dribbble', 'website',
  'desiredSalary', 'referredBy', 'source',
];

// Shape returned for each linked Content(EXPERIENCE) item — enough to render a
// summary card without a second round-trip, and to know which project it lives in.
const EXPERIENCE_INCLUDE = {
  roles: { include: { skills: true }, orderBy: { startDate: 'desc' } },
  linkedSkills: true,
  project: { select: { id: true, name: true } }
};

const PROFILE_INCLUDE = {
  linkedJobs: { include: EXPERIENCE_INCLUDE },
  linkedEducation: { include: EXPERIENCE_INCLUDE },
  linkedSkills: true
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

// Of a set of linked Content items, prefer one that's currently ongoing (a role
// marked isCurrent, or the content's own isOngoing flag); otherwise the most
// recently started one. Used to pick which linked job/education "represents"
// the flat autofill fields the extension reads.
function pickPrimary(items) {
  if (!items || items.length === 0) return null;
  const ongoing = items.find((item) => item.roles?.some((r) => r.isCurrent) || item.isOngoing);
  if (ongoing) return ongoing;
  return [...items].sort((a, b) => {
    const aDate = a.roles?.[0]?.startDate || a.startDate || 0;
    const bDate = b.roles?.[0]?.startDate || b.startDate || 0;
    return new Date(bDate) - new Date(aDate);
  })[0];
}

// GoApply has no flat job/education/skills storage anymore — everything the
// extension autofills for those fields is computed here, on read, from the
// linked Content(EXPERIENCE)/Skill objects.
function computeDerivedFields(profile) {
  const jobs = profile.linkedJobs || [];
  const education = profile.linkedEducation || [];

  const primaryJob = pickPrimary(jobs);
  const primaryRole = primaryJob?.roles?.[0];
  const primaryEducation = pickPrimary(education);
  const primaryEduRole = primaryEducation?.roles?.[0];

  // Approximate total years of experience by summing each job's role spans
  // (or its own start/end if it has no roles), treating ongoing spans as
  // running through today.
  let totalMs = 0;
  for (const job of jobs) {
    const spans = job.roles?.length
      ? job.roles
      : [{ startDate: job.startDate, endDate: job.endDate, isCurrent: job.isOngoing }];
    for (const span of spans) {
      if (!span.startDate) continue;
      const start = new Date(span.startDate).getTime();
      const end = span.isCurrent || !span.endDate ? Date.now() : new Date(span.endDate).getTime();
      if (end > start) totalMs += end - start;
    }
  }

  return {
    currentCompany: primaryJob?.title,
    currentTitle: primaryRole?.title,
    currentlyWorking: primaryRole ? primaryRole.isCurrent : primaryJob?.isOngoing,
    experienceSummary: primaryJob?.excerpt || undefined,
    yearsExperience: totalMs > 0 ? (totalMs / MS_PER_YEAR).toFixed(1) : undefined,
    school: primaryEducation?.title,
    // Content/ExperienceRole don't model "degree" separately from "discipline" —
    // both best-effort resolve to the same role title (e.g. "B.S. Computer Science").
    highestDegree: primaryEduRole?.title,
    discipline: primaryEduRole?.title,
    educationSummary: primaryEducation?.excerpt || undefined,
  };
}

// The DB column is named `fullName` but the dashboard's GoApplyProfile contract
// uses `name`; `skills` is now derived from linkedSkills rather than stored.
// Translate at the boundary so callers never see the storage representation.
function serializeProfile(profile) {
  if (!profile) return null;
  const { fullName, ...rest } = profile;
  const skills = (profile.linkedSkills || []).map((s) => s.name);
  return { ...rest, name: fullName, skills, ...computeDerivedFields(profile) };
}

// Project ids the user can read/write Content in — owns, or has a ProjectAccess row for.
// Mirrors the access check in authorizeProjectAccess (middleware/auth.js), just not tied
// to a single :projectId route param since GoApply searches/links across all of them.
async function getAccessibleProjectIds(userId) {
  const [owned, access] = await Promise.all([
    prisma.project.findMany({ where: { ownerId: userId }, select: { id: true } }),
    prisma.projectAccess.findMany({ where: { userId }, select: { projectId: true } })
  ]);
  return [...new Set([...owned.map(p => p.id), ...access.map(a => a.projectId)])];
}

// GET /api/goapply/profile — get logged-in user's profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE
    });

    res.json(serializeProfile(profile));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Profile Retrieval Failed',
      message: 'Unable to retrieve profile'
    });
  }
});

// GET /api/goapply/experience?category=JOB|EDUCATION&q=... — search the user's own
// portfolio Content(EXPERIENCE) items so they can be linked instead of retyped.
router.get('/experience', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, q } = req.query;

    if (!['JOB', 'EDUCATION'].includes(category)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'category must be JOB or EDUCATION'
      });
    }

    const projectIds = await getAccessibleProjectIds(userId);
    if (projectIds.length === 0) {
      return res.json([]);
    }

    const results = await prisma.content.findMany({
      where: {
        projectId: { in: projectIds },
        contentType: 'EXPERIENCE',
        experienceCategory: category,
        revisionOf: null,
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {})
      },
      include: EXPERIENCE_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    res.json(results);
  } catch (error) {
    console.error('Search experience error:', error);
    res.status(500).json({
      error: 'Experience Search Failed',
      message: 'Unable to search experience'
    });
  }
});

// Shared handler for linking a set of Content(EXPERIENCE) items to the profile,
// scoped to a single category so /profile/jobs can't be used to link education.
function linkExperienceHandler(category, relationField) {
  return async (req, res) => {
    try {
      const userId = req.user.id;
      const { contentIds } = req.body;

      if (!Array.isArray(contentIds)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'contentIds must be an array'
        });
      }

      if (contentIds.length > 0) {
        const projectIds = await getAccessibleProjectIds(userId);
        const validCount = await prisma.content.count({
          where: {
            id: { in: contentIds },
            projectId: { in: projectIds },
            contentType: 'EXPERIENCE',
            experienceCategory: category
          }
        });

        if (validCount !== contentIds.length) {
          return res.status(403).json({
            error: 'Access Denied',
            message: `One or more items are not an accessible ${category} entry`
          });
        }
      }

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          [relationField]: { connect: contentIds.map(id => ({ id })) }
        },
        update: {
          [relationField]: { set: contentIds.map(id => ({ id })) }
        },
        include: PROFILE_INCLUDE
      });

      res.json(serializeProfile(profile));
    } catch (error) {
      console.error(`Link ${category} error:`, error);
      res.status(500).json({
        error: 'Link Failed',
        message: `Unable to update linked ${category.toLowerCase()} entries`
      });
    }
  };
}

// PUT /api/goapply/profile/jobs — replace the set of linked Content(EXPERIENCE, JOB) items
router.put('/profile/jobs', linkExperienceHandler('JOB', 'linkedJobs'));

// PUT /api/goapply/profile/education — replace the set of linked Content(EXPERIENCE, EDUCATION) items
router.put('/profile/education', linkExperienceHandler('EDUCATION', 'linkedEducation'));

// PUT /api/goapply/profile/skills — replace the set of linked (global) Skill items
router.put('/profile/skills', async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillIds } = req.body;

    if (!Array.isArray(skillIds)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'skillIds must be an array'
      });
    }

    if (skillIds.length > 0) {
      const validCount = await prisma.skill.count({ where: { id: { in: skillIds } } });
      if (validCount !== skillIds.length) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'One or more skill ids do not exist'
        });
      }
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        linkedSkills: { connect: skillIds.map(id => ({ id })) }
      },
      update: {
        linkedSkills: { set: skillIds.map(id => ({ id })) }
      },
      include: PROFILE_INCLUDE
    });

    res.json(serializeProfile(profile));
  } catch (error) {
    console.error('Link skills error:', error);
    res.status(500).json({
      error: 'Link Failed',
      message: 'Unable to update linked skills'
    });
  }
});

// POST /api/goapply/skills — find-or-create a global Skill without requiring project
// access (mirrors POST /projects/:projectId/content skills creation in skills.js, minus
// the project gate — skills are a shared, harmless taxonomy any logged-in user can add to).
router.post('/skills', async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Skill name is required'
      });
    }

    const existingSkill = await prisma.skill.findFirst({
      where: { name: name.trim(), category: category || null }
    });

    const skill = existingSkill || await prisma.skill.create({
      data: { name: name.trim(), category: category || null }
    });

    res.status(existingSkill ? 200 : 201).json(skill);
  } catch (error) {
    console.error('Create global skill error:', error);
    res.status(500).json({
      error: 'Skill Creation Failed',
      message: 'Unable to create skill'
    });
  }
});

// PUT /api/goapply/profile — upsert profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, email, phone, location,
      linkedin, github, portfolio, resumeUrl
    } = req.body;

    const passthrough = {};
    for (const field of PROFILE_PASSTHROUGH_FIELDS) {
      if (req.body[field] !== undefined) passthrough[field] = req.body[field];
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: name || null,
        email: email || null,
        phone: phone || null,
        location: location || null,
        linkedin: linkedin || null,
        github: github || null,
        portfolio: portfolio || null,
        resumeUrl: resumeUrl || null,
        ...passthrough
      },
      update: {
        fullName: name !== undefined ? (name || null) : undefined,
        email: email !== undefined ? (email || null) : undefined,
        phone: phone !== undefined ? (phone || null) : undefined,
        location: location !== undefined ? (location || null) : undefined,
        linkedin: linkedin !== undefined ? (linkedin || null) : undefined,
        github: github !== undefined ? (github || null) : undefined,
        portfolio: portfolio !== undefined ? (portfolio || null) : undefined,
        resumeUrl: resumeUrl !== undefined ? (resumeUrl || null) : undefined,
        ...passthrough
      },
      include: PROFILE_INCLUDE
    });

    res.json(serializeProfile(profile));
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
