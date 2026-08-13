
<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="close"
  >
    <div class="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="close"></div>

      <form
        @submit.prevent="submit"
        class="inline-block align-middle bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
      >
        <div class="px-6 pt-6 pb-4 border-b border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">New resume</h3>
          <button type="button" @click="close" class="text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
            <input
              v-model="name"
              type="text"
              placeholder="Untitled Resume"
              class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Start from</label>
            <select
              v-model="templateId"
              class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Base template</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">{{ template.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Linked job</label>
            <select
              v-model="jobId"
              class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">No linked job</option>
              <option v-for="job in sortedJobs" :key="job.id" :value="job.id">{{ job.company }} – {{ job.position }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Initial prompt</label>
            <textarea
              v-model="initialPrompt"
              rows="3"
              placeholder="e.g. Pull the linked job and reduce this resume to 2 pages"
              class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
            ></textarea>
            <label class="mt-2 flex items-center space-x-2 text-xs text-gray-400">
              <input v-model="saveAsDefault" type="checkbox" class="rounded border-gray-600 bg-gray-900 text-primary-600 focus:ring-primary-500" />
              <span>Save as default prompt</span>
            </label>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Model</label>
            <select
              v-model="provider"
              class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option :value="undefined">Default</option>
              <option v-for="p in configuredProviders" :key="p.type" :value="p.type">{{ p.displayName }}</option>
            </select>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="creating"
            class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {{ creating ? 'Creating…' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { ResumeDocumentSummary } from '@/composables/useResumeDocuments'
import type { GoApplyJob } from '@/stores/goapply'
import { readPreferenceCookie, writePreferenceCookie } from '@/utils/goapplyJobPreferences'
import api from '@/services/api'

const DEFAULT_PROMPT_KEY = 'goapply-resume-default-prompt'
const DEFAULT_PROMPT_VERSION = 1

const props = defineProps<{
  isOpen: boolean
  documents: ResumeDocumentSummary[]
  jobs: GoApplyJob[]
  creating: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', payload: { name: string; templateId: string; jobId: string; initialPrompt: string; provider?: string }): void
}>()

interface AiProvider {
  type: string
  displayName: string
  configured: boolean
}

const name = ref('')
const templateId = ref('')
const jobId = ref('')
const initialPrompt = ref('')
const saveAsDefault = ref(false)
const provider = ref<string | undefined>(undefined)
const configuredProviders = ref<AiProvider[]>([])

const templates = computed(() => props.documents.filter((doc) => doc.isTemplate))
const sortedJobs = computed(() => [...props.jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))

onMounted(async () => {
  try {
    const response = await api.get('/ai/providers')
    configuredProviders.value = response.data.providers.filter((p: AiProvider) => p.configured)
  } catch {
    // Provider list is a nicety, not required for resume creation — fail silently.
  }
})

watch(() => props.isOpen, (open) => {
  if (!open) return
  name.value = ''
  templateId.value = ''
  jobId.value = ''
  saveAsDefault.value = false
  provider.value = undefined
  initialPrompt.value = readPreferenceCookie<{ prompt: string }>(DEFAULT_PROMPT_KEY, DEFAULT_PROMPT_VERSION)?.prompt || ''
})

function close() {
  emit('close')
}

function submit() {
  if (saveAsDefault.value) {
    writePreferenceCookie(DEFAULT_PROMPT_KEY, DEFAULT_PROMPT_VERSION, { prompt: initialPrompt.value })
  }
  emit('create', {
    name: name.value.trim(),
    templateId: templateId.value,
    jobId: jobId.value,
    initialPrompt: initialPrompt.value.trim(),
    provider: provider.value,
  })
}
</script>
