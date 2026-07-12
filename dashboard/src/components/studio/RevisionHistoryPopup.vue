
<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="close">
    <div class="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="close"></div>

      <div class="inline-block align-middle bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full">
        <div class="px-6 pt-6 pb-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-white">History</h3>
            <p class="text-sm text-gray-400 mt-1">Revisions are created on every save and after each AI edit</p>
          </div>
          <button @click="close" class="text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex max-h-[70vh]">
          <div class="w-56 flex-shrink-0 border-r border-gray-700 overflow-y-auto py-2">
            <div v-if="isLoading" class="text-center py-6 text-gray-400 text-xs">Loading…</div>
            <div v-else-if="revisions.length === 0" class="text-center py-6 text-gray-500 text-xs px-3">
              No revisions yet. They're created automatically as you save.
            </div>
            <button
              v-for="revision in revisions"
              :key="revision.id"
              @click="select(revision)"
              class="w-full text-left px-4 py-2.5 text-xs transition-colors border-l-2"
              :class="selected?.id === revision.id
                ? 'border-primary-500 bg-primary-600/10 text-white'
                : 'border-transparent text-gray-400 hover:bg-gray-750 hover:text-gray-200'"
            >
              {{ formatRelativeDate(revision.createdAt) }}
            </button>
          </div>

          <div class="flex-1 min-w-0 overflow-y-auto p-4">
            <div v-if="!selected" class="text-center py-16 text-gray-500 text-sm">
              Select a revision to preview what changed.
            </div>
            <div v-else-if="loadingDetail" class="text-center py-16 text-gray-400 text-sm">Loading…</div>
            <RevisionDiffView v-else-if="detail" :before="detail.content" :after="currentContent" />
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
          <button @click="close" class="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
            Close
          </button>
          <button
            v-if="selected"
            @click="restore"
            :disabled="restoring"
            class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {{ restoring ? 'Restoring…' : 'Restore this revision' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import type { EditorStudioAdapter, StudioRevisionSummary, StudioRevisionDetail } from '@/studio/types'
import { formatRelativeDate } from '@/utils/formatRelativeDate'
import RevisionDiffView from '@/components/studio/RevisionDiffView.vue'

const props = defineProps<{
  isOpen: boolean
  adapter: EditorStudioAdapter
  documentId: string
  currentContent: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'restored', content: string): void
}>()

const toast = useToast()
const revisions = ref<StudioRevisionSummary[]>([])
const selected = ref<StudioRevisionSummary | null>(null)
const detail = ref<StudioRevisionDetail | null>(null)
const isLoading = ref(false)
const loadingDetail = ref(false)
const restoring = ref(false)

async function fetchRevisions() {
  if (!props.adapter.listRevisions) return
  isLoading.value = true
  try {
    revisions.value = await props.adapter.listRevisions(props.documentId)
  } finally {
    isLoading.value = false
  }
}

async function select(revision: StudioRevisionSummary) {
  selected.value = revision
  if (!props.adapter.getRevision) return
  loadingDetail.value = true
  try {
    detail.value = await props.adapter.getRevision(props.documentId, revision.id)
  } finally {
    loadingDetail.value = false
  }
}

async function restore() {
  if (!selected.value || !props.adapter.restoreRevision) return
  if (!confirm('Restore this revision? Your current content will be saved as a new revision first, so this can be undone.')) return
  restoring.value = true
  try {
    const doc = await props.adapter.restoreRevision(props.documentId, selected.value.id)
    toast.success('Revision restored')
    emit('restored', (doc as any).content)
    close()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to restore revision')
  } finally {
    restoring.value = false
  }
}

function close() {
  selected.value = null
  detail.value = null
  emit('close')
}

watch(() => props.isOpen, (open) => {
  if (open) fetchRevisions()
})
</script>
