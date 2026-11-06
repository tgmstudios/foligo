const { preservesCode } = require('./rewrite-guards');
test('allows prose changes while preserving Markdown code', () => {
  expect(preservesCode('Before `foo()`\n\n```js\nconst n = 1;\n```', 'After `foo()`\n\n```js\nconst n = 1;\n```')).toBe(true);
  expect(preservesCode('Before', 'After')).toBe(true);
});
test.each([
  ['Use `foo()`', 'Use `bar()`'],
  ['```js\n1\n```', '```js\n2\n```'],
  ['~~~js\n1\n~~~', '~~~js\n2\n~~~'],
  ['```js\n1\n```', 'No code'],
  ['Use ``a`b``', 'Use ``a`c``'],
])('rejects modifications or loss of literal code: %s', (source, output) => {
  expect(preservesCode(source, output)).toBe(false);
});
