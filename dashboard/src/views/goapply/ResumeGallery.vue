
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

    <!-- Search, filter, sort -->
    <div v-if="documents.length > 0 || search" class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative max-w-xs flex-1 min-w-[12rem]">
        <input
          v-model="search"
          type="text"
          placeholder="Search resumes..."
          class="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <select
        v-model="filter"
        class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="all">All resumes</option>
        <option value="tailored">Tailored</option>
        <option value="template">Templates</option>
        <option value="default">Default</option>
      </select>
      <select
        v-model="categoryFilter"
        class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="all">All categories</option>
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
      </select>
      <select
        v-model="sort"
        class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="updated">Recently updated</option>
        <option value="name-asc">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
      </select>
    </div>

    <div v-if="isLoading" class="text-center py-16 text-gray-400 text-sm">Loading…</div>

    <div v-else-if="filteredDocuments.length === 0 && documents.length > 0" class="text-center py-16">
      <p class="text-gray-400 text-sm">No resumes match your search.</p>
    </div>

    <div v-else-if="documents.length === 0" class="text-center py-16">
      <p class="text-gray-400 text-sm">No resumes yet.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="doc in filteredDocuments"
        :key="doc.id"
        @click="openStudio(doc.id)"
        class="relative bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-gray-600 hover:bg-gray-750 transition-all group"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="min-w-0 pr-6">
            <h3 class="font-medium text-sm text-white truncate">{{ doc.name }}</h3>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-if="doc.jobDescription" class="px-1.5 py-0.5 rounded text-[10px] bg-green-900 text-green-300">Tailored</span>
              <span v-if="doc.isTemplate" class="px-1.5 py-0.5 rounded text-[10px] bg-gray-700 text-gray-300">Template</span>
              <span v-if="doc.isDefault" class="px-1.5 py-0.5 rounded text-[10px] bg-primary-900 text-primary-300">Default</span>
              <span v-if="doc.linkedJob?.category" class="px-1.5 py-0.5 rounded text-[10px] bg-blue-900 text-blue-300">{{ doc.linkedJob.category }}</span>
            </div>
          </div>
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
            class="absolute top-9 right-3 z-10 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1"
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
            <button @click="toggleTemplate(doc)" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              {{ doc.isTemplate ? 'Remove from templates' : 'Mark as template' }}
            </button>
            <button v-if="!doc.isDefault" @click="makeDefault(doc.id)" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              Make default template
            </button>
            <button v-if="doc.isDefault" @click="clearDefault(doc.id)" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              Clear default
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
        <div v-if="doc.linkedJob" class="mt-2">
          <LinkedJobBadge :company="doc.linkedJob.company" :position="doc.linkedJob.position" />
        </div>
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

    <NewResumeModal
      :is-open="showNewResumeModal"
      :documents="documents"
      :jobs="goApplyStore.jobs"
      :creating="creating"
      @close="showNewResumeModal = false"
      @create="handleCreateResume"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import '@/studio/adapters'
import { getAdapter } from '@/studio/registry'
import { useResumeDocuments, type ResumeDocumentSummary } from '@/composables/useResumeDocuments'
import { useGoApplyStore } from '@/stores/goapply'
import { formatRelativeDate } from '@/utils/formatRelativeDate'
import MetaEditorPopover from '@/components/studio/MetaEditorPopover.vue'
import LinkedJobBadge from '@/components/goapply/LinkedJobBadge.vue'
import NewResumeModal from '@/components/goapply/NewResumeModal.vue'
import { clearPreferenceCookie, readPreferenceCookie, writePreferenceCookie } from '@/utils/goapplyJobPreferences'

const router = useRouter()
const adapter = getAdapter('resume')
const goApplyStore = useGoApplyStore()

const { documents, isLoading, fetchDocuments, createDocument, loadDocument, updateDocument, cloneDocument, deleteDocument } = useResumeDocuments()

const creating = ref(false)
const showNewResumeModal = ref(false)
const openMenuId = ref<string | null>(null)
const quickEditDoc = ref<ResumeDocumentSummary | null>(null)
const PREFERENCE_KEY = 'goapply-resume-preferences'
const PREFERENCE_VERSION = 1
const FILTER_OPTIONS = ['all', 'tailored', 'template', 'default'] as const
const SORT_OPTIONS = ['updated', 'name-asc', 'name-desc'] as const
const savedPreferences = readPreferenceCookie<Partial<{ search: string; filter: string; category: string; sort: string }>>(PREFERENCE_KEY, PREFERENCE_VERSION)
const search = ref(typeof savedPreferences?.search === 'string' ? savedPreferences.search : '')
const filter = ref<typeof FILTER_OPTIONS[number]>(FILTER_OPTIONS.includes(savedPreferences?.filter as typeof FILTER_OPTIONS[number]) ? savedPreferences!.filter as typeof FILTER_OPTIONS[number] : 'all')
const categoryFilter = ref(typeof savedPreferences?.category === 'string' ? savedPreferences.category : 'all')
const sort = ref<typeof SORT_OPTIONS[number]>(SORT_OPTIONS.includes(savedPreferences?.sort as typeof SORT_OPTIONS[number]) ? savedPreferences!.sort as typeof SORT_OPTIONS[number] : 'updated')

if (savedPreferences && (
  (savedPreferences.search !== undefined && typeof savedPreferences.search !== 'string') ||
  (savedPreferences.filter !== undefined && !FILTER_OPTIONS.includes(savedPreferences.filter as typeof FILTER_OPTIONS[number])) ||
  (savedPreferences.category !== undefined && typeof savedPreferences.category !== 'string') ||
  (savedPreferences.sort !== undefined && !SORT_OPTIONS.includes(savedPreferences.sort as typeof SORT_OPTIONS[number]))
)) clearPreferenceCookie(PREFERENCE_KEY)

watch([search, filter, categoryFilter, sort], () => {
  writePreferenceCookie(PREFERENCE_KEY, PREFERENCE_VERSION, {
    search: search.value, filter: filter.value, category: categoryFilter.value, sort: sort.value,
  })
}, { flush: 'sync' })

const categories = computed(() =>
  [...new Set(goApplyStore.jobs.map(job => job.category).filter((value): value is string => Boolean(value)))].sort()
)

const filteredDocuments = computed(() => {
  let docs = documents.value

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    docs = docs.filter(doc =>
      doc.name.toLowerCase().includes(q) ||
      (doc.jobDescription || '').toLowerCase().includes(q) ||
      (doc.linkedJob?.company || '').toLowerCase().includes(q) ||
      (doc.linkedJob?.position || '').toLowerCase().includes(q)
    )
  }

  if (filter.value === 'tailored') docs = docs.filter(doc => !!doc.jobDescription)
  else if (filter.value === 'template') docs = docs.filter(doc => doc.isTemplate)
  else if (filter.value === 'default') docs = docs.filter(doc => doc.isDefault)

  if (categoryFilter.value !== 'all') docs = docs.filter(doc => doc.linkedJob?.category === categoryFilter.value)

  docs = [...docs]
  if (sort.value === 'name-asc') docs.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'name-desc') docs.sort((a, b) => b.name.localeCompare(a.name))
  else docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return docs
})

function openStudio(id: string) {
  router.push({ name: 'studio-resume', params: { id } })
}

function handleNew() {
  showNewResumeModal.value = true
}

async function handleCreateResume(payload: { name: string; templateId: string; jobId: string; initialPrompt: string }) {
  creating.value = true
  try {
    const content = payload.templateId ? (await loadDocument(payload.templateId)).content : undefined
    const job = payload.jobId ? goApplyStore.jobs.find(j => j.id === payload.jobId) : undefined
    const doc = await createDocument({
      name: payload.name || undefined,
      content,
      jobDescription: job?.description || job?.notes || undefined,
      linkedJobId: job?.id,
    })
    showNewResumeModal.value = false
    router.push({
      name: 'studio-resume',
      params: { id: doc.id },
      query: payload.initialPrompt ? { initialPrompt: payload.initialPrompt } : {},
    })
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

async function toggleTemplate(doc: ResumeDocumentSummary) {
  closeMenu()
  await updateDocument(doc.id, { isTemplate: !doc.isTemplate })
}

async function makeDefault(id: string) {
  closeMenu()
  await updateDocument(id, { isDefault: true })
}

async function clearDefault(id: string) {
  closeMenu()
  await updateDocument(id, { isDefault: false })
}

async function handleDelete(id: string) {
  closeMenu()
  if (!confirm('Delete this resume? This cannot be undone.')) return
  await deleteDocument(id)
}

function handleWindowClick() {
  openMenuId.value = null
}

function handleDataChanged(event: Event) {
  if ((event as CustomEvent).detail?.kind !== 'resume') return
  fetchDocuments()
}

onMounted(() => {
  fetchDocuments()
  if (goApplyStore.jobs.length === 0) goApplyStore.fetchJobs()
  window.addEventListener('click', handleWindowClick)
  window.addEventListener('foligo-data-changed', handleDataChanged)
})

onUnmounted(() => {
  window.removeEventListener('click', handleWindowClick)
  window.removeEventListener('foligo-data-changed', handleDataChanged)
})
</script>
