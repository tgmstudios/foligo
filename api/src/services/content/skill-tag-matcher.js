/**
 * Match-or-create helpers for Skill/ContentTag records, deduplicating the
 * near-identical implementations previously duplicated in routes/ai-content.js
 * and services/ai-session/index.js. This is the canonical implementation used by both.
 */

/**
 * Find-or-create each skill by (name, category), link it to the project if
 * not already linked, and return the matched/created skill records.
 *
 * @param {object} prisma
 * @param {Array<{name: string, category?: string}>} skills
 * @param {string} projectId
 * @param {object} [logger=console]
 * @returns {Promise<Array<{id: string, name: string, category: string|null}>>}
 */
async function matchOrCreateSkills(prisma, skills, projectId, logger = console) {
  if (!skills || skills.length === 0) return [];
  if (!projectId) {
    logger.warn('No project ID provided for skills matching');
    return [];
  }

  const matchedSkills = [];

  for (const skillData of skills) {
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

  return matchedSkills;
}

/**
 * Find-or-create each tag by (name, category), link it to the project if
 * not already linked, and return the matched/created tag records.
 *
 * @param {object} prisma
 * @param {Array<{name: string, category?: string}>} tags
 * @param {string} projectId
 * @param {object} [logger=console]
 * @returns {Promise<Array<{id: string, name: string, category: string|null}>>}
 */
async function matchOrCreateTags(prisma, tags, projectId, logger = console) {
  if (!tags || tags.length === 0) return [];
  if (!projectId) {
    logger.warn('No project ID provided for tags matching');
    return [];
  }

  const matchedTags = [];

  for (const tagData of tags) {
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

  return matchedTags;
}

module.exports = { matchOrCreateSkills, matchOrCreateTags };
