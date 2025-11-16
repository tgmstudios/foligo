/**
 * Centralized configuration for Gemini service
 */

const { HarmBlockThreshold, HarmCategory } = require('@google/generative-ai');

// Model configurations
const MODEL_CONFIG = {
  FLASH: 'gemini-flash-latest',
  PRO: 'gemini-2.5-pro'
};

// Default generation configurations
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
    maxOutputTokens: 1024
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

// Safety settings configuration
// Using BLOCK_ONLY_HIGH to be more permissive for portfolio content
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
  }
];

// System instructions for different models
const SYSTEM_INSTRUCTIONS = {
  FLASH: `You are a helpful AI assistant specialized in portfolio content creation. You help users create professional blog posts, project descriptions, and work experience descriptions. Always be conversational, friendly, and helpful.`,
  
  PRO: `You are a professional content writer specialized in creating high-quality portfolio content. You transform conversational information into polished, engaging, and well-structured content. Your writing is clear, compelling, and tailored to showcase the user's skills and achievements.`,
  
  CHAT: `You are a conversational AI assistant helping users create portfolio content. Write in plain text without markdown formatting. Be friendly, natural, and ask follow-up questions to gather the information needed to create great content.`
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    '429', // Too many requests
    '500', // Internal server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504'  // Gateway timeout
  ]
};

module.exports = {
  MODEL_CONFIG,
  GENERATION_CONFIG,
  SAFETY_SETTINGS,
  SYSTEM_INSTRUCTIONS,
  RETRY_CONFIG
};

