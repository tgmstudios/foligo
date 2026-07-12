
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
      <button
        v-if="showHistory"
        @click="$emit('open-history')"
        class="px-2.5 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        History
      </button>
      <button
        v-if="showMeta"
        @click="$emit('open-meta')"
        class="px-2.5 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        Meta
      </button>
      <button
        v-if="showExport"
        @click="$emit('export')"
        class="px-2.5 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        Export
      </button>
      <button
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
        class="ml-1.5 px-3 py-1.5 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  dirty?: boolean
  saving?: boolean
  focusMode?: boolean
  showHistory?: boolean
  showMeta?: boolean
  showExport?: boolean
}>(), {
  dirty: false,
  saving: false,
  focusMode: false,
  showHistory: false,
  showMeta: false,
  showExport: false,
})

defineEmits<{
  (e: 'back'): void
  (e: 'save'): void
  (e: 'toggle-focus'): void
  (e: 'open-history'): void
  (e: 'open-meta'): void
  (e: 'export'): void
}>()
</script>
