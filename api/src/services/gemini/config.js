/**
 * Generation-config constants for the gemini/* conversation & content flows.
 * Split out of the old gemini-config.js so this smaller, gemini-flow-specific
 * config no longer drags in provider/SDK-specific constants (those now live
 * in ai/providers/index.js).
 */

const GENERATION_CONFIG = {
  DEFAULT: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048
  },
  CREATIVE: {
    temperature: 0.8,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192
  },
  PRECISE: {
    temperature: 0.3,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 512
  },
  CHAT: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096  // Increased for function calling responses
  },
  RESUME_CHATBOT: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192  // Larger context window for resume/job application assistance
  },
  VERY_PRECISE: {
    temperature: 0.1,
    topK: 10,
    topP: 0.95,
    maxOutputTokens: 10
  },
  SHORT: {
    temperature: 0.3,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 50
  }
};

// System instructions for different models (currently unused by the
// model-agnostic AIManager path, kept for compatibility with anything that
// still imports it from here).
const SYSTEM_INSTRUCTIONS = {
  FLASH: `You are a helpful AI assistant specialized in portfolio content creation. You help users create professional blog posts, project descriptions, and work experience descriptions. Always be conversational, friendly, and helpful.`,

  PRO: `You are a professional content writer specialized in creating high-quality portfolio content. You transform conversational information into polished, engaging, and well-structured content. Your writing is clear, compelling, and tailored to showcase the user's skills and achievements.`,

  CHAT: `You are a conversational AI assistant helping users create portfolio content. Write in plain text without markdown formatting. Be friendly, natural, and ask follow-up questions to gather the information needed to create great content.`
};

module.exports = {
  GENERATION_CONFIG,
  SYSTEM_INSTRUCTIONS
};
