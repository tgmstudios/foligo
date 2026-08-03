<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <input v-model="search" type="text" placeholder="Search jobs..." class="min-w-[200px] flex-1 max-w-xs px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
      <select v-model="categoryFilter" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
        <option value="">All Categories</option>
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
      </select>
      <select v-model="tagFilter" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
        <option value="">All Tags</option>
        <option v-for="tag in tags" :key="tag" :value="tag">{{ tag }}</option>
      </select>
      <select v-model="sortBy" class="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Sort jobs">
        <option value="manual">Manual Order</option>
        <option value="updated-desc">Recently Updated</option>
        <option value="created-desc">Recently Added</option>
        <option value="applied-desc">Applied Date</option>
        <option value="company-asc">Company A–Z</option>
        <option value="category-asc">Category A–Z</option>
      </select>
      <button
        @click="openCreateForm"
        class="ml-auto px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        + Add Job
      </button>
    </div>

    <div v-if="store.isLoading && store.jobs.length === 0" class="text-center py-12 text-gray-400">
      Loading board...
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 xl:grid-cols-3"
      style="min-height: 60vh"
    >
      <div
        v-for="(column, colIdx) in localColumns"
        :key="column.status"
        class="min-w-0"
      >
        <!-- Column Header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span :class="`w-3 h-3 rounded-full ${column.color}`"></span>
            <h3 class="text-sm font-semibold text-gray-200 uppercase tracking-wide">
              {{ column.label }}
            </h3>
          </div>
          <span class="text-xs text-gray-500 bg-gray-700 rounded-full px-2 py-0.5">
            {{ column.jobs.length }}
          </span>
        </div>

        <!-- Draggable Column -->
        <VueDraggable
          v-model="column.jobs"
          :group="{ name: 'goapply-kanban', pull: true, put: true }"
          :animation="200"
          :sort="true"
          :disabled="isMobile || !canReorder"
          ghost-class="opacity-50"
          drag-class="shadow-lg"
          class="space-y-2 min-h-[120px] p-2 rounded-lg bg-gray-800/50 border border-dashed border-gray-700 transition-colors"
          :class="{ 'cursor-default': isMobile }"
          @add="handleAdd($event, column.status, colIdx)"
          @update="handleUpdate(colIdx)"
          item-key="id"
        >
          <div
            v-for="(job, jobIdx) in column.jobs"
            :key="job.id"
            class="card p-3"
            :class="isMobile ? '' : 'cursor-grab active:cursor-grabbing'"
          >
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-medium text-white truncate">{{ job.company }}</h4>
                <p class="text-xs text-gray-400 truncate mt-0.5">{{ job.position }}</p>
                <p v-if="job.category" class="text-xs text-primary-300 truncate mt-1">{{ job.category }}</p>
              </div>
              <div class="ml-1 flex flex-shrink-0 items-center gap-1">
                <a
                  v-if="job.url"
                  :href="job.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-white"
                  title="Open job posting in a new tab"
                  aria-label="Open job posting in a new tab"
                >
                  <ArrowTopRightOnSquareIcon class="h-4 w-4" />
                </a>
                <!-- Edit button -->
                <button
                  @click="openEditForm(job)"
                  class="rounded p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-white"
                  title="Edit job"
                >
                  <PencilSquareIcon class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div v-if="job.tags.length" class="flex flex-wrap gap-1 mt-2">
              <span v-for="tag in job.tags" :key="tag" class="rounded-full bg-primary-900/50 px-2 py-0.5 text-[11px] text-primary-300">{{ tag }}</span>
            </div>

            <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ job.appliedAt ? formatDate(job.appliedAt) : '—' }}</span>

              <!-- Referred By -->
              <span v-if="job.referredBy" class="text-gray-600">
                · via {{ job.referredBy }}
              </span>
            </div>

            <div v-if="job.notes" class="mt-2 pt-2 border-t border-gray-700 min-w-0">
              <p class="text-xs text-gray-500 mb-1">Notes:</p>
              <div class="text-xs text-gray-400 markdown-body prose-sm line-clamp-4 overflow-hidden break-words" v-html="renderMarkdown(job.notes)"></div>
            </div>

            <!-- Mobile arrow buttons -->
            <div v-if="isMobile" class="flex justify-end gap-1 mt-2 pt-2 border-t border-gray-700">
              <button
                @click="moveJob(colIdx, jobIdx, -1)"
                :disabled="jobIdx === 0"
                class="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move up"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                @click="moveJob(colIdx, jobIdx, 1)"
                :disabled="jobIdx === column.jobs.length - 1"
                class="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move down"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </VueDraggable>

        <!-- Empty state -->
        <div v-if="column.jobs.length === 0" class="text-center py-6">
          <p class="text-xs text-gray-600">No jobs</p>
        </div>
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
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useGoApplyStore, JOB_STATUSES, KANBAN_COLUMNS, type JobStatus, type GoApplyJob } from '@/stores/goapply'
import { format } from 'date-fns'
import { marked } from 'marked'
import { ArrowTopRightOnSquareIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import JobForm from '@/views/goapply/JobForm.vue'
import { clearPreferenceCookie, readPreferenceCookie, writePreferenceCookie } from '@/utils/goapplyJobPreferences'

const store = useGoApplyStore()
const PREFERENCE_COOKIE = 'goapply-kanban-preferences'
const PREFERENCE_VERSION = 1
const SORT_OPTIONS = ['manual', 'updated-desc', 'created-desc', 'applied-desc', 'company-asc', 'category-asc'] as const
const savedPreferences = readPreferenceCookie<Partial<{ search: string; category: string; tag: string; sort: string }>>(PREFERENCE_COOKIE, PREFERENCE_VERSION)
const search = ref(typeof savedPreferences?.search === 'string' ? savedPreferences.search : '')
const categoryFilter = ref(typeof savedPreferences?.category === 'string' ? savedPreferences.category : '')
const tagFilter = ref(typeof savedPreferences?.tag === 'string' ? savedPreferences.tag : '')
const sortBy = ref(typeof savedPreferences?.sort === 'string' && SORT_OPTIONS.includes(savedPreferences.sort as any) ? savedPreferences.sort : 'manual')
const categories = computed(() => [...new Set(store.jobs.map(job => job.category).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b)))
const tags = computed(() => [...new Set(store.jobs.flatMap(job => job.tags))].sort((a, b) => a.localeCompare(b)))

if (savedPreferences && (
  (savedPreferences.search !== undefined && typeof savedPreferences.search !== 'string') ||
  (savedPreferences.category !== undefined && typeof savedPreferences.category !== 'string') ||
  (savedPreferences.tag !== undefined && typeof savedPreferences.tag !== 'string') ||
  (savedPreferences.sort !== undefined && !SORT_OPTIONS.includes(savedPreferences.sort as any))
)) clearPreferenceCookie(PREFERENCE_COOKIE)

watch([search, categoryFilter, tagFilter, sortBy], () => {
  writePreferenceCookie(PREFERENCE_COOKIE, PREFERENCE_VERSION, {
    search: search.value, category: categoryFilter.value, tag: tagFilter.value, sort: sortBy.value,
  })
}, { flush: 'sync' })

const canReorder = computed(() => sortBy.value === 'manual' && !search.value && !categoryFilter.value && !tagFilter.value)

const visibleJobs = computed(() => {
  const q = search.value.trim().toLowerCase()
  let jobs = store.jobs.filter(job =>
    (!q || [job.company, job.position, job.notes, job.category, ...job.tags].some(value => value?.toLowerCase().includes(q))) &&
    (!categoryFilter.value || job.category === categoryFilter.value) &&
    (!tagFilter.value || job.tags.includes(tagFilter.value))
  )
  if (sortBy.value === 'manual') return [...jobs].sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const [field, direction] = sortBy.value.split('-')
  return [...jobs].sort((a, b) => {
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
})

// Local reactive copy that VueDraggable can mutate directly
const localColumns = ref<{ status: JobStatus; label: string; color: string; jobs: GoApplyJob[] }[]>([])

// Mobile detection
const isMobile = ref(window.innerWidth < 768)
function onResize() {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// Job form state
const showForm = ref(false)
const editingJob = ref<GoApplyJob | null>(null)

// Sync from store → local when jobs load
watch(visibleJobs, (jobs) => {
  const map: Record<string, GoApplyJob[]> = {}
  for (const s of JOB_STATUSES) map[s] = []
  for (const job of jobs) {
    if (map[job.status]) map[job.status].push(job)
  }
  localColumns.value = KANBAN_COLUMNS.map(col => ({
    ...col,
    jobs: [...map[col.status]],  // shallow clone so VueDraggable can mutate
  }))
}, { immediate: true, deep: true })

function formatDate(dateString: string) {
  return format(new Date(dateString), 'MMM d, yyyy')
}

function renderMarkdown(text: string) {
  return marked.parse(text, { breaks: true })
}

// ── Drag & Drop / Reorder ────────────────────────────────────────────

// @add fires when an item is dragged FROM another list INTO this column.
// Note: saveColumnOrder already sets status=column.status for every item,
// so we don't need to read evt.data or manually mutate job.status.
// The server will update both sortOrder and status via the bulk reorder endpoint.
async function handleAdd(_evt: any, _newStatus: JobStatus, colIdx: number) {
  await saveColumnOrder(colIdx)
}

// @update fires when item order changes within the same column
async function handleUpdate(colIdx: number) {
  await saveColumnOrder(colIdx)
}

async function saveColumnOrder(colIdx: number) {
  const column = localColumns.value[colIdx]
  if (!column) return

  const items = column.jobs.map((job, i) => ({
    id: job.id,
    sortOrder: i,
    status: column.status,
  }))

  try {
    await store.reorderJobs(items)
  } catch {
    // Revert on failure
    await store.fetchJobs()
  }
}

// ── Mobile arrow buttons ─────────────────────────────────────────────

async function moveJob(colIdx: number, jobIdx: number, direction: number) {
  const column = localColumns.value[colIdx]
  if (!column) return

  const newIdx = jobIdx + direction
  if (newIdx < 0 || newIdx >= column.jobs.length) return

  // Swap
  const temp = column.jobs[jobIdx]
  column.jobs[jobIdx] = column.jobs[newIdx]
  column.jobs[newIdx] = temp

  // Trigger a re-render by replacing the array
  column.jobs = [...column.jobs]

  await saveColumnOrder(colIdx)
}

// ── Job Form ─────────────────────────────────────────────────────────

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
