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
const {
  createContentCreateTools,
  createContentEditTools
} = require('../ai/tools');
const { buildConversationalSystemPrompt } = require('../content/conversation-prompts');
const { GENERATION_CONFIG } = require('./config');
const {
  extractStructuredData,
  extractStructuredDataUniversal,
  buildMetadataFromStructuredData,
  extractTitleFromConversation
} = require('./metadata');
const { shouldCreateMultiplePosts, generateMultiplePosts } = require('./multi-post');

function buildInitialMessage(contentType) {
  return contentType
    ? `I want to create ${contentType === 'BLOG' ? 'a blog post' : contentType === 'PROJECT' ? 'a project description' : contentType === 'EXPERIENCE' ? 'a work experience entry' : 'content'}.`
    : 'Hi, I want to create some content.';
}

/**
 * Handle AI session — non-streaming path.
 *
 * Consumes the ai SDK stream internally, collecting the final text, any
 * tool-call signals, and the completion marker from Foligo signal tools.
 */
async function handleAISession(mode, contentType, initialInfo, chatHistory, context = {}, { logger, userId, sessionKey, fetchPost }) {
  logger.info('Starting AI session', { mode, contentType, chatHistoryLength: chatHistory.length });

  try {
    const systemInstruction = buildConversationalSystemPrompt(mode, contentType, initialInfo, context);
    const tools = mode === 'edit'
      ? createContentEditTools({ userId, sessionKey, fetchPost })
      : createContentCreateTools({ userId, sessionKey, fetchPost });

    const messages = chatHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    while (messages.length > 0 && messages[0].role !== 'user') messages.shift();
    if (messages.length === 0) {
      messages.push({ role: 'user', content: buildInitialMessage(contentType) });
    }

    // Collect the full stream — same multi-step loop the editor uses.
    let text = '';
    let finalToolCall = null;
    let finalToolResult = null;
    const toolCalls = [];

    for await (const part of ai.streamChat(messages, {
      systemInstruction,
      tools,
      maxSteps: 30,
      temperature: GENERATION_CONFIG.CHAT.temperature,
      maxTokens: GENERATION_CONFIG.CHAT.maxOutputTokens,
    })) {
      if (part.type === 'text-delta') text += part.text;

      if (part.type === 'tool-call') {
        finalToolCall = { name: part.toolName, args: part.input, toolCallId: part.toolCallId };
        toolCalls.push(finalToolCall);
        logger.info('Tool call', { toolName: part.toolName, argsPreview: JSON.stringify(part.input).substring(0, 200) });
      }

      if (part.type === 'tool-result') {
        finalToolResult = part.output;
        logger.info('Tool result', { toolName: part.toolName });
      }
    }

    // If the AI called a Foligo completion signal, extract the result.
    if (finalToolCall) {
      const name = finalToolCall.name;
      const args = finalToolCall.args;

      if (name === 'signalContentReadyForGeneration') {
        const result = finalToolResult?._action === 'contentReady'
          ? finalToolResult : { _action: 'contentReady', ...args };
        return {
          done: true,
          summary: result.summary,
          contentType: result.contentType || contentType,
          message: text || "Perfect! I have everything I need to create your content.",
          toolActivity: toolCalls.map(tc => ({ toolName: tc.name, input: tc.args, status: 'done' }))
        };
      }

      if (name === 'signalEditReadyForGeneration') {
        const result = finalToolResult?._action === 'editReady'
          ? finalToolResult : { _action: 'editReady', ...args };
        return {
          done: true,
          summary: result.summary,
          changes: result.changes,
          contentType,
          message: text || "Got it! I'll apply those changes now.",
          toolActivity: toolCalls.map(tc => ({ toolName: tc.name, input: tc.args, status: 'done' }))
        };
      }

      if (name === 'fetchExistingPost') {
        return {
          done: false,
          toolcall: 'fetch_post',
          postId: args.postId,
          message: text || `Fetching "${args.postTitle || 'the post'}"...`,
          contentType,
          toolActivity: toolCalls.map(tc => ({ toolName: tc.name, input: tc.args, status: 'done' }))
        };
      }

      // Tool was executed (GitHub, etc.) — return conversational response
      return {
        message: text || 'I gathered some information from your GitHub.',
        done: false,
        contentType,
        toolActivity: toolCalls.map(tc => ({ toolName: tc.name, input: tc.args, status: 'done' }))
      };
    }

    // No tool call — plain conversational response
    if (!text || text.trim().length === 0) {
      logger.error('AI returned empty response');
      return { message: "I apologize, but I ran into an issue. Please try again.", done: false, contentType };
    }

    return { message: text, done: false, contentType };

  } catch (error) {
    logger.error('AI session EXCEPTION', { error: error.message, stack: error.stack, mode, contentType });
    throw new GeminiAPIError(`Failed to handle AI session: ${error.message}`, error);
  }
}

/**
 * Stream a content-creator conversation turn.
 *
 * This is now a thin wrapper around `ai.streamChat` with `maxSteps: 6` —
 * the exact same multi-step tool-calling pattern used by the content editor
 * and resume editor.  All tools have `execute` handlers so the SDK
 * auto-executes GitHub browse/read/search calls and feeds results back
 * to the AI without any external loop.
 *
 * Completion signals (signalContentReadyForGeneration, etc.) are yielded
 * as normal tool-call / tool-result events — the route handler watches
 * for them to know when to trigger content generation.
 */
async function* streamAISession(mode, contentType, initialInfo, chatHistory, context = {}, { logger, userId, sessionKey, fetchPost }) {
  const systemInstruction = buildConversationalSystemPrompt(mode, contentType, initialInfo, context);
  const tools = mode === 'edit'
    ? createContentEditTools({ userId, sessionKey, fetchPost })
    : createContentCreateTools({ userId, sessionKey, fetchPost });

  const messages = chatHistory.slice(-10).map(message => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: message.content
  }));

  while (messages.length > 0 && messages[0].role !== 'user') messages.shift();
  if (messages.length === 0) {
    messages.push({ role: 'user', content: buildInitialMessage(contentType) });
  }

  // Same multi-step agentic loop the editor/resume chats use.
  for await (const part of ai.streamChat(messages, {
    systemInstruction,
    tools,
    maxSteps: 30,
    temperature: GENERATION_CONFIG.CHAT.temperature,
    maxTokens: GENERATION_CONFIG.CHAT.maxOutputTokens,
  })) {
    yield part;
  }
}

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

/**
 * Stream final content generation over SSE.
 * Yields text-delta events as the model generates, then runs extraction
 * and yields the final result.  Keeps the connection alive so nginx/load
 * balancer timeouts are never hit.
 */
async function* streamGenerateFinalContent(mode, contentType, chatHistory, currentContent, changes, context = {}, { aiText, logger }) {
  logger.info('Streaming final content generation', { mode, contentType });

  const {
    projectGenerationPrompt,
    experienceGenerationPrompt,
    blogGenerationPrompt,
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

  // Phase 1: stream the markdown generation
  let fullResponse = '';
  yield { type: 'status', phase: 'generating', message: 'The model is drafting your content…' };

  try {
    for await (const part of ai.streamGenerate(prompt, {
      temperature: GENERATION_CONFIG.CREATIVE.temperature,
      maxTokens: GENERATION_CONFIG.CREATIVE.maxOutputTokens,
      modelType: 'LONG',
    })) {
      if (part.type === 'reasoning-delta') {
        yield { type: 'reasoning-delta', text: part.text };
      } else {
        fullResponse += part.text;
        yield { type: 'text-delta', text: part.text };
      }
    }
  } catch (error) {
    logger.error('Stream generation error', { error: error.message });
    yield { type: 'error', message: `Generation failed: ${error.message}` };
    return;
  }

  // Phase 2: extract structured data
  yield { type: 'status', phase: 'extracting', message: 'Separating the draft from its metadata…' };

  const { markdownContent, structuredData: xmlData } = extractStructuredData(fullResponse, { logger });
  let finalStructuredData = xmlData;

  if (!finalStructuredData) {
    finalStructuredData = await extractStructuredDataUniversal(
      contentType, markdownContent, chatHistory, context, { aiText, logger }
    );
  }

  const skills = finalStructuredData?.skills || [];
  const tags = finalStructuredData?.tags || [];
  let title = finalStructuredData?.title;
  if (!title || title.length < 3) {
    title = await extractTitleFromConversation(contentType, chatHistory, markdownContent, { aiText, logger });
  }
  const metadata = buildMetadataFromStructuredData(finalStructuredData, contentType);
  const excerpt = finalStructuredData?.excerpt || null;

  yield {
    type: 'result',
    content: markdownContent,
    title,
    excerpt,
    metadata,
    skills,
    tags,
    structuredData: finalStructuredData,
  };
}

module.exports = {
  handleAISession,
  streamAISession,
  handleFunctionCall,
  getFollowUpMessage,
  generateFinalContent,
  streamGenerateFinalContent,
};
