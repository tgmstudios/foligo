<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Platform Settings</h1>
      <p class="text-gray-400 mt-1">Configure platform-level integrations and services</p>
    </div>

    <div class="space-y-6 max-w-2xl">
      <!-- SearXNG Configuration -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-2">Web Search (SearXNG)</h3>
        <p class="text-gray-400 text-sm mb-4">
          Powers the <code class="text-blue-400 bg-gray-700 px-1 rounded">web_search</code> tool available to all AI agents
          (cover letter editor, resume editor, job assistant, content editor, and extension agent).
          Agents use this to look up current information, documentation, and examples.
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              SearXNG Instance URL
              <span v-if="envUrl" class="text-gray-500 ml-1">(default from environment)</span>
            </label>
            <div class="flex gap-3">
              <input
                v-model="searxngUrl"
                type="url"
                :placeholder="envUrl || 'https://search.tgm.one'"
                class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                :class="{ 'border-yellow-600': savedUrl && savedUrl !== searxngUrl }"
              />
              <button
                v-if="searxngUrl"
                @click="testConnection"
                :disabled="isTesting"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {{ isTesting ? 'Testing...' : 'Test' }}
              </button>
            </div>
            <p v-if="envUrl && !savedUrl" class="text-gray-500 text-xs mt-1">
              Using environment default. Save a value here to override it.
            </p>
            <p v-if="testResult" :class="testResult.ok ? 'text-green-400' : 'text-red-400'" class="text-sm mt-2">
              {{ testResult.ok ? `Connected (${testResult.latency}ms, ${testResult.count} results)` : testResult.error }}
            </p>
          </div>

          <div class="flex justify-between items-center">
            <button
              v-if="fromEnv && savedUrl !== searxngUrl"
              @click="resetToEnv"
              class="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Reset to environment default
            </button>
            <span v-else></span>
            <button
              @click="saveSettings"
              :disabled="isSaving || !searxngUrl || searxngUrl === savedUrl"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="bg-gray-800/50 rounded-lg border border-gray-700/50 p-6">
        <h3 class="text-sm font-medium text-gray-400 mb-2">About Web Search</h3>
        <div class="text-sm text-gray-500 space-y-2">
          <p>The <code class="text-gray-400">web_search</code> tool queries SearXNG, a privacy-respecting metasearch
          engine, to give agents access to current web information. Results are blended from multiple engines
          (Google, DuckDuckGo, Wikipedia, etc.) with relevance scoring.</p>
          <p>This is the same SearXNG instance used by the Hermes AI assistant for general web research.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()
const isSaving = ref(false)
const isTesting = ref(false)
const searxngUrl = ref('')
const envUrl = ref('')
const savedUrl = ref('')
const fromEnv = ref(true)
const testResult = ref<{ ok: boolean; latency?: number; count?: number; error?: string } | null>(null)

const fetchSettings = async () => {
  try {
    const { data } = await api.get('/admin/settings')
    savedUrl.value = data.searxng_url || ''
    fromEnv.value = !savedUrl.value
    searxngUrl.value = savedUrl.value || ''

    // Try to detect env default from the API response metadata, or infer from saved
    if (!savedUrl.value && data.searxng_url !== undefined) {
      // API returned empty — check if there's an env var hint
    }
  } catch (error: any) {
    console.error('Failed to fetch settings:', error)
    toast.error('Failed to load settings')
  }
}

const saveSettings = async () => {
  try {
    isSaving.value = true
    await api.put('/admin/settings', { searxng_url: searxngUrl.value })
    savedUrl.value = searxngUrl.value
    fromEnv.value = false
    toast.success('SearXNG URL saved')
  } catch (error: any) {
    console.error('Failed to save settings:', error)
    toast.error(error.response?.data?.error || 'Failed to save settings')
  } finally {
    isSaving.value = false
  }
}

const testConnection = async () => {
  try {
    isTesting.value = true
    testResult.value = null
    const { data } = await api.post('/admin/settings/test', { url: searxngUrl.value })
    testResult.value = data
  } catch (error: any) {
    testResult.value = { ok: false, error: error.response?.data?.error || error.message }
  } finally {
    isTesting.value = false
  }
}

const resetToEnv = async () => {
  searxngUrl.value = ''
  await saveSettings()
  fromEnv.value = true
  testResult.value = null
}

onMounted(() => {
  fetchSettings()
})
</script>
