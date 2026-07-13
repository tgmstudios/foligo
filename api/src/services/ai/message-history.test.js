const { flattenToolMessages } = require('./message-history');

describe('flattenToolMessages', () => {
  test('converts native tool history into provider-safe text', () => {
    const messages = flattenToolMessages([
      { role: 'user', content: [{ type: 'text', text: 'Fill the page.' }] },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'I will inspect it.' },
          { type: 'tool-call', toolCallId: 'call_1', toolName: 'rescan_page', input: {} },
        ],
      },
      {
        role: 'tool',
        content: [{
          type: 'tool-result', toolCallId: 'call_1', toolName: 'rescan_page',
          output: { type: 'json', value: { fields: [{ ref: 'f0' }] } },
        }],
      },
    ]);

    expect(messages[0]).toEqual({ role: 'user', content: [{ type: 'text', text: 'Fill the page.' }] });
    expect(messages[1]).toEqual({
      role: 'assistant',
      content: 'I will inspect it.\n[Requested tool rescan_page: {}]',
    });
    expect(messages[2]).toEqual({
      role: 'user',
      content: '[Tool rescan_page result: {"fields":[{"ref":"f0"}]}]',
    });
  });

  test('truncates oversized historical tool output', () => {
    const [message] = flattenToolMessages([{
      role: 'tool',
      content: [{
        type: 'tool-result', toolCallId: 'call_1', toolName: 'get_resume',
        output: { type: 'json', value: { text: 'x'.repeat(100) } },
      }],
    }], { maxPartChars: 30 });

    expect(message.content).toContain('[truncated]');
    expect(message.content.length).toBeLessThan(100);
  });
});
