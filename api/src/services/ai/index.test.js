jest.mock('./manager', () => ({
  generateText: jest.fn(),
  generateChat: jest.fn(),
  generateWithTools: jest.fn(),
  listProviders: jest.fn(),
  testProvider: jest.fn(),
  getProvider: jest.fn(),
  listAvailableModels: jest.fn(),
}));

const manager = require('./manager');
const ai = require('./index');

describe('AI facade', () => {
  beforeEach(() => jest.clearAllMocks());

  test('passes user-scoped list options through to the manager', async () => {
    manager.listProviders.mockResolvedValue([]);

    await ai.listProviders({ userId: 'user-1' });

    expect(manager.listProviders).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});
