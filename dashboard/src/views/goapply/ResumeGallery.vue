
<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-white">Resumes</h1>
        <p class="text-sm text-gray-400 mt-1">Open a resume in the Studio to edit, tailor, and compile it.</p>
      </div>
      <button
        @click="handleNew"
        :disabled="creating"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>New Resume</span>
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-16 text-gray-400 text-sm">Loading…</div>

    <div v-else-if="documents.length === 0" class="text-center py-16">
      <p class="text-gray-400 text-sm">No resumes yet.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="doc in documents"
        :key="doc.id"
        @click="openStudio(doc.id)"
        class="relative bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-gray-600 hover:bg-gray-750 transition-all group"
      >
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-medium text-sm text-white truncate pr-6">{{ doc.name }}</h3>
          <button
            @click.stop="toggleMenu(doc.id)"
            class="absolute top-3 right-3 p-1 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
            :class="{ 'opacity-100': openMenuId === doc.id }"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          <div
            v-if="openMenuId === doc.id"
            @click.stop
            class="absolute top-9 right-3 z-10 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1"
          >
            <button
              @click="openQuickEdit(doc)"
              class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Quick edit
            </button>
            <button
              @click="handleClone(doc.id)"
              class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Clone
            </button>
            <button
              @click="handleDelete(doc.id)"
              class="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <p class="text-xs text-gray-500">{{ formatRelativeDate(doc.updatedAt) }}</p>
        <p v-if="doc.jobDescription" class="text-xs text-gray-500 mt-2 line-clamp-2">
          {{ doc.jobDescription.substring(0, 100) }}{{ doc.jobDescription.length > 100 ? '…' : '' }}
        </p>
      </div>
    </div>

    <MetaEditorPopover
      v-if="quickEditDoc"
      :is-open="!!quickEditDoc"
      :adapter="adapter"
      :document-id="quickEditDoc.id"
      :initial-values="adapter.getMetaValues(quickEditDoc)"
      @close="quickEditDoc = null"
      @saved="fetchDocuments"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import '@/studio/adapters'
import { getAdapter } from '@/studio/registry'
import { useResumeDocuments, type ResumeDocumentSummary } from '@/composables/useResumeDocuments'
import { formatRelativeDate } from '@/utils/formatRelativeDate'
import MetaEditorPopover from '@/components/studio/MetaEditorPopover.vue'

const router = useRouter()
const adapter = getAdapter('resume')

const { documents, isLoading, fetchDocuments, createDocument, cloneDocument, deleteDocument } = useResumeDocuments()

const creating = ref(false)
const openMenuId = ref<string | null>(null)
const quickEditDoc = ref<ResumeDocumentSummary | null>(null)

function openStudio(id: string) {
  router.push({ name: 'goapply-resume-studio', params: { id } })
}

async function handleNew() {
  creating.value = true
  try {
    const doc = await createDocument()
    openStudio(doc.id)
  } finally {
    creating.value = false
  }
}

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu() {
  openMenuId.value = null
}

function openQuickEdit(doc: ResumeDocumentSummary) {
  quickEditDoc.value = doc
  closeMenu()
}

async function handleClone(id: string) {
  closeMenu()
  await cloneDocument(id)
}

async function handleDelete(id: string) {
  closeMenu()
  if (!confirm('Delete this resume? This cannot be undone.')) return
  await deleteDocument(id)
}

function handleWindowClick() {
  openMenuId.value = null
}

onMounted(() => {
  fetchDocuments()
  window.addEventListener('click', handleWindowClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleWindowClick)
})
</script>
