jest.mock('ai', () => ({ tool: definition => definition }));
const { createInteractionTools } = require('./interaction-tools');

describe('content interview tools', () => {
  const tools = createInteractionTools();
  test('supports single-choice questions and multiple-choice polls', async () => {
    for (const multiple of [true, false]) {
      const input = { question: 'Who should this reach?', options: ['Hiring managers', 'Engineers'], multiple };
      expect(tools.ask_user.inputSchema.safeParse(input).success).toBe(true);
      expect(await tools.ask_user.execute(input)).toEqual({ kind: 'question', ...input, waitingForUser: true });
    }
  });
  test('rejects unusable question cards', () => {
    expect(tools.ask_user.inputSchema.safeParse({ question: '', options: ['Only'], multiple: false }).success).toBe(false);
  });
  test('requests screenshots without treating display as an answer', async () => {
    expect(await tools.request_screenshots.execute({ question: 'Show the latency dashboard with the date range visible.' }))
      .toEqual({ kind: 'screenshots', question: 'Show the latency dashboard with the date range visible.', waitingForUser: true });
  });
});
