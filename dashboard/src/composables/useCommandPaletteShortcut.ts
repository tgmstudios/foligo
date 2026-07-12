import { onMounted, onUnmounted } from 'vue'
import { useCommandPaletteStore } from '@/stores/commandPalette'

/** Global Cmd/Ctrl+K listener. Mount once at the app root so the shortcut works
 *  both inside the dashboard chrome and inside the chrome-free Editor Studio. */
export function useCommandPaletteShortcut() {
  const store = useCommandPaletteStore()

  function handleKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      store.toggle()
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
}
