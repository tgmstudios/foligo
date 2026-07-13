function stringify(value, maxChars) {
  let text;
  try { text = JSON.stringify(value); } catch { text = String(value); }
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}… [truncated]`;
}

function toolOutputValue(output) {
  if (!output || typeof output !== 'object') return output;
  if ('value' in output) return output.value;
  return output;
}

/**
 * Some OpenAI-compatible gateways accept tool definitions and produce tool
 * calls, but reject subsequent requests containing native tool-call/tool
 * result history. Convert completed historical rounds into ordinary text
 * while leaving user/assistant prose intact. The next request can still
 * advertise tools and produce a fresh native tool call.
 */
function flattenToolMessages(messages, { maxPartChars = 12000 } = {}) {
  return (messages || []).map(message => {
    if (!Array.isArray(message?.content)) return message;

    if (message.role === 'assistant') {
      const lines = message.content.flatMap(part => {
        if (part?.type === 'text' && part.text) return [part.text];
        if (part?.type === 'tool-call') {
          return [`[Requested tool ${part.toolName}: ${stringify(part.input, maxPartChars)}]`];
        }
        return [];
      });
      return { role: 'assistant', content: lines.join('\n') || '[Assistant requested a tool.]' };
    }

    if (message.role === 'tool') {
      const lines = message.content
        .filter(part => part?.type === 'tool-result')
        .map(part => `[Tool ${part.toolName} result: ${stringify(toolOutputValue(part.output), maxPartChars)}]`);
      return { role: 'user', content: lines.join('\n') || '[A tool completed without a result.]' };
    }

    return message;
  });
}

module.exports = { flattenToolMessages };
