// Fast template guard for the /media mobile overflow fix; the authoritative check is
// dashboard/tests/layout-viewport.browser.py (real browser, /media and /portfolios/:id/media).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'vue/compiler-sfc'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tpl = parse(fs.readFileSync(path.join(root, 'src/components/media/MediaManager.vue'), 'utf8')).descriptor.template.content

test('media search input can shrink inside the flex filter row (min-w-0)', () => {
  const input = tpl.match(/<input[^>]*v-model="searchQuery"[\s\S]*?\/>/)[0]
  assert.match(input, /\bflex-1\b/)
  assert.match(input, /\bmin-w-0\b/)
})
