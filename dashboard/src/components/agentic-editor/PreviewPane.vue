<template>
  <div class="preview-pane h-full flex flex-col bg-gray-950">
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
      <span class="text-xs text-gray-400">Preview</span>
      <div class="flex items-center space-x-2">
        <span v-if="compiling" class="text-xs text-primary-400 flex items-center space-x-1">
          <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Compiling…</span>
        </span>
        <button
          v-if="closable"
          @click="$emit('close')"
          class="p-1 text-gray-400 hover:text-white rounded"
          title="Hide preview"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          @click="$emit('recompile')"
          :disabled="compiling"
          class="px-2 py-1 text-xs bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          Recompile
        </button>
      </div>
    </div>

    <div class="flex-1 min-h-0 relative">
      <div v-if="compileError" class="absolute inset-0 overflow-y-auto p-4">
        <div class="bg-red-900/30 border border-red-700 rounded-lg p-4 text-sm text-red-200">
          <p class="font-semibold mb-2">Compilation failed</p>
          <pre class="whitespace-pre-wrap text-xs text-red-300/80 max-h-96 overflow-y-auto">{{ compileError }}</pre>
        </div>
      </div>
      <embed
        v-else-if="pdfUrl"
        :src="pdfUrl"
        type="application/pdf"
        class="absolute inset-0 w-full h-full border-0 bg-white"
        title="Resume PDF preview"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center text-gray-500 text-sm p-6 text-center">
        {{ compiling ? 'Compiling your resume…' : 'No compiled PDF yet — send a message or click Recompile.' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  pdfUrl?: string | null
  compiling?: boolean
  compileError?: string | null
  closable?: boolean
}>(), {
  pdfUrl: null,
  compiling: false,
  compileError: null,
  closable: false
})

defineEmits<{
  (e: 'recompile'): void
  (e: 'close'): void
}>()
</script>
