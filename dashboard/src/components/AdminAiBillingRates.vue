<template>
  <section class="rounded-lg border border-gray-700 bg-gray-800 p-5 my-6">
    <h2 class="text-lg font-semibold text-white">Model billing rates</h2>
    <p class="text-sm text-gray-400 mt-2">USD per million tokens. Set all four rates for models used with spending limits. Enter zero for a free category. Rates are snapshotted per call, so edits affect future calls only.</p>
    <p v-if="error" role="alert" class="text-red-400 mt-3">{{ error }}</p>
    <div class="overflow-x-auto mt-4"><table class="w-full text-sm text-gray-300 text-left"><thead><tr><th class="p-2">Model</th><th v-for="key in rateKeys" :key="key" class="p-2">{{ labels[key] }}</th><th class="p-2">Actions</th></tr></thead>
      <tbody><tr v-for="model in models" :key="model.id" class="border-t border-gray-700"><td class="p-2 min-w-[8rem]">{{ model.name }}</td><td v-for="key in rateKeys" :key="key" class="p-2"><input v-model="model.rates[key]" type="number" min="0" max="1000000" step="0.000001" :aria-label="`${model.name} ${labels[key]}`" class="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white" placeholder="Unpriced" /></td><td class="p-2"><button :disabled="busy === model.id" class="text-primary-400" @click="save(model)">Save rates</button></td></tr></tbody>
    </table></div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'
const rateKeys = ['input', 'output', 'cacheRead', 'cacheWrite'] as const
const labels = { input: 'Input', output: 'Output (incl. reasoning)', cacheRead: 'Cache read', cacheWrite: 'Cache write' }
const models = ref<any[]>([]); const error = ref(''); const busy = ref(''); const toast = useToast()
async function load() {
  try { const { data } = await api.get('/admin/ai-billing/models'); models.value = data.models.map((model: any) => ({ ...model, rates: Object.fromEntries(rateKeys.map(key => [key, model.billingRates?.[key] ?? ''])) })) }
  catch { error.value = 'Unable to load billing rates' }
}
async function save(model: any) {
  error.value = ''; busy.value = model.id
  try {
    const values = rateKeys.map(key => model.rates[key])
    if (values.some(v => v === '') && !values.every(v => v === '')) throw new Error('Fill all four rates, or clear all to mark the model unpriced.')
    const rates = values.every(v => v === '') ? null : Object.fromEntries(rateKeys.map(key => [key, Number(model.rates[key])]))
    await api.put(`/admin/ai-billing/models/${model.id}/rates`, { rates }); toast.success('Billing rates saved')
  } catch (e: any) { error.value = e.response?.data?.error || e.message || 'Unable to save rates' } finally { busy.value = '' }
}
onMounted(load)
</script>
