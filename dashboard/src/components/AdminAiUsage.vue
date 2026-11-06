<template>
  <section class="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
    <h2 class="text-lg font-semibold text-white">Server AI billing and limits</h2>
    <p class="mt-2 text-sm text-gray-400">Limits apply to server-funded models this user has been granted. Personal connections have a separate ledger and no server charge. Calls include retries and tool steps.</p>
    <p v-if="error" class="mt-3 text-red-400" role="alert">{{ error }}</p>
    <form v-if="summary" class="mt-4 space-y-4" @submit.prevent="save">
      <label class="flex items-center gap-2 text-white"><input v-model="policy.unlimited" type="checkbox" /> Unlimited server AI usage</label>
      <fieldset :disabled="policy.unlimited || busy" class="grid gap-4 sm:grid-cols-3 disabled:opacity-50">
        <label class="text-sm text-gray-300">Monthly provider calls<input v-model="policy.monthlyRequests" type="number" min="0" max="2147483647" step="1" class="field" placeholder="Unlimited" /></label>
        <label class="text-sm text-gray-300">Monthly tokens<input v-model="policy.monthlyTokens" type="number" min="0" max="2147483647" step="1" class="field" placeholder="Unlimited" /></label>
        <label class="text-sm text-gray-300">Monthly spend (USD)<input v-model="policy.monthlyCostUsd" type="number" min="0" max="1000000000" step="0.000001" class="field" placeholder="Unlimited" /></label>
      </fieldset>
      <p class="text-xs text-gray-400">Blank means no cap; zero blocks use. Token and spend limits use estimated reservations before dispatch, then reported usage. Actual usage may exceed an estimate, especially for images or provider-managed tools. Unknown calls retain their reservation. Spend caps require billing rates on every model and no unpriced calls in the period.</p>
      <button :disabled="busy" class="bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-50">{{ busy ? 'Saving…' : 'Save allowance' }}</button>
    </form>
    <div class="mt-6 flex flex-wrap gap-3 items-end">
      <label class="text-sm text-gray-300">Billing month (UTC)<input v-model="month" type="month" class="field" @change="load" /></label>
      <button :disabled="loading" class="px-3 py-2 bg-gray-700 text-white rounded disabled:opacity-50" @click="load">Refresh usage</button>
      <button :disabled="exporting || loading || !events.length" class="px-3 py-2 bg-gray-700 text-white rounded disabled:opacity-50" @click="download">{{ exporting ? 'Exporting…' : 'Export month (JSON)' }}</button>
    </div>
    <p v-if="loading" class="mt-4 text-gray-400">Loading usage…</p>
    <div v-else-if="summary" class="overflow-x-auto mt-4">
      <table class="w-full text-sm text-left text-gray-300">
        <thead class="text-gray-400"><tr><th class="p-2">Funding / status</th><th class="p-2">Calls</th><th class="p-2">Input</th><th class="p-2">Output</th><th class="p-2">Used / reserved</th><th class="p-2">Estimated USD</th></tr></thead>
        <tbody><tr v-for="group in summary.groups" :key="`${group.source}:${group.status}`" class="border-t border-gray-700"><td class="p-2">{{ group.source }} / {{ group.status }}</td><td class="p-2">{{ group.requests }}</td><td class="p-2">{{ group.inputTokens || 0 }}</td><td class="p-2">{{ group.outputTokens || 0 }}</td><td class="p-2">{{ group.totalTokens || 0 }}</td><td class="p-2">{{ group.costUsd == null ? 'Unpriced / personal' : '$' + Number(group.costUsd).toFixed(6) }}<span v-if="group.source === 'SERVER' && group.unpricedRequests" class="block text-xs text-yellow-400">{{ group.unpricedRequests }} unpriced calls</span></td></tr></tbody>
      </table>
      <p v-if="!summary.groups.length" class="py-3 text-gray-400">No AI calls in this month.</p>
      <p class="mt-3 text-xs text-gray-400">Costs use the rates saved at request time. Unpriced calls are excluded from sums; see individual events. This is an estimated billing ledger, not an invoice from the provider.</p>
      <h3 class="mt-5 font-medium text-white">Provider call ledger</h3>
      <table class="w-full text-xs text-left text-gray-300 mt-2">
        <thead class="text-gray-400"><tr><th class="p-2">When</th><th class="p-2">Model / funding</th><th class="p-2">Status</th><th class="p-2">Tokens</th><th class="p-2">USD</th></tr></thead>
        <tbody><tr v-for="event in events" :key="event.id" class="border-t border-gray-700"><td class="p-2 whitespace-nowrap">{{ new Date(event.createdAt).toLocaleString() }}</td><td class="p-2 break-all">{{ event.providerType }} / {{ event.model }} · {{ event.source }}</td><td class="p-2">{{ event.status }}</td><td class="p-2">{{ event.totalTokens }}</td><td class="p-2">{{ event.costUsd == null ? 'Unpriced / personal' : '$' + event.costUsd }}</td></tr></tbody>
      </table>
      <div v-if="pages > 1" class="mt-3 flex items-center gap-3 text-gray-300"><button :disabled="page === 1" @click="changePage(-1)">Previous</button><span>Page {{ page }} / {{ pages }}</span><button :disabled="page >= pages" @click="changePage(1)">Next</button></div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'
const props = defineProps<{ userId: string }>()
const toast = useToast(); const error = ref(''); const busy = ref(false); const loading = ref(false); const exporting = ref(false)
const summary = ref<any>(null); const events = ref<any[]>([]); const page = ref(1); const pages = ref(0)
const month = ref(new Date().toISOString().slice(0, 7))
const policy = reactive({ unlimited: true, monthlyRequests: '' as string | number, monthlyTokens: '' as string | number, monthlyCostUsd: '' as string | number })
const base = () => `/admin/ai-billing/users/${props.userId}`
const message = (e: any) => e.response?.data?.error || 'Unable to update AI usage'
async function loadEvents() {
  const { data } = await api.get(`${base()}/events`, { params: { month: month.value, page: page.value } })
  events.value = data.events; pages.value = data.pages
}
async function load() {
  loading.value = true; error.value = ''; page.value = 1
  try {
    const { data } = await api.get(base(), { params: { month: month.value } })
    summary.value = data
    Object.assign(policy, { unlimited: data.policy.unlimited, monthlyRequests: data.policy.monthlyRequests ?? '', monthlyTokens: data.policy.monthlyTokens ?? '', monthlyCostUsd: data.policy.monthlyCostUsd ?? '' })
    await loadEvents()
  } catch (e) { error.value = message(e) } finally { loading.value = false }
}
async function changePage(delta: number) { page.value += delta; try { await loadEvents() } catch (e) { error.value = message(e) } }
async function save() {
  busy.value = true; error.value = ''
  const nullable = (value: string | number) => value === '' ? null : Number(value)
  try {
    await api.put(`${base()}/policy`, { unlimited: policy.unlimited, monthlyRequests: nullable(policy.monthlyRequests), monthlyTokens: nullable(policy.monthlyTokens), monthlyCostUsd: nullable(policy.monthlyCostUsd) })
    toast.success('Server AI allowance saved'); await load()
  } catch (e) { error.value = message(e) } finally { busy.value = false }
}
async function download() {
  exporting.value = true
  try {
    const all: any[] = []
    for (let current = 1; ; current++) {
      const { data } = await api.get(`${base()}/events`, { params: { month: month.value, page: current } })
      all.push(...data.events)
      if (current >= data.pages) break
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify({ month: month.value, userId: props.userId, events: all }, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `ai-usage-${props.userId}-${month.value}.json`; link.click(); URL.revokeObjectURL(url)
  } catch (e) { error.value = message(e) } finally { exporting.value = false }
}
onMounted(load)
</script>
<style scoped>
.field { @apply mt-2 block w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white; }
</style>
