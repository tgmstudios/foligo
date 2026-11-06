// Source guards for responsive fixes (authoritative check: layout-viewport.browser.py).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

for (const v of ['AdminUsersView', 'AdminProjectsView', 'AdminContentView']) {
  test(`${v}: table scrolls inside its own container; header wraps`, () => {
    const s = read(`src/views/admin/${v}.vue`)
    assert.match(s, /<div class="overflow-x-auto"[^>]*>\s*<table/)
    assert.match(s, /flex flex-col gap-4 sm:flex-row/)
    assert.match(s, /flex flex-wrap items-center gap-4/)
  })
}

test('ContentEditorView action bar wraps on narrow screens', () => {
  const s = read('src/views/content/ContentEditorView.vue')
  assert.match(s, /flex flex-wrap items-center gap-3/)
  assert.match(s, /flex flex-col gap-4 sm:flex-row/)
})

test('header keeps portfolio select usable at md', () => {
  const s = read('src/layouts/DashboardLayout.vue')
  assert.match(s, /min-w-\[6\.5rem\] max-w-full/)
  assert.match(s, /sm:max-w-\[9rem\] lg:max-w-none/)
})

// Harness-integrity guards (the real gate is layout-viewport.browser.py; these stop it being weakened).
test('viewport harness fails on pageerrors and unmocked API calls, with valid fixture dates', () => {
  const s = read('tests/layout-viewport.browser.py')
  assert.match(s, /pg\.on\('pageerror'/)
  assert.match(s, /problems\.append\(f'pageerror:/)
  assert.match(s, /PAGEERRORS/)
  assert.match(s, /fails\.append\(\('unmocked'/)
  assert.doesNotMatch(s, /else:\s*\n\s*body = \[\]/, 'unknown API calls must 404 and fail, not silently return []')
  const ts = s.match(/^TS = '([^']+)'/m)
  assert.ok(ts && !Number.isNaN(new Date(ts[1]).getTime()), 'fixture TS must be a valid ISO date')
  assert.doesNotMatch(s, /(createdAt|updatedAt)': '(?!2026-)/)
})

test('ContentListView rows wrap and shrink on narrow screens', () => {
  const s = read('src/views/content/ContentListView.vue')
  assert.doesNotMatch(s, /<div class="flex items-start flex-1">/)
  assert.match(s, /flex items-start flex-1 min-w-0/)
  assert.match(s, /flex flex-wrap items-center text-xs text-gray-400 mt-2 gap-x-3/)
})
