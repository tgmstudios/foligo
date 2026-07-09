/**
 * Gemini AI Provider — Google Gemini via @google/generative-ai SDK.
 * 
 * Config:
 *   AI_GEMINI_API_KEY  — Google AI API key
 *   AI_GEMINI_MODEL    — model name (default: gemini-flash-latest)
 *   AI_GEMINI_BASE_URL — optional custom endpoint
 */
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require('@google/generative-ai');
const BaseProvider = require('./base');

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'gemini';
    this.apiKey = config.apiKey || process.env.AI_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    this.modelName = config.model || process.env.AI_GEMINI_MODEL || 'gemini-flash-latest';
    this.baseUrl = config.baseUrl || process.env.AI_GEMINI_BASE_URL || null;

    if (!this.apiKey) {
      console.warn('[GeminiProvider] No API key configured — provider will be unavailable');
      this.genAI = null;
      return;
    }

    const initOpts = {};
    if (this.baseUrl) initOpts.baseUrl = this.baseUrl;
    this.genAI = new GoogleGenerativeAI(this.apiKey, initOpts);
  }

  get displayName() { return `Gemini (${this.modelName})`; }

  get capabilities() {
    return {
      streaming: true,
      tools: true,
      vision: true,
      json: true,
      reasoning: this.modelName.includes('pro'),
      maxTokens: this.modelName.includes('pro') ? 8192 : 4096,
    };
  }

  _getModel(tools, systemInstruction) {
    if (!this.genAI) throw new Error('GeminiProvider: not configured (missing API key)');
    const opts = { model: this.modelName, safetySettings: SAFETY_SETTINGS };
    if (tools) opts.tools = tools;
    if (systemInstruction) opts.systemInstruction = systemInstruction;
    return this.genAI.getGenerativeModel(opts);
  }

  async generateText(prompt, options = {}) {
    const model = this._getModel();
    const generationConfig = {
      temperature: options.temperature ?? 0.7,
      topK: options.topK ?? 40,
      topP: options.topP ?? 0.95,
      maxOutputTokens: options.maxTokens ?? this.capabilities.maxTokens,
    };
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig });
    return result.response.text();
  }

  async generateChat(messages, options = {}) {
    const { tools, systemInstruction, temperature = 0.7, maxTokens } = options;
    const model = this._getModel(tools, systemInstruction);
    const generationConfig = {
      temperature,
      topK: options.topK ?? 40,
      topP: options.topP ?? 0.95,
      maxOutputTokens: maxTokens ?? this.capabilities.maxTokens,
    };

    // Convert messages to Gemini format — Gemini requires first message to be 'user'
    const contents = [];
    for (const msg of messages) {
      contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] });
    }
    // Ensure starts with user
    while (contents.length > 0 && contents[0].role !== 'user') contents.shift();

    const result = await model.generateContent({ contents, generationConfig });
    const response = result.response;

    const functionCalls = response.functionCalls?.() || null;
    let text = null;
    try { text = response.text(); } catch { /* function call only — no text */ }

    return { text, functionCalls };
  }

  async generateWithTools(prompt, tools, options = {}) {
    return this.generateChat([{ role: 'user', content: prompt }], { ...options, tools });
  }

  /** Stream a response — returns an async iterable of text chunks */
  async *streamText(prompt, options = {}) {
    const model = this._getModel();
    const generationConfig = {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? this.capabilities.maxTokens,
    };
    const result = await model.generateContentStream({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig });
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }
}

module.exports = GeminiProvider;
