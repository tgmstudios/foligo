
<template>
  <div class="studio-shell h-screen w-screen flex flex-col bg-gray-950 overflow-hidden">
    <div class="flex-shrink-0 border-b border-gray-800">
      <slot name="header" :side-by-side="sideBySide" :preview-open="previewOpen" :toggle-preview="togglePreview" />
    </div>

    <div class="flex-1 flex min-h-0">
      <div v-if="!focusMode && $slots['left-toolbar']" class="w-12 flex-shrink-0 border-r border-gray-800 bg-gray-900">
        <slot name="left-toolbar" />
      </div>

      <!-- Hard split: no gap/padding between editor and preview, single 1px divider. -->
      <div ref="mainColEl" class="flex-1 flex min-w-0">
        <div
          v-if="sideBySide || !previewOpen"
          class="flex-1 min-w-0 flex flex-col bg-gray-900"
          :class="{ 'border-r border-gray-800': sideBySide }"
        >
          <slot name="editor" :side-by-side="sideBySide" :preview-open="previewOpen" :toggle-preview="togglePreview" />
        </div>
        <div v-if="sideBySide || previewOpen" class="flex-1 min-w-0 flex flex-col bg-gray-900">
          <slot name="preview" :side-by-side="sideBySide" :preview-open="previewOpen" :toggle-preview="togglePreview" />
        </div>
      </div>

      <div
        v-if="!focusMode && $slots.chat && !chatCollapsed"
        class="w-80 flex-shrink-0 border-l border-gray-800 bg-gray-900 flex flex-col overflow-hidden"
      >
        <div class="h-9 flex items-center justify-end border-b border-gray-800 flex-shrink-0 px-1.5">
          <button
            @click="chatCollapsed = true"
            class="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            title="Collapse chat"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <slot name="chat" />
      </div>

      <div
        v-if="!focusMode && $slots.chat && chatCollapsed"
        class="w-9 flex-shrink-0 border-l border-gray-800 bg-gray-900 flex flex-col items-center pt-1.5"
      >
        <button
          @click="chatCollapsed = false"
          class="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
          title="Expand chat"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Below this main-column width, the preview collapses behind a toggle instead
// of sitting side-by-side with the editor (ported from AgenticEditorLayout).
const SIDE_BY_SIDE_THRESHOLD = 880

withDefaults(defineProps<{ focusMode?: boolean }>(), { focusMode: false })

const mainColEl = ref<HTMLDivElement>()
const sideBySide = ref(true)
const previewOpen = ref(false)
const chatCollapsed = ref(false)

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

defineExpose({ sideBySide, previewOpen, togglePreview, chatCollapsed })
</script>
