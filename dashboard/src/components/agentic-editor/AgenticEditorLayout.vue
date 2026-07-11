<template>
  <div class="agentic-editor-layout h-full flex gap-4 min-h-0">
    <!-- Main column: editor (+ preview side-by-side when there's room) -->
    <div ref="mainColEl" class="flex-1 flex min-w-0 gap-3">
      <div
        v-if="sideBySide || !previewOpen"
        class="flex-1 min-w-0 flex flex-col rounded-lg border border-gray-700 overflow-hidden bg-gray-900"
      >
        <slot name="editor" :side-by-side="sideBySide" :preview-open="previewOpen" :toggle-preview="togglePreview" />
      </div>
      <div
        v-if="sideBySide || previewOpen"
        class="flex-1 min-w-0 flex flex-col rounded-lg border border-gray-700 overflow-hidden bg-gray-900"
      >
        <slot name="preview" :side-by-side="sideBySide" :preview-open="previewOpen" :toggle-preview="togglePreview" />
      </div>
    </div>

    <!-- Right sidebar: history docked at top, chat fills the rest -->
    <div class="w-80 flex-shrink-0 bg-gray-900 border border-gray-700 rounded-lg flex flex-col overflow-hidden">
      <slot name="history" />
      <slot name="chat" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Below this main-column width, the preview collapses behind a toggle instead
// of sitting side-by-side with the editor.
const SIDE_BY_SIDE_THRESHOLD = 880

const mainColEl = ref<HTMLDivElement>()
const sideBySide = ref(true)
const previewOpen = ref(false)

let observer: ResizeObserver | null = null

function togglePreview() {
  previewOpen.value = !previewOpen.value
}

onMounted(() => {
  if (!mainColEl.value) return
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      sideBySide.value = entry.contentRect.width >= SIDE_BY_SIDE_THRESHOLD
    }
  })
  observer.observe(mainColEl.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

defineExpose({ sideBySide, previewOpen, togglePreview })
</script>
