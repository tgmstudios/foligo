import type { EditorStudioAdapter } from './types'

const adapters = new Map<string, EditorStudioAdapter>()

export function registerAdapter(adapter: EditorStudioAdapter) {
  adapters.set(adapter.type, adapter)
}

export function getAdapter(type: string): EditorStudioAdapter {
  const adapter = adapters.get(type)
  if (!adapter) {
    throw new Error(`No Editor Studio adapter registered for type "${type}"`)
  }
  return adapter
}
