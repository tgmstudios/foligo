<template>
  <section class="bg-gray-800 rounded-lg border border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-white">Your AI connections</h3>
    <p class="mt-2 text-sm text-gray-400">Use your own API keys or a supported Codex subscription. Enabled personal connections are preferred automatically. Choose a server model explicitly to use your server allowance.</p>
    <p class="mt-2 text-sm text-gray-400">Personal calls are billed by your provider and do not consume your server allowance. A failed personal call never switches to server billing.</p>
    <p v-if="error" role="alert" class="mt-3 text-red-400">{{ error }}</p>
    <p v-if="loading" class="mt-4 text-gray-400">Loading connections…</p>
    <div v-else class="mt-5 space-y-3">
      <div v-for="connection in connections" :key="connection.id" class="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-700 p-3">
        <div class="min-w-0"><p class="text-white break-all">{{ connection.providerType }} · {{ connection.model }}</p><p class="text-xs text-gray-400">{{ connection.authType === 'subscription' ? 'Subscription linked' : 'API key saved' }} · {{ connection.modelType }} · {{ connection.enabled ? 'Enabled' : 'Disabled' }}</p></div>
        <div class="flex gap-3"><button class="text-primary-400" type="button" :disabled="busy" @click="edit(connection)">Edit</button><button class="text-red-400" type="button" :disabled="busy" @click="remove(connection.providerType)">Disconnect</button></div>
      </div>
      <p v-if="!connections.length" class="text-sm text-gray-400">No personal connections yet.</p>
      <form class="grid gap-4 sm:grid-cols-2 pt-4" @submit.prevent="save">
        <label class="text-sm text-gray-300">Provider<select v-model="form.providerType" class="field" @change="selectProvider"><option v-for="provider in providers" :key="provider.value" :value="provider.value">{{ provider.label }}</option></select></label>
        <label class="text-sm text-gray-300">Model ID<input v-model="form.model" required maxlength="200" class="field" placeholder="Model ID from your provider" /></label>
        <label class="text-sm text-gray-300">API key<input v-model="form.apiKey" type="password" autocomplete="new-password" maxlength="8192" class="field" :placeholder="existing ? 'Leave blank to keep your saved credentials' : 'Your provider API key'" :required="!existing" /></label>
        <label class="text-sm text-gray-300">Task preference<select v-model="form.modelType" class="field"><option value="QUICK">Quick tasks</option><option value="LONG">Long tasks</option></select></label>
        <label class="flex items-center gap-2 text-gray-300 text-sm"><input v-model="form.enabled" type="checkbox" /> Enable personal connection</label>
        <div class="sm:col-span-2"><button :disabled="busy" class="px-4 py-2 bg-primary-600 rounded text-white disabled:opacity-50">{{ busy ? 'Saving…' : 'Save personal connection' }}</button></div>
      </form>
      <div class="border-t border-gray-700 pt-4 space-y-3">
        <h4 class="font-medium text-white">Codex / ChatGPT subscription</h4>
        <p v-if="!codexEnabled" class="text-sm text-gray-400">{{ codexReason }}</p>
        <button v-if="codexEnabled && !login" type="button" :disabled="busy" class="px-4 py-2 bg-white text-black rounded disabled:opacity-50" @click="startLogin">Continue with ChatGPT</button>
        <div v-if="login" class="text-sm text-gray-300 space-y-3" aria-live="polite">
          <p>Open <a :href="login.verificationUrl" target="_blank" rel="noopener noreferrer" class="text-primary-400 underline">ChatGPT sign-in</a> and enter <strong class="font-mono text-white">{{ login.userCode }}</strong>.</p>
          <p>Waiting for approval. This code expires in 15 minutes.</p>
          <button type="button" class="text-gray-300 underline" @click="cancelLogin">Cancel sign-in</button>
        </div>
        <p class="text-sm text-gray-400">{{ claudeReason }}</p>
      </div>
      <div v-if="usage" class="border-t border-gray-700 pt-4 text-sm text-gray-300 space-y-2">
        <h4 class="font-medium text-white">Server allowance this month</h4>
        <p>{{ serverRequests }} provider calls · {{ serverTokens.toLocaleString() }} tokens used or reserved · ${{ serverCost.toFixed(6) }} estimated cost</p>
        <p v-if="usage.policy.unlimited">Unlimited server usage for your granted models.</p>
        <p v-else>Limits: {{ usage.policy.monthlyRequests ?? 'Unlimited' }} calls · {{ usage.policy.monthlyTokens ?? 'Unlimited' }} tokens · {{ usage.policy.monthlyCostUsd == null ? 'Unlimited spend' : '$' + usage.policy.monthlyCostUsd }}</p>
        <p class="text-gray-400">Resets {{ new Date(usage.periodEnd).toLocaleDateString() }} (UTC). Unpriced usage is excluded from the cost total; pending and unknown calls retain estimates.</p>
        <a href="https://chatgpt.com/settings/usage" target="_blank" rel="noopener noreferrer" class="text-primary-400 underline">Manage ChatGPT plan usage</a>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'
interface Connection { id: string; providerType: string; model: string; modelType: string; enabled: boolean; authType: string }
const providers = [{ value: 'openai', label: 'OpenAI' }, { value: 'anthropic', label: 'Claude (Anthropic API)' }, { value: 'gemini', label: 'Google Gemini' }, { value: 'opencode', label: 'OpenCode' }, { value: 'codex', label: 'Codex (OpenAI API)' }]
const toast = useToast()
const connections = ref<Connection[]>([])
const loading = ref(true); const busy = ref(false); const error = ref('')
const codexEnabled = ref(false); const codexReason = ref(''); const claudeReason = ref('')
const usage = ref<any>(null); const login = ref<any>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let disposed = false
let loginGeneration = 0
const form = reactive({ providerType: 'openai', model: '', modelType: 'QUICK', apiKey: '', enabled: true })
const existing = computed(() => connections.value.find(row => row.providerType === form.providerType))
const serverGroups = computed(() => (usage.value?.groups || []).filter((row: any) => row.source === 'SERVER'))
const serverRequests = computed(() => serverGroups.value.reduce((n: number, row: any) => n + row.requests, 0))
const serverTokens = computed(() => serverGroups.value.reduce((n: number, row: any) => n + (row.totalTokens || 0), 0))
const serverCost = computed(() => serverGroups.value.reduce((n: number, row: any) => n + Number(row.costUsd || 0), 0))
const message = (e: any) => e.response?.data?.error || 'Unable to update AI settings'
async function load() {
  try {
    const results = await Promise.allSettled([api.get('/ai/personal/connections'), api.get('/ai/personal/usage')])
    if (results[0].status === 'rejected') throw results[0].reason
    const data = results[0].value.data
    connections.value = data.connections; codexEnabled.value = data.codexLinkEnabled; codexReason.value = data.codexLinkReason; claudeReason.value = data.claudeLinkReason
    if (results[1].status === 'fulfilled') usage.value = results[1].value.data
    else error.value = 'Connections loaded, but usage could not be loaded. Reload to retry.'
  } catch (e) { error.value = message(e) } finally { loading.value = false }
}
function edit(row: Connection) { Object.assign(form, { providerType: row.providerType, model: row.model, modelType: row.modelType, enabled: row.enabled, apiKey: '' }) }
function selectProvider() {
  if (existing.value) edit(existing.value)
  else Object.assign(form, { model: '', apiKey: '', enabled: true, modelType: 'QUICK' })
}
async function save() {
  busy.value = true; error.value = ''
  try { await api.put(`/ai/personal/connections/${form.providerType}`, { model: form.model, modelType: form.modelType, enabled: form.enabled, ...(form.apiKey ? { apiKey: form.apiKey } : {}) }); form.apiKey = ''; await cancelLogin(); await load(); toast.success('Personal AI connection saved') }
  catch (e) { error.value = message(e) } finally { busy.value = false }
}
async function remove(type: string) {
  busy.value = true
  try { await api.delete(`/ai/personal/connections/${type}`); await cancelLogin(); await load(); selectProvider(); toast.success('Personal connection removed') }
  catch (e) { error.value = message(e) } finally { busy.value = false }
}
async function startLogin() {
  busy.value = true; error.value = ''
  try {
    const { data } = await api.post('/ai/personal/codex/start')
    login.value = data
    const generation = ++loginGeneration
    const deadline = Date.now() + data.expiresIn * 1000
    const poll = async () => {
      if (disposed || generation !== loginGeneration) return
      if (Date.now() >= deadline) { login.value = null; error.value = 'Sign-in expired. Start again.'; return }
      try {
        const response = await api.post('/ai/personal/codex/poll')
        if (disposed || generation !== loginGeneration) return
        if (response.data.status === 'authorized') { login.value = null; await load(); toast.success('Codex subscription linked'); return }
        if (response.data.status === 'expired') { login.value = null; error.value = 'Sign-in expired. Start again.'; return }
        timer = setTimeout(poll, Math.max(5, data.interval) * 1000)
      } catch (e) { login.value = null; error.value = message(e) }
    }
    timer = setTimeout(poll, Math.max(5, data.interval) * 1000)
  } catch (e) { error.value = message(e) } finally { busy.value = false }
}
async function cancelLogin() {
  loginGeneration++; clearTimeout(timer); login.value = null
  await api.delete('/ai/personal/codex/login')
}
onMounted(load)
onUnmounted(() => { disposed = true; loginGeneration++; clearTimeout(timer) })
</script>
<style scoped>
.field { @apply mt-2 block w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white; }
</style>
