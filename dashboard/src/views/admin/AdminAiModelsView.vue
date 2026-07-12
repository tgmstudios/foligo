<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">AI Models</h1>
        <p class="text-gray-400 mt-1">Quick models power chats and interviews. Long models power final content generation.</p>
      </div>
      <button class="btn-primary" @click="openCreate">Add model</button>
    </div>

    <div v-if="loading" class="text-gray-400">Loading models…</div>
    <div v-else class="grid md:grid-cols-2 gap-6">
      <section v-for="type in modelTypes" :key="type" class="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 class="text-lg font-semibold text-white mb-1">{{ type === 'QUICK' ? 'Quick models' : 'Long models' }}</h2>
        <p class="text-xs text-gray-400 mb-4">Default: {{ defaultName(type) }}</p>
        <div v-if="modelsFor(type).length === 0" class="text-sm text-gray-500 py-6 text-center">No models configured</div>
        <div v-for="item in modelsFor(type)" :key="item.id" class="border border-gray-700 rounded-lg p-4 mb-3 last:mb-0">
          <div class="flex justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium text-white">{{ item.name }}</span>
                <span v-if="item.isDefault" class="text-xs bg-primary-900 text-primary-300 px-2 py-0.5 rounded">Default</span>
                <span v-if="!item.enabled" class="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">Disabled</span>
              </div>
              <p class="text-xs text-gray-400 mt-1">{{ item.providerType }} · {{ item.model }}</p>
              <p v-if="item.endpoint" class="text-xs text-gray-500 truncate max-w-sm">{{ item.endpoint }}</p>
            </div>
            <div class="flex gap-2 text-sm">
              <button class="p-1.5 text-primary-400 hover:text-primary-300" title="Test model" aria-label="Test model" @click="testModel(item)"><ListActionIcon name="test"></ListActionIcon></button>
              <button class="p-1.5 text-gray-300 hover:text-white" title="Edit model" aria-label="Edit model" @click="openEdit(item)"><ListActionIcon name="edit"></ListActionIcon></button>
              <button class="p-1.5 text-red-400 hover:text-red-300" title="Delete model" aria-label="Delete model" @click="remove(item)"><ListActionIcon name="delete"></ListActionIcon></button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="mt-6 bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div><h2 class="text-lg font-semibold text-white">Voice</h2><p class="text-xs text-gray-400 mt-1">ElevenLabs powers voice interviews in the AI content generator.</p></div>
        <span :class="voice.enabled ? 'bg-green-600' : 'bg-gray-600'" class="px-2 py-1 text-xs font-medium text-white rounded">{{ voice.enabled ? 'Enabled' : 'Disabled' }}</span>
      </div>
      <form class="grid md:grid-cols-2 gap-4" @submit.prevent="saveVoice">
        <label class="field">Provider<input value="ElevenLabs" disabled class="input opacity-60" /></label>
        <label class="field">Agent ID<input v-model="voice.agentId" required class="input" placeholder="agent_..." /></label>
        <label class="field">Voice ID (optional)<input v-model="voice.voiceId" class="input" placeholder="ElevenLabs voice ID" /></label>
        <label class="field">Model ID (optional)<input v-model="voice.modelId" class="input" placeholder="eleven_turbo_v2_5" /></label>
        <label class="field md:col-span-2">API key<input v-model="voice.apiKey" type="password" class="input" :placeholder="voice.hasApiKey ? 'Leave blank to keep existing key' : 'ElevenLabs API key'" /></label>
        <div class="md:col-span-2 flex items-center justify-between pt-1">
          <label class="text-sm text-gray-300"><input v-model="voice.enabled" type="checkbox" class="mr-2" />Enable voice interviews</label>
          <button class="btn-primary" :disabled="savingVoice">{{ savingVoice ? 'Saving…' : 'Save voice settings' }}</button>
        </div>
      </form>
    </section>

    <div v-if="showForm" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="closeForm">
      <form class="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" @submit.prevent="save">
        <h2 class="text-xl font-semibold text-white mb-5">{{ editing ? 'Edit model' : 'Add model' }}</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <label class="field">Display name<input v-model="form.name" required class="input" placeholder="OpenCode Go DeepSeek Flash" /></label>
          <label class="field">Slug<input v-model="form.slug" required pattern="[a-z0-9-]+" class="input" placeholder="opencode-deepseek-flash" /></label>
          <label class="field">Provider<select v-model="form.providerType" class="input"><option v-for="p in providerTypes" :key="p" :value="p">{{ p }}</option></select></label>
          <label class="field">Model type<select v-model="form.modelType" class="input"><option value="QUICK">Quick</option><option value="LONG">Long</option></select></label>
          <label class="field md:col-span-2">Provider model ID<input v-model="form.model" required class="input" placeholder="deepseek-chat" /></label>
          <label class="field md:col-span-2">Endpoint<input v-model="form.endpoint" class="input" placeholder="http://127.0.0.1:8080/v1" /></label>
          <label class="field md:col-span-2">API key<input v-model="form.apiKey" type="password" class="input" :placeholder="editing?.hasApiKey ? 'Leave blank to keep existing key' : 'Optional'" /></label>
          <label class="field md:col-span-2">Headers (JSON)<textarea v-model="headersText" rows="3" class="input" placeholder='{"X-API-Key":"..."}' /></label>
        </div>
        <div class="flex gap-6 mt-4 text-sm text-gray-300">
          <label><input v-model="form.enabled" type="checkbox" class="mr-2" />Enabled</label>
          <label><input v-model="form.isDefault" type="checkbox" class="mr-2" />Default for {{ form.modelType.toLowerCase() }} tasks</label>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button type="button" class="btn-secondary" @click="closeForm">Cancel</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save model' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import ListActionIcon from '@/components/common/ListActionIcon.vue'
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

type ModelType = 'QUICK' | 'LONG'
interface AiModel { id: string; name: string; slug: string; providerType: string; model: string; endpoint?: string; headers?: Record<string,string>; modelType: ModelType; enabled: boolean; isDefault: boolean; hasApiKey?: boolean }
interface VoiceConfig { name: string; agentId: string; voiceId: string; modelId: string; apiKey: string; enabled: boolean; hasApiKey: boolean }
const empty = (): Omit<AiModel, 'id'> & { apiKey: string } => ({ name: '', slug: '', providerType: 'opencode', model: '', endpoint: '', headers: {}, modelType: 'QUICK', enabled: true, isDefault: false, apiKey: '' })
const toast = useToast()
const models = ref<AiModel[]>([])
const loading = ref(true), saving = ref(false), showForm = ref(false)
const savingVoice = ref(false)
const voice = ref<VoiceConfig>({ name: 'ElevenLabs', agentId: '', voiceId: '', modelId: '', apiKey: '', enabled: false, hasApiKey: false })
const editing = ref<AiModel | null>(null)
const form = ref(empty())
const headersText = ref('')
const modelTypes: ModelType[] = ['QUICK', 'LONG']
const providerTypes = ['gemini', 'openai', 'opencode', 'ollama', 'anthropic', 'custom']
const modelsFor = (type: ModelType) => models.value.filter(m => m.modelType === type)
const defaultName = (type: ModelType) => modelsFor(type).find(m => m.isDefault && m.enabled)?.name || 'First enabled model'
async function load() {
  loading.value = true
  try {
    const [modelsResponse, voiceResponse] = await Promise.all([api.get('/admin/ai-models'), api.get('/admin/ai-models/voice/elevenlabs')])
    models.value = modelsResponse.data
    if (voiceResponse.data) voice.value = { ...voice.value, ...voiceResponse.data, apiKey: '' }
  } finally { loading.value = false }
}
function openCreate() { editing.value = null; form.value = empty(); headersText.value = ''; showForm.value = true }
function openEdit(item: AiModel) { editing.value = item; form.value = { ...item, apiKey: '', headers: item.headers || {} }; headersText.value = item.headers ? JSON.stringify(item.headers, null, 2) : ''; showForm.value = true }
function closeForm() { showForm.value = false }
async function save() {
  saving.value = true
  try {
    const payload = { ...form.value, headers: headersText.value.trim() ? JSON.parse(headersText.value) : {} }
    if (editing.value) await api.put(`/admin/ai-models/${editing.value.id}`, payload); else await api.post('/admin/ai-models', payload)
    toast.success('AI model saved'); closeForm(); await load()
  } catch (error: any) { toast.error(error.response?.data?.message || error.message || 'Failed to save model') } finally { saving.value = false }
}
async function remove(item: AiModel) { if (!confirm(`Delete "${item.name}"?`)) return; await api.delete(`/admin/ai-models/${item.id}`); toast.success('AI model deleted'); await load() }
async function testModel(item: AiModel) { const result = (await api.post(`/admin/ai-models/${item.id}/test`)).data; result.ok ? toast.success(`Connected in ${result.latency}ms`) : toast.error(result.error || 'Connection failed') }
async function saveVoice() {
  savingVoice.value = true
  try {
    const response = await api.put('/admin/ai-models/voice/elevenlabs', voice.value)
    voice.value = { ...voice.value, ...response.data, apiKey: '' }
    toast.success('Voice settings saved')
  } catch (error: any) { toast.error(error.response?.data?.message || 'Failed to save voice settings') } finally { savingVoice.value = false }
}
onMounted(load)
</script>

<style scoped>
.field { @apply text-sm text-gray-300 flex flex-col gap-1; }
.input { @apply w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-primary-500 focus:outline-none; }
.btn-primary { @apply rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50; }
.btn-secondary { @apply rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600; }
</style>
