/**
 * Shared skill/tag matching helpers: given AI-extracted skills/tags, find an
 * existing Skill/ContentTag record (case-insensitive) or create a new one,
 * then link it to the given project.
 *
 * Extracted out of gemini.js (previously duplicated between gemini.js and
 * routes/ai-content.js).
 */
const { prisma } = require('./database');

/**
 * Match or create skills based on extracted skills from AI
 */
async function matchOrCreateSkills(extractedSkills, context, logger = console) {
  if (!extractedSkills || extractedSkills.length === 0) {
    return [];
  }

  logger.info('Matching or creating skills', { count: extractedSkills.length });

  const matchedSkills = [];

  const projectId = context.project?.id;
  if (!projectId) {
    logger.warn('No project ID provided for skills matching');
    return matchedSkills;
  }

  for (const skillData of extractedSkills) {
    const skillName = skillData.name?.trim();
    const skillCategory = skillData.category?.trim() || null;

    if (!skillName) continue;

    try {
      // Try to find existing skill
      let skill = await prisma.skill.findFirst({
        where: {
          name: { equals: skillName, mode: 'insensitive' },
          category: skillCategory || null
        }
      });

      // If not found, create it
      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: skillName,
            category: skillCategory
          }
        });
        logger.info('Created new skill', { name: skillName, category: skillCategory });
      }

      // Link skill to project if not already linked
      const existingLink = await prisma.skill.findFirst({
        where: {
          id: skill.id,
          projects: {
            some: {
              id: projectId
            }
          }
        }
      });

      if (!existingLink) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            skills: {
              connect: { id: skill.id }
            }
          }
        });
        logger.info('Linked skill to project', { skillId: skill.id, projectId });
      }

      matchedSkills.push({
        id: skill.id,
        name: skill.name,
        category: skill.category
      });
    } catch (error) {
      logger.error(`Error matching/creating skill ${skillName}`, { error: error.message });
    }
  }

  logger.info('Skills matched/created', { count: matchedSkills.length });
  return matchedSkills;
}

/**
 * Match or create tags based on extracted tags from AI
 */
async function matchOrCreateTags(extractedTags, context, logger = console) {
  if (!extractedTags || extractedTags.length === 0) {
    return [];
  }

  logger.info('Matching or creating tags', { count: extractedTags.length });

  const matchedTags = [];

  const projectId = context.project?.id;
  if (!projectId) {
    logger.warn('No project ID provided for tags matching');
    return matchedTags;
  }

  for (const tagData of extractedTags) {
    const tagName = tagData.name?.trim();
    const tagCategory = tagData.category?.trim() || null;

    if (!tagName) continue;

    try {
      // Try to find existing tag
      let tag = await prisma.contentTag.findFirst({
        where: {
          name: { equals: tagName, mode: 'insensitive' },
          category: tagCategory || null
        }
      });

      // If not found, create it
      if (!tag) {
        tag = await prisma.contentTag.create({
          data: {
            name: tagName,
            category: tagCategory
          }
        });
        logger.info('Created new tag', { name: tagName, category: tagCategory });
      }

      // Link tag to project if not already linked
      const existingLink = await prisma.contentTag.findFirst({
        where: {
          id: tag.id,
          projects: {
            some: {
              id: projectId
            }
          }
        }
      });

      if (!existingLink) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            tags: {
              connect: { id: tag.id }
            }
          }
        });
        logger.info('Linked tag to project', { tagId: tag.id, projectId });
      }

      matchedTags.push({
        id: tag.id,
        name: tag.name,
        category: tag.category
      });
    } catch (error) {
      logger.error(`Error matching/creating tag ${tagName}`, { error: error.message });
    }
  }

  logger.info('Tags matched/created', { count: matchedTags.length });
  return matchedTags;
}

module.exports = { matchOrCreateSkills, matchOrCreateTags };
