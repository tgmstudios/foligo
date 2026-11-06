import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = (await readFile(new URL('../src/composables/useAgenticChat.ts', import.meta.url), 'utf8'))
  .replace("from 'vue'", `from '${pathToFileURL(require.resolve('vue')).href}'`)
  .replace("import { API_URL } from '@/services/api'", "const API_URL = '/api'")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { useAgenticChat } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('tool-only question turns survive save/load and send answers with question context', async () => {
  const previousFetch = globalThis.fetch
  const previousStorage = globalThis.localStorage
  const requests = []
  let saved
  globalThis.localStorage = { getItem: () => null }
  globalThis.fetch = async (_url, init) => {
    requests.push(JSON.parse(init.body))
    const output = { kind: 'question', question: 'Who is your audience?', options: ['Engineers', 'Recruiters'], multiple: true, waitingForUser: true }
    return new Response([
      { type: 'tool-call', toolCallId: 'q1', toolName: 'ask_user', input: {} },
      { type: 'tool-result', toolCallId: 'q1', toolName: 'ask_user', output },
      { type: 'done' },
    ].map(e => `data: ${JSON.stringify(e)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } })
  }
  try {
    const chat = useAgenticChat(() => '/chat')
    // Vue proxies aren't structured-cloneable; simulate the JSON session transport.
    const first = useAgenticChat(() => '/chat', { onTurnComplete: history => { saved = JSON.parse(JSON.stringify(history)) } })
    await first.sendMessage('Interview me')
    assert.equal(saved.length, 2)
    assert.equal(saved[1].interactions[0].kind, 'question')
    assert.match(saved[1].content, /Engineers; Recruiters; Other/)
    chat.loadHistory(saved)
    assert.equal(chat.messages.value[1].interactions[0].multiple, true)
    await chat.sendMessage('Who is your audience?\nEngineers and a custom answer')
    assert.match(requests[1].history[1].content, /Who is your audience/)
    assert.match(requests[1].message, /custom answer/)
  } finally {
    globalThis.fetch = previousFetch
    globalThis.localStorage = previousStorage
  }
})
