import { ref, shallowRef } from 'vue'

export type AiChatView = 'modal' | 'inline' | 'dock' | 'fullscreen'

// Shared between the layout-owned AI chat (which persists across pages) and
// the dashboard page, which offers an inline host for it. Keeping the view here
// lets the chat pop out to the bottom-right and stay put while navigating.
const view = ref<AiChatView>('modal')
const hostEl = shallowRef<HTMLElement | null>(null)

export function useAiChatDock() {
  return { view, hostEl }
}
