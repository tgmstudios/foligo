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
      <!-- Structured compilation errors -->
      <div v-if="compileError" class="absolute inset-0 overflow-y-auto p-4">
        <div class="bg-red-900/30 border border-red-700 rounded-lg overflow-hidden">
          <!-- Header -->
          <div class="px-4 py-3 border-b border-red-700/50 flex items-center gap-2">
            <svg class="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p class="text-sm font-semibold text-red-200">{{ errorSummary }}</p>
          </div>

          <!-- Error list -->
          <div v-if="parsedErrors.length > 0" class="divide-y divide-red-700/30">
            <div
              v-for="(err, idx) in parsedErrors"
              :key="idx"
              class="px-4 py-3 hover:bg-red-900/20 transition-colors"
            >
              <div class="flex items-start gap-2">
                <span class="text-xs font-mono text-red-400 bg-red-900/50 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-red-200 leading-relaxed">{{ err.message }}</p>
                  <div v-if="err.line" class="mt-1.5 flex items-center gap-2">
                    <button
                      @click="$emit('jumpToLine', err.line)"
                      class="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:underline transition-colors"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      line {{ err.line }}{{ err.col ? `:${err.col}` : '' }}
                    </button>
                  </div>
                  <pre
                    v-if="err.context"
                    class="mt-1.5 text-xs font-mono text-red-300/70 bg-gray-900/70 rounded px-2 py-1 overflow-x-auto max-h-16"
                  >{{ err.context }}</pre>
                </div>
              </div>
            </div>
          </div>

          <!-- Raw log (collapsible, for deep debugging) -->
          <details v-if="compileLog" class="border-t border-red-700/30">
            <summary class="px-4 py-2 text-xs text-red-400/60 hover:text-red-400 cursor-pointer select-none">
              Raw compiler output
            </summary>
            <pre class="px-4 pb-3 text-xs text-red-300/50 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">{{ compileLog }}</pre>
          </details>
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
import { computed } from 'vue'

interface LatexError {
  line?: number
  col?: number
  message: string
  context?: string
}

const props = withDefaults(defineProps<{
  pdfUrl?: string | null
  compiling?: boolean
  compileError?: string | null
  compileLog?: string | null
  closable?: boolean
}>(), {
  pdfUrl: null,
  compiling: false,
  compileError: null,
  compileLog: null,
  closable: false
})

defineEmits<{
  (e: 'recompile'): void
  (e: 'close'): void
  (e: 'jumpToLine', line: number): void
}>()

const parsedErrors = computed<LatexError[]>(() => {
  if (!props.compileError) return []

  // If the error is raw JSON from the API (passed as a string), try parsing
  try {
    const parsed = JSON.parse(props.compileError)
    if (Array.isArray(parsed)) return parsed
    if (parsed.errors && Array.isArray(parsed.errors)) return parsed.errors
  } catch {
    // Not JSON — try parsing the raw text for line references
  }

  // Fallback: try to extract error info from raw text
  const raw = props.compileError
  const errors: LatexError[] = []

  // Try "line X" pattern
  const lineMatch = raw.match(/line\s+(\d+)/i)
  if (lineMatch) {
    const lines = raw.split('\n').filter(l => l.trim())
    errors.push({
      line: parseInt(lineMatch[1], 10),
      message: lines[0] || raw.slice(0, 200),
      context: lines.slice(0, 5).join('\n').slice(0, 300),
    })
  } else if (raw.trim()) {
    errors.push({
      message: raw.slice(0, 300),
      context: raw.slice(0, 500),
    })
  }

  return errors
})

const errorSummary = computed(() => {
  if (parsedErrors.value.length === 0) return 'Compilation failed'
  if (parsedErrors.value.length === 1) return `LaTeX error at line ${parsedErrors.value[0].line || '?'}`
  return `${parsedErrors.value.length} LaTeX errors (first at line ${parsedErrors.value[0].line || '?'})`
})
</script>
