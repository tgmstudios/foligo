
<template>
  <div ref="shellEl" class="studio-shell h-screen w-screen flex flex-col bg-gray-950 overflow-hidden">
    <div class="flex-shrink-0 border-b border-gray-800">
      <slot name="header" :side-by-side="sideBySide" :preview-open="previewOpen" :toggle-preview="togglePreview" />
    </div>

    <div class="flex-1 flex min-h-0">
      <div v-if="!focusMode && $slots['left-toolbar']" class="w-12 flex-shrink-0 border-r border-gray-800 bg-gray-900">
        <slot name="left-toolbar" />
      </div>

      <!-- Hard split: no gap/padding between editor and preview, single draggable divider. -->
      <div ref="mainColEl" class="flex-1 flex min-w-0">
        <div
          v-if="sideBySide || !previewOpen"
          class="min-w-0 flex flex-col bg-gray-900"
          :style="sideBySide ? { flex: `0 0 ${splitPct}%` } : { flex: '1 1 0%' }"
        >
          <slot name="editor" :side-by-side="sideBySide" :preview-open="previewOpen" :toggle-preview="togglePreview" />
        </div>

        <div
          v-if="sideBySide"
          class="w-1.5 flex-shrink-0 border-r border-gray-800 cursor-col-resize hover:bg-primary-500/50 active:bg-primary-500 transition-colors"
          @mousedown="startSplitDrag"
        />

        <div v-if="sideBySide || previewOpen" class="flex-1 min-w-0 flex flex-col bg-gray-900">
          <slot name="preview" :side-by-side="sideBySide" :preview-open="previewOpen" :toggle-preview="togglePreview" />
        </div>
      </div>

      <div
        v-if="!focusMode && $slots.chat && !chatCollapsed"
        class="w-1.5 flex-shrink-0 cursor-col-resize hover:bg-primary-500/50 active:bg-primary-500 transition-colors"
        @mousedown="startChatDrag"
      />

      <div
        v-if="!focusMode && $slots.chat && !chatCollapsed"
        class="flex-shrink-0 border-l border-gray-800 bg-gray-900 flex flex-col overflow-hidden"
        :style="{ width: `${chatWidth}px` }"
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

    <!-- Full-screen capture layer while dragging, so iframes/embeds (e.g. the PDF preview) don't swallow mousemove. -->
    <div v-if="dragMode" class="fixed inset-0 z-50 cursor-col-resize" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { readPreferenceCookie, writePreferenceCookie } from '@/utils/goapplyJobPreferences'

// Below this main-column width, the preview collapses behind a toggle instead
// of sitting side-by-side with the editor (ported from AgenticEditorLayout).
const SIDE_BY_SIDE_THRESHOLD = 880

const MIN_SPLIT_PCT = 20
const MAX_SPLIT_PCT = 80
const MIN_CHAT_WIDTH = 240
const MAX_CHAT_WIDTH = 640

const LAYOUT_COOKIE_NAME = 'studio-layout'
const LAYOUT_COOKIE_VERSION = 1

interface StudioLayoutPrefs {
  splitPct: number
  chatWidth: number
  chatCollapsed: boolean
}

withDefaults(defineProps<{ focusMode?: boolean }>(), { focusMode: false })

const shellEl = ref<HTMLDivElement>()
const mainColEl = ref<HTMLDivElement>()
const sideBySide = ref(true)
const previewOpen = ref(false)

const savedLayout = readPreferenceCookie<StudioLayoutPrefs>(LAYOUT_COOKIE_NAME, LAYOUT_COOKIE_VERSION)
const chatCollapsed = ref(savedLayout?.chatCollapsed ?? false)
const splitPct = ref(clamp(savedLayout?.splitPct ?? 50, MIN_SPLIT_PCT, MAX_SPLIT_PCT))
const chatWidth = ref(clamp(savedLayout?.chatWidth ?? 320, MIN_CHAT_WIDTH, MAX_CHAT_WIDTH))
const dragMode = ref<'split' | 'chat' | null>(null)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function persistLayout() {
  writePreferenceCookie<StudioLayoutPrefs>(LAYOUT_COOKIE_NAME, LAYOUT_COOKIE_VERSION, {
    splitPct: splitPct.value,
    chatWidth: chatWidth.value,
    chatCollapsed: chatCollapsed.value,
  })
}

watch(chatCollapsed, persistLayout)

let observer: ResizeObserver | null = null

function togglePreview() {
  previewOpen.value = !previewOpen.value
}

function startSplitDrag(event: MouseEvent) {
  event.preventDefault()
  dragMode.value = 'split'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function startChatDrag(event: MouseEvent) {
  event.preventDefault()
  dragMode.value = 'chat'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent) {
  if (dragMode.value === 'split' && mainColEl.value) {
    const rect = mainColEl.value.getBoundingClientRect()
    const pct = ((event.clientX - rect.left) / rect.width) * 100
    splitPct.value = Math.min(MAX_SPLIT_PCT, Math.max(MIN_SPLIT_PCT, pct))
  } else if (dragMode.value === 'chat' && shellEl.value) {
    const rect = shellEl.value.getBoundingClientRect()
    const width = rect.right - event.clientX
    chatWidth.value = Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, width))
  }
}

function stopDrag() {
  dragMode.value = null
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  persistLayout()
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
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  document.body.style.userSelect = ''
})

defineExpose({ sideBySide, previewOpen, togglePreview, chatCollapsed })
</script>
