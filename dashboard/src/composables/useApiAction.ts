import { useToast } from 'vue-toastification'

// ── Error-toast wrapper ──────────────────────────────────────────────────
// Consolidates the repeated pattern of:
//   try { ...; toast.success(...) } catch (error: any) {
//     const message = error.response?.data?.message || fallback
//     toast.error(message)
//     throw error
//   }
// found throughout stores/projects.ts and stores/goapply.ts.

/**
 * Runs `fn`, showing an error toast (using the server-provided message when
 * available, otherwise `fallbackMessage`) and re-throwing on failure. On
 * success, if `successMessage` is provided (a string, or a function of the
 * result for dynamic server-provided messages), shows a success toast.
 */
export async function withErrorToast<T>(
  fn: () => Promise<T>,
  fallbackMessage: string,
  successMessage?: string | ((result: T) => string | undefined)
): Promise<T> {
  const toast = useToast()
  try {
    const result = await fn()
    const message = typeof successMessage === 'function' ? successMessage(result) : successMessage
    if (message) {
      toast.success(message)
    }
    return result
  } catch (error: any) {
    const message = error.response?.data?.message || fallbackMessage
    toast.error(message)
    throw error
  }
}

// ── Entity sync helper ───────────────────────────────────────────────────
// Consolidates the "update entity both in a list array and in a `current`
// ref" pattern repeated across updateProject, updateSiteConfig,
// publishProject, updateContent, deleteContent, etc.

/**
 * Updates (or removes) an entity identified by `id` within `list` and, if
 * `current` currently holds the same entity, applies the same change to it.
 *
 * - Pass `updater` to replace/patch the matching entity in both places.
 * - Pass `remove: true` instead to delete the entity from the list and clear
 *   `current` if it matches.
 */
export function syncEntityInState<T extends { id: string }>(
  list: import('vue').Ref<T[]>,
  current: import('vue').Ref<T | null>,
  id: string,
  updater: ((entity: T) => T) | null,
  options: { remove?: boolean } = {}
): void {
  if (options.remove) {
    list.value = list.value.filter((entity) => entity.id !== id)
    if (current.value?.id === id) {
      current.value = null
    }
    return
  }

  if (!updater) return

  const index = list.value.findIndex((entity) => entity.id === id)
  if (index !== -1) {
    list.value.splice(index, 1, updater(list.value[index]))
  }

  if (current.value?.id === id) {
    current.value = updater(current.value)
  }
}

/**
 * Variant of {@link syncEntityInState} for entities nested one level down,
 * e.g. `content` items living inside each project in a `projects` list plus
 * a `currentProject` ref. Applies the same update/remove to the nested
 * collection wherever it's found (across all parent entities, and on
 * `current` if it holds a matching parent).
 */
export function syncNestedEntityInState<P extends { content?: C[] }, C extends { id: string }>(
  list: import('vue').Ref<P[]>,
  current: import('vue').Ref<P | null>,
  nestedId: string,
  updater: ((entity: C) => C) | null,
  options: { remove?: boolean } = {}
): void {
  const applyTo = (parent: P) => {
    if (!parent.content) return
    if (options.remove) {
      parent.content = parent.content.filter((entity) => entity.id !== nestedId)
      return
    }
    if (!updater) return
    const index = parent.content.findIndex((entity) => entity.id === nestedId)
    if (index !== -1) {
      parent.content[index] = updater(parent.content[index])
    }
  }

  list.value.forEach(applyTo)
  if (current.value) {
    applyTo(current.value)
  }
}
