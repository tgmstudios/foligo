
<template>
  <div class="relative flex flex-col items-center py-2 space-y-1">
    <button
      @click.stop="commandPaletteStore.open()"
      class="w-9 h-9 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      title="Search (⌘K)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>

    <button
      @click.stop="toggle('documents')"
      class="w-9 h-9 flex items-center justify-center rounded-md transition-colors"
      :class="open === 'documents' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
      title="Other resumes"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </button>

    <button
      v-if="showInsertMenu"
      @click.stop="toggle('insert')"
      class="w-9 h-9 flex items-center justify-center rounded-md transition-colors"
      :class="open === 'insert' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
      title="Insert: formatting, tables, diagrams, emoji"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <button
      v-if="adapter.supportsMediaImport"
      @click.stop="toggle('media')"
      class="w-9 h-9 flex items-center justify-center rounded-md transition-colors"
      :class="open === 'media' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
      title="Media library"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>

    <button
      v-if="adapter.type === 'resume'"
      @click.stop="toggle('score')"
      class="w-9 h-9 flex items-center justify-center rounded-md transition-colors"
      :class="open === 'score' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
      title="Score resume (HackerRank rubric)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </button>

    <div v-if="open" @click.stop>
      <OtherDocumentsFlyout
        v-if="open === 'documents'"
        :adapter="adapter"
        :active-id="documentId"
        @select="(id) => { $emit('switch-document', id); open = null }"
      />
      <InsertMenuFlyout
        v-else-if="open === 'insert'"
        @format-h1="$emit('format-h1')"
        @format-h2="$emit('format-h2')"
        @format-h3="$emit('format-h3')"
        @format-bold="$emit('format-bold')"
        @format-italic="$emit('format-italic')"
        @format-link="$emit('format-link')"
        @format-ul="$emit('format-ul')"
        @format-ol="$emit('format-ol')"
        @format-quote="$emit('format-quote')"
        @format-code="$emit('format-code')"
        @format-codeblock="$emit('format-codeblock')"
        @format-table="$emit('format-table')"
        @insert-mermaid="$emit('insert-mermaid')"
        @open-drawio="$emit('open-drawio'); open = null"
        @insert-emoji="(emoji) => $emit('insert-emoji', emoji)"
      />
      <MediaPickerPopover
        v-else-if="open === 'media'"
        :project-id="projectId"
        @select="(media) => { adapter.onMediaSelected?.(media); open = null }"
      />
      <ResumeScorePopover
        v-else-if="open === 'score'"
        :document-id="documentId"
        @close="open = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { EditorStudioAdapter } from '@/studio/types'
import OtherDocumentsFlyout from '@/components/studio/OtherDocumentsFlyout.vue'
import MediaPickerPopover from '@/components/studio/MediaPickerPopover.vue'
import InsertMenuFlyout from '@/components/studio/InsertMenuFlyout.vue'
import ResumeScorePopover from '@/components/goapply/ResumeScorePopover.vue'
import { useCommandPaletteStore } from '@/stores/commandPalette'

const commandPaletteStore = useCommandPaletteStore()

withDefaults(defineProps<{
  adapter: EditorStudioAdapter
  documentId: string
  projectId?: string
  showInsertMenu?: boolean
}>(), {
  showInsertMenu: false,
})

defineEmits<{
  (e: 'switch-document', id: string): void
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

const open = ref<'documents' | 'insert' | 'media' | 'score' | null>(null)

function toggle(panel: 'documents' | 'insert' | 'media' | 'score') {
  // The scoring popup is intentionally modal-like: only its X closes it.
  if (open.value === 'score') return
  open.value = open.value === panel ? null : panel
}

function closeOnOutsideClick() {
  if (open.value === 'score') return
  open.value = null
}

onMounted(() => window.addEventListener('click', closeOnOutsideClick))
onUnmounted(() => window.removeEventListener('click', closeOnOutsideClick))
</script>
