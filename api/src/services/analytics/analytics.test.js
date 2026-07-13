const { createWriteKey, hash, normalizeEvent, normalizeOrigin, originAllowed } = require('./analytics');

describe('analytics service', () => {
  test('creates opaque prefixed write keys', () => {
    expect(createWriteKey()).toMatch(/^fa_[A-Za-z0-9_-]{32}$/);
  });

  test('hashes identifiers deterministically without retaining the input', () => {
    expect(hash('visitor-1', 'salt')).toBe(hash('visitor-1', 'salt'));
    expect(hash('visitor-1', 'salt')).not.toContain('visitor-1');
  });

  test('normalizes a valid event and infers its path', () => {
    const event = normalizeEvent({ name: 'page_view', url: 'https://example.com/work?id=1', visitorId: 'abc' }, 'property');
    expect(event).toMatchObject({ propertyId: 'property', name: 'page_view', path: '/work' });
    expect(event.visitorHash).toHaveLength(64);
  });

  test('rejects invalid event names and oversized metadata', () => {
    expect(() => normalizeEvent({ name: 'bad event' }, 'property')).toThrow('Event name');
    expect(() => normalizeEvent({ name: 'valid', metadata: { value: 'x'.repeat(9000) } }, 'property')).toThrow('8 KB');
  });

  test('matches exact and wildcard origins', () => {
    expect(normalizeOrigin('https://EXAMPLE.com/path')).toBe('https://example.com');
    expect(originAllowed('https://example.com', ['https://example.com'])).toBe(true);
    expect(originAllowed('https://app.preview.example.com', ['*.example.com'])).toBe(true);
    expect(originAllowed('https://example.net', ['*.example.com'])).toBe(false);
  });
});
