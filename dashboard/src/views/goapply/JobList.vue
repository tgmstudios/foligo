<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <!-- Search -->
      <div class="relative flex-1 min-w-[200px] max-w-xs">
        <input
          v-model="search"
          type="text"
          placeholder="Search jobs..."
          class="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Status Filter -->
      <select
        v-model="statusFilter"
        class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">All Statuses</option>
        <option v-for="s in JOB_STATUSES" :key="s" :value="s">{{ STATUS_LABELS[s] }}</option>
      </select>

      <select v-model="categoryFilter" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
        <option value="">All Categories</option>
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
      </select>

      <select v-model="tagFilter" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
        <option value="">All Tags</option>
        <option v-for="tag in tags" :key="tag" :value="tag">{{ tag }}</option>
      </select>

      <select v-model="sortBy" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Sort jobs">
        <option value="updated-desc">Recently Updated</option>
        <option value="created-desc">Recently Added</option>
        <option value="applied-desc">Applied Date</option>
        <option value="company-asc">Company A–Z</option>
        <option value="category-asc">Category A–Z</option>
      </select>

      <!-- Add Button -->
      <button
        @click="openCreateForm"
        class="ml-auto px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        + Add Job
      </button>
    </div>

    <!-- Table -->
    <div v-if="filteredJobs.length === 0 && !store.isLoading" class="text-center py-12 text-gray-400">
      <p>No jobs found.</p>
      <button @click="openCreateForm" class="mt-2 text-primary-400 hover:underline text-sm">
        Add your first job
      </button>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Company</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Position</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category & Tags</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Applied</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <tr
              v-for="job in filteredJobs"
              :key="job.id"
              class="hover:bg-gray-750 transition-colors"
            >
              <td class="px-4 py-3 text-sm text-white font-medium">{{ job.company }}</td>
              <td class="px-4 py-3 text-sm text-gray-300">
                {{ job.position }}
                <a
                  v-if="job.url"
                  :href="job.url"
                  target="_blank"
                  class="ml-1 text-primary-400 hover:underline"
                  title="Open job posting"
                >
                  &#8599;
                </a>
              </td>
              <td class="px-4 py-3 text-xs">
                <div v-if="job.category" class="text-gray-300 mb-1">{{ job.category }}</div>
                <div v-if="job.tags.length" class="flex flex-wrap gap-1">
                  <span v-for="tag in job.tags" :key="tag" class="rounded-full bg-primary-900/50 px-2 py-0.5 text-primary-300">{{ tag }}</span>
                </div>
                <span v-if="!job.category && !job.tags.length" class="text-gray-600">—</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="STATUS_COLORS[job.status]"
                >
                  {{ STATUS_LABELS[job.status] }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-400">
                {{ job.appliedAt ? formatDate(job.appliedAt) : '—' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-400">
                <div v-if="job.notes" class="text-xs text-gray-400 markdown-body max-w-xs truncate" v-html="renderMarkdown(truncate(job.notes, 100))"></div>
                <span v-else class="text-gray-600">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditForm(job)"
                    class="p-1 text-gray-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="handleDelete(job.id)"
                    class="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Job Form Modal -->
    <JobForm
      v-if="showForm"
      :job="editingJob"
      @close="showForm = false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGoApplyStore, JOB_STATUSES, STATUS_LABELS, STATUS_COLORS, type GoApplyJob } from '@/stores/goapply'
import { format } from 'date-fns'
import { marked } from 'marked'
import JobForm from '@/views/goapply/JobForm.vue'
import { clearPreferenceCookie, readPreferenceCookie, writePreferenceCookie } from '@/utils/goapplyJobPreferences'

const store = useGoApplyStore()

const PREFERENCE_COOKIE = 'goapply-job-list-preferences'
const PREFERENCE_VERSION = 1
const SORT_OPTIONS = ['updated-desc', 'created-desc', 'applied-desc', 'company-asc', 'category-asc'] as const
const savedPreferences = readPreferenceCookie<Partial<{ search: string; status: string; category: string; tag: string; sort: string }>>(PREFERENCE_COOKIE, PREFERENCE_VERSION)

const search = ref(typeof savedPreferences?.search === 'string' ? savedPreferences.search : '')
const statusFilter = ref(typeof savedPreferences?.status === 'string' && JOB_STATUSES.includes(savedPreferences.status as any) ? savedPreferences.status : '')
const categoryFilter = ref(typeof savedPreferences?.category === 'string' ? savedPreferences.category : '')
const tagFilter = ref(typeof savedPreferences?.tag === 'string' ? savedPreferences.tag : '')
const sortBy = ref(typeof savedPreferences?.sort === 'string' && SORT_OPTIONS.includes(savedPreferences.sort as any) ? savedPreferences.sort : 'updated-desc')
const showForm = ref(false)
const editingJob = ref<GoApplyJob | null>(null)

const categories = computed(() => [...new Set(store.jobs.map(job => job.category).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b)))
const tags = computed(() => [...new Set(store.jobs.flatMap(job => job.tags))].sort((a, b) => a.localeCompare(b)))

if (savedPreferences && (
  (savedPreferences.search !== undefined && typeof savedPreferences.search !== 'string') ||
  (savedPreferences.status !== undefined && !JOB_STATUSES.includes(savedPreferences.status as any)) ||
  (savedPreferences.category !== undefined && typeof savedPreferences.category !== 'string') ||
  (savedPreferences.tag !== undefined && typeof savedPreferences.tag !== 'string') ||
  (savedPreferences.sort !== undefined && !SORT_OPTIONS.includes(savedPreferences.sort as any))
)) clearPreferenceCookie(PREFERENCE_COOKIE)

watch([search, statusFilter, categoryFilter, tagFilter, sortBy], () => {
  writePreferenceCookie(PREFERENCE_COOKIE, PREFERENCE_VERSION, {
    search: search.value, status: statusFilter.value, category: categoryFilter.value,
    tag: tagFilter.value, sort: sortBy.value,
  })
})

const preferencesReady = ref(store.jobs.length > 0)
let jobsLoadStarted = store.isLoading
watch(() => store.isLoading, (loading) => {
  if (loading) jobsLoadStarted = true
  else if (jobsLoadStarted) preferencesReady.value = true
}, { immediate: true })
watch([preferencesReady, categories, tags], ([ready]) => {
  if (!ready) return
  if (categoryFilter.value && !categories.value.includes(categoryFilter.value)) categoryFilter.value = ''
  if (tagFilter.value && !tags.value.includes(tagFilter.value)) tagFilter.value = ''
}, { immediate: true })

const filteredJobs = computed(() => {
  let jobs = store.jobs

  if (search.value) {
    const q = search.value.toLowerCase()
    jobs = jobs.filter(
      (j) =>
        j.company.toLowerCase().includes(q) ||
        j.position.toLowerCase().includes(q) ||
        (j.category && j.category.toLowerCase().includes(q)) ||
        j.tags.some(tag => tag.toLowerCase().includes(q)) ||
        (j.notes && j.notes.toLowerCase().includes(q))
    )
  }

  if (statusFilter.value) {
    jobs = jobs.filter((j) => j.status === statusFilter.value)
  }

  if (categoryFilter.value) jobs = jobs.filter(job => job.category === categoryFilter.value)
  if (tagFilter.value) jobs = jobs.filter(job => job.tags.includes(tagFilter.value))

  const [field, direction] = sortBy.value.split('-')
  jobs = [...jobs].sort((a, b) => {
    let result = 0
    if (field === 'company') result = a.company.localeCompare(b.company)
    else if (field === 'category') result = (a.category || '').localeCompare(b.category || '')
    else {
      const aDate = field === 'created' ? a.createdAt : field === 'applied' ? a.appliedAt : a.updatedAt
      const bDate = field === 'created' ? b.createdAt : field === 'applied' ? b.appliedAt : b.updatedAt
      result = (aDate ? new Date(aDate).getTime() : 0) - (bDate ? new Date(bDate).getTime() : 0)
    }
    return direction === 'desc' ? -result : result
  })

  return jobs
})

function formatDate(dateString: string) {
  return format(new Date(dateString), 'MMM d, yyyy')
}

function renderMarkdown(text: string) {
  return marked.parse(text, { breaks: true })
}

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

function openCreateForm() {
  editingJob.value = null
  showForm.value = true
}

function openEditForm(job: GoApplyJob) {
  editingJob.value = job
  showForm.value = true
}

function onSaved() {
  showForm.value = false
  editingJob.value = null
}

async function handleDelete(id: string) {
  if (confirm('Are you sure you want to delete this job?')) {
    await store.deleteJob(id)
  }
}
</script>

<style scoped>
.markdown-body p { margin-bottom: 0.25rem; }
.markdown-body ul { list-style-type: disc; padding-left: 1rem; }
.markdown-body ol { list-style-type: decimal; padding-left: 1rem; }
.markdown-body code { background: rgba(255,255,255,0.1); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.8em; }
.markdown-body pre { background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; overflow-x: auto; }
.markdown-body a { color: #818cf8; text-decoration: underline; }
.markdown-body strong { font-weight: 600; }
.markdown-body blockquote { border-left: 2px solid #4b5563; padding-left: 0.75rem; color: #9ca3af; }
</style>
