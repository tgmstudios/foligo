<template>
  <div>
    <div v-if="store.isLoading && store.jobs.length === 0" class="text-center py-12 text-gray-400">
      Loading board...
    </div>

    <div v-else class="flex gap-4 overflow-x-auto pb-4" style="min-height: 60vh">
      <div
        v-for="column in store.kanbanColumns"
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
          :class="{ 'bg-gray-800/80 border-primary-500': isDragOver }"
          @change="(evt: any) => handleChange(evt, column.status)"
          @end="handleDragEnd"
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
import { ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useGoApplyStore, type JobStatus, type GoApplyJob } from '@/stores/goapply'
import { format } from 'date-fns'

const store = useGoApplyStore()
const isDragOver = ref(false)

function formatDate(dateString: string) {
  return format(new Date(dateString), 'MMM d, yyyy')
}

async function handleChange(evt: any, newStatus: JobStatus) {
  // evt contains info about what was moved: { added, removed, moved }
  if (evt.added) {
    const job: GoApplyJob = evt.added.element
    if (job.status !== newStatus) {
      try {
        await store.updateJobStatus(job.id, newStatus)
      } catch {
        // Revert will happen via store state — the local array is reactive but
        // we need to force refresh since the PUT failed
        await store.fetchJobs()
      }
    }
  }
}

function handleDragEnd() {
  isDragOver.value = false
}
</script>
