/**
 * Core conversational session flow: handleAISession / streamAISession (the
 * function-calling conversation loop), function-call dispatch, and final
 * content generation.
 */
const ai = require('../ai/manager');
const { GeminiAPIError } = require('../core/errors');
const {
  AI_CONTENT_CREATE_TOOLS,
  AI_CONTENT_EDIT_TOOLS
} = require('../ai/gemini-tools');
const { buildConversationalSystemPrompt } = require('../content/conversation-prompts');
const { GENERATION_CONFIG } = require('./config');
const {
  extractStructuredData,
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
 * Handle AI session - main conversation handler
 * Now uses Function Calling for structured, reliable responses
 */
async function handleAISession(mode, contentType, initialInfo, chatHistory, context = {}, { aiChat, logger }) {
  logger.info('Starting AI session with Function Calling', {
    mode,
    contentType,
    chatHistoryLength: chatHistory.length
  });

  try {
    // Build the consolidated system prompt
    const systemPrompt = buildConversationalSystemPrompt(mode, contentType, initialInfo, context);

    logger.debug('System prompt built', {
      promptLength: systemPrompt.length,
      mode,
      contentType
    });

    // Log the actual prompt for debugging (first 500 chars)
    logger.debug('System prompt preview', {
      preview: systemPrompt.substring(0, 500)
    });

    // Pick tools based on mode (create vs edit)
    const toolsForMode = mode === 'edit' ? AI_CONTENT_EDIT_TOOLS : AI_CONTENT_CREATE_TOOLS;

    // Build message list from history — send all in one call via AIManager
    const messages = chatHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Ensure starts with 'user' role
    while (messages.length > 0 && messages[0].role !== 'user') messages.shift();

    // Guard: empty history on initial create — inject a default starter message
    if (messages.length === 0) {
      messages.push({ role: 'user', content: buildInitialMessage(contentType) });
    }

    logger.debug('Chat history prepared', {
      originalLength: chatHistory.length,
      formattedLength: messages.length,
    });

    // Call through AIManager — provider handles model, tools, system prompt
    const { text: responseText, reasoning, functionCalls } = await aiChat(messages, {
      tools: toolsForMode,
      systemInstruction: systemPrompt,
      temperature: GENERATION_CONFIG.CHAT.temperature,
      maxTokens: GENERATION_CONFIG.CHAT.maxOutputTokens,
      context: 'AI session',
    });

    logger.debug('Response received', {
      hasText: !!responseText,
      textLength: responseText?.length || 0,
      hasFunctionCalls: !!functionCalls,
      functionCount: functionCalls?.length || 0,
    });

    // Check for function calls FIRST (structured response)
    // Now in model-agnostic format: [{name, args}]
    if (functionCalls && functionCalls.length > 0) {
      logger.info('AI session - function call detected', {
        functionName: functionCalls[0].name,
        mode,
        contentType,
        argsPreview: JSON.stringify(functionCalls[0].args).substring(0, 200)
      });
      const toolCall = functionCalls[0];
      const handled = await handleFunctionCall({ name: toolCall.name, args: toolCall.args }, contentType, { logger });
      return {
        ...handled,
        reasoning: reasoning || undefined,
        toolActivity: [{
          toolName: toolCall.name,
          input: toolCall.args,
          status: 'done'
        }]
      };
    }

    logger.debug('Checking for function calls', {
      hasFunctionCalls: !!functionCalls,
      functionCallsLength: functionCalls?.length || 0
    });

    if (functionCalls && functionCalls.length > 0) {
      logger.info('AI session - function call detected', {
        functionName: functionCalls[0].name,
        mode,
        contentType,
        argsPreview: JSON.stringify(functionCalls[0].args).substring(0, 200)
      });
      return await handleFunctionCall(functionCalls[0], contentType, { logger });
    }

    // If no function call, it's a regular conversational response
    logger.debug('No function call, returning text response');

    // Warn if response is empty
    if (!responseText || responseText.trim().length === 0) {
      logger.error('AI returned empty response', {
        mode, contentType,
        chatHistoryLength: chatHistory.length,
        systemPromptLength: systemPrompt.length,
      });
      return {
        message: "I apologize, but I ran into an issue. Please try again.",
        done: false,
        contentType: contentType
      };
    }

    logger.info('AI session - conversational response', {
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 100)
    });

    return {
      message: responseText,
      reasoning: reasoning || undefined,
      done: false,
      contentType: contentType
    };

  } catch (error) {
    logger.error('AI session EXCEPTION', {
      error: error.message,
      errorName: error.name,
      stack: error.stack,
      mode,
      contentType,
      chatHistoryLength: chatHistory.length
    });
    throw new GeminiAPIError(`Failed to handle AI session: ${error.message}`, error);
  }
}

/**
 * Stream a content-creator conversation turn. Raw reasoning, text, and tool
 * events are yielded immediately; the final session state is returned as a
 * synthetic session-result event so the route can execute server-side tools.
 */
async function* streamAISession(mode, contentType, initialInfo, chatHistory, context = {}, { logger }) {
  const systemInstruction = buildConversationalSystemPrompt(mode, contentType, initialInfo, context);
  const tools = mode === 'edit' ? AI_CONTENT_EDIT_TOOLS : AI_CONTENT_CREATE_TOOLS;
  const messages = chatHistory.slice(-10).map(message => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: message.content
  }));

  while (messages.length > 0 && messages[0].role !== 'user') messages.shift();
  if (messages.length === 0) {
    messages.push({ role: 'user', content: buildInitialMessage(contentType) });
  }

  let text = '';
  let toolCall = null;
  for await (const part of ai.streamChat(messages, {
    systemInstruction,
    tools,
    maxSteps: 1,
    temperature: GENERATION_CONFIG.CHAT.temperature,
    maxTokens: GENERATION_CONFIG.CHAT.maxOutputTokens
  })) {
    if (part.type === 'text-delta') text += part.text;
    if (part.type === 'tool-call' && !toolCall) {
      toolCall = { name: part.toolName, args: part.input, toolCallId: part.toolCallId };
    }
    yield part;
  }

  const result = toolCall
    ? await handleFunctionCall(toolCall, contentType, { logger })
    : { message: text || 'I apologize, but I ran into an issue. Please try again.', done: false, contentType };
  yield { type: 'session-result', result, toolCall };
}

/**
 * Private: Handle function call from AI
 * This replaces the old regex-based JSON parsing
 */
async function handleFunctionCall(functionCall, currentContentType, { logger }) {
  const { name, args } = functionCall;

  logger.info('Function call received', {
    functionName: name,
    args: JSON.stringify(args)
  });

  switch (name) {
    case 'signalContentReadyForGeneration':
      logger.info('Content ready for generation', {
        contentType: args.contentType,
        summaryLength: args.summary?.length || 0
      });
      return {
        done: true,
        summary: args.summary,
        contentType: args.contentType,
        message: "Perfect! I have everything I need to create your content."
      };

    case 'signalEditReadyForGeneration':
      return {
        done: true,
        summary: args.summary,
        changes: args.changes,
        contentType: currentContentType,
        message: "Got it! I'll apply those changes now."
      };

    case 'fetchExistingPost':
      return {
        done: false,
        toolcall: 'fetch_post',
        postId: args.postId,
        message: `Fetching "${args.postTitle || 'the post'}"...`,
        contentType: currentContentType
      };

    case 'createStructuredResumeDraft':
      // Resume chatbot: create a saved resume document that the agentic resume editor can open.
      // IMPORTANT: No additional AI is called on the server; the provided resumeContent LaTeX is used as-is.
      return {
        done: true,
        toolcall: 'create_resume_document',
        resume: {
          name: args.name,
          jobDescription: args.jobDescription || '',
          resumeContent: args.resumeContent
        },
        message: "Great, I've created a resume draft. You can open it in the Resume Editor to keep refining and export it."
      };

    default:
      logger.warn('Unknown function call', { functionName: name });
      return {
        done: false,
        message: "I'm not sure what to do next. Can you provide more details?",
        contentType: currentContentType
      };
  }
}

/**
 * Private: Get a natural follow-up message after content type change
 */
function getFollowUpMessage(contentType) {
  const followUps = {
    'PROJECT': 'What did you build and what problem does it solve?',
    'EXPERIENCE': 'What was your role and where did you work?',
    'BLOG': 'What would you like to write about?'
  };
  return followUps[contentType] || 'Tell me more about it.';
}

/**
 * Generate final content
 * Now uses XML-based prompts and structured_data extraction
 */
async function generateFinalContent(mode, contentType, chatHistory, currentContent, changes, context = {}, { aiText, logger }) {
  logger.info('Generating final content with XML prompts', {
    mode,
    contentType,
    chatHistoryLength: chatHistory.length
  });

  try {
    const {
      projectGenerationPrompt,
      experienceGenerationPrompt,
      blogGenerationPrompt,
      skillGenerationPrompt,
      editGenerationPrompt
    } = require('../content/content-generation-prompts');

    // Build the appropriate prompt based on mode and type
    let prompt;
    if (mode === 'edit') {
      prompt = editGenerationPrompt(currentContent, changes, chatHistory, context);
    } else {
      const promptMap = {
        'PROJECT': projectGenerationPrompt,
        'EXPERIENCE': experienceGenerationPrompt,
        'BLOG': blogGenerationPrompt
      };

      const promptGenerator = promptMap[contentType];
      if (!promptGenerator) {
        throw new Error(`Unknown content type: ${contentType}`);
      }

      prompt = promptGenerator(chatHistory, context);
    }

    logger.debug('Content generation prompt', {
      promptLength: prompt.length
    });

    // Generate content via AIManager (model-agnostic)
    const fullResponse = await aiText(prompt, {
      temperature: GENERATION_CONFIG.CREATIVE.temperature,
      maxTokens: GENERATION_CONFIG.CREATIVE.maxOutputTokens,
      modelType: 'LONG',
      context: 'Content generation',
    });

    logger.info('Content generated - FULL RESPONSE', {
      responseLength: fullResponse.length,
      fullResponse: fullResponse // Log entire response for debugging
    });

    // Extract structured_data block and markdown content
    const { markdownContent, structuredData } = extractStructuredData(fullResponse, { logger });

    logger.info('Extracted content and structured data', {
      markdownLength: markdownContent.length,
      hasStructuredData: !!structuredData,
      structuredData: structuredData ? JSON.stringify(structuredData, null, 2) : null
    });

    // Extract skills and tags from structured data
    // Return them without IDs - frontend will handle matching/creating
    const extractedSkills = structuredData?.skills || [];
    const extractedTags = structuredData?.tags || [];

    logger.info('Skills and tags extracted from structured data', {
      skillsCount: extractedSkills.length,
      tagsCount: extractedTags.length,
      skills: extractedSkills,
      tags: extractedTags
    });

    // Use title from structured data or extract from conversation
    let title = structuredData?.title;
    if (!title || title.length < 3) {
      logger.debug('Title missing or too short, extracting from conversation');
      title = await extractTitleFromConversation(contentType, chatHistory, markdownContent, { aiText, logger });
    }

    // Build metadata from structured data
    const metadata = buildMetadataFromStructuredData(structuredData, contentType);

    logger.debug('Metadata built from structured data', {
      metadata: metadata
    });

    // Check for multiple posts
    const shouldCreateMultiple = await shouldCreateMultiplePosts(chatHistory, contentType, { aiText, logger });

    const result = {
      content: markdownContent,
      title,
      excerpt: structuredData?.excerpt || null,
      metadata,
      skills: extractedSkills, // Return raw skills without IDs - frontend will handle matching
      tags: extractedTags, // Return raw tags without IDs - frontend will handle matching
      structuredData // Include full structured data for direct field mapping
    };

    if (shouldCreateMultiple) {
      const multiplePosts = await generateMultiplePosts(chatHistory, context, { aiText, logger });
      result.multiplePosts = multiplePosts || null;
    }

    logger.info('Final content prepared - COMPLETE RESULT', {
      title,
      excerpt: result.excerpt?.substring(0, 100),
      skillsCount: extractedSkills.length,
      tagsCount: extractedTags.length,
      hasMultiplePosts: !!result.multiplePosts,
      hasStructuredData: !!structuredData,
      structuredDataKeys: structuredData ? Object.keys(structuredData) : [],
      projectLinks: structuredData?.projectLinks,
      startDate: structuredData?.startDate,
      endDate: structuredData?.endDate,
      isOngoing: structuredData?.isOngoing
    });

    return result;

  } catch (error) {
    logger.error('Content generation error', { error: error.message, stack: error.stack });
    throw new GeminiAPIError(`Failed to generate final content: ${error.message}`, error);
  }
}

module.exports = {
  handleAISession,
  streamAISession,
  handleFunctionCall,
  getFollowUpMessage,
  generateFinalContent
};
