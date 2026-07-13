/**
 * Resume chatbot session — specialized for resume and job application
 * assistance. Uses a larger context window and specialized prompts.
 */
const { GeminiAPIError } = require('../errors');
const { AI_RESUME_CHATBOT_TOOLS } = require('../gemini-tools');
const { buildResumeChatbotSystemPrompt } = require('../resume-chatbot-prompts');
const { GENERATION_CONFIG } = require('./config');
const { handleFunctionCall } = require('./session-flow');

async function handleResumeChatbotSession(resumeText, jobPosting, chatHistory, userId, context = {}, { aiChat, logger }) {
  logger.info('Starting resume chatbot session', {
    hasResume: !!resumeText,
    hasJobPosting: !!jobPosting,
    chatHistoryLength: chatHistory.length
  });

  try {
    // Build system prompt for resume chatbot
    const systemPrompt = buildResumeChatbotSystemPrompt(resumeText, jobPosting, context);

    // Build messages from chat history
    const messages = chatHistory.slice(-20).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Ensure starts with 'user'
    while (messages.length > 0 && messages[0].role !== 'user') messages.shift();

    // If no messages, add initial prompt
    if (messages.length === 0) {
      const initialMsg = resumeText && jobPosting
        ? 'I have uploaded my resume and a job posting. Can you help me tailor my resume for this position?'
        : resumeText
        ? 'I have uploaded my resume. Can you help me improve it?'
        : jobPosting
        ? 'I have a job posting. Can you help me understand what they\'re looking for?'
        : 'Hello! I need help with my resume and job applications.';
      messages.push({ role: 'user', content: initialMsg });
    }

    logger.info('Calling AI for resume chatbot', { msgCount: messages.length });

    // Call through AIManager with tools + system prompt
    const { text: responseText, functionCalls } = await aiChat(messages, {
      tools: AI_RESUME_CHATBOT_TOOLS,
      systemInstruction: systemPrompt,
      temperature: GENERATION_CONFIG.RESUME_CHATBOT.temperature,
      maxTokens: GENERATION_CONFIG.RESUME_CHATBOT.maxOutputTokens,
      context: 'Resume chatbot session',
    });

    // Check for function calls (e.g., fetchExistingPost)
    if (functionCalls && functionCalls.length > 0) {
      logger.info('Resume chatbot - function call detected', {
        functionName: functionCalls[0].name
      });
      return await handleFunctionCall({ name: functionCalls[0].name, args: functionCalls[0].args }, 'BLOG', { logger });
    }

    if (!responseText || responseText.trim().length === 0) {
      logger.error('Resume chatbot returned empty response');
      return { message: 'I apologize, but I ran into an issue. Please try again.', done: false };
    }

    logger.info('Resume chatbot - response received', {
      responseLength: responseText.length
    });

    return {
      message: responseText,
      done: false
    };

  } catch (error) {
    logger.error('Resume chatbot session EXCEPTION', {
      error: error.message,
      stack: error.stack
    });
    throw new GeminiAPIError(`Failed to handle resume chatbot session: ${error.message}`, error);
  }
}

module.exports = { handleResumeChatbotSession };
