<template>
  <div>
    <!-- Toolbar -->
    <div class="flex items-center gap-3 mb-4">
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

    <div v-else class="flex gap-4 overflow-x-auto pb-4" style="min-height: 60vh">
      <div
        v-for="(column, colIdx) in localColumns"
        :key="column.status"
        class="flex-shrink-0 w-72"
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
          :disabled="isMobile"
          ghost-class="opacity-50"
          drag-class="shadow-lg"
          class="space-y-2 min-h-[120px] p-2 rounded-lg bg-gray-800/50 border border-dashed border-gray-700 transition-colors"
          :class="{ 'cursor-default': isMobile }"
          @add="(evt: any) => handleAdd(evt, column.status, colIdx)"
          @update="(evt: any) => handleUpdate(colIdx)"
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
              </div>
              <!-- Edit button -->
              <button
                @click="openEditForm(job)"
                class="ml-1 p-1 text-gray-500 hover:text-white transition-colors flex-shrink-0"
                title="Edit job"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
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

            <div v-if="job.notes" class="mt-2 pt-2 border-t border-gray-700">
              <p class="text-xs text-gray-500 mb-1">Notes:</p>
              <div class="text-xs text-gray-400 markdown-body prose-sm" v-html="renderMarkdown(job.notes)"></div>
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useGoApplyStore, JOB_STATUSES, KANBAN_COLUMNS, type JobStatus, type GoApplyJob } from '@/stores/goapply'
import { format } from 'date-fns'
import { marked } from 'marked'
import JobForm from '@/views/goapply/JobForm.vue'

const store = useGoApplyStore()

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
watch(() => store.jobs, (jobs) => {
  const map: Record<string, GoApplyJob[]> = {}
  for (const s of JOB_STATUSES) map[s] = []
  // Sort jobs by sortOrder then updatedAt
  const sorted = [...jobs].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
  for (const job of sorted) {
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
