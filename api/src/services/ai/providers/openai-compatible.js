/**
 * OpenAI-Compatible Provider — works with any OpenAI Chat Completions API.
 * 
 * Used by: OpenAI, OpenCode Go, Ollama, LM Studio, vLLM, Groq, Together AI,
 *          DeepSeek, Mistral, xAI, and any custom endpoint.
 * 
 * Config (per provider instance):
 *   endpoint  — API base URL (e.g., https://api.openai.com/v1)
 *   apiKey    — API key (optional for local models)
 *   model     — model name
 *   headers   — extra HTTP headers
 */
const BaseProvider = require('./base');

class OpenAICompatibleProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = config.name || 'openai-compatible';
    this.endpoint = (config.endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.apiKey = config.apiKey || null;
    this.modelName = config.model || 'gpt-4o-mini';
    this.extraHeaders = config.headers || {};
    this.modelParams = config.modelParams || {}; // extra params some APIs need (e.g., max_completion_tokens)
  }

  get displayName() {
    const label = { opencode: 'OpenCode', ollama: 'Ollama', openai: 'OpenAI' }[this.name] || this.name;
    return `${label} (${this.modelName})`;
  }

  get capabilities() {
    return {
      streaming: true,
      tools: true,
      vision: this.name !== 'ollama', // Ollama vision varies by model
      json: true,
      reasoning: false,
      maxTokens: this.modelParams.maxTokens || 4096,
    };
  }

  _buildHeaders() {
    const h = { 'Content-Type': 'application/json', ...this.extraHeaders };
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`;
    return h;
  }

  _buildBody(messages, options) {
    const body = {
      model: this.modelName,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.capabilities.maxTokens,
      ...this.modelParams,
    };

    if (options.tools?.length) {
      body.tools = options.tools.map(t => ({
        type: 'function',
        function: t.function || t,
      }));
      body.tool_choice = options.toolChoice || 'auto';
    }

    if (options.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    if (options.stop) body.stop = options.stop;
    if (options.topP != null) body.top_p = options.topP;

    return body;
  }

  async _call(messages, options = {}) {
    const url = `${this.endpoint}/chat/completions`;
    const body = this._buildBody(messages, options);

    const resp = await fetch(url, {
      method: 'POST',
      headers: this._buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`[${this.name}] HTTP ${resp.status}: ${err.slice(0, 500)}`);
    }

    return resp.json();
  }

  async generateText(prompt, options = {}) {
    const data = await this._call([{ role: 'user', content: prompt }], options);
    return data.choices?.[0]?.message?.content || '';
  }

  async generateChat(messages, options = {}) {
    const data = await this._call(messages, options);
    const choice = data.choices?.[0];
    if (!choice) throw new Error(`[${this.name}] No response from model`);

    const content = choice.message?.content || null;

    // Extract function/tool calls if present
    let functionCalls = null;
    if (choice.message?.tool_calls?.length) {
      functionCalls = choice.message.tool_calls.map(tc => ({
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments),
      }));
    }

    return { text: content, functionCalls };
  }

  async healthCheck() {
    try {
      await this.generateText('ping', { maxTokens: 5 });
      return true;
    } catch { return false; }
  }
}

module.exports = OpenAICompatibleProvider;
