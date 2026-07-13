/**
 * Internal AI-call helpers (replaces the old _callModelWithRetry).
 * Wraps the model-agnostic AIManager singleton with the retry/logging
 * calls in the rest of this module.  Wraps the model-agnostic AIManager
 */
const ai = require('../ai/manager');
const { GeminiAPIError } = require('../core/errors');

/**
 * Build the { aiText, aiChat } helpers bound to a given logger.
 * @param {object} logger
 */
function createAiClient(logger) {
  /** Simple text generation through AIManager. Keeps retry + logging. */
  async function aiText(prompt, options = {}) {
    const { context = 'AI call', ...genOpts } = options;
    logger.debug(`_aiText: ${context}`, { promptLen: prompt.length });
    try {
      const { text } = await ai.generateText(prompt, genOpts);
      return text;
    } catch (error) {
      logger.error(`${context} failed`, { error: error.message });
      throw new GeminiAPIError(`${context} failed: ${error.message}`, error);
    }
  }

  /** Chat/tools generation through AIManager. Provider chosen by AI_DEFAULT_PROVIDER env var. */
  async function aiChat(messages, options = {}) {
    const { context = 'AI chat', ...genOpts } = options;
    logger.debug(`_aiChat: ${context}`, { msgCount: messages.length });
    try {
      return await ai.generateChat(messages, genOpts);
    } catch (error) {
      logger.error(`${context} failed`, { error: error.message });
      throw new GeminiAPIError(`${context} failed: ${error.message}`, error);
    }
  }

  return { aiText, aiChat };
}

module.exports = { createAiClient };
