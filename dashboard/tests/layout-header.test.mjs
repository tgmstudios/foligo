// Template contract for the dashboard top bar (fast guard; the authoritative check is
// dashboard/tests/layout-viewport.browser.py, which measures a real browser at 360/390/768/1280).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'vue/compiler-sfc'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = fs.readFileSync(path.join(root, 'src/layouts/DashboardLayout.vue'), 'utf8')
const tpl = parse(src).descriptor.template.content
const bar = tpl.slice(tpl.indexOf('<!-- Top bar -->'), tpl.indexOf('<!-- Page content -->'))
const tag = (re) => (bar.match(re) || [''])[0]

test('portfolio select can shrink and is labelled', () => {
  const sel = tag(/<select[\s\S]*?>/)
  assert.match(sel, /\bmin-w-0\b/)
  assert.match(sel, /\bmax-w-\[?[\w.]+\]?/)
  assert.match(sel, /aria-label="Portfolio"/)
})

test('"Portfolio:" text label is hidden on the smallest screens', () => {
  assert.match(tag(/<label[\s\S]*?>/), /\bhidden sm:inline\b/)
})

test('right-hand button group does not shrink and has gap that tightens on mobile', () => {
  assert.match(bar, /shrink-0 space-x-2 sm:space-x-4/)
})

test('icon-only buttons have accessible names', () => {
  assert.match(bar, /aria-label="Open navigation menu"/)
  assert.match(bar, /aria-label="Create content with AI"/)
})

test('title truncates instead of forcing width', () => {
  assert.match(tag(/<h2[\s\S]*?>/), /\btruncate\b/)
})

test('sign out / menu actions remain wired', () => {
  assert.match(src, /@click="handleLogout"/)
  assert.match(bar, /@click="sidebarOpen = true"/)
})
