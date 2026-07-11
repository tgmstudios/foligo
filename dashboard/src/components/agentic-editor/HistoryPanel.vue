<template>
  <div class="history-panel border-b border-gray-700 flex-shrink-0">
    <button
      @click="expanded = !expanded"
      class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
    >
      <h3 class="text-sm font-semibold text-white">History</h3>
      <svg
        class="w-4 h-4 text-gray-400 transform transition-transform"
        :class="{ 'rotate-180': expanded }"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="expanded" class="max-h-72 overflow-y-auto px-3 pb-3 space-y-2">
      <button
        @click="$emit('new')"
        class="w-full px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>New Resume</span>
      </button>

      <div v-if="loading" class="text-center py-6 text-gray-400 text-sm">Loading…</div>
      <div v-else-if="documents.length === 0" class="text-center py-6 text-gray-400 text-sm">
        No saved resumes yet.
      </div>

      <div
        v-for="doc in documents"
        :key="doc.id"
        @click="$emit('select', doc.id)"
        :class="[
          'p-3 rounded-lg cursor-pointer transition-all border',
          activeId === doc.id
            ? 'bg-primary-600/20 border-primary-500 text-white'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-600'
        ]"
      >
        <div class="flex items-start justify-between mb-1">
          <h4 class="font-medium text-sm truncate flex-1">{{ doc.name }}</h4>
          <button
            @click.stop="$emit('delete', doc.id)"
            class="ml-2 p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
            title="Delete"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <p class="text-xs text-gray-500">{{ formatDate(doc.updatedAt) }}</p>
        <p v-if="doc.jobDescription" class="text-xs text-gray-500 mt-1 line-clamp-2">
          {{ doc.jobDescription.substring(0, 100) }}{{ doc.jobDescription.length > 100 ? '…' : '' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface ResumeDocumentSummary {
  id: string
  name: string
  jobDescription?: string | null
  createdAt: string
  updatedAt: string
}

withDefaults(defineProps<{
  documents: ResumeDocumentSummary[]
  activeId?: string | null
  loading?: boolean
}>(), {
  activeId: null,
  loading: false
})

defineEmits<{
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
  (e: 'new'): void
}>()

const expanded = ref(true)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
</script>
