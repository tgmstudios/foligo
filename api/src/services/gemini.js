const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createGeminiLogger } = require('./logger');
const { prompts, fallbackQuestions } = require('./prompts');
const { MODEL_CONFIG, GENERATION_CONFIG, SAFETY_SETTINGS, SYSTEM_INSTRUCTIONS } = require('./gemini-config');
const { retryWithBackoff } = require('./retry');
const { GeminiConfigError, GeminiAPIError, GeminiParseError } = require('./errors');

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
   * Generate blog post
   */
  async generateBlogPost(topic, details = {}) {
    this.logger.info('Generating blog post', { topic, details });
    const prompt = prompts.buildBlog(topic, details);
    return this.generateContent(prompt, { temperature: 0.8 });
  }

  /**
   * Generate project description
   */
  async generateProjectDescription(projectName, technologies = [], features = []) {
    this.logger.info('Generating project description', { 
      projectName, 
      technologiesCount: technologies.length,
      featuresCount: features.length 
    });
    const prompt = prompts.buildProject(projectName, technologies, features);
    return this.generateContent(prompt, { temperature: 0.7 });
  }

  /**
   * Generate experience description
   */
  async generateExperienceDescription(company, position, duration, responsibilities = []) {
    this.logger.info('Generating experience description', { 
      company, 
      position, 
      duration,
      responsibilitiesCount: responsibilities.length 
    });
    const prompt = prompts.buildExperience(company, position, duration, responsibilities);
    return this.generateContent(prompt, { temperature: 0.6 });
  }

  /**
   * Chat with user
   */
  async chatWithUser(messages) {
    this.logger.info('Chat with user', { messageCount: messages.length });
    
    const systemPrompt = prompts.chatWithUser();
    
    // Format messages for Gemini
    const formattedMessages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ];

    this.logger.debug('Last user message', { 
      preview: messages[messages.length - 1]?.content?.substring(0, 200) 
    });
    
    const responseText = await this._callModelWithRetry(
      this.chatModel,
      formattedMessages,
      GENERATION_CONFIG.CHAT,
      'Chat with user'
    );
    
    this.logger.info('Chat response received', { 
      responseLength: responseText.length 
    });
    
    return responseText;
  }

  /**
   * Generate content from answers
   */
  async generateContentFromAnswers(contentType, topic, answers, questions, chatHistory = []) {
    this.logger.info('Generating content from answers', { 
      contentType, 
      topic,
      answersCount: answers.length,
      questionsCount: questions.length 
    });
    
    const promptGenerator = prompts.generateFromAnswers[contentType] || prompts.generateFromAnswers['BLOG'];
    const prompt = promptGenerator(topic, questions, answers, chatHistory);
    
    return this.generateContent(prompt, { temperature: 0.8 });
  }

  /**
   * Generate clarifying questions
   */
  async generateClarifyingQuestions(contentType, initialInfo = {}) {
    this.logger.info('Generating clarifying questions', { contentType });
    
    const promptGenerator = prompts.clarifyingQuestions[contentType] || prompts.clarifyingQuestions['BLOG'];
    const prompt = promptGenerator(initialInfo);
    
    try {
      const response = await this.generateContent(prompt, { 
        temperature: 0.3, 
        _skipLog: false 
      });
      
      // Parse and validate response
      const questions = this._parseQuestionsResponse(response);
      
      if (Array.isArray(questions) && questions.every(q => typeof q === 'string')) {
        this.logger.info('Clarifying questions generated', { count: questions.length });
        return questions;
      } else {
        throw new Error('Invalid question format');
      }
    } catch (error) {
      this.logger.warn('Failed to generate clarifying questions, using fallback', { 
        error: error.message 
      });
      return fallbackQuestions[contentType] || fallbackQuestions['BLOG'];
    }
  }

  /**
   * Private: Parse questions response
   */
  _parseQuestionsResponse(response) {
    let cleanedResponse = response.trim();
    
    // Remove markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON array in the response
    const jsonMatch = cleanedResponse.match(/\[.*\]/s);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    return JSON.parse(cleanedResponse);
  }

  /**
   * Ask next question in conversation
   */
  async askNextQuestion(contentType, currentInfo, chatHistory, questionNumber, maxQuestions) {
    this.logger.info('Asking next question', { 
      contentType, 
      questionNumber, 
      maxQuestions 
    });
    
    const promptData = {
      contentType,
      currentInfo: JSON.stringify(currentInfo),
      chatHistory: JSON.stringify(chatHistory),
      questionNumber,
      maxQuestions
    };
    
    // Build prompt (simplified version - actual prompt would use the prompts module)
    const prompt = `You are a content creation assistant. Ask question ${questionNumber} of ${maxQuestions} based on ${promptData.contentType} type and current info.`;
    
    try {
      const response = await this.generateContent(prompt, { 
        temperature: 0.7, 
        _skipLog: false 
      });
      
      this.logger.info('Next question generated', { questionNumber });
      return response.trim();
    } catch (error) {
      this.logger.warn('Failed to generate question, using fallback', { 
        error: error.message 
      });
      
      const questions = fallbackQuestions[contentType] || fallbackQuestions['BLOG'];
      return questions[questionNumber - 1] || questions[questions.length - 1];
    }
  }

  /**
   * Handle AI session - main conversation handler
   * Refactored into smaller helper methods
   */
  async handleAISession(mode, contentType, initialInfo, chatHistory, context = {}) {
    this.logger.info('Starting AI session', { 
      mode, 
      contentType,
      chatHistoryLength: chatHistory.length 
    });
    
    try {
      // Generate system prompt based on mode
      const systemPrompt = this._buildSystemPrompt(mode, contentType, initialInfo, context);
      
      // Build conversation history
      const formattedMessages = this._formatChatHistory(systemPrompt, chatHistory);
      
      this.logger.debug('AI session context', { 
        messageCount: formattedMessages.length,
        lastMessagePreview: formattedMessages[formattedMessages.length - 1]?.parts[0]?.text?.substring(0, 200)
      });
      
      // Call model
      const responseText = await this._callModelWithRetry(
        this.flashModel,
        formattedMessages,
        GENERATION_CONFIG.CHAT,
        'AI session'
      );
      
      this.logger.info('AI session response received', { 
        responseLength: responseText.length 
      });
      
      // Parse response and check for special commands
      return await this._parseSessionResponse(responseText, contentType, chatHistory, initialInfo);
      
    } catch (error) {
      this.logger.error('AI session error', { error: error.message });
      throw new GeminiAPIError(`Failed to handle AI session: ${error.message}`, error);
    }
  }

  /**
   * Private: Build system prompt for AI session
   */
  _buildSystemPrompt(mode, contentType, initialInfo, context) {
    if (mode === 'edit') {
      return prompts.aiSessionEdit(initialInfo, context.chatHistory || []);
    } else {
      return prompts.aiSessionCreate(contentType, initialInfo, context);
    }
  }

  /**
   * Private: Format chat history for API call
   */
  _formatChatHistory(systemPrompt, chatHistory) {
    return [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...chatHistory.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ];
  }

  /**
   * Private: Parse session response for special commands and completion signals
   */
  async _parseSessionResponse(responseText, contentType, chatHistory, initialInfo) {
    // Check for toolcall (post fetch request)
    const toolcallMatch = this._checkForToolcall(responseText);
    if (toolcallMatch) {
      return toolcallMatch;
    }
    
    // Check if AI is done asking questions
    const doneMatch = this._checkForCompletion(responseText);
    if (doneMatch) {
      return await this._handleCompletion(doneMatch, responseText, contentType, chatHistory, initialInfo);
    }
    
    // Check if content type needs correction
    const correctedType = await this._checkContentTypeCorrection(contentType, chatHistory, initialInfo);
    
    return {
      message: responseText,
      done: false,
      contentType: correctedType
    };
  }

  /**
   * Private: Check for toolcall in response
   */
  _checkForToolcall(responseText) {
    const toolcallRegex = /{"toolcall"\s*:\s*"fetch_post"\s*,\s*"postId"\s*:\s*"([^"]+)"}/;
    const toolcallMatch = responseText.match(toolcallRegex);
    
    if (toolcallMatch) {
      const postId = toolcallMatch[1];
      this.logger.info('Toolcall detected', { postId });
      
      return {
        toolcall: 'fetch_post',
        postId: postId,
        message: responseText.replace(toolcallRegex, '').trim() || 'Fetching post...',
        done: false
      };
    }
    
    return null;
  }

  /**
   * Private: Check for completion signal
   */
  _checkForCompletion(responseText) {
    const doneRegex = /{"done"\s*:\s*true[^}]*}/;
    const doneMatch = responseText.match(doneRegex);
    
    if (doneMatch) {
      try {
        return JSON.parse(doneMatch[0]);
      } catch (e) {
        this.logger.warn('Failed to parse completion JSON', { error: e.message });
        return { done: true, summary: 'Conversation complete' };
      }
    }
    
    return null;
  }

  /**
   * Private: Handle completion of conversation
   */
  async _handleCompletion(doneInfo, responseText, contentType, chatHistory, initialInfo) {
    this.logger.info('AI session completed', { 
      contentType,
      summary: doneInfo.summary 
    });
    
    // Check if contentType needs correction at completion
    const correctedType = await this._checkContentTypeCorrection(contentType, chatHistory, initialInfo);
    
    if (correctedType !== contentType) {
      this.logger.info('Content type corrected at completion', { 
        from: contentType, 
        to: correctedType 
      });
    }
    
    return {
      message: responseText,
      done: true,
      summary: doneInfo.summary,
      changes: doneInfo.changes || null,
      contentType: correctedType
    };
  }

  /**
   * Private: Check if content type needs correction
   */
  async _checkContentTypeCorrection(contentType, chatHistory, initialInfo) {
    // Only check if we have enough conversation history
    if (chatHistory.length < 2) {
      return contentType;
    }
    
    const inferredType = await this.inferContentType(chatHistory, initialInfo);
    
    if (inferredType && inferredType !== contentType) {
      this.logger.info('Content type correction needed', { 
        from: contentType, 
        to: inferredType 
      });
      return inferredType;
    }
    
    return contentType;
  }

  /**
   * Generate final content
   * Refactored into smaller helper methods
   */
  async generateFinalContent(mode, contentType, chatHistory, currentContent, changes, context = {}) {
    this.logger.info('Generating final content', { 
      mode, 
      contentType,
      chatHistoryLength: chatHistory.length 
    });
    
    try {
      // Build the complete prompt
      const prompt = this._buildContentGenerationPrompt(mode, contentType, chatHistory, currentContent, changes, context);
      
      this.logger.debug('Content generation prompt', { 
        promptLength: prompt.length,
        firstChars: prompt.substring(0, 500),
        lastChars: prompt.substring(prompt.length - 500)
      });
      
      // Generate content using pro model
      let content = await this._callModelWithRetry(
        this.proModel,
        [{ role: 'user', parts: [{ text: prompt }] }],
        GENERATION_CONFIG.CREATIVE,
        'Content generation'
      );
      
      this.logger.info('Content generated', { 
        contentLength: content.length 
      });
      
      // Extract and process the content
      const { cleanedContent, extractedSkills, extractedTags } = this._extractAndCleanContent(content);
      
      // Extract title
      const title = await this.extractTitleFromConversation(contentType, chatHistory, cleanedContent);
      
      // Extract metadata
      const metadata = await this.extractMetadataFromConversation(contentType, chatHistory, cleanedContent);
      
      // Match or create skills and tags
      const matchedSkills = await this.matchOrCreateSkills(extractedSkills, context);
      const matchedTags = await this.matchOrCreateTags(extractedTags, context);
      
      // Check for multiple posts
      const shouldCreateMultiple = await this.shouldCreateMultiplePosts(chatHistory, contentType);
      
      const result = {
        content: cleanedContent,
        title,
        metadata,
        skills: matchedSkills,
        tags: matchedTags
      };
      
      if (shouldCreateMultiple) {
        const multiplePosts = await this.generateMultiplePosts(chatHistory, context);
        result.multiplePosts = multiplePosts || null;
      }
      
      this.logger.info('Final content prepared', { 
        title,
        skillsCount: matchedSkills.length,
        tagsCount: matchedTags.length,
        hasMultiplePosts: !!result.multiplePosts
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('Content generation error', { error: error.message });
      throw new GeminiAPIError(`Failed to generate final content: ${error.message}`, error);
    }
  }

  /**
   * Private: Build content generation prompt
   */
  _buildContentGenerationPrompt(mode, contentType, chatHistory, currentContent, changes, context) {
    const globalPrompt = prompts.contentGenerationGlobal(chatHistory, context);
    
    let typeSpecificPrompt = '';
    if (mode === 'edit') {
      typeSpecificPrompt = prompts.contentGenerationEdit(currentContent, changes);
    } else {
      // Get type-specific prompt
      const promptMap = {
        'PROJECT': prompts.contentGenerationProject,
        'EXPERIENCE': prompts.contentGenerationExperience,
        'BLOG': prompts.contentGenerationBlog,
        'SKILL': prompts.contentGenerationSkill
      };
      
      const promptGenerator = promptMap[contentType];
      if (promptGenerator) {
        typeSpecificPrompt = promptGenerator();
      }
    }
    
    return globalPrompt + (typeSpecificPrompt ? '\n' + typeSpecificPrompt : '');
  }

  /**
   * Private: Extract skills/tags JSON and clean content
   */
  _extractAndCleanContent(content) {
    let extractedSkills = [];
    let extractedTags = [];
    
    // Extract skills and tags JSON block
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const jsonMatch = content.match(jsonBlockRegex);
    
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        extractedSkills = jsonData.skills || [];
        extractedTags = jsonData.tags || [];
        // Remove the JSON block from content
        content = content.replace(jsonBlockRegex, '').trim();
        
        this.logger.debug('Extracted skills and tags', { 
          skillsCount: extractedSkills.length,
          tagsCount: extractedTags.length 
        });
      } catch (e) {
        this.logger.warn('Failed to parse skills/tags JSON', { error: e.message });
      }
    }
    
    // Clean up the content
    const cleanedContent = this._cleanGeneratedContent(content);
    
    return { cleanedContent, extractedSkills, extractedTags };
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
    
    // Remove any stray # title headings
    content = content.replace(/^#\s+.+$/m, '').trim();
    
    return content;
  }

  /**
   * Extract title from conversation
   */
  async extractTitleFromConversation(contentType, chatHistory, generatedContent) {
    this.logger.info('Extracting title', { contentType });
    
    try {
      const conversationText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = prompts.extractTitle(contentType, conversationText);
      
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
      'BLOG': 'Untitled Post',
      'SKILL': 'Skill'
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
      
      const prompt = prompts.inferContentType(conversationText, infoText);
      
      const result = await this._callModelWithRetry(
        this.flashModel,
        [{ role: 'user', parts: [{ text: prompt }] }],
        GENERATION_CONFIG.VERY_PRECISE,
        'Infer content type'
      );
      
      const inferredType = result.trim().toUpperCase();
      
      this.logger.info('Content type inferred', { inferredType });
      
      if (['PROJECT', 'BLOG', 'EXPERIENCE', 'SKILL'].includes(inferredType)) {
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
    
    // Priority 5: SKILL indicators
    if (/(?:skill|technology|programming language|framework|tool|proficient|expert)/i.test(fullText)) {
      return 'SKILL';
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
      
      const promptGenerator = prompts.extractMetadata[contentType] || prompts.extractMetadata['BLOG'];
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
      
      const prompt = prompts.shouldCreateMultiplePosts(conversationText, primaryType);
      
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
      const prompt = prompts.generateMultiplePosts(conversationText);
      
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
          const validTypes = additionalTypes.filter(t => ['PROJECT', 'BLOG', 'EXPERIENCE', 'SKILL'].includes(t));
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
