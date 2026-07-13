/**
 * Multi-post detection/generation: decides whether a conversation implies
 * more than one piece of content should be created, and drafts the list of
 * additional content types.
 */
const { utilityPrompts } = require('../prompt-utils');
const { GENERATION_CONFIG } = require('./config');

/**
 * Check if multiple posts should be created
 */
async function shouldCreateMultiplePosts(chatHistory, primaryType, { aiText, logger }) {
  logger.info('Checking for multiple posts', { primaryType });

  try {
    const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n').toLowerCase();

    // Check for indicators
    const indicators = [
      /(?:also|additionally|plus|and|create|make).*?(?:blog|project|experience|skill)/i,
      /(?:multiple|several|few|both|all).*?(?:posts|content|items)/i,
      /(?:link|connect|relate|associate).*?(?:project|blog|skill|experience)/i
    ];

    const hasIndicators = indicators.some(pattern => pattern.test(conversationText));

    const prompt = utilityPrompts.shouldCreateMultiplePosts(conversationText, primaryType);

    const result = await aiText(prompt, {
      temperature: GENERATION_CONFIG.VERY_PRECISE.temperature,
      maxTokens: GENERATION_CONFIG.VERY_PRECISE.maxOutputTokens,
      context: 'Check multiple posts',
    });

    const answer = result.trim().toLowerCase();
    const shouldCreate = answer.includes('yes') || hasIndicators;

    logger.info('Multiple posts check result', { shouldCreate });
    return shouldCreate;

  } catch (error) {
    logger.error('Error checking for multiple posts', { error: error.message });
    return false;
  }
}

/**
 * Generate multiple linked posts
 */
async function generateMultiplePosts(chatHistory, context, { aiText, logger }) {
  logger.info('Generating multiple posts list');

  try {
    const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = utilityPrompts.generateMultiplePosts(conversationText);

    const result = await aiText(prompt, {
      temperature: GENERATION_CONFIG.PRECISE.temperature,
      maxTokens: GENERATION_CONFIG.PRECISE.maxOutputTokens,
      context: 'Generate multiple posts',
    });

    // Extract JSON array
    let responseText = result.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = responseText.match(/\[.*\]/);

    if (jsonMatch) {
      const additionalTypes = JSON.parse(jsonMatch[0]);
      if (Array.isArray(additionalTypes) && additionalTypes.length > 0) {
        const validTypes = additionalTypes.filter(t => ['PROJECT', 'BLOG', 'EXPERIENCE'].includes(t));
        logger.info('Multiple posts generated', { types: validTypes });
        return validTypes;
      }
    }

    return [];
  } catch (error) {
    logger.error('Error generating multiple posts list', { error: error.message });
    return [];
  }
}

module.exports = {
  shouldCreateMultiplePosts,
  generateMultiplePosts
};
