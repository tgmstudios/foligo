<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-white">Cover Letters</h1>
        <p class="text-sm text-gray-400 mt-1">Open a cover letter in the Studio to write and tailor it.</p>
      </div>
      <button @click="handleNew" :disabled="creating" class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        <span>New Cover Letter</span>
      </button>
    </div>

    <!-- Search -->
    <div v-if="documents.length > 0 || search" class="mb-4">
      <div class="relative max-w-xs">
        <input
          v-model="search"
          type="text"
          placeholder="Search cover letters..."
          class="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-16 text-gray-400 text-sm">Loading…</div>
    <div v-else-if="filteredDocuments.length === 0 && documents.length > 0" class="text-center py-16"><p class="text-gray-400 text-sm">No cover letters match your search.</p></div>
    <div v-else-if="documents.length === 0" class="text-center py-16"><p class="text-gray-400 text-sm">No cover letters yet.</p></div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="doc in filteredDocuments" :key="doc.id" @click="openStudio(doc.id)" class="relative bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-gray-600 hover:bg-gray-750 transition-all group">
        <div class="flex items-start justify-between mb-2">
          <div class="min-w-0 pr-6">
            <h3 class="font-medium text-sm text-white truncate">{{ doc.title }}</h3>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-if="doc.isTemplate" class="px-1.5 py-0.5 rounded text-[10px] bg-gray-700 text-gray-300">Template</span>
              <span v-if="doc.isDefault" class="px-1.5 py-0.5 rounded text-[10px] bg-primary-900 text-primary-300">Default</span>
            </div>
          </div>
          <button @click.stop="toggleMenu(doc.id)" class="absolute top-3 right-3 p-1 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100" :class="{ 'opacity-100': openMenuId === doc.id }">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
          </button>
          <div v-if="openMenuId === doc.id" @click.stop class="absolute top-9 right-3 z-10 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1">
            <button @click="openQuickEdit(doc)" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white">Quick edit</button>
            <button @click="handleClone(doc.id)" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white">Clone</button>
            <button @click="toggleTemplate(doc)" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white">{{ doc.isTemplate ? 'Remove from templates' : 'Mark as template' }}</button>
            <button v-if="!doc.isDefault" @click="makeDefault(doc.id)" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white">Make default template</button>
            <button v-if="doc.isDefault" @click="clearDefault(doc.id)" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white">Clear default</button>
            <button @click="handleDelete(doc.id)" class="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-gray-800 hover:text-red-300">Delete</button>
          </div>
        </div>
        <p class="text-xs text-gray-500">{{ formatRelativeDate(doc.updatedAt) }}</p>
        <div v-if="doc.job" class="mt-2">
          <LinkedJobBadge :company="doc.job.company" :position="doc.job.position" />
        </div>
        <p class="text-xs text-gray-500 mt-2 line-clamp-2 whitespace-pre-line">{{ doc.content }}</p>
      </div>
    </div>

    <MetaEditorPopover v-if="quickEditDoc" :is-open="!!quickEditDoc" :adapter="adapter" :document-id="quickEditDoc.id" :initial-values="adapter.getMetaValues(quickEditDoc)" @close="quickEditDoc = null" @saved="fetchDocuments" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import '@/studio/adapters'
import { getAdapter } from '@/studio/registry'
import { useCoverLetterDocuments, type CoverLetterDocument } from '@/composables/useCoverLetterDocuments'
import { formatRelativeDate } from '@/utils/formatRelativeDate'
import MetaEditorPopover from '@/components/studio/MetaEditorPopover.vue'
import LinkedJobBadge from '@/components/goapply/LinkedJobBadge.vue'

const router = useRouter()
const adapter = getAdapter('cover-letter')
const { documents, isLoading, fetchDocuments, createDocument, updateDocument, cloneDocument, deleteDocument } = useCoverLetterDocuments()
const creating = ref(false)
const openMenuId = ref<string | null>(null)
const quickEditDoc = ref<CoverLetterDocument | null>(null)
const search = ref('')

const filteredDocuments = computed(() => {
  if (!search.value.trim()) return documents.value
  const q = search.value.toLowerCase()
  return documents.value.filter(doc =>
    doc.title.toLowerCase().includes(q) ||
    (doc.content || '').toLowerCase().includes(q) ||
    (doc.job?.company || '').toLowerCase().includes(q) ||
    (doc.job?.position || '').toLowerCase().includes(q)
  )
})

const openStudio = (id: string) => router.push({ name: 'studio-cover-letter', params: { id } })
async function handleNew() { creating.value = true; try { openStudio((await createDocument()).id) } finally { creating.value = false } }
function toggleMenu(id: string) { openMenuId.value = openMenuId.value === id ? null : id }
function openQuickEdit(doc: CoverLetterDocument) { quickEditDoc.value = doc; openMenuId.value = null }
async function handleClone(id: string) { openMenuId.value = null; await cloneDocument(id) }
async function toggleTemplate(doc: CoverLetterDocument) { openMenuId.value = null; await updateDocument(doc.id, { isTemplate: !doc.isTemplate }); await fetchDocuments() }
async function makeDefault(id: string) { openMenuId.value = null; await updateDocument(id, { isDefault: true }); await fetchDocuments() }
async function clearDefault(id: string) { openMenuId.value = null; await updateDocument(id, { isDefault: false }); await fetchDocuments() }
async function handleDelete(id: string) { openMenuId.value = null; if (confirm('Delete this cover letter? This cannot be undone.')) await deleteDocument(id) }
const closeMenu = () => { openMenuId.value = null }
onMounted(() => { fetchDocuments(); window.addEventListener('click', closeMenu) })
onUnmounted(() => window.removeEventListener('click', closeMenu))
</script>
