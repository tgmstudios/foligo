import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const helperSource = await readFile(new URL('../src/lib/pendingAttachments.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(helperSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { appendAttachments } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const component = await readFile(new URL('../src/components/AIContentCreatorModal.vue', import.meta.url), 'utf8')
const script = component.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)?.[1] || ''

test('chat sends selected files as the second sendMessage argument, including attachment-only turns', () => {
  assert.match(script, /await chat\.sendMessage\(text, files\)/)
  assert.match(script, /!currentMessage\.value\.trim\(\) && !pendingFiles\.value\.length/)
  assert.match(component, /!currentMessage\.trim\(\) && !pendingFiles\.length/)
})

test('attachment selection caps total pending files at five and supports removing a selected file', () => {
  const files = Array.from({ length: 7 }, (_, i) => new File([String(i)], `${i}.txt`))
  const selected = appendAttachments([], files)
  assert.equal(selected.length, 5)
  assert.deepEqual(selected.map(file => file.name), ['0.txt', '1.txt', '2.txt', '3.txt', '4.txt'])
  assert.match(component, /pendingFiles\.splice\(index, 1\)/)
})

test('closing, reopening, and switching chats cannot carry pending files into another conversation', () => {
  assert.match(script, /const close = \(\) => \{[\s\S]*?pendingFiles\.value = \[\]/)
  assert.match(script, /const open = async[\s\S]*?chat\.reset\(\)[\s\S]*?pendingFiles\.value = \[\]/)
  assert.match(script, /const newChat = \(\) => \{[\s\S]*?pendingFiles\.value = \[\]/)
  assert.match(script, /const openSavedChat = async[\s\S]*?pendingFiles\.value = \[\]/)
})
