<template>
  <div>
    <div v-if="store.isLoading && store.jobs.length === 0" class="text-center py-12 text-gray-400">
      Loading board...
    </div>

    <div v-else class="flex gap-4 overflow-x-auto pb-4" style="min-height: 60vh">
      <div
        v-for="column in localColumns"
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
          ghost-class="opacity-50"
          drag-class="shadow-lg rotate-1"
          class="space-y-2 min-h-[120px] p-2 rounded-lg bg-gray-800/50 border border-dashed border-gray-700 transition-colors"
          @change="(evt: any) => handleChange(evt, column.status)"
          item-key="id"
        >
          <div
            v-for="job in column.jobs"
            :key="job.id"
            class="card p-3 cursor-grab active:cursor-grabbing hover:border-gray-500 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-medium text-white truncate">{{ job.company }}</h4>
                <p class="text-xs text-gray-400 truncate mt-0.5">{{ job.position }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ job.appliedAt ? formatDate(job.appliedAt) : '—' }}</span>
            </div>
            <div v-if="job.notes" class="mt-2 pt-2 border-t border-gray-700">
              <p class="text-xs text-gray-500 mb-1">Notes:</p>
              <div class="text-xs text-gray-400 markdown-body prose-sm" v-html="renderMarkdown(job.notes)"></div>
            </div>
          </div>
        </VueDraggable>

        <!-- Empty state -->
        <div v-if="column.jobs.length === 0" class="text-center py-6">
          <p class="text-xs text-gray-600">No jobs</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useGoApplyStore, JOB_STATUSES, KANBAN_COLUMNS, type JobStatus, type GoApplyJob } from '@/stores/goapply'
import { format } from 'date-fns'
import { marked } from 'marked'

const store = useGoApplyStore()

// Local reactive copy that VueDraggable can mutate directly
const localColumns = ref<{ status: JobStatus; label: string; color: string; jobs: GoApplyJob[] }[]>([])

// Sync from store → local when jobs load
watch(() => store.jobs, (jobs) => {
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

async function handleChange(evt: any, newStatus: JobStatus) {
  if (evt.added) {
    const job: GoApplyJob = evt.added.element
    if (job.status !== newStatus) {
      const oldStatus = job.status
      // Optimistic update
      job.status = newStatus
      try {
        await store.updateJobStatus(job.id, newStatus)
      } catch {
        // Revert on failure
        job.status = oldStatus
        await store.fetchJobs()
      }
    }
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
