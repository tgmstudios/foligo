/**
 * Gemini Service — AI-powered content generation for Foligo.
 * 
 * NOW MODEL-AGNOSTIC: all AI calls are routed through the unified AIManager.
 * Defaults to Gemini but respects AI_DEFAULT_PROVIDER / AI_FALLBACK_CHAIN env vars.
 * The public API is unchanged — routes don't need modification.
 */
const { createGeminiLogger } = require('./logger');
const { fallbackQuestions, utilityPrompts } = require('./prompt-utils');
const { MODEL_CONFIG, GENERATION_CONFIG, SAFETY_SETTINGS, SYSTEM_INSTRUCTIONS } = require('./gemini-config');
const { GeminiConfigError, GeminiAPIError, GeminiParseError } = require('./errors');
const {
  AI_CONTENT_CREATE_TOOLS,
  AI_CONTENT_EDIT_TOOLS,
  AI_RESUME_CHATBOT_TOOLS
} = require('./gemini-tools');
const { buildConversationalSystemPrompt } = require('./conversation-prompts');
const { buildResumeChatbotSystemPrompt } = require('./resume-chatbot-prompts');
const ai = require('./ai/manager');  // ← model-agnostic AIManager

class GeminiService {
  constructor() {
    this.logger = createGeminiLogger();
    this.logger.info('Initializing AI service (model-agnostic)', {
      defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'gemini',
      fallback: process.env.AI_FALLBACK_CHAIN || 'gemini,opencode',
    });
  }

  // ─── Internal helpers (replaces _callModelWithRetry) ──────────────

  /** Simple text generation through AIManager. Keeps retry + logging. */
  async _aiText(prompt, options = {}) {
    const { context = 'AI call', ...genOpts } = options;
    this.logger.debug(`_aiText: ${context}`, { promptLen: prompt.length });
    try {
      return await ai.generateText(prompt, genOpts);
    } catch (error) {
      this.logger.error(`${context} failed`, { error: error.message });
      throw new GeminiAPIError(`${context} failed: ${error.message}`, error);
    }
  }

  /** Chat/tools generation through AIManager. Provider chosen by AI_DEFAULT_PROVIDER env var. */
  async _aiChat(messages, options = {}) {
    const { context = 'AI chat', ...genOpts } = options;
    this.logger.debug(`_aiChat: ${context}`, { msgCount: messages.length });
    try {
      return await ai.generateChat(messages, genOpts);
    } catch (error) {
      this.logger.error(`${context} failed`, { error: error.message });
      throw new GeminiAPIError(`${context} failed: ${error.message}`, error);
    }
  }

  /**
   * Private: Strip markdown formatting and convert to plain text
   * Converts markdown elements to their plain text equivalents
   */
  _stripMarkdown(text) {
    if (!text) return text;
    
    let cleaned = text;
    
    // Remove code blocks (```code```) - but preserve the content
    cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
      // Extract code content, remove the backticks
      return match.replace(/```/g, '').trim();
    });
    
    // Remove inline code (`code`) - preserve the content
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    
    // Remove headers (# Header -> Header) - preserve the text
    cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '$1');
    
    // Remove bold (**text** or __text__ -> text) - preserve the text
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    
    // Remove italic (*text* or _text_ -> text) - preserve the text
    // Be careful not to remove single asterisks that are part of the text
    cleaned = cleaned.replace(/\*([^*\n]+)\*/g, '$1');
    cleaned = cleaned.replace(/_([^_\n]+)_/g, '$1');
    
    // Remove links ([text](url) -> text) - preserve the link text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove images ![alt](url) -> alt - preserve alt text
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
    
    // Convert list items (- item or * item -> item) - preserve the item text
    cleaned = cleaned.replace(/^[\s]*[-*+]\s+(.+)$/gm, '$1');
    cleaned = cleaned.replace(/^[\s]*\d+\.\s+(.+)$/gm, '$1');
    
    // Remove horizontal rules (--- or ***) - remove entirely
    cleaned = cleaned.replace(/^[\s]*[-*]{3,}[\s]*$/gm, '');
    
    // Remove blockquotes (> text -> text) - preserve the text
    cleaned = cleaned.replace(/^>\s+(.+)$/gm, '$1');
    
    // Clean up multiple newlines (max 2 consecutive)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  /**
   * Private: Extract relevant hashtags from content data
   */
  _extractHashtags(contentData) {
    const hashtags = [];
    
    // Extract from tags if available
    if (contentData.tags && Array.isArray(contentData.tags)) {
      contentData.tags.forEach(tag => {
        if (tag.name) {
          const hashtag = '#' + tag.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
          if (hashtag.length > 1 && hashtag.length < 20) {
            hashtags.push(hashtag);
          }
        }
      });
    }
    
    // Extract from skills if available
    if (contentData.linkedSkills && Array.isArray(contentData.linkedSkills)) {
      contentData.linkedSkills.forEach(skill => {
        if (skill.name) {
          const hashtag = '#' + skill.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
          if (hashtag.length > 1 && hashtag.length < 20 && !hashtags.includes(hashtag)) {
            hashtags.push(hashtag);
          }
        }
      });
    }
    
    return hashtags;
  }

  // ─────────────────────────────────────────────────────────────────
  // Simple text generation (replaces old _callModelWithRetry calls)
  async generateContent(prompt, options = {}) {
    const {
      temperature = GENERATION_CONFIG.DEFAULT.temperature,
      maxOutputTokens = GENERATION_CONFIG.DEFAULT.maxOutputTokens,
      _skipLog = false
    } = options;

    if (!_skipLog) {
      this.logger.info('Generate content', { promptLength: prompt.length, temperature });
      this.logger.debug('Prompt preview', { preview: prompt.substring(0, 300) });
    }

    const text = await this._aiText(prompt, { temperature, maxTokens: maxOutputTokens, context: 'Generate content' });
    
    if (!_skipLog) {
      this.logger.info('Response received', { responseLength: text.length });
      this.logger.debug('Response preview', { preview: text.substring(0, 200) });
    }
    
    return text;
  }

  /**
   * Handle AI session - main conversation handler
   * Now uses Function Calling for structured, reliable responses
   */
  async handleAISession(mode, contentType, initialInfo, chatHistory, context = {}) {
    this.logger.info('Starting AI session with Function Calling', { 
      mode, 
      contentType,
      chatHistoryLength: chatHistory.length 
    });
    
    try {
      // Build the consolidated system prompt
      const systemPrompt = buildConversationalSystemPrompt(mode, contentType, initialInfo, context);
      
      this.logger.debug('System prompt built', { 
        promptLength: systemPrompt.length,
        mode,
        contentType 
      });
      
      // Log the actual prompt for debugging (first 500 chars)
      this.logger.debug('System prompt preview', {
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
        messages.push({
          role: 'user',
          content: contentType
            ? `I want to create ${contentType === 'BLOG' ? 'a blog post' : contentType === 'PROJECT' ? 'a project description' : contentType === 'EXPERIENCE' ? 'a work experience entry' : 'content'}.`
            : 'Hi, I want to create some content.'
        });
      }

      this.logger.debug('Chat history prepared', {
        originalLength: chatHistory.length,
        formattedLength: messages.length,
      });

      // Call through AIManager — provider handles model, tools, system prompt
      const { text: responseText, functionCalls } = await this._aiChat(messages, {
        tools: toolsForMode,
        systemInstruction: systemPrompt,
        temperature: GENERATION_CONFIG.CHAT.temperature,
        maxTokens: GENERATION_CONFIG.CHAT.maxOutputTokens,
        context: 'AI session',
      });

      this.logger.debug('Response received', {
        hasText: !!responseText,
        textLength: responseText?.length || 0,
        hasFunctionCalls: !!functionCalls,
        functionCount: functionCalls?.length || 0,
      });

      // Check for function calls FIRST (structured response)
      // Now in model-agnostic format: [{name, args}]
      if (functionCalls && functionCalls.length > 0) {
        this.logger.info('AI session - function call detected', {
          functionName: functionCalls[0].name,
          mode,
          contentType,
          argsPreview: JSON.stringify(functionCalls[0].args).substring(0, 200)
        });
        return await this._handleFunctionCall({ name: functionCalls[0].name, args: functionCalls[0].args }, contentType);
      }
      
      this.logger.debug('Checking for function calls', {
        hasFunctionCalls: !!functionCalls,
        functionCallsLength: functionCalls?.length || 0
      });
      
      if (functionCalls && functionCalls.length > 0) {
        this.logger.info('AI session - function call detected', {
          functionName: functionCalls[0].name,
          mode,
          contentType,
          argsPreview: JSON.stringify(functionCalls[0].args).substring(0, 200)
        });
        return await this._handleFunctionCall(functionCalls[0], contentType);
      }
      
      // If no function call, it's a regular conversational response
      this.logger.debug('No function call, returning text response');

      // Warn if response is empty
      if (!responseText || responseText.trim().length === 0) {
        this.logger.error('AI returned empty response', {
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

      this.logger.info('AI session - conversational response', {
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 100)
      });

      return {
        message: responseText,
        done: false,
        contentType: contentType
      };
      
    } catch (error) {
      this.logger.error('AI session EXCEPTION', { 
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
   * Private: Handle function call from AI
   * This replaces the old regex-based JSON parsing
   */
  async _handleFunctionCall(functionCall, currentContentType) {
    const { name, args } = functionCall;
    
    this.logger.info('Function call received', { 
      functionName: name, 
      args: JSON.stringify(args) 
    });
    
    switch (name) {
      case 'signalContentReadyForGeneration':
        this.logger.info('Content ready for generation', {
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
        // Resume chatbot: create a saved resume draft that the resume generator can edit later.
        // IMPORTANT: No additional AI is called on the server; the provided resumeData is used as-is.
        return {
          done: true,
          toolcall: 'create_resume_history',
          resume: {
            name: args.name,
            layoutStyle: args.layoutStyle || null,
            resumeSize: args.resumeSize || 'medium',
            jobDescription: args.jobDescription || '',
            contentItemIds: Array.isArray(args.contentItemIds) ? args.contentItemIds : [],
            templateId: args.templateId || null,
            resumeData: args.resumeData || {}
          },
          message: "Great, I've created a structured resume draft with that layout. You can open it in the Resume Generator to tweak and export it."
        };
      
      default:
        this.logger.warn('Unknown function call', { functionName: name });
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
  _getFollowUpMessage(contentType) {
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
  async generateFinalContent(mode, contentType, chatHistory, currentContent, changes, context = {}) {
    this.logger.info('Generating final content with XML prompts', { 
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
      } = require('./content-generation-prompts');
      
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
      
      this.logger.debug('Content generation prompt', { 
        promptLength: prompt.length 
      });
      
      // Generate content via AIManager (model-agnostic)
      const fullResponse = await this._aiText(prompt, {
        temperature: GENERATION_CONFIG.CREATIVE.temperature,
        maxTokens: GENERATION_CONFIG.CREATIVE.maxOutputTokens,
        context: 'Content generation',
      });
      
      this.logger.info('Content generated - FULL RESPONSE', { 
        responseLength: fullResponse.length,
        fullResponse: fullResponse // Log entire response for debugging
      });
      
      // Extract structured_data block and markdown content
      const { markdownContent, structuredData } = this._extractStructuredData(fullResponse);
      
      this.logger.info('Extracted content and structured data', {
        markdownLength: markdownContent.length,
        hasStructuredData: !!structuredData,
        structuredData: structuredData ? JSON.stringify(structuredData, null, 2) : null
      });
      
      // Extract skills and tags from structured data
      // Return them without IDs - frontend will handle matching/creating
      const extractedSkills = structuredData?.skills || [];
      const extractedTags = structuredData?.tags || [];
      
      this.logger.info('Skills and tags extracted from structured data', {
        skillsCount: extractedSkills.length,
        tagsCount: extractedTags.length,
        skills: extractedSkills,
        tags: extractedTags
      });
      
      // Use title from structured data or extract from conversation
      let title = structuredData?.title;
      if (!title || title.length < 3) {
        this.logger.debug('Title missing or too short, extracting from conversation');
        title = await this.extractTitleFromConversation(contentType, chatHistory, markdownContent);
      }
      
      // Build metadata from structured data
      const metadata = this._buildMetadataFromStructuredData(structuredData, contentType);
      
      this.logger.debug('Metadata built from structured data', {
        metadata: metadata
      });
      
      // Check for multiple posts
      const shouldCreateMultiple = await this.shouldCreateMultiplePosts(chatHistory, contentType);
      
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
        const multiplePosts = await this.generateMultiplePosts(chatHistory, context);
        result.multiplePosts = multiplePosts || null;
      }
      
      this.logger.info('Final content prepared - COMPLETE RESULT', { 
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
      this.logger.error('Content generation error', { error: error.message, stack: error.stack });
      throw new GeminiAPIError(`Failed to generate final content: ${error.message}`, error);
    }
  }

  /**
   * Private: Extract structured_data block and markdown content
   * Parses XML-style structured_data tag and returns both parts
   */
  _extractStructuredData(fullResponse) {
    // Look for <structured_data> ... </structured_data> block
    const structuredDataRegex = /<structured_data>\s*([\s\S]*?)\s*<\/structured_data>/;
    const match = fullResponse.match(structuredDataRegex);
    
    let structuredData = null;
    let markdownContent = fullResponse;
    
    if (match) {
      try {
        // Parse the JSON inside the structured_data block
        const jsonString = match[1].trim();
        structuredData = JSON.parse(jsonString);
        
        // Remove the structured_data block from the content
        markdownContent = fullResponse.replace(structuredDataRegex, '').trim();
        
        this.logger.debug('Extracted structured data', {
          hasTitle: !!structuredData.title,
          hasExcerpt: !!structuredData.excerpt,
          skillsCount: structuredData.skills?.length || 0,
          tagsCount: structuredData.tags?.length || 0
        });
      } catch (e) {
        this.logger.warn('Failed to parse structured_data JSON', { 
          error: e.message,
          jsonPreview: match[1].substring(0, 200)
        });
      }
    } else {
      this.logger.warn('No structured_data block found in response');
    }
    
    // Clean up the markdown content
    markdownContent = this._cleanGeneratedContent(markdownContent);
    
    return { markdownContent, structuredData };
  }

  /**
   * Private: Clean generated content
   */
  _cleanGeneratedContent(content) {
    // Remove header metadata patterns
    content = content.replace(/^By\s+[^•]+•\s*[^•]+•\s*[^\n]+\n?/i, '').trim();
    
    // Remove common intro phrases
    const introPatterns = [
      /^Of course\.[^\n]*\n/i,
      /^Here is[^\n]*\n/i,
      /^Sure\.[^\n]*\n/i,
      /^Certainly\.[^\n]*\n/i,
      /^Alright\.[^\n]*\n/i,
      /^I'll[^\n]*\n/i,
      /^I'll create[^\n]*\n/i,
      /^Here's[^\n]*\n/i,
      /^\*\*\*/g,
      /^---$/gm
    ];
    
    for (const pattern of introPatterns) {
      content = content.replace(pattern, '');
    }
    
    // Remove any stray # title headings at the start
    content = content.replace(/^#\s+.+$/m, '').trim();
    
    // Remove any leftover closing structured_data tags and JSON blocks
    content = content.replace(/<\/structured_data>\s*/g, '');
    content = content.replace(/```json\s*\{[\s\S]*?\}\s*```/g, '');
    
    // Unescape markdown characters that were escaped unnecessarily
    content = content.replace(/\\([.,!?'";:\-\(\)\[\]{}])/g, '$1');
    
    return content;
  }

  /**
   * Private: Build metadata object from structured data
   * Maps structured data fields to database schema
   */
  _buildMetadataFromStructuredData(structuredData, contentType) {
    if (!structuredData) {
      return {};
    }
    
    const metadata = {};
    
    // PROJECT-specific metadata
    if (contentType === 'PROJECT') {
      if (structuredData.startDate) metadata.startDate = structuredData.startDate;
      if (structuredData.endDate) metadata.endDate = structuredData.endDate;
      if (structuredData.isOngoing !== undefined) metadata.isOngoing = structuredData.isOngoing;
      if (structuredData.featuredImage) metadata.featuredImage = structuredData.featuredImage;
      if (structuredData.projectLinks) metadata.projectLinks = structuredData.projectLinks;
      if (structuredData.contributors) metadata.contributors = structuredData.contributors;
    }
    
    // EXPERIENCE-specific metadata
    if (contentType === 'EXPERIENCE') {
      if (structuredData.experienceCategory) metadata.experienceCategory = structuredData.experienceCategory;
      if (structuredData.location) metadata.location = structuredData.location;
      if (structuredData.locationType) metadata.locationType = structuredData.locationType;
      if (structuredData.startDate) metadata.startDate = structuredData.startDate;
      if (structuredData.endDate) metadata.endDate = structuredData.endDate;
      if (structuredData.isOngoing !== undefined) metadata.isOngoing = structuredData.isOngoing;
      if (structuredData.roles) metadata.roles = structuredData.roles;
    }
    
    // Store full structured data for reference
    metadata.aiGenerated = true;
    metadata.generatedAt = new Date().toISOString();
    
    return metadata;
  }

  /**
   * Extract title from conversation
   */
  async extractTitleFromConversation(contentType, chatHistory, generatedContent) {
    this.logger.info('Extracting title', { contentType });
    
    try {
      const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = utilityPrompts.extractTitle(contentType, conversationText);
      
      const result = await this._aiText(prompt, {
        temperature: GENERATION_CONFIG.SHORT.temperature,
        maxTokens: GENERATION_CONFIG.SHORT.maxOutputTokens,
        context: 'Extract title',
      });
      
      let title = result.trim();
      
      // Clean up common issues
      title = title.replace(/^["']|["']$/g, ''); // Remove quotes
      title = title.replace(/^#\s*/, ''); // Remove # if present
      
      this.logger.info('Title extracted', { title });
      
      // Fallback if title is too short or empty
      if (!title || title.length < 3) {
        title = this._getFallbackTitle(contentType);
        this.logger.warn('Using fallback title', { title });
      }
      
      return title;
    } catch (error) {
      this.logger.error('Title extraction error', { error: error.message });
      return this._getFallbackTitle(contentType);
    }
  }

  /**
   * Private: Get fallback title
   */
  _getFallbackTitle(contentType) {
    const fallbackTitles = {
      'PROJECT': 'Untitled Project',
      'EXPERIENCE': 'Work Experience',
      'BLOG': 'Untitled Post'
    };
    return fallbackTitles[contentType] || 'Untitled';
  }

  /**
   * Infer content type from conversation
   */
  async inferContentType(chatHistory, initialInfo) {
    this.logger.info('Inferring content type');
    
    try {
      const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
      const infoText = initialInfo ? JSON.stringify(initialInfo) : '';
      
      const prompt = utilityPrompts.inferContentType(conversationText, infoText);
      
      const result = await this._aiText(prompt, {
        temperature: GENERATION_CONFIG.VERY_PRECISE.temperature,
        maxTokens: GENERATION_CONFIG.VERY_PRECISE.maxOutputTokens,
        context: 'Infer content type',
      });
      
      const inferredType = result.trim().toUpperCase();
      
      this.logger.info('Content type inferred', { inferredType });
      
      if (['PROJECT', 'BLOG', 'EXPERIENCE'].includes(inferredType)) {
        return inferredType;
      }
      
      // Fallback to keyword matching
      const fallbackType = this._inferContentTypeFromKeywords(conversationText, infoText);
      this.logger.info('Using fallback content type', { fallbackType });
      return fallbackType;
      
    } catch (error) {
      this.logger.error('Content type inference error', { error: error.message });
      return 'BLOG'; // Default fallback
    }
  }

  /**
   * Private: Infer content type from keywords (fallback)
   */
  _inferContentTypeFromKeywords(conversationText, infoText) {
    const fullText = (conversationText + '\n' + infoText).toLowerCase();
    
    // Priority 1: Check for clear EXPERIENCE indicators
    const experienceIndicators = /(?:role|position|responsibilities|worked at|employed|job at|intern at|developer at|engineer at|studied at|degree)/i;
    const companyIndicators = /(?:company|organization|corporation|inc\.|llc|university|college|school)/i;
    
    if (experienceIndicators.test(fullText) && companyIndicators.test(fullText)) {
      return 'EXPERIENCE';
    }
    
    // Priority 2: Check for PROJECT indicators
    if (/(?:built|created|developed|deployed|launched|implemented).*?(?:project|app|website|application|system|tool)/i.test(fullText) ||
        /(?:project|app|website|application|system).*?(?:built|created|developed|deployed|launched)/i.test(fullText)) {
      return 'PROJECT';
    }
    
    // Priority 3: Check for generic EXPERIENCE keywords
    if (/(?:job|work|employment|internship|education|degree|university|college|certification)/i.test(fullText)) {
      return 'EXPERIENCE';
    }
    
    // Priority 4: Check for PROJECT keywords
    if (/(?:github|repo|repository|hackathon|devpost)/i.test(fullText)) {
      return 'PROJECT';
    }
    
    return 'BLOG';
  }

  /**
   * Extract metadata from conversation
   */
  async extractMetadataFromConversation(contentType, chatHistory, generatedContent) {
    this.logger.info('Extracting metadata', { contentType });
    
    try {
      const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const promptGenerator = utilityPrompts.extractMetadata[contentType] || utilityPrompts.extractMetadata['BLOG'];
      const prompt = promptGenerator(conversationText);
      
      const result = await this._aiText(prompt, {
        temperature: GENERATION_CONFIG.PRECISE.temperature,
        maxTokens: GENERATION_CONFIG.PRECISE.maxOutputTokens,
        context: 'Extract metadata',
      });
      
      // Clean and parse response
      let responseText = result.trim();
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const metadata = JSON.parse(jsonMatch[0]);
        this.logger.info('Metadata extracted', { keys: Object.keys(metadata) });
        return metadata;
      }
      
      return {};
    } catch (error) {
      this.logger.error('Metadata extraction error', { error: error.message });
      // Fallback to basic extraction
      return this.extractMetadataBasic(contentType, chatHistory, generatedContent);
    }
  }

  /**
   * Basic fallback metadata extraction using regex
   */
  extractMetadataBasic(contentType, chatHistory, generatedContent) {
    this.logger.info('Using basic metadata extraction', { contentType });
    
    const metadata = {};
    const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n').toLowerCase();
    const fullText = (conversationText + '\n' + generatedContent).toLowerCase();
    
    if (contentType === 'PROJECT') {
      // Check for ongoing projects
      if (/(?:ongoing|current|still|active|in progress|continuing)/i.test(fullText)) {
        metadata.isOngoing = true;
      }
      
      // Extract GitHub link
      const githubMatch = fullText.match(/(?:github|repo|repository).*?(https?:\/\/[^\s]+github[^\s]*|github\.com\/[^\s\/]+\/[^\s\/]+)/i);
      if (githubMatch) {
        let githubUrl = githubMatch[1];
        if (!githubUrl.startsWith('http')) {
          githubUrl = 'https://' + githubUrl;
        }
        metadata.projectLinks = { ...metadata.projectLinks, github: githubUrl };
      }
      
      // Extract Devpost link
      const devpostMatch = fullText.match(/(?:devpost).*?(https?:\/\/[^\s]+devpost[^\s]*|devpost\.com\/[^\s\/]+)/i);
      if (devpostMatch) {
        let devpostUrl = devpostMatch[1];
        if (!devpostUrl.startsWith('http')) {
          devpostUrl = 'https://' + devpostUrl;
        }
        metadata.projectLinks = { ...metadata.projectLinks, devpost: devpostUrl };
      }
    }
    
    if (contentType === 'EXPERIENCE') {
      // Extract experience category
      if (/(?:job|work|employment|position|role)/i.test(conversationText) && !/(?:education|school|university|degree)/i.test(conversationText)) {
        metadata.experienceCategory = 'JOB';
      } else if (/(?:education|school|university|college|degree|studied|student)/i.test(conversationText)) {
        metadata.experienceCategory = 'EDUCATION';
      } else if (/(?:certification|certificate|license|licensed)/i.test(conversationText)) {
        metadata.experienceCategory = 'CERTIFICATION';
      }
      
      // Extract location type
      if (/(?:remote|work from home|wfh)/i.test(fullText)) {
        metadata.locationType = 'REMOTE';
      } else if (/(?:hybrid|partially remote|mix)/i.test(fullText)) {
        metadata.locationType = 'HYBRID';
      } else if (/(?:onsite|on-site|in-person|office)/i.test(fullText)) {
        metadata.locationType = 'ONSITE';
      }
      
      // Check for ongoing
      if (/(?:current|ongoing|still|present)/i.test(fullText)) {
        metadata.isOngoing = true;
      }
    }
    
    return metadata;
  }

  /**
   * Check if multiple posts should be created
   */
  async shouldCreateMultiplePosts(chatHistory, primaryType) {
    this.logger.info('Checking for multiple posts', { primaryType });
    
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
      
      const result = await this._aiText(prompt, {
        temperature: GENERATION_CONFIG.VERY_PRECISE.temperature,
        maxTokens: GENERATION_CONFIG.VERY_PRECISE.maxOutputTokens,
        context: 'Check multiple posts',
      });
      
      const answer = result.trim().toLowerCase();
      const shouldCreate = answer.includes('yes') || hasIndicators;
      
      this.logger.info('Multiple posts check result', { shouldCreate });
      return shouldCreate;
      
    } catch (error) {
      this.logger.error('Error checking for multiple posts', { error: error.message });
      return false;
    }
  }

  /**
   * Generate multiple linked posts
   */
  async generateMultiplePosts(chatHistory, context) {
    this.logger.info('Generating multiple posts list');
    
    try {
      const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = utilityPrompts.generateMultiplePosts(conversationText);
      
      const result = await this._aiText(prompt, {
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
          this.logger.info('Multiple posts generated', { types: validTypes });
          return validTypes;
        }
      }
      
      return [];
    } catch (error) {
      this.logger.error('Error generating multiple posts list', { error: error.message });
      return [];
    }
  }

  /**
   * Match or create skills based on extracted skills from AI
   */
  async matchOrCreateSkills(extractedSkills, context) {
    if (!extractedSkills || extractedSkills.length === 0) {
      return [];
    }

    this.logger.info('Matching or creating skills', { count: extractedSkills.length });

    const { prisma } = require('../services/database');
    const matchedSkills = [];

    const projectId = context.project?.id;
    if (!projectId) {
      this.logger.warn('No project ID provided for skills matching');
      return matchedSkills;
    }

    for (const skillData of extractedSkills) {
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
          this.logger.info('Created new skill', { name: skillName, category: skillCategory });
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
          this.logger.info('Linked skill to project', { skillId: skill.id, projectId });
        }

        matchedSkills.push({
          id: skill.id,
          name: skill.name,
          category: skill.category
        });
      } catch (error) {
        this.logger.error(`Error matching/creating skill ${skillName}`, { error: error.message });
      }
    }

    this.logger.info('Skills matched/created', { count: matchedSkills.length });
    return matchedSkills;
  }

  /**
   * Match or create tags based on extracted tags from AI
   */
  async matchOrCreateTags(extractedTags, context) {
    if (!extractedTags || extractedTags.length === 0) {
      return [];
    }

    this.logger.info('Matching or creating tags', { count: extractedTags.length });

    const { prisma } = require('../services/database');
    const matchedTags = [];

    const projectId = context.project?.id;
    if (!projectId) {
      this.logger.warn('No project ID provided for tags matching');
      return matchedTags;
    }

    for (const tagData of extractedTags) {
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
          this.logger.info('Created new tag', { name: tagName, category: tagCategory });
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
          this.logger.info('Linked tag to project', { tagId: tag.id, projectId });
        }

        matchedTags.push({
          id: tag.id,
          name: tag.name,
          category: tag.category
        });
      } catch (error) {
        this.logger.error(`Error matching/creating tag ${tagName}`, { error: error.message });
      }
    }

    this.logger.info('Tags matched/created', { count: matchedTags.length });
    return matchedTags;
  }

  /**
   * Generate post links using flash model
   * Analyzes all posts and suggests meaningful links between them
   */
  async generatePostLinks(posts) {
    this.logger.info('Generating post links', { postsCount: posts.length });
    
    try {
      const { postLinksGenerationPrompt } = require('./post-links-prompts');
      
      // Limit posts to 30 per batch (can handle more with JSON response format)
      const MAX_POSTS_PER_BATCH = 30;
      const postsToProcess = posts.slice(0, MAX_POSTS_PER_BATCH);
      if (posts.length > MAX_POSTS_PER_BATCH) {
        this.logger.warn('Too many posts, processing first batch', {
          totalPosts: posts.length,
          processingPosts: postsToProcess.length,
          remainingPosts: posts.length - MAX_POSTS_PER_BATCH
        });
      }
      
      // Build prompt with limited posts
      const prompt = postLinksGenerationPrompt(postsToProcess);
      
      this.logger.info('Post links prompt (FULL)', { 
        promptLength: prompt.length,
        postsCount: posts.length,
        fullPrompt: prompt
      });
      
      // Generate links via AIManager (model-agnostic, JSON output)
      this.logger.info('Calling AI for post links', {
        promptLength: prompt.length,
        postsCount: postsToProcess.length,
      });

      const responseText = await this._aiText(prompt, {
        temperature: 0.2,
        maxTokens: 8192,
        context: 'Post links generation',
      });
      
      this.logger.info('Post links response received', { 
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200)
      });
      
      if (!responseText || responseText.trim().length === 0) {
        this.logger.error('Post links response is empty', {
          postsCount: posts.length,
          promptLength: prompt.length
        });
        throw new GeminiAPIError('Received empty response from AI model');
      }
      
      // Parse JSON response
      let responseJson = responseText.trim();
      
      // Remove markdown code blocks if present
      responseJson = responseJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Extract JSON object
      const jsonMatch = responseJson.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('No JSON found in response', { 
          responseText: responseText.substring(0, 500),
          responseLength: responseText.length
        });
        return { links: [] };
      }
      
      let result;
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        this.logger.error('Failed to parse JSON from response', {
          error: parseError.message,
          jsonPreview: jsonMatch[0].substring(0, 500)
        });
        throw new GeminiAPIError('Failed to parse JSON response from AI model', parseError);
      }
      
      // Validate and clean links
      const validLinks = [];
      const seenLinks = new Set();
      
      if (result.links && Array.isArray(result.links)) {
        for (const link of result.links) {
          // Validate required fields
          if (!link.sourceId || !link.targetId || !link.linkType) {
            this.logger.warn('Invalid link missing required fields', { link });
            continue;
          }
          
          // Skip self-links
          if (link.sourceId === link.targetId) {
            this.logger.warn('Skipping self-link', { sourceId: link.sourceId });
            continue;
          }
          
          // Validate link type
          const validLinkTypes = ['related', 'parent', 'child', 'sequential', 'complementary', 'prerequisite', 'follow-up'];
          if (!validLinkTypes.includes(link.linkType)) {
            this.logger.warn('Invalid link type', { linkType: link.linkType, link });
            continue;
          }
          
          // Normalize link direction (always use lexicographically smaller ID as source)
          const normalized = link.sourceId < link.targetId 
            ? { sourceId: link.sourceId, targetId: link.targetId }
            : { sourceId: link.targetId, targetId: link.sourceId };
          
          // Check for duplicates
          const linkKey = `${normalized.sourceId}-${normalized.targetId}-${link.linkType}`;
          if (seenLinks.has(linkKey)) {
            this.logger.debug('Skipping duplicate link', { linkKey });
            continue;
          }
          
          seenLinks.add(linkKey);
          
          validLinks.push({
            sourceId: normalized.sourceId,
            targetId: normalized.targetId,
            linkType: link.linkType,
            reason: link.reason || 'AI-generated link'
          });
        }
      }
      
      this.logger.info('Post links generated', { 
        totalLinks: validLinks.length,
        links: validLinks 
      });
      
      return { links: validLinks };
      
    } catch (error) {
      this.logger.error('Post links generation error', { 
        error: error.message, 
        stack: error.stack 
      });
      throw new GeminiAPIError(`Failed to generate post links: ${error.message}`, error);
    }
  }

  /**
   * Generate social media post (LinkedIn or X/Twitter) for content
   * Creates platform-appropriate post with links to foligo site and project links
   * @param {string} platform - 'linkedin' or 'x'
   */
  async generateSocialPost(contentData, projectData, platform = 'linkedin') {
    this.logger.info('Generating social post', {
      contentId: contentData.id,
      contentType: contentData.type,
      projectId: projectData.id,
      platform
    });

    try {
      // Build the foligo link
      const foligoLink = `https://${projectData.subdomain}.foligo.tech/${contentData.slug || contentData.id}`;
      
      // Build project links section
      const projectLinks = [];
      if (contentData.projectLinks?.github) {
        projectLinks.push(`GitHub: ${contentData.projectLinks.github}`);
      }
      if (contentData.projectLinks?.devpost) {
        projectLinks.push(`Devpost: ${contentData.projectLinks.devpost}`);
      }
      if (contentData.projectLinks?.other && contentData.projectLinks.other.length > 0) {
        contentData.projectLinks.other.forEach(link => {
          if (link) projectLinks.push(link);
        });
      }
      const linksText = projectLinks.length > 0 ? `\n\nLinks:\n${projectLinks.join('\n')}` : '';

      // Build platform-specific prompts
      let prompt;
      if (platform === 'linkedin') {
        prompt = `Generate a professional LinkedIn post for the following content.

Content Title: ${contentData.title}
Content Type: ${contentData.type}
Excerpt: ${contentData.excerpt || 'No excerpt provided'}
Content Preview: ${(contentData.content || '').substring(0, 1500)}

Foligo Link: ${foligoLink}${linksText}

LinkedIn Post Requirements:
- Professional, engaging tone that resonates with LinkedIn's professional audience
- 2-3 well-structured paragraphs (approximately 200-500 words)
- Start with a hook that captures attention
- Include specific details, achievements, or insights from the content
- Use storytelling elements when appropriate
- Include 3-5 relevant hashtags at the end (mix of broad and niche tags)
- IMPORTANT: Naturally incorporate the foligo link (${foligoLink}) within the post text itself, not just at the end. For example: "Check out the full details here: ${foligoLink}" or "Learn more: ${foligoLink}" or weave it into a sentence naturally
- Include project links (GitHub, Devpost, etc.) if available, but integrate them naturally
- Use professional language but remain authentic and personable
- Encourage engagement (questions, comments, shares)
- Format with proper line breaks for readability
- IMPORTANT: Use plain text only - NO markdown formatting (no **bold**, no # headers, no *italics*, no [links](url), no code blocks, no lists with - or *). Write in plain text that will display correctly on LinkedIn.
- CRITICAL: ALWAYS write complete, finished thoughts. Every sentence must be complete. Every paragraph must be complete. The post must end with proper punctuation (period, exclamation, or question mark). NEVER cut off mid-sentence or mid-thought. If you're describing something, finish describing it completely before ending.

Return only the LinkedIn post text (no JSON, no quotes, no markdown, just plain text post content). Make sure the foligo link is naturally integrated within the post:`;
      } else {
        prompt = `Generate a concise X (Twitter) post for the following content.

Content Title: ${contentData.title}
Content Type: ${contentData.type}
Excerpt: ${contentData.excerpt || 'No excerpt provided'}
Content Preview: ${(contentData.content || '').substring(0, 800)}

Foligo Link: ${foligoLink}${linksText}

X/Twitter Post Requirements:
- Concise, punchy, and engaging tone typical of X/Twitter
- Keep it concise but complete - X supports longer posts now, but aim for 200-500 characters for best engagement
- Start with a hook or interesting statement
- Use emojis sparingly (1-2 max) to add personality
- Be conversational and authentic
- Include 2-3 relevant hashtags
- IMPORTANT: Naturally incorporate the foligo link (${foligoLink}) within the post text itself, not just at the end. For example: "Check it out: ${foligoLink}" or weave it into the message naturally. Only include the link ONCE.
- Make it shareable and engaging
- Use line breaks strategically for readability
- Consider using a question or call-to-action to encourage engagement
- IMPORTANT: Use plain text only - NO markdown formatting (no **bold**, no # headers, no *italics*, no [links](url), no code blocks). Write in plain text that will display correctly on X/Twitter.
- CRITICAL: ALWAYS write complete, finished thoughts. Every sentence must be complete. The post must end with proper punctuation (period, exclamation, or question mark). NEVER cut off mid-sentence or mid-thought.

Return only the X post text (no JSON, no quotes, no markdown, just plain text post content). Make sure the foligo link is naturally integrated within the post and only appears once:`;
      }

      const generationConfig = {
        temperature: platform === 'linkedin' ? 0.7 : 0.8, // Slightly more creative for X
        topK: 40,
        topP: 0.95,
        maxOutputTokens: platform === 'linkedin' ? 2048 : 1024 // Increased tokens to prevent truncation
      };

      const responseText = await this._aiText(prompt, {
        temperature: generationConfig.temperature,
        maxTokens: generationConfig.maxOutputTokens,
        context: `Generate ${platform} post`,
      });

      // Clean up the response (remove any JSON formatting if present)
      let post = responseText.trim();
      
      this.logger.info('Raw AI response for social post', {
        platform,
        responseLength: post.length,
        responsePreview: post.substring(0, 300)
      });
      
      // Remove JSON wrapper if present
      const jsonMatch = post.match(/\{[\s\S]*"post"[\s\S]*:[\s\S]*"([^"]+)"[\s\S]*\}/);
      if (jsonMatch) {
        post = jsonMatch[1];
      } else {
        // Remove quotes if wrapped
        post = post.replace(/^["']|["']$/g, '');
      }

      // Strip markdown formatting and convert to plain text
      const beforeStrip = post.trim();
      post = this._stripMarkdown(post);
      
      // If stripping markdown removed everything or made it too short, use the original
      if (!post || post.trim().length < 10) {
        this.logger.warn('Markdown stripping removed too much content, using original', {
          beforeLength: beforeStrip.length,
          afterLength: post ? post.length : 0
        });
        post = beforeStrip;
      }

      // Check if post appears to be cut off mid-sentence (ends without proper punctuation)
      const trimmedPost = post.trim();
      const lastChar = trimmedPost[trimmedPost.length - 1];
      const properEndings = ['.', '!', '?', ':', ';'];
      const endsWithLink = trimmedPost.endsWith(foligoLink);
      const endsWithHashtag = /#\w+\s*$/.test(trimmedPost);
      
      // If post doesn't end with proper punctuation and doesn't end with link/hashtag, it might be truncated
      if (!properEndings.includes(lastChar) && !endsWithLink && !endsWithHashtag && trimmedPost.length > 50) {
        this.logger.warn('Post appears to be cut off mid-sentence, attempting to complete', {
          postLength: trimmedPost.length,
          lastChars: trimmedPost.substring(trimmedPost.length - 50)
        });
        
        // Try to find a natural break point (last sentence boundary before the end)
        const lastPeriod = trimmedPost.lastIndexOf('.');
        const lastExclamation = trimmedPost.lastIndexOf('!');
        const lastQuestion = trimmedPost.lastIndexOf('?');
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        // If we found a sentence end within the last 200 characters, truncate there
        if (lastSentenceEnd > trimmedPost.length - 200 && lastSentenceEnd > 0) {
          post = trimmedPost.substring(0, lastSentenceEnd + 1).trim();
          this.logger.info('Truncated post at last complete sentence', {
            originalLength: trimmedPost.length,
            newLength: post.length
          });
        } else {
          // If no good break point, try to complete the thought with a simple ending
          // Only do this if the post is reasonably long (at least 100 chars)
          if (trimmedPost.length > 100) {
            // Find the last word boundary
            const lastSpace = trimmedPost.lastIndexOf(' ');
            if (lastSpace > trimmedPost.length * 0.8) {
              // If we're close to the end, just truncate at word boundary
              post = trimmedPost.substring(0, lastSpace).trim() + '.';
              this.logger.info('Completed truncated post at word boundary', {
                originalLength: trimmedPost.length,
                newLength: post.length
              });
            }
          }
        }
      }

      // Check if link is already included in the post
      const hasLink = post.includes(foligoLink);
      
      // Validate we have actual content (not just whitespace or the link)
      const contentWithoutLink = post.replace(new RegExp(foligoLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim();
      if (!contentWithoutLink || contentWithoutLink.length < 10) {
        this.logger.warn('Generated post appears empty, creating fallback', {
          postLength: post.length,
          contentWithoutLinkLength: contentWithoutLink.length,
          originalResponse: responseText.substring(0, 200)
        });
        
        // Create a fallback post based on content
        const title = contentData.title || 'My project';
        const excerpt = contentData.excerpt || '';
        
        if (platform === 'x') {
          // Create a concise X post with integrated link
          let baseText = '';
          if (excerpt && excerpt.length > 0) {
            const cleanExcerpt = excerpt.replace(/\n/g, ' ').substring(0, 100);
            baseText = `${title}: ${cleanExcerpt} Check it out: ${foligoLink}`;
          } else {
            baseText = `Just shipped: ${title}! ${foligoLink}`;
          }
          
          // Add hashtags
          const hashtags = this._extractHashtags(contentData);
          const hashtagText = hashtags.length > 0 ? ` ${hashtags.slice(0, 2).join(' ')}` : '';
          
          post = baseText + hashtagText;
          
          // Ensure it fits - truncate at word boundary if needed
          if (post.length > 280) {
            const maxLength = 280 - hashtagText.length;
            let truncated = baseText.substring(0, maxLength);
            // Find last space to avoid cutting words
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > maxLength * 0.7) { // Only use if we're not losing too much
              truncated = truncated.substring(0, lastSpace);
            }
            post = truncated + '... ' + hashtagText;
          }
        } else {
          // Create a LinkedIn post with integrated link
          const cleanExcerpt = excerpt ? excerpt.replace(/\n/g, ' ').substring(0, 200) : 'Check out my latest project!';
          post = `Excited to share: ${title}\n\n${cleanExcerpt}\n\nLearn more: ${foligoLink}`;
        }
      } else if (!hasLink) {
        // Link not included, add it naturally
        if (platform === 'x') {
          // For X, add it inline before hashtags if possible
          const hashtagMatch = post.match(/#\w+/g);
          if (hashtagMatch && hashtagMatch.length > 0) {
            const lastHashtagIndex = post.lastIndexOf(hashtagMatch[hashtagMatch.length - 1]);
            const beforeHashtags = post.substring(0, lastHashtagIndex).trim();
            const hashtags = post.substring(lastHashtagIndex);
            post = `${beforeHashtags} ${foligoLink} ${hashtags}`;
          } else {
            post = `${post} ${foligoLink}`;
          }
        } else {
          // For LinkedIn, add it naturally at the end
          post = `${post}\n\nLearn more: ${foligoLink}`;
        }
      }

      // Remove duplicate links if they exist (shouldn't happen, but safety check)
      const linkRegex = new RegExp(foligoLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const linkMatches = post.match(linkRegex);
      if (linkMatches && linkMatches.length > 1) {
        // Keep only the first occurrence, remove duplicates
        const firstLinkIndex = post.indexOf(foligoLink);
        const beforeFirstLink = post.substring(0, firstLinkIndex + foligoLink.length);
        const afterFirstLink = post.substring(firstLinkIndex + foligoLink.length);
        // Remove all other occurrences of the link
        const cleanedAfter = afterFirstLink.replace(linkRegex, '').trim();
        post = (beforeFirstLink + ' ' + cleanedAfter).trim().replace(/\s+/g, ' ');
        this.logger.info('Removed duplicate links from post', { 
          duplicatesRemoved: linkMatches.length - 1,
          finalLength: post.length 
        });
      }

      // For X, we don't strictly limit to 280 anymore (X supports longer posts)
      // But we'll still try to keep it reasonable (under 1000 chars for best engagement)
      // Only truncate if it's extremely long
      if (platform === 'x' && post.length > 1000) {
        // Check if link is in the post
        const linkIndex = post.indexOf(foligoLink);
        const hasLinkInPost = linkIndex !== -1;
        
        if (hasLinkInPost) {
          // Link is already included, truncate content before it
          const beforeLink = post.substring(0, linkIndex).trim();
          const afterLink = post.substring(linkIndex + foligoLink.length).trim();
          
          // Truncate to ~800 chars total
          const maxContentLength = 800 - foligoLink.length - afterLink.length - 10;
          
          if (maxContentLength > 50) {
            // Truncate before link at sentence boundary
            let truncated = beforeLink.substring(0, maxContentLength);
            const lastPeriod = truncated.lastIndexOf('.');
            const lastExclamation = truncated.lastIndexOf('!');
            const lastQuestion = truncated.lastIndexOf('?');
            
            // Prefer sentence boundaries
            const sentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
            if (sentenceEnd > maxContentLength * 0.5) {
              truncated = truncated.substring(0, sentenceEnd + 1);
            } else {
              // Fall back to word boundary
              const lastSpace = truncated.lastIndexOf(' ');
              if (lastSpace > maxContentLength * 0.7) {
                truncated = truncated.substring(0, lastSpace);
              }
            }
            
            post = `${truncated} ${foligoLink} ${afterLink}`.trim();
          } else {
            // Not enough space, put link at end
            const maxContent = 800 - foligoLink.length - 5;
            let truncated = (beforeLink + ' ' + afterLink).substring(0, maxContent);
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > maxContent * 0.7) {
              truncated = truncated.substring(0, lastSpace);
            }
            post = `${truncated}... ${foligoLink}`;
          }
        } else {
          // No link yet, truncate at sentence boundary
          const maxLength = 750; // Reserve space for link
          let truncated = post.substring(0, maxLength);
          const lastPeriod = truncated.lastIndexOf('.');
          const lastExclamation = truncated.lastIndexOf('!');
          const lastQuestion = truncated.lastIndexOf('?');
          
          // Prefer sentence boundaries
          const sentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
          if (sentenceEnd > maxLength * 0.5) {
            truncated = truncated.substring(0, sentenceEnd + 1);
          } else {
            // Fall back to word boundary
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > maxLength * 0.7) {
              truncated = truncated.substring(0, lastSpace);
            }
          }
          
          post = `${truncated}... ${foligoLink}`;
        }
      }

      this.logger.info('Social post generated', {
        platform,
        postLength: post.length
      });

      return { post, platform };

    } catch (error) {
      this.logger.error('Social posts generation error', {
        error: error.message,
        stack: error.stack
      });
      throw new GeminiAPIError(`Failed to generate social posts: ${error.message}`, error);
    }
  }

  /**
   * Handle resume chatbot session - specialized for resume and job application assistance
   * Uses larger context window and specialized prompts
   */
  async handleResumeChatbotSession(resumeText, jobPosting, chatHistory, userId, context = {}) {
    this.logger.info('Starting resume chatbot session', {
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

      this.logger.info('Calling AI for resume chatbot', { msgCount: messages.length });

      // Call through AIManager with tools + system prompt
      const { text: responseText, functionCalls } = await this._aiChat(messages, {
        tools: AI_RESUME_CHATBOT_TOOLS,
        systemInstruction: systemPrompt,
        temperature: GENERATION_CONFIG.RESUME_CHATBOT.temperature,
        maxTokens: GENERATION_CONFIG.RESUME_CHATBOT.maxOutputTokens,
        context: 'Resume chatbot session',
      });

      // Check for function calls (e.g., fetchExistingPost)
      if (functionCalls && functionCalls.length > 0) {
        this.logger.info('Resume chatbot - function call detected', {
          functionName: functionCalls[0].name
        });
        return await this._handleFunctionCall({ name: functionCalls[0].name, args: functionCalls[0].args }, 'BLOG');
      }

      if (!responseText || responseText.trim().length === 0) {
        this.logger.error('Resume chatbot returned empty response');
        return { message: 'I apologize, but I ran into an issue. Please try again.', done: false };
      }

      this.logger.info('Resume chatbot - response received', {
        responseLength: responseText.length
      });

      return {
        message: responseText,
        done: false
      };

    } catch (error) {
      this.logger.error('Resume chatbot session EXCEPTION', {
        error: error.message,
        stack: error.stack
      });
      throw new GeminiAPIError(`Failed to handle resume chatbot session: ${error.message}`, error);
    }
  }
}

module.exports = new GeminiService();
