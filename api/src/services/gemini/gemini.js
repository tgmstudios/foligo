/**
 * Gemini Service — AI-powered content generation for Foligo.
 *
 * NOW MODEL-AGNOSTIC: all AI calls are routed through the unified AIManager.
 * Defaults to Gemini but respects AI_DEFAULT_PROVIDER / AI_FALLBACK_CHAIN env vars.
 * The public API is unchanged — routes don't need modification.
 *
 * This file is a thin facade: it owns the singleton's shared state (logger,
 * AI-call helpers) and delegates each method group to the corresponding
 * module under ./gemini/*, passing that state through explicitly instead of
 * relying on mixed-in prototypes.
 */
const { prisma } = require('../core/database');
const { createAILogger } = require('../core/logger');
const { GENERATION_CONFIG } = require('./config');
const { createAiClient } = require('./ai-client');
const { stripMarkdown, extractHashtags } = require('./text-cleanup');
const sessionFlow = require('./session-flow');
const metadata = require('./metadata');
const multiPost = require('./multi-post');
const socialPost = require('./social-post');
const resumeChatbot = require('./resume-chatbot');
const skillTagMatcher = require('../content/skill-tag-matcher');

class GeminiService {
  constructor() {
    this.logger = createAILogger({ service: 'content-ai' });
    this._ai = createAiClient(this.logger);
    this.logger.info('Initializing AI service (model-agnostic)', {
      defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'gemini',
      fallback: process.env.AI_FALLBACK_CHAIN || 'gemini,opencode',
    });
  }

  /** Shared deps passed into the extracted gemini/* modules. */
  get _deps() {
    return { aiText: this._ai.aiText, aiChat: this._ai.aiChat, logger: this.logger };
  }

  // ─── Internal helpers (replaces _callModelWithRetry) ──────────────

  /** Simple text generation through AIManager. Keeps retry + logging. */
  async _aiText(prompt, options = {}) {
    return this._ai.aiText(prompt, options);
  }

  /** Chat/tools generation through AIManager. Provider chosen by AI_DEFAULT_PROVIDER env var. */
  async _aiChat(messages, options = {}) {
    return this._ai.aiChat(messages, options);
  }

  /**
   * Private: Strip markdown formatting and convert to plain text
   */
  _stripMarkdown(text) {
    return stripMarkdown(text);
  }

  /**
   * Private: Extract relevant hashtags from content data
   */
  _extractHashtags(contentData) {
    return extractHashtags(contentData);
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
  async handleAISession(mode, contentType, initialInfo, chatHistory, context = {}, extra = {}) {
    return sessionFlow.handleAISession(mode, contentType, initialInfo, chatHistory, context, { ...this._deps, ...extra });
  }

  /**
   * Stream a content-creator conversation turn. Raw reasoning, text, and tool
   * events are yielded immediately; the final session state is returned as a
   * synthetic session-result event so the route can execute server-side tools.
   */
  streamAISession(mode, contentType, initialInfo, chatHistory, context = {}, extra = {}) {
    return sessionFlow.streamAISession(mode, contentType, initialInfo, chatHistory, context, { ...this._deps, ...extra });
  }

  /**
   * Private: Handle function call from AI
   * This replaces the old regex-based JSON parsing
   */
  async _handleFunctionCall(functionCall, currentContentType) {
    return sessionFlow.handleFunctionCall(functionCall, currentContentType, this._deps);
  }

  /**
   * Private: Get a natural follow-up message after content type change
   */
  _getFollowUpMessage(contentType) {
    return sessionFlow.getFollowUpMessage(contentType);
  }

  /**
   * Generate final content
   * Now uses XML-based prompts and structured_data extraction
   */
  async generateFinalContent(mode, contentType, chatHistory, currentContent, changes, context = {}) {
    return sessionFlow.generateFinalContent(mode, contentType, chatHistory, currentContent, changes, context, this._deps);
  }

  /**
   * Private: Extract structured_data block and markdown content
   * Parses XML-style structured_data tag and returns both parts
   */
  _extractStructuredData(fullResponse) {
    return metadata.extractStructuredData(fullResponse, this._deps);
  }

  /**
   * Private: Build metadata object from structured data
   * Maps structured data fields to database schema
   */
  _buildMetadataFromStructuredData(structuredData, contentType) {
    return metadata.buildMetadataFromStructuredData(structuredData, contentType);
  }

  /**
   * Extract title from conversation
   */
  async extractTitleFromConversation(contentType, chatHistory, generatedContent) {
    return metadata.extractTitleFromConversation(contentType, chatHistory, generatedContent, this._deps);
  }

  /**
   * Private: Get fallback title
   */
  _getFallbackTitle(contentType) {
    return metadata.getFallbackTitle(contentType);
  }

  /**
   * Infer content type from conversation
   */
  async inferContentType(chatHistory, initialInfo) {
    return metadata.inferContentType(chatHistory, initialInfo, this._deps);
  }

  /**
   * Private: Infer content type from keywords (fallback)
   */
  _inferContentTypeFromKeywords(conversationText, infoText) {
    return metadata.inferContentTypeFromKeywords(conversationText, infoText);
  }

  /**
   * Extract metadata from conversation
   */
  async extractMetadataFromConversation(contentType, chatHistory, generatedContent) {
    return metadata.extractMetadataFromConversation(contentType, chatHistory, generatedContent, this._deps);
  }

  /**
   * Basic fallback metadata extraction using regex
   */
  extractMetadataBasic(contentType, chatHistory, generatedContent) {
    return metadata.extractMetadataBasic(contentType, chatHistory, generatedContent, this._deps);
  }

  /**
   * Check if multiple posts should be created
   */
  async shouldCreateMultiplePosts(chatHistory, primaryType) {
    return multiPost.shouldCreateMultiplePosts(chatHistory, primaryType, this._deps);
  }

  /**
   * Generate multiple linked posts
   */
  async generateMultiplePosts(chatHistory, context) {
    return multiPost.generateMultiplePosts(chatHistory, context, this._deps);
  }

  /**
   * Match or create skills based on extracted skills from AI
   */
  async matchOrCreateSkills(extractedSkills, context) {
    return skillTagMatcher.matchOrCreateSkills(prisma, extractedSkills, context.project?.id, this.logger);
  }

  /**
   * Match or create tags based on extracted tags from AI
   */
  async matchOrCreateTags(extractedTags, context) {
    return skillTagMatcher.matchOrCreateTags(prisma, extractedTags, context.project?.id, this.logger);
  }

  /**
   * Generate social media post (LinkedIn or X/Twitter) for content
   * Creates platform-appropriate post with links to foligo site and project links
   * @param {string} platform - 'linkedin' or 'x'
   */
  async generateSocialPost(contentData, projectData, platform = 'linkedin') {
    return socialPost.generateSocialPost(contentData, projectData, platform, this._deps);
  }

  /**
   * Handle resume chatbot session - specialized for resume and job application assistance
   * Uses larger context window and specialized prompts
   */
  async handleResumeChatbotSession(resumeText, jobPosting, chatHistory, userId, context = {}, extra = {}) {
    return resumeChatbot.handleResumeChatbotSession(resumeText, jobPosting, chatHistory, userId, context, { ...this._deps, ...extra });
  }
}

module.exports = new GeminiService();
