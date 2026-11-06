// Node module hooks so the REAL Pinia store can be imported under node:test:
// '@/services/api' -> controllable fake (globalThis.__fakeApi), vue-toastification -> stub,
// other '@/x' -> src/x with a .ts extension.
import { pathToFileURL, fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import path from 'node:path'

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src')
const fakeApi = pathToFileURL(path.resolve(src, '../tests/support/fake-api.mjs')).href
const fakeToast = pathToFileURL(path.resolve(src, '../tests/support/fake-toast.mjs')).href

export async function resolve(specifier, context, next) {
  if (specifier === 'vue-toastification') return { url: fakeToast, shortCircuit: true }
  if (specifier === '@/services/api') return { url: fakeApi, shortCircuit: true }
  if (specifier.startsWith('@/')) {
    const base = path.join(src, specifier.slice(2))
    for (const c of [base, base + '.ts', path.join(base, 'index.ts')]) {
      if (path.extname(c) && existsSync(c)) return next(pathToFileURL(c).href, context)
    }
  }
  if (specifier.startsWith('./') && !path.extname(specifier) && context.parentURL?.startsWith('file://')) {
    const c = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier + '.ts')
    if (existsSync(c)) return next(pathToFileURL(c).href, context)
  }
  return next(specifier, context)
}
