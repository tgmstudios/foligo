#!/usr/bin/env node
/*
 * Copy every object from a source S3 bucket (MinIO) to a destination S3 bucket (OCI Object Storage
 * S3-compat), preserving keys and object metadata (Content-Type, Cache-Control, x-amz-meta-*),
 * then verify each destination object by SHA-256 of the bytes, size and content type.
 * Never deletes anything. Idempotent: re-running copies only missing/different objects (delta).
 *
 * Run inside the api pod (has the `minio` SDK). Credentials come from the environment only:
 *   SRC_ENDPOINT SRC_PORT SRC_SSL SRC_ACCESS_KEY SRC_SECRET_KEY SRC_BUCKET [SRC_REGION]
 *   DST_ENDPOINT DST_PORT DST_SSL DST_ACCESS_KEY DST_SECRET_KEY DST_BUCKET DST_REGION
 * Output: JSON report on stdout (no credentials). Exit code 1 if any verification fails.
 */
const crypto = require('crypto');
const Minio = require(process.env.MINIO_MODULE || 'minio');

const mk = (p, extra = {}) => new Minio.Client({
  endPoint: process.env[`${p}_ENDPOINT`],
  port: parseInt(process.env[`${p}_PORT`], 10),
  useSSL: process.env[`${p}_SSL`] === 'true',
  accessKey: process.env[`${p}_ACCESS_KEY`],
  secretKey: process.env[`${p}_SECRET_KEY`],
  ...(process.env[`${p}_REGION`] ? { region: process.env[`${p}_REGION`] } : {}),
  ...extra,
});
const src = mk('SRC');
const dst = mk('DST');
const SB = process.env.SRC_BUCKET;
const DB = process.env.DST_BUCKET;

const list = (c, b) => new Promise((res, rej) => {
  const out = [];
  const s = c.listObjectsV2(b, '', true);
  s.on('data', (o) => o.name && out.push(o));
  s.on('end', () => res(out));
  s.on('error', rej);
});
const readAll = async (c, b, k) => {
  const st = await c.getObject(b, k);
  const chunks = [];
  for await (const ch of st) chunks.push(ch);
  return Buffer.concat(chunks);
};
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const SKIP = /^(etag|last-modified|content-length|accept-ranges|date|server|vary|connection|x-amz-(request-id|id-2|version-id|meta-.*-checksum)|x-request-id|strict-transport-security|x-content-type-options|x-xss-protection|content-security-policy|x-minio-.*|x-amz-server-side-encryption.*|opc-.*|x-amz-checksum.*|retry-after|cf-.*|transfer-encoding|content-md5|content-range)$/i;
const copyMeta = (m) => {
  const o = {};
  for (const [k, v] of Object.entries(m || {})) if (!SKIP.test(k)) o[k] = v;
  return o;
};
const normCT = (m) => (m['content-type'] || m['Content-Type'] || '').toLowerCase();

(async () => {
  const report = { src: { bucket: SB }, dst: { bucket: DB, endpoint: process.env.DST_ENDPOINT }, objects: [], copied: 0, skipped: 0, failed: 0 };
  const srcObjs = await list(src, SB);
  report.src.count = srcObjs.length;
  report.src.bytes = srcObjs.reduce((a, o) => a + o.size, 0);
  for (const o of srcObjs) {
    const rec = { key: o.name, size: o.size };
    try {
      const sStat = await src.statObject(SB, o.name);
      const body = await readAll(src, SB, o.name);
      if (body.length !== o.size) throw new Error(`source read length ${body.length} != listed ${o.size}`);
      rec.sha256 = sha(body);
      rec.contentType = normCT(sStat.metaData);
      let needCopy = true;
      try {
        const dStat = await dst.statObject(DB, o.name);
        if (dStat.size === o.size && sha(await readAll(dst, DB, o.name)) === rec.sha256) needCopy = false;
      } catch (e) { if (!['NotFound', 'NoSuchKey'].includes(e.code)) throw e; }
      if (needCopy) {
        const meta = copyMeta(sStat.metaData);
        if (!normCT(meta)) meta['Content-Type'] = 'application/octet-stream';
        await dst.putObject(DB, o.name, body, body.length, meta);
        report.copied++; rec.action = 'copied';
      } else { report.skipped++; rec.action = 'already-identical'; }
      // read back and verify
      const dStat = await dst.statObject(DB, o.name);
      const dBody = await readAll(dst, DB, o.name);
      rec.verify = {
        size: dStat.size === o.size && dBody.length === o.size,
        sha256: sha(dBody) === rec.sha256,
        contentType: normCT(dStat.metaData) === rec.contentType,
        userMeta: JSON.stringify(Object.entries(sStat.metaData).filter(([k]) => /^x-amz-meta-/i.test(k)).sort()) ===
                  JSON.stringify(Object.entries(dStat.metaData).filter(([k]) => /^x-amz-meta-/i.test(k)).sort()),
      };
      rec.ok = Object.values(rec.verify).every(Boolean);
    } catch (e) { rec.ok = false; rec.error = `${e.code || ''} ${e.message}`.slice(0, 200); }
    if (!rec.ok) report.failed++;
    report.objects.push(rec);
  }
  const dstObjs = await list(dst, DB);
  report.dst.count = dstObjs.length;
  report.dst.bytes = dstObjs.reduce((a, o) => a + o.size, 0);
  const sk = new Set(srcObjs.map((o) => o.name));
  report.dst.extraKeys = dstObjs.filter((o) => !sk.has(o.name)).map((o) => o.name);
  report.verifiedOk = report.objects.filter((r) => r.ok).length;
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.failed || report.dst.count < report.src.count ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.code, e.message); process.exit(2); });
