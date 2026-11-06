jest.mock('mammoth', () => ({ extractRawText: jest.fn() }));
jest.mock('pdf-parse', () => ({ PDFParse: jest.fn() }));
const { prepareAttachments, buildModelMessage } = require('./ai-attachment-text');

describe('chat screenshot attachments', () => {
  test('sends screenshots as model image parts alongside document reference text', async () => {
    const attachments = await prepareAttachments([
      { originalname: 'dashboard.png', mimetype: 'image/png', size: 3, buffer: Buffer.from('png') },
      { originalname: 'notes.txt', mimetype: 'text/plain', size: 5, buffer: Buffer.from('Notes') },
    ]);
    const message = buildModelMessage('Use this evidence', attachments);
    expect(message[0]).toEqual({ type: 'text', text: expect.stringContaining('Notes') });
    expect(message[1]).toEqual({ type: 'image', image: 'data:image/png;base64,cG5n' });
  });
  test('preserves text-only messages and rejects unsupported uploads', async () => {
    expect(buildModelMessage('Hello', [])).toBe('Hello');
    await expect(prepareAttachments([{ originalname: 'app.exe', mimetype: 'application/octet-stream', buffer: Buffer.from('x') }])).rejects.toThrow('unsupported file type');
  });
});
