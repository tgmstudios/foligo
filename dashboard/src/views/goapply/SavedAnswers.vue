<template>
  <div>
    <!-- Header + Add Button -->
    <div class="flex items-center justify-between mb-4">
      <p class="text-gray-400 text-sm">Reusable Q&A pairs for job applications</p>
      <button
        @click="openForm()"
        class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        + Add Answer
      </button>
    </div>

    <!-- List -->
    <div v-if="store.answers.length === 0 && !store.isLoading" class="text-center py-12 text-gray-400">
      <p>No saved answers yet.</p>
      <button @click="openForm()" class="mt-2 text-primary-400 hover:underline text-sm">
        Add your first Q&A pair
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="answer in store.answers"
        :key="answer.id"
        class="card p-4"
      >
        <div class="flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="text-sm font-medium text-white">{{ answer.question }}</h4>
              <span
                v-if="answer.category"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300"
              >
                {{ answer.category }}
              </span>
            </div>
            <p class="text-sm text-gray-400 line-clamp-2">{{ answer.answer }}</p>
            <div v-if="answer.jobs?.length" class="mt-2 flex flex-wrap gap-1.5">
              <LinkedJobBadge v-for="job in answer.jobs" :key="job.id" :company="job.company" :position="job.position" />
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Updated {{ formatTimeAgo(answer.updatedAt) }}
            </p>
          </div>
          <div class="flex items-center gap-1 ml-4">
            <button
              @click="openForm(answer)"
              class="p-1 text-gray-400 hover:text-white transition-colors"
              title="Edit"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="handleDelete(answer.id)"
              class="p-1 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Answer Form Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" @click="showForm = false"></div>
      <div class="relative bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-white mb-4">
          {{ editingAnswer ? 'Edit Answer' : 'New Answer' }}
        </h2>

        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Question *</label>
            <input
              v-model="form.question"
              type="text"
              required
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Tell me about yourself"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <input
              v-model="form.category"
              type="text"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., behavioral, technical"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Answer *</label>
            <textarea
              v-model="form.answer"
              rows="6"
              required
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Your answer..."
            ></textarea>
          </div>

          <div>
            <div class="mb-1 flex items-center justify-between">
              <label class="block text-sm font-medium text-gray-300">Attach to jobs</label>
              <button v-if="form.jobIds.length" type="button" class="text-xs text-gray-400 hover:text-white" @click="form.jobIds = []">Clear</button>
            </div>
            <p class="mb-2 text-xs text-gray-500">Optional. Select every application where this Q&amp;A is relevant.</p>
            <div v-if="store.jobs.length" class="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-gray-600 bg-gray-900/40 p-2">
              <label v-for="job in store.jobs" :key="job.id" class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-gray-700/60">
                <input v-model="form.jobIds" type="checkbox" :value="job.id" class="mt-0.5 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500" />
                <span class="min-w-0 text-sm text-gray-300"><span class="font-medium text-white">{{ job.position }}</span> at {{ job.company }}</span>
              </label>
            </div>
            <p v-else class="rounded-lg border border-dashed border-gray-600 p-3 text-center text-xs text-gray-500">Create a job first to attach this answer.</p>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showForm = false" class="px-4 py-2 text-sm text-gray-300 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              :disabled="store.isSaving"
              class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ store.isSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useGoApplyStore, type SavedAnswer } from '@/stores/goapply'
import { formatDistanceToNow } from 'date-fns'
import LinkedJobBadge from '@/components/goapply/LinkedJobBadge.vue'

const store = useGoApplyStore()

const showForm = ref(false)
const editingAnswer = ref<SavedAnswer | null>(null)

const form = reactive({
  question: '',
  answer: '',
  category: '',
  jobIds: [] as string[],
})

function openForm(answer?: SavedAnswer) {
  if (answer) {
    editingAnswer.value = answer
    form.question = answer.question
    form.answer = answer.answer
    form.category = answer.category || ''
    form.jobIds = answer.jobs?.map((job) => job.id) || []
  } else {
    editingAnswer.value = null
    form.question = ''
    form.answer = ''
    form.category = ''
    form.jobIds = []
  }
  showForm.value = true
}

async function handleSave() {
  try {
    if (editingAnswer.value) {
      await store.updateAnswer(editingAnswer.value.id, { ...form })
    } else {
      await store.createAnswer({ ...form })
    }
    showForm.value = false
  } catch {
    // handled by store
  }
}

async function handleDelete(id: string) {
  if (confirm('Delete this answer?')) {
    await store.deleteAnswer(id)
  }
}

function formatTimeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}
</script>
