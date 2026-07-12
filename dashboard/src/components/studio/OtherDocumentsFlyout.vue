
<template>
  <div class="absolute left-14 top-14 z-40 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
    <div class="px-3 py-2 border-b border-gray-800">
      <h4 class="text-xs font-semibold text-white">Your resumes</h4>
    </div>
    <div class="max-h-96 overflow-y-auto py-1">
      <div v-if="isLoading" class="text-center py-6 text-gray-400 text-xs">Loading…</div>
      <div v-else-if="documents.length === 0" class="text-center py-6 text-gray-500 text-xs">No other resumes yet.</div>
      <button
        v-for="doc in documents"
        :key="doc.id"
        @click="$emit('select', doc.id)"
        class="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors"
        :class="{ 'bg-gray-800': doc.id === activeId }"
      >
        <p class="text-xs font-medium truncate" :class="doc.id === activeId ? 'text-primary-400' : 'text-gray-200'">{{ doc.title }}</p>
        <p class="text-[11px] text-gray-500">{{ formatRelativeDate(doc.updatedAt) }}</p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { EditorStudioAdapter, StudioDocumentSummary } from '@/studio/types'
import { formatRelativeDate } from '@/utils/formatRelativeDate'

const props = defineProps<{
  adapter: EditorStudioAdapter
  activeId: string
}>()

defineEmits<{
  (e: 'select', id: string): void
}>()

const documents = ref<StudioDocumentSummary[]>([])
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    documents.value = await props.adapter.listDocuments()
  } finally {
    isLoading.value = false
  }
})
</script>
