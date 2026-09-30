const mockGenerateText = jest.fn();
const mockGenerateChat = jest.fn();

jest.mock('../ai/manager', () => ({
  generateText: mockGenerateText,
  generateChat: mockGenerateChat,
}));

const { createAiClient } = require('./ai-client');

const logger = { debug: jest.fn(), error: jest.fn() };

describe('AI session client user-scoped forwarding', () => {
  beforeEach(() => jest.clearAllMocks());

  test('passes userId and model selection through text and chat helpers', async () => {
    mockGenerateText.mockResolvedValue({ text: 'text response' });
    mockGenerateChat.mockResolvedValue({ text: 'chat response' });
    const { aiText, aiChat } = createAiClient(logger);

    await expect(aiText('Draft this', { userId: 'user-1', provider: 'granted-model', context: 'test' }))
      .resolves.toBe('text response');
    await expect(aiChat([{ role: 'user', content: 'Hello' }], { userId: 'user-1', provider: 'granted-model', context: 'test' }))
      .resolves.toEqual({ text: 'chat response' });

    expect(mockGenerateText).toHaveBeenCalledWith('Draft this', {
      userId: 'user-1', provider: 'granted-model',
    });
    expect(mockGenerateChat).toHaveBeenCalledWith([{ role: 'user', content: 'Hello' }], {
      userId: 'user-1', provider: 'granted-model',
    });
  });
});
