/**
 * Core conversational AI session flow — model-agnostic.
 *
 * Both paths use the exact same `ai.streamChat` + `maxSteps` pattern
 * that the content editor, resume editor, and every other agentic chat in
 * Foligo uses.  The ai SDK drives the full tool-calling loop —
 * no custom function-call dispatch or single-turn limitations.
 *
 * Foligo tools (signalContentReadyForGeneration, fetchExistingPost, etc.)
 * all have `execute` handlers so the SDK executes them natively.  The route
 * handler detects completion signals from streamed tool-call / tool-result
 * events.
 */
const ai = require('../ai/manager');
const { GeminiAPIError } = require('../core/errors');
const { GENERATION_CONFIG } = require('./config');
const {
  extractStructuredData,
  extractStructuredDataUniversal,
  buildMetadataFromStructuredData,
  extractTitleFromConversation
} = require('./metadata');
const { shouldCreateMultiplePosts, generateMultiplePosts } = require('./multi-post');

// ── Legacy handleFunctionCall kept for resume-chatbot.js compatibility ──

async function handleFunctionCall(functionCall, currentContentType, { logger, userId, sessionKey }) {
  const { name, args } = functionCall;
  logger.info('Function call received', { functionName: name, args: JSON.stringify(args) });

  switch (name) {
    case 'signalContentReadyForGeneration':
      return { done: true, summary: args.summary, contentType: args.contentType, message: "Perfect! I have everything I need to create your content." };
    case 'signalEditReadyForGeneration':
      return { done: true, summary: args.summary, changes: args.changes, contentType: currentContentType, message: "Got it! I'll apply those changes now." };
    case 'fetchExistingPost':
      return { done: false, toolcall: 'fetch_post', postId: args.postId, message: `Fetching "${args.postTitle || 'the post'}"...`, contentType: currentContentType };
    case 'createStructuredResumeDraft':
      return { done: true, toolcall: 'create_resume_document', resume: { name: args.name, jobDescription: args.jobDescription || '', resumeContent: args.resumeContent }, message: "Great, I've created a resume draft." };
    // GitHub tools
    case 'github_list_repos':
    case 'github_browse_files':
    case 'github_read_file':
    case 'github_search_code':
      try {
        const { createGithubTools } = require('../github/github-tools');
        const ghTools = createGithubTools({ userId, sessionKey });
        const impl = ghTools[name];
        if (!impl?.execute) throw new Error(`GitHub tool ${name} not available.`);
        const output = await impl.execute(args);
        return { done: false, toolcall: name, toolOutput: output, toolInput: args, message: null, contentType: currentContentType };
      } catch (error) {
        logger.error(`GitHub tool ${name} failed`, { error: error.message });
        return { done: false, message: `I tried to check your GitHub but ran into an issue: ${error.message}. Can you tell me about the project directly?`, contentType: currentContentType };
      }
    default:
      logger.warn('Unknown function call', { functionName: name });
      return { done: false, message: "I'm not sure what to do next. Can you provide more details?", contentType: currentContentType };
  }
}

function getFollowUpMessage(contentType) {
  const followUps = {
    'PROJECT': 'What did you build and what problem does it solve?',
    'EXPERIENCE': 'What was your role and where did you work?',
    'BLOG': 'What would you like to write about?'
  };
  return followUps[contentType] || 'Tell me more about it.';
}

async function generateFinalContent(mode, contentType, chatHistory, currentContent, changes, context = {}, { aiText, logger }) {
  logger.info('Generating final content with XML prompts', { mode, contentType, chatHistoryLength: chatHistory.length });

  try {
    const {
      projectGenerationPrompt,
      experienceGenerationPrompt,
      blogGenerationPrompt,
      skillGenerationPrompt,
      editGenerationPrompt
    } = require('../content/content-generation-prompts');

    let prompt;
    if (mode === 'edit') {
      prompt = editGenerationPrompt(currentContent, changes, chatHistory, context);
    } else {
      const promptMap = { 'PROJECT': projectGenerationPrompt, 'EXPERIENCE': experienceGenerationPrompt, 'BLOG': blogGenerationPrompt };
      const promptGenerator = promptMap[contentType];
      if (!promptGenerator) throw new Error(`Unknown content type: ${contentType}`);
      prompt = promptGenerator(chatHistory, context);
    }

    const fullResponse = await aiText(prompt, {
      temperature: GENERATION_CONFIG.CREATIVE.temperature,
      maxTokens: GENERATION_CONFIG.CREATIVE.maxOutputTokens,
      modelType: 'LONG',
      context: 'Content generation',
    });

    const { markdownContent, structuredData } = extractStructuredData(fullResponse, { logger });

    // Fallback: if the model didn't produce the XML structured_data block
    // (common with non-Gemini models like DeepSeek), extract via a separate
    // universal JSON-extraction call that works with any model.
    let finalStructuredData = structuredData;
    if (!finalStructuredData) {
      logger.info('XML structured_data not found, running universal extraction');
      finalStructuredData = await extractStructuredDataUniversal(
        contentType, markdownContent, chatHistory, context, { aiText, logger }
      );
    }

    const extractedSkills = finalStructuredData?.skills || [];
    const extractedTags = finalStructuredData?.tags || [];

    let title = finalStructuredData?.title;
    if (!title || title.length < 3) {
      title = await extractTitleFromConversation(contentType, chatHistory, markdownContent, { aiText, logger });
    }

    const metadata = buildMetadataFromStructuredData(finalStructuredData, contentType);

    const result = {
      content: markdownContent,
      title,
      excerpt: finalStructuredData?.excerpt || null,
      metadata,
      skills: extractedSkills,
      tags: extractedTags,
      structuredData: finalStructuredData
    };

    const shouldCreateMultiple = await shouldCreateMultiplePosts(chatHistory, contentType, { aiText, logger });
    if (shouldCreateMultiple) {
      const multiplePosts = await generateMultiplePosts(chatHistory, context, { aiText, logger });
      result.multiplePosts = multiplePosts || null;
    }

    return result;
  } catch (error) {
    logger.error('Content generation error', { error: error.message, stack: error.stack });
    throw new GeminiAPIError(`Failed to generate final content: ${error.message}`, error);
  }
}

module.exports = {
  handleFunctionCall,
  getFollowUpMessage,
  generateFinalContent,
};
