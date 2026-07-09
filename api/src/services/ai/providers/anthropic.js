/**
 * Anthropic AI Provider — Claude via @anthropic-ai/sdk.
 * 
 * Config:
 *   AI_ANTHROPIC_API_KEY  — Anthropic API key
 *   AI_ANTHROPIC_MODEL    — model name (default: claude-sonnet-4-20250514)
 *   AI_ANTHROPIC_BASE_URL — optional custom endpoint
 */
const BaseProvider = require('./base');

class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'anthropic';
    this.apiKey = config.apiKey || process.env.AI_ANTHROPIC_API_KEY;
    this.modelName = config.model || process.env.AI_ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    this.baseUrl = config.baseUrl || process.env.AI_ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
    this.anthropicVersion = '2023-06-01';
  }

  get displayName() { return `Claude (${this.modelName})`; }

  get capabilities() {
    return {
      streaming: true,
      tools: true,
      vision: true,
      json: false, // Claude doesn't have JSON mode but is good at it
      reasoning: this.modelName.includes('opus') || this.modelName.includes('sonnet'),
      maxTokens: 4096,
    };
  }

  _buildHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': this.anthropicVersion,
    };
  }

  _buildBody(messages, options) {
    const { systemPrompt, tools, temperature, maxTokens } = options;

    // Convert messages to Anthropic format
    const anthropicMessages = [];
    for (const msg of messages) {
      anthropicMessages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    }

    const body = {
      model: this.modelName,
      messages: anthropicMessages,
      max_tokens: maxTokens ?? this.capabilities.maxTokens,
      temperature: temperature ?? 0.7,
    };

    if (systemPrompt) body.system = systemPrompt;
    if (tools?.length) body.tools = tools;

    return body;
  }

  async _call(messages, options = {}) {
    const url = `${this.baseUrl}/v1/messages`;
    const body = this._buildBody(messages, options);

    const resp = await fetch(url, {
      method: 'POST',
      headers: this._buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`[anthropic] HTTP ${resp.status}: ${err.slice(0, 500)}`);
    }

    return resp.json();
  }

  _extractResponse(data) {
    let text = '';
    const toolUses = [];

    for (const block of data.content || []) {
      if (block.type === 'text') text += block.text;
      if (block.type === 'tool_use') {
        toolUses.push({ name: block.name, args: block.input });
      }
    }

    return { text: text || null, functionCalls: toolUses.length ? toolUses : null };
  }

  async generateText(prompt, options = {}) {
    const data = await this._call([{ role: 'user', content: prompt }], options);
    return this._extractResponse(data).text || '';
  }

  async generateChat(messages, options = {}) {
    const data = await this._call(messages, options);
    return this._extractResponse(data);
  }
}

module.exports = AnthropicProvider;
