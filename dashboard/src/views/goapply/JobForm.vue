<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60" @click="$emit('close')"></div>

    <!-- Modal -->
    <div class="relative bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-white">
          {{ job ? 'Edit Job' : 'Add Job' }}
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Company -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Company *</label>
          <input
            v-model="form.company"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Google"
          />
        </div>

        <!-- Position -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Position *</label>
          <input
            v-model="form.position"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Senior Frontend Developer"
          />
        </div>

        <!-- URL -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Job Posting URL</label>
          <input
            v-model="form.url"
            type="url"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://..."
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select
            v-model="form.status"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option v-for="s in JOB_STATUSES" :key="s" :value="s">
              {{ STATUS_LABELS[s] }}
            </option>
          </select>
        </div>

        <!-- Applied At -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Applied Date</label>
          <input
            v-model="form.appliedAt"
            type="date"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Notes</label>
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Any notes about this job..."
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="store.isSaving"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {{ store.isSaving ? 'Saving...' : job ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useGoApplyStore, JOB_STATUSES, STATUS_LABELS, type GoApplyJob, type JobFormData } from '@/stores/goapply'

const props = defineProps<{
  job: GoApplyJob | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const store = useGoApplyStore()

const form = reactive<JobFormData>({
  company: props.job?.company || '',
  position: props.job?.position || '',
  url: props.job?.url || '',
  notes: props.job?.notes || '',
  status: props.job?.status || 'saved',
  appliedAt: props.job?.appliedAt
    ? new Date(props.job.appliedAt).toISOString().split('T')[0]
    : '',
})

async function handleSubmit() {
  try {
    if (props.job) {
      await store.updateJob(props.job.id, { ...form })
    } else {
      await store.createJob({ ...form })
    }
    emit('saved')
  } catch {
    // Error already handled by store
  }
}
</script>
