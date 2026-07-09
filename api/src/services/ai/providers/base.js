/**
 * Base AI Provider — defines the interface every provider must implement.
 * 
 * Supported capabilities:
 *   streaming  — provider supports streaming responses
 *   tools      — provider supports function/tool calling
 *   vision     — provider can process images
 *   json       — provider supports structured JSON output mode
 *   reasoning  — provider supports reasoning/thinking tokens
 */
class BaseProvider {
  constructor(config) {
    this.config = config;
    this.name = 'base';
  }

  /** Human-readable provider name for UIs */
  get displayName() { return this.name; }

  /** Capabilities object — override in subclasses */
  get capabilities() {
    return {
      streaming: false,
      tools: false,
      vision: false,
      json: false,
      reasoning: false,
      maxTokens: 4096,
    };
  }

  /**
   * Generate text from a simple prompt.
   * @param {string} prompt — the input prompt
   * @param {object} options — { temperature, maxTokens, stopSequences, ... }
   * @returns {Promise<string>} generated text
   */
  async generateText(prompt, options = {}) {
    throw new Error(`${this.name}: generateText() not implemented`);
  }

  /**
   * Generate text from a chat conversation.
   * @param {Array<{role:string, content:string}>} messages
   * @param {object} options — { temperature, maxTokens, tools, ... }
   * @returns {Promise<{text: string, functionCalls?: Array}>}
   */
  async generateChat(messages, options = {}) {
    throw new Error(`${this.name}: generateChat() not implemented`);
  }

  /**
   * Generate text with tool/function calling support.
   * Returns structured function calls if the model decides to use tools.
   * @returns {Promise<{text: string|null, functionCalls: Array|null}>}
   */
  async generateWithTools(prompt, tools, options = {}) {
    const messages = [{ role: 'user', content: prompt }];
    return this.generateChat(messages, { ...options, tools });
  }

  /**
   * Health check — returns true if provider is reachable.
   */
  async healthCheck() {
    try {
      await this.generateText('ping', { maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = BaseProvider;
