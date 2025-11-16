const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createGeminiLogger } = require('./logger');
const { fallbackQuestions, utilityPrompts } = require('./prompt-utils');
const { MODEL_CONFIG, GENERATION_CONFIG, SAFETY_SETTINGS, SYSTEM_INSTRUCTIONS } = require('./gemini-config');
const { retryWithBackoff } = require('./retry');
const { GeminiConfigError, GeminiAPIError, GeminiParseError } = require('./errors');
const { AI_SESSION_TOOLS } = require('./gemini-tools');
const { buildConversationalSystemPrompt } = require('./conversation-prompts');

class GeminiService {
  constructor() {
    this.logger = createGeminiLogger();
    this.apiKey = process.env.GEMINI_API_KEY;
    
    // Fail fast if API key is missing
    if (!this.apiKey) {
      throw new GeminiConfigError('GEMINI_API_KEY not found in environment variables. Please configure the API key.');
    }
    
    this.logger.info('Initializing Gemini service');
    
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      
      // Initialize models with system instructions and safety settings
      this.flashModel = this.genAI.getGenerativeModel({ 
        model: MODEL_CONFIG.FLASH,
        systemInstruction: SYSTEM_INSTRUCTIONS.FLASH,
        safetySettings: SAFETY_SETTINGS
      });
      
      this.proModel = this.genAI.getGenerativeModel({ 
        model: MODEL_CONFIG.PRO,
        systemInstruction: SYSTEM_INSTRUCTIONS.PRO,
        safetySettings: SAFETY_SETTINGS
      });
      
      this.chatModel = this.genAI.getGenerativeModel({ 
        model: MODEL_CONFIG.FLASH,
        systemInstruction: SYSTEM_INSTRUCTIONS.CHAT,
        safetySettings: SAFETY_SETTINGS
      });
      
      this.logger.info('Gemini service initialized successfully', {
        flashModel: MODEL_CONFIG.FLASH,
        proModel: MODEL_CONFIG.PRO
      });
    } catch (error) {
      this.logger.error('Failed to initialize Gemini service', { error: error.message });
      throw new GeminiConfigError('Failed to initialize Gemini models', error);
    }
  }

  /**
   * Private: Make API call with retry logic
   */
  async _callModelWithRetry(model, contents, generationConfig, context = 'API call') {
    return retryWithBackoff(
      async () => {
        try {
          const result = await model.generateContent({
            contents,
            generationConfig
          });
          
          const response = await result.response;
          return response.text();
        } catch (error) {
          this.logger.error(`${context} failed`, { error: error.message });
          throw new GeminiAPIError(`${context} failed: ${error.message}`, error);
        }
      },
      { context },
      this.logger
    );
  }

  /**
   * Generate content using flash model
   */
  async generateContent(prompt, options = {}) {
    const {
      temperature = GENERATION_CONFIG.DEFAULT.temperature,
      topK = GENERATION_CONFIG.DEFAULT.topK,
      topP = GENERATION_CONFIG.DEFAULT.topP,
      maxOutputTokens = GENERATION_CONFIG.DEFAULT.maxOutputTokens,
      _skipLog = false
    } = options;

    const generationConfig = { temperature, topK, topP, maxOutputTokens };

    if (!_skipLog) {
      this.logger.info('Flash model - Generate content', {
        promptLength: prompt.length,
        temperature
      });
      this.logger.debug('Prompt preview', { preview: prompt.substring(0, 300) });
    }

    const responseText = await this._callModelWithRetry(
      this.flashModel,
      [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      'Generate content'
    );
    
    if (!_skipLog) {
      this.logger.info('Flash model - Response received', { 
        responseLength: responseText.length 
      });
      this.logger.debug('Response preview', { preview: responseText.substring(0, 200) });
    }
    
    return responseText;
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
      
      // Initialize model with system instruction and tools
      const sessionModel = this.genAI.getGenerativeModel({
        model: MODEL_CONFIG.FLASH,
        systemInstruction: systemPrompt,
        tools: AI_SESSION_TOOLS,
        safetySettings: SAFETY_SETTINGS
      });
      
      this.logger.debug('Model initialized', {
        model: MODEL_CONFIG.FLASH,
        toolsCount: AI_SESSION_TOOLS[0].functionDeclarations.length
      });
      
      // Start chat session with history
      let historyFormatted = chatHistory.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Ensure history starts with 'user' role (Gemini API requirement)
      // Remove messages from the beginning until we find a 'user' message
      while (historyFormatted.length > 0 && historyFormatted[0].role !== 'user') {
        historyFormatted.shift();
      }
      
      this.logger.debug('Chat history formatted', {
        originalLength: chatHistory.length,
        formattedLength: historyFormatted.length,
        roles: historyFormatted.map(h => h.role).join(', ')
      });
      
      const chat = sessionModel.startChat({
        history: historyFormatted,
        generationConfig: GENERATION_CONFIG.CHAT
      });
      
      // Get the last user message
      const lastUserMessage = chatHistory[chatHistory.length - 1]?.content || '';
      
      this.logger.info('Sending message to model', { 
        messageLength: lastUserMessage.length,
        messagePreview: lastUserMessage.substring(0, 200) 
      });
      
      // Send message and get response
      const result = await chat.sendMessage(lastUserMessage);
      const response = result.response;
      
      this.logger.debug('Raw response received', {
        hasResponse: !!response,
        hasCandidates: !!response.candidates,
        candidatesCount: response.candidates?.length || 0
      });
      
      // Log candidates and safety ratings for debugging
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0];
        this.logger.info('Response candidate details', {
          finishReason: candidate.finishReason,
          hasContent: !!candidate.content,
          partsCount: candidate.content?.parts?.length || 0,
          safetyRatings: candidate.safetyRatings?.map(r => ({ 
            category: r.category, 
            probability: r.probability,
            blocked: r.blocked 
          }))
        });
        
        // Log parts for debugging
        if (candidate.content?.parts) {
          candidate.content.parts.forEach((part, idx) => {
            this.logger.debug(`Response part ${idx}`, {
              hasText: !!part.text,
              textLength: part.text?.length || 0,
              hasFunctionCall: !!part.functionCall,
              functionName: part.functionCall?.name
            });
          });
        }
      } else {
        this.logger.warn('No candidates in response', {
          hasResponse: !!response,
          responseKeys: response ? Object.keys(response) : []
        });
      }
      
      // Check for function calls FIRST (this is the structured response)
      const functionCalls = response.functionCalls();
      
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
      
      // If no function call, it's a regular conversational response (asking a question)
      this.logger.debug('No function call, attempting to extract text');
      
      let responseText;
      try {
        responseText = response.text();
        this.logger.debug('Text extracted successfully', {
          textLength: responseText.length,
          textPreview: responseText.substring(0, 100)
        });
      } catch (textError) {
        this.logger.error('Failed to extract text from response', {
          error: textError.message,
          errorStack: textError.stack,
          candidates: candidates?.length || 0,
          finishReason: candidates?.[0]?.finishReason,
          hasContent: !!candidates?.[0]?.content,
          contentParts: candidates?.[0]?.content?.parts?.length || 0
        });
        responseText = '';
      }
      
      // Warn if response is empty (this shouldn't happen)
      if (!responseText || responseText.trim().length === 0) {
        const finishReason = candidates?.[0]?.finishReason;
        
        this.logger.error('CRITICAL: AI returned empty response', {
          mode,
          contentType,
          chatHistoryLength: chatHistory.length,
          lastUserMessageLength: lastUserMessage.length,
          lastUserMessage: lastUserMessage.substring(0, 200),
          candidatesCount: candidates?.length || 0,
          finishReason: finishReason,
          safetyRatings: candidates?.[0]?.safetyRatings,
          systemPromptLength: systemPrompt.length,
          toolsProvided: !!AI_SESSION_TOOLS
        });
        
        // Provide specific error messages based on finish reason
        let errorMessage = "I apologize, but I ran into an issue. Please try again.";
        
        if (finishReason === 'MAX_TOKENS') {
          errorMessage = "I tried to process too much information at once. Could you break that down into smaller chunks or give me fewer details at a time?";
        } else if (finishReason === 'MALFORMED_FUNCTION_CALL') {
          errorMessage = "I had trouble understanding your request. Could you rephrase that or provide the information in a different way?";
        } else if (finishReason === 'SAFETY') {
          errorMessage = "I couldn't process that request due to content policy. Please try rephrasing your request.";
        }
        
        // Return a fallback message
        return {
          message: errorMessage,
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
        contentType: contentType // No change
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
      
      // Generate content using pro model
      const fullResponse = await this._callModelWithRetry(
        this.proModel,
        [{ role: 'user', parts: [{ text: prompt }] }],
        GENERATION_CONFIG.CREATIVE,
        'Content generation'
      );
      
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
      
      const result = await this._callModelWithRetry(
        this.flashModel,
        [{ role: 'user', parts: [{ text: prompt }] }],
        GENERATION_CONFIG.SHORT,
        'Extract title'
      );
      
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
      
      const result = await this._callModelWithRetry(
        this.flashModel,
        [{ role: 'user', parts: [{ text: prompt }] }],
        GENERATION_CONFIG.VERY_PRECISE,
        'Infer content type'
      );
      
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
      
      const result = await this._callModelWithRetry(
        this.flashModel,
        [{ role: 'user', parts: [{ text: prompt }] }],
        GENERATION_CONFIG.PRECISE,
        'Extract metadata'
      );
      
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
      
      const result = await this._callModelWithRetry(
        this.flashModel,
        [{ role: 'user', parts: [{ text: prompt }] }],
        GENERATION_CONFIG.VERY_PRECISE,
        'Check multiple posts'
      );
      
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
      
      const result = await this._callModelWithRetry(
        this.flashModel,
        [{ role: 'user', parts: [{ text: prompt }] }],
        GENERATION_CONFIG.PRECISE,
        'Generate multiple posts'
      );
      
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
}

module.exports = new GeminiService();
