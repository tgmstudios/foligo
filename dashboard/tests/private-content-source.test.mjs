// Regression: dashboard must never use the anonymous public feed (GET /projects/:id/content) for
// owner views; it is PUBLISHED-only and 404s for unpublished projects.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src')
function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (/\.(vue|ts)$/.test(e.name)) yield p
  }
}

test('no dashboard source GETs the public project content feed', () => {
  const bad = []
  for (const f of walk(src)) {
    const s = fs.readFileSync(f, 'utf8')
    if (/api\.get\(\s*[`'"]\/projects\/(\$\{[^}]+\}|[^/`'"]+)\/content[`'"]/.test(s)) bad.push(path.relative(src, f))
  }
  assert.deepEqual(bad, [])
})

test('fetchProjectContent reads private content from authenticated GET /projects only', async () => {
  const { register } = await import('node:module')
  register('./support/store-loader.mjs', import.meta.url)
  const calls = []
  globalThis.__fakeApi = { get: async (u) => { calls.push(u); return { data: {
    ownedProjects: [{ id: 'p1', content: [{ id: 'd', status: 'DRAFT' }, { id: 'h', status: 'HIDDEN' }] }],
    memberProjects: [{ id: 'p2', content: [{ id: 'm', status: 'DRAFT' }] }] } } } }
  const { fetchProjectContent } = await import('../src/services/project-content.ts')
  assert.deepEqual((await fetchProjectContent('p1')).map((c) => c.id), ['d', 'h'])
  assert.deepEqual((await fetchProjectContent('p2')).map((c) => c.id), ['m'])
  assert.deepEqual(await fetchProjectContent('nope'), [])
  assert.deepEqual([...new Set(calls)], ['/projects'])
})
