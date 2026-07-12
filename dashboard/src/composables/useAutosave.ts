import { watchDebounced } from '@vueuse/core'
import type { Ref } from 'vue'

/**
 * Debounced background save: fires `save` a few seconds after `content`
 * stops changing, but only while `dirty` is true — `dirty` is driven by the
 * editor's own input event (not by programmatic content replacement from
 * loading a document, an agent edit, or a revision restore), so this never
 * autosaves a no-op write triggered by those.
 */
export function useAutosave(
  content: Ref<string>,
  dirty: Ref<boolean>,
  save: (value: string) => Promise<void>,
  delay = 3000
) {
  watchDebounced(
    content,
    async (value) => {
      if (!dirty.value) return
      await save(value)
    },
    { debounce: delay }
  )
}
