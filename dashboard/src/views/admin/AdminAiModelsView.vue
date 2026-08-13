<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">AI Providers</h1>
      <p class="text-gray-400 mt-1 text-sm">Quick models power chats and interviews. Long models power final content generation.</p>
    </div>

    <section class="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-sm">
      <div class="flex flex-wrap gap-x-8 gap-y-2">
        <div v-for="type in modelTypes" :key="type" class="flex items-center gap-2">
          <span class="text-gray-400">{{ type === 'QUICK' ? 'Quick default' : 'Long default' }}:</span>
          <span class="text-white font-medium">{{ defaultName(type) }}</span>
          <span v-if="fallbackCount(type)" class="text-xs text-gray-500">+{{ fallbackCount(type) }} fallback{{ fallbackCount(type) === 1 ? '' : 's' }}</span>
        </div>
      </div>
      <button class="btn-secondary text-xs shrink-0" @click="openDefaultsForm">Configure</button>
    </section>

    <div v-if="loading" class="text-gray-400">Loading providers…</div>
    <div v-else class="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700">
      <div v-for="type in providerTypes" :key="type" class="flex items-center justify-between gap-3 p-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-medium text-white">{{ providerLabel(type) }}</span>
            <span v-if="!isProviderEnabled(type)" class="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">Disabled</span>
            <span v-else-if="isProviderConfiguredUi(type)" class="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Configured</span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">{{ providerHint(type) }}</p>
        </div>
        <button class="btn-secondary text-xs shrink-0" @click="openProviderEdit(type)">Edit</button>
      </div>
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
        <h2 class="text-xl font-semibold text-white mb-5">Edit model</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <label class="field">Provider<select v-model="form.providerType" class="input" @change="onProviderTypeChange"><option v-for="p in providerTypes" :key="p" :value="p">{{ providerLabel(p) }}</option></select></label>
          <label class="field">Model type<select v-model="form.modelType" class="input"><option value="QUICK">Quick</option><option value="LONG">Long</option></select></label>
          <label class="field md:col-span-2">Provider model ID<input v-model="form.model" required class="input" placeholder="deepseek-chat" /></label>
          <label class="field">Display name (optional)<input v-model="form.name" class="input" :placeholder="`${providerLabel(form.providerType)} ${form.model || '...'}`" /></label>
          <label class="field">Slug (optional)<input v-model="form.slug" pattern="[a-z0-9-]*" class="input" placeholder="auto-generated" /></label>
        </div>

        <p class="text-xs text-gray-500 mt-4">
          Endpoint, API key and headers are optional here — they override this model's provider-wide connection
          details (set once via that provider's <strong>Edit</strong> button) just for this model.
        </p>
        <div class="grid md:grid-cols-2 gap-4 mt-2">
          <label class="field md:col-span-2">Endpoint<input v-model="form.endpoint" class="input" placeholder="Uses the provider's configured endpoint" /></label>
          <label class="field md:col-span-2">API key<input v-model="form.apiKey" type="password" class="input" :placeholder="editing?.hasApiKey ? 'Leave blank to keep existing key' : 'Uses the provider\'s configured key'" /></label>
          <label class="field md:col-span-2">Headers (JSON)<textarea v-model="headersText" rows="3" class="input" placeholder='{"X-API-Key":"..."}' /></label>
        </div>

        <div class="mt-5">
          <span class="text-sm text-gray-300 font-medium">Capabilities</span>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-300 mt-2">
            <label v-for="cap in capabilityKeys" :key="cap" class="flex items-center">
              <input type="checkbox" class="mr-2" :checked="!!form.capabilities[cap]" @change="setCapability(cap, ($event.target as HTMLInputElement).checked)" />{{ capabilityLabel(cap) }}
            </label>
          </div>
          <label class="field mt-3 max-w-xs">Max output tokens
            <input type="number" min="256" step="256" class="input" :value="form.capabilities.maxTokens ?? ''"
              @input="setCapability('maxTokens', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)" />
          </label>
        </div>

        <div class="flex gap-6 mt-5 text-sm text-gray-300">
          <label><input v-model="form.enabled" type="checkbox" class="mr-2" />Enabled</label>
          <label><input v-model="form.isDefault" type="checkbox" class="mr-2" />Default for {{ form.modelType.toLowerCase() }} tasks</label>
        </div>
        <div class="flex justify-between items-center mt-6">
          <div class="flex gap-4">
            <button type="button" class="text-xs text-primary-400 hover:text-primary-300" @click="testModel(editing!)">Test connection</button>
            <button type="button" class="text-xs text-red-400 hover:text-red-300" @click="removeAndClose">Delete model</button>
          </div>
          <div class="flex gap-3">
            <button type="button" class="btn-secondary" @click="closeForm">Cancel</button>
            <button class="btn-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save model' }}</button>
          </div>
        </div>
      </form>
    </div>

    <div v-if="showProviderForm" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="closeProviderForm">
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-white">{{ providerLabel(providerForm.providerType) }}</h2>
          <label class="flex items-center gap-1.5 text-xs text-gray-300">
            <input v-model="providerForm.enabled" type="checkbox" @change="saveProviderConfig" />
            Enabled
          </label>
        </div>

        <details class="mb-3 text-xs" :open="providerForm.providerType === 'codex'">
          <summary class="text-gray-400 cursor-pointer select-none hover:text-gray-300">Connection settings</summary>
          <div class="grid gap-2 mt-2">
            <label class="field text-xs">Endpoint / base URL<input v-model="providerForm.endpoint" class="input" placeholder="http://127.0.0.1:8080/v1" /></label>

            <div v-if="providerForm.providerType === 'codex'" class="field text-xs">
              <span>ChatGPT sign-in</span>
              <div v-if="isCodexConnected() && codexAuth.status !== 'pending'" class="flex items-center justify-between gap-2 mt-1">
                <span class="text-green-400">Signed in with ChatGPT</span>
                <button type="button" class="btn-secondary text-xs" @click="startCodexSignIn">Sign in again</button>
              </div>
              <div v-else-if="codexAuth.status === 'pending'" class="mt-1 space-y-1.5">
                <p class="text-gray-300">Open <a :href="codexAuth.verificationUrl" target="_blank" rel="noopener noreferrer" class="text-primary-400 underline">{{ codexAuth.verificationUrl }}</a> and enter this code:</p>
                <p class="text-base font-mono text-white tracking-widest">{{ codexAuth.userCode }}</p>
                <div class="flex items-center gap-3">
                  <span class="text-gray-500">Waiting for approval…</span>
                  <button type="button" class="text-red-400 hover:text-red-300" @click="cancelCodexSignIn">Cancel</button>
                </div>
              </div>
              <div v-else class="mt-1">
                <button type="button" class="btn-secondary text-xs" @click="startCodexSignIn">Sign in with ChatGPT</button>
                <p v-if="codexAuth.status === 'error'" class="text-red-400 mt-1">{{ codexAuth.error }}</p>
              </div>
            </div>
            <label v-else class="field text-xs">API key<input v-model="providerForm.apiKey" type="password" class="input" :placeholder="providerForm.hasApiKey ? 'Leave blank to keep existing key' : 'Optional'" /></label>

            <label class="field text-xs">Headers (JSON)<textarea v-model="providerHeadersText" rows="2" class="input" placeholder='{"X-API-Key":"..."}' /></label>
            <button type="button" class="btn-secondary text-xs self-start" :disabled="savingProvider" @click="saveProviderConfig">{{ savingProvider ? 'Saving…' : 'Save connection' }}</button>
          </div>
        </details>

        <div class="border-t border-gray-700 pt-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-400 font-medium">Models</span>
            <button type="button" class="text-xs text-primary-400 hover:text-primary-300" :disabled="discoveringCatalog" @click="refreshCatalog">{{ discoveringCatalog ? 'Refreshing…' : 'Refresh' }}</button>
          </div>
          <p v-if="catalogError" class="text-xs text-red-400 mb-2">{{ catalogError }}</p>
          <div v-if="!catalog.length" class="text-xs text-gray-500 py-3 text-center">No models found</div>
          <div v-else class="max-h-56 overflow-y-auto">
            <div v-for="entry in catalog" :key="entry.id" class="flex items-center gap-2 text-sm text-gray-300 py-1">
              <input type="checkbox" :checked="isCatalogModelEnabled(entry.id)" @change="toggleCatalogModel(entry)" />
              <span
                class="truncate flex-1"
                :class="findCatalogRecord(entry.id) ? 'cursor-pointer hover:text-white hover:underline' : ''"
                @click="editCatalogModel(entry.id)"
              >{{ entry.id }}<span v-if="entry.name && entry.name !== entry.id" class="text-gray-500"> — {{ entry.name }}</span></span>
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <input v-model="newModelId" class="input text-xs" placeholder="Add model ID…" @keyup.enter="addCatalogModel" />
            <button type="button" class="btn-secondary text-xs shrink-0" @click="addCatalogModel">Add</button>
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <button type="button" class="btn-secondary text-sm" @click="closeProviderForm">Close</button>
        </div>
      </div>
    </div>

    <div v-if="showDefaultsForm" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="closeDefaultsForm">
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <h2 class="text-lg font-semibold text-white mb-1">Default models &amp; fallbacks</h2>
        <p class="text-xs text-gray-500 mb-4">Pick the primary model for each task type, plus up to 3 fallbacks tried in order if earlier ones are unavailable.</p>

        <div v-for="type in modelTypes" :key="type" class="mb-5 last:mb-0">
          <h3 class="text-sm font-medium text-gray-300 mb-2">{{ type === 'QUICK' ? 'Quick tasks' : 'Long tasks' }}</h3>
          <div class="grid gap-2">
            <label v-for="(_, idx) in defaultsForm[type]" :key="idx" class="field text-xs">
              {{ idx === 0 ? 'Primary' : `Fallback ${idx}` }}
              <select class="input" v-model="defaultsForm[type][idx]">
                <option value="">— none —</option>
                <option v-for="m in defaultsModelOptions(type, idx)" :key="m.id" :value="m.id">
                  {{ m.name }} — {{ providerLabel(m.providerType) }} ({{ m.modelType }})
                </option>
              </select>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-4">
          <button type="button" class="btn-secondary" @click="closeDefaultsForm">Cancel</button>
          <button class="btn-primary" :disabled="savingDefaults" @click="saveDefaults">{{ savingDefaults ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

type ModelType = 'QUICK' | 'LONG'
interface ModelCapabilities { streaming?: boolean; tools?: boolean; vision?: boolean; json?: boolean; reasoning?: boolean; maxTokens?: number }
interface AiModel { id: string; name: string; slug: string; providerType: string; model: string; endpoint?: string; headers?: Record<string,string>; capabilities?: ModelCapabilities; modelType: ModelType; enabled: boolean; isDefault: boolean; hasApiKey?: boolean }
interface VoiceConfig { name: string; agentId: string; voiceId: string; modelId: string; apiKey: string; enabled: boolean; hasApiKey: boolean }
interface DiscoveredModel { id: string; name?: string; ownedBy?: string; capabilities?: ModelCapabilities }
interface ProviderConfig { id: string | null; providerType: string; endpoint: string | null; headers?: Record<string,string>; enabled: boolean; hasApiKey: boolean; oauthConnected?: boolean; knownModels?: string[] }

const providerTypes = ['gemini', 'openai', 'opencode', 'codex', 'ollama', 'anthropic', 'custom']
const capabilityKeys: Array<keyof ModelCapabilities> = ['streaming', 'tools', 'vision', 'json', 'reasoning']
const providerLabels: Record<string, string> = { gemini: 'Gemini', openai: 'OpenAI', opencode: 'OpenCode Go', codex: 'Codex', ollama: 'Ollama', anthropic: 'Anthropic', custom: 'Custom' }
const providerHints: Record<string, string> = {
  gemini: 'Google Gemini API',
  openai: 'OpenAI API',
  opencode: 'Self-hosted via `opencode serve`, OpenAI-compatible',
  codex: 'Sign in with your ChatGPT Plus/Pro/Team subscription',
  ollama: 'Local Ollama server, OpenAI-compatible',
  anthropic: 'Anthropic Claude API',
  custom: 'Any OpenAI-compatible endpoint',
}

function providerLabel(type: string) { return providerLabels[type] || type }
function providerHint(type: string) { return providerHints[type] || '' }
function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function defaultCapabilities(providerType: string): ModelCapabilities {
  if (providerType === 'gemini') return { streaming: true, tools: true, vision: true, json: true, reasoning: false, maxTokens: 4096 }
  if (providerType === 'anthropic') return { streaming: true, tools: true, vision: true, json: false, reasoning: false, maxTokens: 4096 }
  return { streaming: true, tools: true, vision: providerType !== 'ollama', json: true, reasoning: providerType === 'codex', maxTokens: 8192 }
}

type ModelForm = Omit<AiModel, 'id' | 'capabilities'> & { apiKey: string; capabilities: ModelCapabilities }
const empty = (): ModelForm => ({
  name: '', slug: '', providerType: 'opencode', model: '', endpoint: '', headers: {},
  capabilities: defaultCapabilities('opencode'), modelType: 'QUICK', enabled: true, isDefault: false, apiKey: '',
})

const toast = useToast()
const models = ref<AiModel[]>([])
const loading = ref(true), saving = ref(false), showForm = ref(false)
const savingVoice = ref(false)
const voice = ref<VoiceConfig>({ name: 'ElevenLabs', agentId: '', voiceId: '', modelId: '', apiKey: '', enabled: false, hasApiKey: false })
const editing = ref<AiModel | null>(null)
const form = ref(empty())
const headersText = ref('')
const modelTypes: ModelType[] = ['QUICK', 'LONG']
let capabilitiesTouched = false

const providerConfigs = ref<ProviderConfig[]>([])
const showProviderForm = ref(false)
const savingProvider = ref(false)
const providerHeadersText = ref('')
const providerForm = ref<{ providerType: string; endpoint: string; apiKey: string; enabled: boolean; hasApiKey: boolean }>({
  providerType: 'opencode', endpoint: '', apiKey: '', enabled: true, hasApiKey: false,
})
const catalog = ref<DiscoveredModel[]>([])
const discoveringCatalog = ref(false)
const catalogError = ref('')
const newModelId = ref('')

interface CodexAuthState { status: 'idle' | 'pending' | 'authorized' | 'error'; userCode?: string; verificationUrl?: string; error?: string }
const codexAuth = ref<CodexAuthState>({ status: 'idle' })
let codexPollTimer: ReturnType<typeof setTimeout> | null = null

const modelDefaults = ref<Record<ModelType, string[]>>({ QUICK: [], LONG: [] })
const showDefaultsForm = ref(false)
const savingDefaults = ref(false)
const defaultsForm = ref<Record<ModelType, string[]>>({ QUICK: ['', '', '', ''], LONG: ['', '', '', ''] })

const modelsForProvider = (type: string) => models.value.filter(m => m.providerType === type)
const defaultName = (type: ModelType) => {
  const primaryId = modelDefaults.value[type]?.[0]
  const primary = primaryId ? models.value.find(m => m.id === primaryId && m.enabled) : undefined
  return primary?.name || models.value.find(m => m.modelType === type && m.isDefault && m.enabled)?.name || 'First enabled model'
}
const fallbackCount = (type: ModelType) => Math.max(0, (modelDefaults.value[type]?.length || 0) - 1)
const providerConfigFor = (type: string) => providerConfigs.value.find(p => p.providerType === type)
const isCodexConnected = () => !!providerConfigFor('codex')?.oauthConnected
const allModelIds = (type: string): string[] => {
  const configured = modelsForProvider(type).map(m => m.model)
  const known = providerConfigFor(type)?.knownModels || []
  return Array.from(new Set([...configured, ...known])).sort()
}
const isProviderEnabled = (type: string) => providerConfigFor(type)?.enabled !== false
const isProviderConfiguredUi = (type: string) => { const c = providerConfigFor(type); return !!(c && (c.hasApiKey || c.endpoint)) }

function capabilityLabel(key: string) {
  return { streaming: 'Streaming', tools: 'Tools', vision: 'Vision', json: 'JSON mode', reasoning: 'Reasoning' }[key] || key
}

function setCapability(key: keyof ModelCapabilities, value: boolean | number | undefined) {
  capabilitiesTouched = true
  form.value.capabilities = { ...form.value.capabilities, [key]: value }
}
function onProviderTypeChange() {
  if (!capabilitiesTouched) form.value.capabilities = defaultCapabilities(form.value.providerType)
}

async function load() {
  loading.value = true
  try {
    const [modelsResponse, voiceResponse, providersResponse, defaultsResponse] = await Promise.all([
      api.get('/admin/ai-models'), api.get('/admin/ai-models/voice/elevenlabs'),
      api.get('/admin/ai-models/providers'), api.get('/admin/ai-models/defaults'),
    ])
    models.value = modelsResponse.data
    if (voiceResponse.data) voice.value = { ...voice.value, ...voiceResponse.data, apiKey: '' }
    providerConfigs.value = providersResponse.data
    modelDefaults.value = defaultsResponse.data
  } finally { loading.value = false }
}
async function loadProviders() {
  providerConfigs.value = (await api.get('/admin/ai-models/providers')).data
}

function defaultsModelOptions(type: ModelType, idx: number) {
  const chosenElsewhere = new Set(defaultsForm.value[type].filter((id, i) => i !== idx && id))
  return models.value.filter(m => m.enabled && !chosenElsewhere.has(m.id))
}
function openDefaultsForm() {
  const padTo4 = (ids: string[]) => { const out = [...ids]; while (out.length < 4) out.push(''); return out.slice(0, 4) }
  defaultsForm.value = { QUICK: padTo4(modelDefaults.value.QUICK || []), LONG: padTo4(modelDefaults.value.LONG || []) }
  showDefaultsForm.value = true
}
function closeDefaultsForm() { showDefaultsForm.value = false }
async function saveDefaults() {
  savingDefaults.value = true
  try {
    for (const type of modelTypes) {
      const order = defaultsForm.value[type].filter(Boolean)
      await api.put(`/admin/ai-models/defaults/${type}`, { order })
    }
    modelDefaults.value = { QUICK: defaultsForm.value.QUICK.filter(Boolean), LONG: defaultsForm.value.LONG.filter(Boolean) }
    toast.success('Defaults saved')
    closeDefaultsForm()
    await load()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to save defaults')
  } finally { savingDefaults.value = false }
}
function openEdit(item: AiModel) {
  editing.value = item
  form.value = { ...item, apiKey: '', headers: item.headers || {}, capabilities: item.capabilities ? { ...item.capabilities } : defaultCapabilities(item.providerType) }
  headersText.value = item.headers ? JSON.stringify(item.headers, null, 2) : ''
  capabilitiesTouched = true
  showForm.value = true
}
function closeForm() { showForm.value = false }
async function save() {
  saving.value = true
  try {
    const name = form.value.name.trim() || `${providerLabel(form.value.providerType)} ${form.value.model}`
    const slug = form.value.slug.trim() || slugify(`${form.value.providerType}-${form.value.model}`)
    const payload = { ...form.value, name, slug, headers: headersText.value.trim() ? JSON.parse(headersText.value) : {} }
    if (editing.value) await api.put(`/admin/ai-models/${editing.value.id}`, payload); else await api.post('/admin/ai-models', payload)
    toast.success('AI model saved'); closeForm(); await load()
  } catch (error: any) { toast.error(error.response?.data?.message || error.message || 'Failed to save model') } finally { saving.value = false }
}
async function remove(item: AiModel) { if (!confirm(`Delete "${item.name}"?`)) return; await api.delete(`/admin/ai-models/${item.id}`); toast.success('AI model deleted'); await load() }
async function removeAndClose() {
  if (!editing.value) return
  await remove(editing.value)
  closeForm()
}
async function testModel(item: AiModel) { const result = (await api.post(`/admin/ai-models/${item.id}/test`)).data; result.ok ? toast.success(`Connected in ${result.latency}ms`) : toast.error(result.error || 'Connection failed') }

async function refreshModels() {
  models.value = (await api.get('/admin/ai-models')).data
}
async function refreshCatalog() {
  const type = providerForm.value.providerType
  catalog.value = allModelIds(type).map(id => ({ id }))
  discoveringCatalog.value = true
  catalogError.value = ''
  try {
    const response = await api.post('/admin/ai-models/discover', { providerType: type })
    const discovered: DiscoveredModel[] = response.data.models || []
    const merged = [...catalog.value]
    for (const entry of discovered) {
      const idx = merged.findIndex(e => e.id === entry.id)
      if (idx === -1) merged.push(entry); else merged[idx] = { ...merged[idx], ...entry }
    }
    catalog.value = merged.sort((a, b) => a.id.localeCompare(b.id))
  } catch (error: any) {
    catalogError.value = error.response?.data?.message || 'Could not fetch models — showing configured models only.'
  } finally { discoveringCatalog.value = false }
}
async function openProviderEdit(type: string) {
  const existing = providerConfigFor(type)
  providerForm.value = { providerType: type, endpoint: existing?.endpoint || '', apiKey: '', enabled: existing?.enabled !== false, hasApiKey: existing?.hasApiKey || false }
  providerHeadersText.value = existing?.headers && Object.keys(existing.headers).length ? JSON.stringify(existing.headers, null, 2) : ''
  catalogError.value = ''
  newModelId.value = ''
  codexAuth.value = { status: 'idle' }
  showProviderForm.value = true
  await refreshCatalog()
}
function closeProviderForm() {
  showProviderForm.value = false
  stopCodexPolling()
}

async function startCodexSignIn() {
  stopCodexPolling()
  try {
    const response = await api.post('/admin/ai-models/providers/codex/device-auth/start')
    const { userCode, verificationUrl, interval } = response.data
    codexAuth.value = { status: 'pending', userCode, verificationUrl }
    schedulePollCodexSignIn(interval || 5)
  } catch (error: any) {
    codexAuth.value = { status: 'error', error: error.response?.data?.message || 'Failed to start ChatGPT sign-in' }
  }
}
function schedulePollCodexSignIn(intervalSec: number) {
  codexPollTimer = setTimeout(async () => {
    try {
      const response = await api.post('/admin/ai-models/providers/codex/device-auth/poll')
      if (response.data.status === 'authorized') {
        codexAuth.value = { status: 'authorized' }
        toast.success('Signed in with ChatGPT')
        await loadProviders()
      } else {
        schedulePollCodexSignIn(intervalSec)
      }
    } catch (error: any) {
      codexAuth.value = { status: 'error', error: error.response?.data?.message || 'ChatGPT sign-in failed or expired' }
    }
  }, intervalSec * 1000)
}
function stopCodexPolling() {
  if (codexPollTimer) { clearTimeout(codexPollTimer); codexPollTimer = null }
}
function cancelCodexSignIn() {
  stopCodexPolling()
  codexAuth.value = { status: 'idle' }
  api.delete('/admin/ai-models/providers/codex/device-auth').catch(() => {})
}
async function saveProviderConfig() {
  savingProvider.value = true
  try {
    const headers = providerHeadersText.value.trim() ? JSON.parse(providerHeadersText.value) : {}
    await api.put(`/admin/ai-models/providers/${providerForm.value.providerType}`, {
      endpoint: providerForm.value.endpoint || undefined,
      apiKey: providerForm.value.apiKey || undefined,
      headers,
      enabled: providerForm.value.enabled,
    })
    await loadProviders()
  } catch (error: any) { toast.error(error.response?.data?.message || 'Failed to save provider settings') } finally { savingProvider.value = false }
}
function findCatalogRecord(modelId: string) {
  const type = providerForm.value.providerType
  return models.value.find(m => m.providerType === type && m.model === modelId)
}
function isCatalogModelEnabled(modelId: string) {
  return !!findCatalogRecord(modelId)?.enabled
}
async function toggleCatalogModel(entry: DiscoveredModel) {
  const type = providerForm.value.providerType
  const record = findCatalogRecord(entry.id)
  try {
    if (record) {
      await api.put(`/admin/ai-models/${record.id}`, { ...record, apiKey: '', headers: record.headers || {}, capabilities: record.capabilities || {}, enabled: !record.enabled })
    } else {
      await api.post('/admin/ai-models', {
        name: `${providerLabel(type)} ${entry.name || entry.id}`,
        slug: slugify(`${type}-${entry.id}`),
        providerType: type,
        model: entry.id,
        modelType: 'QUICK',
        enabled: true,
        isDefault: false,
        headers: {},
        capabilities: entry.capabilities && Object.keys(entry.capabilities).length ? entry.capabilities : defaultCapabilities(type),
      })
    }
    await refreshModels()
  } catch (error: any) { toast.error(error.response?.data?.message || 'Failed to update model') }
}
function addCatalogModel() {
  const id = newModelId.value.trim()
  if (!id) return
  let entry = catalog.value.find(e => e.id === id)
  if (!entry) {
    entry = { id }
    catalog.value = [...catalog.value, entry].sort((a, b) => a.id.localeCompare(b.id))
  }
  newModelId.value = ''
  if (!findCatalogRecord(id)) toggleCatalogModel(entry)
}
function editCatalogModel(modelId: string) {
  const record = findCatalogRecord(modelId)
  if (!record) return
  closeProviderForm()
  openEdit(record)
}

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
