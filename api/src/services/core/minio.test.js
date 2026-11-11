const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');

function load(env) {
  const seen = {};
  const origLoad = Module._load;
  Module._load = function (req, ...a) {
    if (req === 'minio') return { Client: function (o) { Object.assign(seen, o); } };
    return origLoad.call(this, req, ...a);
  };
  const keys = ['MINIO_ENDPOINT', 'MINIO_PORT', 'MINIO_USE_SSL', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_REGION'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  keys.forEach((k) => delete process.env[k]);
  Object.assign(process.env, env);
  delete require.cache[require.resolve('./minio')];
  try { require('./minio'); } finally {
    Module._load = origLoad;
    keys.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
    delete require.cache[require.resolve('./minio')];
  }
  return seen;
}

test('MINIO_REGION is passed as the signing region (OCI S3 compat)', () => {
  const o = load({ MINIO_ENDPOINT: 'ns.compat.objectstorage.us-sanjose-1.oraclecloud.com', MINIO_PORT: '443', MINIO_USE_SSL: 'true', MINIO_REGION: 'us-sanjose-1' });
  assert.strictEqual(o.region, 'us-sanjose-1'); assert.strictEqual(o.port, 443); assert.strictEqual(o.useSSL, true);
});
test('region omitted when MINIO_REGION unset (legacy MinIO behaviour)', () => {
  assert.ok(!('region' in load({ MINIO_ENDPOINT: 'minio' })));
});
