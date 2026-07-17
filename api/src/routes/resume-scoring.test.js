jest.mock('../services/core/database', () => ({ prisma: {} }));
const mockGenerateChat = jest.fn();
jest.mock('../services/ai/manager', () => ({ generateChat: mockGenerateChat }));

const { parseEvaluation, requestEvaluation } = require('./resume-scoring');

describe('resume scoring response parsing', () => {
  const evaluation = {
    scores: {
      open_source: { score: 10, max: 35, evidence: 'Example' },
    },
  };

  test('parses JSON returned as normal text', () => {
    expect(parseEvaluation({ text: JSON.stringify(evaluation) })).toEqual(evaluation);
  });

  test('parses JSON returned in the reasoning channel when text is empty', () => {
    expect(parseEvaluation({ text: '', reasoning: `Analysis\n${JSON.stringify(evaluation)}` })).toEqual(evaluation);
  });

  test('rejects malformed or structurally incomplete responses', () => {
    expect(parseEvaluation({ text: '{"not_scores": true}' })).toBeNull();
    expect(parseEvaluation({ text: '', reasoning: '' })).toBeNull();
  });

  test('gives reasoning models enough output budget and preserves the requested model pool', async () => {
    mockGenerateChat.mockResolvedValueOnce({ text: JSON.stringify(evaluation) });

    await requestEvaluation('resume content', 'LONG');

    expect(mockGenerateChat).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ modelType: 'LONG', maxTokens: 12000 }),
    );
  });
});
