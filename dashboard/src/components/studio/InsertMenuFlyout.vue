
<template>
  <div class="absolute left-14 top-24 z-40 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-[80vh] overflow-y-auto">
    <div class="px-3 py-2 border-b border-gray-800 sticky top-0 bg-gray-900">
      <h4 class="text-xs font-semibold text-white">Insert</h4>
    </div>

    <div class="p-2">
      <p class="px-1 py-1 text-[11px] font-medium text-gray-500 uppercase tracking-wide">Formatting</p>
      <div class="grid grid-cols-4 gap-1 mb-2">
        <button v-for="btn in formatButtons" :key="btn.id" @click="emitFormat(btn.event)" :title="btn.label" class="btn-icon">
          <span class="text-xs font-semibold">{{ btn.glyph }}</span>
        </button>
      </div>

      <p class="px-1 py-1 text-[11px] font-medium text-gray-500 uppercase tracking-wide">Insert</p>
      <div class="grid grid-cols-4 gap-1 mb-2">
        <button @click="$emit('format-link')" title="Link" class="btn-icon">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" /></svg>
        </button>
        <button @click="$emit('format-ul')" title="Bulleted list" class="btn-icon">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12" /></svg>
        </button>
        <button @click="$emit('format-ol')" title="Numbered list" class="btn-icon">
          <span class="text-xs font-semibold">1.</span>
        </button>
        <button @click="$emit('format-quote')" title="Blockquote" class="btn-icon">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M8 14h.01M12 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
        <button @click="$emit('format-code')" title="Inline code" class="btn-icon">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16M6 8L2 12l4 4M18 8l4 4-4 4" /></svg>
        </button>
        <button @click="$emit('format-codeblock')" title="Code block" class="btn-icon">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </button>
        <button @click="$emit('format-table')" title="Table" class="btn-icon">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M3 6h18v12H3V6z" /></svg>
        </button>
      </div>

      <p class="px-1 py-1 text-[11px] font-medium text-gray-500 uppercase tracking-wide">Diagrams</p>
      <div class="space-y-1 mb-2">
        <button @click="$emit('insert-mermaid')" class="w-full text-left px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span>Mermaid diagram</span>
        </button>
        <button @click="$emit('open-drawio')" class="w-full text-left px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          <span>Draw.io diagram</span>
        </button>
      </div>

      <p class="px-1 py-1 text-[11px] font-medium text-gray-500 uppercase tracking-wide">Emoji</p>
      <div class="grid grid-cols-8 gap-0.5">
        <button
          v-for="emoji in emojis"
          :key="emoji"
          @click="$emit('insert-emoji', emoji)"
          class="w-7 h-7 flex items-center justify-center text-base hover:bg-gray-800 rounded transition-colors"
        >{{ emoji }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'format-h1'): void
  (e: 'format-h2'): void
  (e: 'format-h3'): void
  (e: 'format-bold'): void
  (e: 'format-italic'): void
  (e: 'format-link'): void
  (e: 'format-ul'): void
  (e: 'format-ol'): void
  (e: 'format-quote'): void
  (e: 'format-code'): void
  (e: 'format-codeblock'): void
  (e: 'format-table'): void
  (e: 'insert-mermaid'): void
  (e: 'open-drawio'): void
  (e: 'insert-emoji', emoji: string): void
}>()

type FormatEvent = 'format-h1' | 'format-h2' | 'format-h3' | 'format-bold' | 'format-italic'

const formatButtons: Array<{ id: string; event: FormatEvent; label: string; glyph: string }> = [
  { id: 'h1', event: 'format-h1', label: 'Heading 1', glyph: 'H1' },
  { id: 'h2', event: 'format-h2', label: 'Heading 2', glyph: 'H2' },
  { id: 'h3', event: 'format-h3', label: 'Heading 3', glyph: 'H3' },
  { id: 'bold', event: 'format-bold', label: 'Bold', glyph: 'B' },
  { id: 'italic', event: 'format-italic', label: 'Italic', glyph: 'I' },
]

// defineEmits' generated `emit` is a set of per-event call overloads, which
// TS can't resolve against a single union-typed argument — this helper is
// the narrow, provably-safe cast around that (every value in formatButtons
// is a literal member of the emits type above).
function emitFormat(event: FormatEvent) {
  (emit as (e: FormatEvent) => void)(event)
}

const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '🎉', '🚀', '🔥', '💡', '✅', '❌', '⚠️', '📌', '📝', '✨', '💯', '🙌', '👏', '❤️', '😎', '🤝', '📈', '🐛']
</script>

<style scoped>
.btn-icon {
  @apply w-full h-8 flex items-center justify-center text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors;
}
</style>
