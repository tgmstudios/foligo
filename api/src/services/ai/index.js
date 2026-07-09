/**
 * AI Module — model-agnostic AI abstraction for Foligo.
 * 
 * Quick start:
 *   const ai = require('./services/ai');
 *   const text = await ai.generateText('Hello world');
 *   const { text, functionCalls } = await ai.generateChat(messages, { tools });
 *   const providers = await ai.listProviders(); // for UIs
 */

const aim = require('./manager');

module.exports = {
  // Core methods
  generateText: (prompt, opts) => aim.generateText(prompt, opts),
  generateChat: (messages, opts) => aim.generateChat(messages, opts),
  generateWithTools: (prompt, tools, opts) => aim.generateWithTools(prompt, tools, opts),

  // Provider management
  listProviders: () => aim.listProviders(),
  testProvider: (type) => aim.testProvider(type),
  getProvider: (type, overrides) => aim.getProvider(type, overrides),

  // Direct access to manager for advanced use
  manager: aim,

  // Re-export provider classes for direct instantiation
  providers: {
    Gemini: require('./providers/gemini'),
    OpenAI: require('./providers/openai-compatible'),
    Anthropic: require('./providers/anthropic'),
  },
};
