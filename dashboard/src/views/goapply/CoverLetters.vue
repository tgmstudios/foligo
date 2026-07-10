<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-gray-400 text-sm">AI-generated cover letters for your job applications</p>
      </div>
      <button
        @click="showGenerateForm = true"
        class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        + Generate Letter
      </button>
    </div>

    <!-- Generate Form Modal -->
    <div v-if="showGenerateForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" @click="showGenerateForm = false"></div>
      <div class="relative bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg p-6 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">Generate Cover Letter</h2>
          <button @click="showGenerateForm = false" class="text-gray-400 hover:text-white">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleGenerate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Select Job (optional)</label>
            <select
              v-model="generateJobId"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">— None —</option>
              <option v-for="job in store.jobs" :key="job.id" :value="job.id">
                {{ job.company }} — {{ job.position }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Or paste job description</label>
            <textarea
              v-model="generateJobDescription"
              rows="4"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Paste the job description here..."
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showGenerateForm = false" class="px-4 py-2 text-sm text-gray-300 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              :disabled="store.isGenerating"
              class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ store.isGenerating ? 'Generating...' : 'Generate' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Letters List -->
    <div v-if="store.coverLetters.length === 0 && !store.isLoading" class="text-center py-12 text-gray-400">
      <p>No cover letters yet.</p>
      <button @click="showGenerateForm = true" class="mt-2 text-primary-400 hover:underline text-sm">
        Generate your first cover letter
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="letter in store.coverLetters"
        :key="letter.id"
        class="card p-4"
      >
        <div class="flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-medium text-white mb-1">
              {{ letter.title || 'Cover Letter' }}
              <span v-if="letter.company" class="text-gray-400 font-normal">
                — {{ letter.company }}
              </span>
              <span v-if="letter.position" class="text-gray-500 text-xs">
                ({{ letter.position }})
              </span>
            </h4>
            <p class="text-sm text-gray-400 line-clamp-3 whitespace-pre-line">{{ letter.content }}</p>
            <p class="text-xs text-gray-500 mt-1">
              Created {{ formatTimeAgo(letter.createdAt) }}
            </p>
          </div>
          <div class="flex items-center gap-1 ml-4">
            <button
              @click="viewLetter = letter"
              class="p-1 text-gray-400 hover:text-white transition-colors"
              title="View"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              @click="handleDelete(letter.id)"
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

    <!-- View Letter Modal -->
    <div v-if="viewLetter" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" @click="viewLetter = null"></div>
      <div class="relative bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">
            {{ viewLetter.title || 'Cover Letter' }}
          </h2>
          <button @click="viewLetter = null" class="text-gray-400 hover:text-white">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="viewLetter.company" class="text-sm text-gray-400 mb-3">
          {{ viewLetter.company }}{{ viewLetter.position ? ` — ${viewLetter.position}` : '' }}
        </div>

        <div class="prose prose-invert max-w-none">
          <pre class="text-sm text-gray-200 whitespace-pre-wrap font-sans">{{ viewLetter.content }}</pre>
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            @click="copyContent(viewLetter.content)"
            class="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
          >
            Copy to Clipboard
          </button>
          <button
            @click="viewLetter = null"
            class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGoApplyStore, type CoverLetter } from '@/stores/goapply'
import { useToast } from 'vue-toastification'
import { formatDistanceToNow } from 'date-fns'

const store = useGoApplyStore()
const toast = useToast()

const showGenerateForm = ref(false)
const generateJobId = ref('')
const generateJobDescription = ref('')
const viewLetter = ref<CoverLetter | null>(null)

async function handleGenerate() {
  try {
    await store.generateCoverLetter(
      generateJobId.value || undefined,
      generateJobDescription.value || undefined
    )
    showGenerateForm.value = false
    generateJobId.value = ''
    generateJobDescription.value = ''
  } catch {
    // handled by store
  }
}

async function handleDelete(id: string) {
  if (confirm('Delete this cover letter?')) {
    await store.deleteCoverLetter(id)
  }
}

function copyContent(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Copied to clipboard')
  }).catch(() => {
    toast.error('Failed to copy')
  })
}

function formatTimeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}
</script>
