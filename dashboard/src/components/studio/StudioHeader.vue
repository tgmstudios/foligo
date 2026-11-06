
<template>
  <div class="h-14 px-3 flex items-center justify-between text-white">
    <div class="flex items-center space-x-3 min-w-0">
      <button
        @click="$emit('back')"
        class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors flex-shrink-0"
        title="Back"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div class="min-w-0">
        <p class="text-sm font-medium truncate">{{ title }}</p>
        <p class="text-xs text-gray-500">{{ dirty ? 'Unsaved changes' : 'Saved' }}</p>
      </div>
    </div>

    <div class="flex items-center space-x-1.5 flex-shrink-0">
      <slot name="actions" />
      <button
        v-if="showPreviewToggle && !sideBySide"
        @click="$emit('toggle-preview')"
        :title="previewOpen ? 'Edit' : 'Preview'"
        :aria-label="previewOpen ? 'Edit' : 'Preview'"
        class="p-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
      >
        <PencilSquareIcon v-if="previewOpen" class="h-4 w-4" />
        <EyeIcon v-else class="h-4 w-4" />
      </button>
      <button
        v-if="showHistory"
        @click="$emit('open-history')"
        title="History"
        aria-label="History"
        class="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        <ClockIcon class="h-4 w-4" />
      </button>
      <button
        v-if="showMeta"
        @click="$emit('open-meta')"
        title="Meta"
        aria-label="Meta"
        class="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        <TagIcon class="h-4 w-4" />
      </button>
      <button
        v-if="showExport"
        @click="$emit('export')"
        title="Export"
        aria-label="Export"
        class="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        <ArrowDownTrayIcon class="h-4 w-4" />
      </button>
      <button
        v-if="sideBySide"
        @click="$emit('toggle-focus')"
        class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
        :class="{ 'text-primary-400': focusMode }"
        title="Focus mode"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
      <button
        @click="$emit('save')"
        :disabled="!dirty || saving"
        :title="saving ? 'Saving…' : 'Save'"
        :aria-label="saving ? 'Saving…' : 'Save'"
        class="ml-1.5 p-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <CheckIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDownTrayIcon, CheckIcon, ClockIcon, EyeIcon, PencilSquareIcon, TagIcon } from '@heroicons/vue/24/outline'

withDefaults(defineProps<{
  title: string
  dirty?: boolean
  saving?: boolean
  focusMode?: boolean
  showHistory?: boolean
  showMeta?: boolean
  showExport?: boolean
  showPreviewToggle?: boolean
  sideBySide?: boolean
  previewOpen?: boolean
}>(), {
  dirty: false,
  saving: false,
  focusMode: false,
  showHistory: false,
  showMeta: false,
  showExport: false,
  showPreviewToggle: false,
  sideBySide: true,
  previewOpen: false,
})

defineEmits<{
  (e: 'back'): void
  (e: 'save'): void
  (e: 'toggle-focus'): void
  (e: 'open-history'): void
  (e: 'open-meta'): void
  (e: 'export'): void
  (e: 'toggle-preview'): void
}>()
</script>
