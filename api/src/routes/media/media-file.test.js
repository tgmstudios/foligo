const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { Readable } = require('node:stream');
const { createMediaFileHandler, canonicalMediaUrl } = require('./media-file');

function serve(handler) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => { req.params = { id: req.url.split('/')[1] }; res.status = (c) => { res.statusCode = c; return res; }; res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); }; handler(req, res); });
    server.listen(0, () => resolve(server));
  });
}
const quiet = { error() {} };
const media = { id: 'm1', objectName: 'o.png', mimeType: 'image/png', filename: 'a"b.png' };
const bytes = Buffer.from('PNGBYTES');

function deps(over = {}) {
  return {
    prisma: { media: { findUnique: async ({ where }) => (where.id === 'm1' ? media : null) } },
    minioClient: {
      statObject: async () => ({ size: bytes.length, etag: 'abc' }),
      getObject: async () => Readable.from([bytes]),
    },
    bucketName: 'foligo', logger: quiet, ...over,
  };
}
async function get(server, path, method = 'GET') {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    http.request({ port, path, method, agent: false }, (r) => { const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => resolve({ r, body: Buffer.concat(c) })); }).on('error', reject).end();
  });
}

test('canonicalMediaUrl uses the API proxy path and never a storage host', () => {
  assert.strictEqual(canonicalMediaUrl('x', 'https://api.foligo.org/'), 'https://api.foligo.org/api/media/x/file');
  assert.match(canonicalMediaUrl('x'), /\/api\/media\/x\/file$/);
});

test('streams exact bytes with immutable cache headers', async () => {
  const s = await serve(createMediaFileHandler(deps()));
  const { r, body } = await get(s, '/m1');
  assert.strictEqual(r.statusCode, 200);
  assert.deepStrictEqual(body, bytes);
  assert.strictEqual(r.headers['content-type'], 'image/png');
  assert.strictEqual(r.headers['content-length'], String(bytes.length));
  assert.match(r.headers['cache-control'], /immutable/);
  assert.strictEqual(r.headers.etag, '"abc"');
  assert.doesNotMatch(r.headers['content-disposition'], /a"b/);
  s.closeAllConnections(); s.close();
});

test('HEAD returns headers without touching the object body', async () => {
  let fetched = false;
  const s = await serve(createMediaFileHandler(deps({ minioClient: { statObject: async () => ({ size: 8 }), getObject: async () => { fetched = true; } } })));
  const { r, body } = await get(s, '/m1', 'HEAD');
  assert.strictEqual(r.statusCode, 200); assert.strictEqual(body.length, 0); assert.strictEqual(fetched, false);
  s.closeAllConnections(); s.close();
});

test('unknown id -> 404; missing object -> 404; storage failure -> 502 without leaking detail', async () => {
  let s = await serve(createMediaFileHandler(deps()));
  assert.strictEqual((await get(s, '/nope')).r.statusCode, 404); s.closeAllConnections(); s.close();
  s = await serve(createMediaFileHandler(deps({ minioClient: { statObject: async () => { const e = new Error('x'); e.code = 'NotFound'; throw e; } } })));
  assert.strictEqual((await get(s, '/m1')).r.statusCode, 404); s.closeAllConnections(); s.close();
  s = await serve(createMediaFileHandler(deps({ minioClient: { statObject: async () => { throw new Error('secret-host.oraclecloud.com'); } } })));
  const { r, body } = await get(s, '/m1');
  assert.strictEqual(r.statusCode, 502); assert.doesNotMatch(body.toString(), /oraclecloud/); s.closeAllConnections(); s.close();
});
