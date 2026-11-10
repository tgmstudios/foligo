<template>
  <section v-if="state?.enabled || error" class="bg-gray-800 rounded-lg border border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-white">Plan &amp; billing</h3>
    <p v-if="error" role="alert" class="mt-3 text-red-400">{{ error }}</p>
    <p v-if="loading" class="mt-4 text-gray-400">Loading plans…</p>
    <div v-else-if="state" class="mt-4 space-y-4">
      <p v-if="current" class="text-sm text-gray-300">
        Current plan: <strong class="text-white">{{ current.name }}</strong> ({{ state.subscription.status }})
        <span v-if="state.subscription.cancelAtPeriodEnd"> · ends {{ date(state.subscription.currentPeriodEnd) }}</span>
        <span v-else-if="state.subscription.currentPeriodEnd"> · renews {{ date(state.subscription.currentPeriodEnd) }}</span>
      </p>
      <p v-else class="text-sm text-gray-400">You are not subscribed to a paid plan.</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <div v-for="plan in state.plans" :key="plan.key" class="rounded border border-gray-700 p-4">
          <p class="font-medium text-white">{{ plan.name }}</p>
          <ul class="mt-2 text-sm text-gray-400 space-y-1">
            <li>{{ plan.monthlyRequests ?? 'Unlimited' }} server AI calls / month</li>
            <li>{{ plan.monthlyTokens == null ? 'Unlimited' : plan.monthlyTokens.toLocaleString() }} tokens / month</li>
            <li>{{ plan.monthlyCostUsd == null ? 'No spend cap' : '$' + plan.monthlyCostUsd + ' estimated spend cap' }}</li>
          </ul>
          <button v-if="!subscribed" type="button" :disabled="busy" class="mt-3 px-4 py-2 bg-primary-600 rounded text-white disabled:opacity-50" @click="checkout(plan.key)">Subscribe</button>
          <p v-else-if="plan.key === state.subscription.planKey" class="mt-3 text-sm text-green-400">Your plan</p>
        </div>
      </div>
      <button v-if="state.subscription" type="button" :disabled="busy" class="px-4 py-2 bg-gray-700 rounded text-white disabled:opacity-50" @click="portal">Manage subscription &amp; invoices</button>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'
import { createCheckoutAttemptStore } from './checkoutAttempt.js'
const checkoutAttempts = createCheckoutAttemptStore()
const state = ref<any>(null)
const loading = ref(true); const busy = ref(false); const error = ref('')
const subscribed = computed(() => ['active', 'trialing', 'past_due'].includes(state.value?.subscription?.status))
const current = computed(() => subscribed.value ? state.value.plans.find((plan: any) => plan.key === state.value.subscription.planKey) || { name: state.value.subscription.planKey } : null)
const date = (value: string) => new Date(value).toLocaleDateString()
const message = (e: any) => e.response?.data?.error || 'Billing request failed'
async function load() {
  try { state.value = (await api.get('/billing/plans')).data } catch (e) { error.value = message(e) } finally { loading.value = false }
}
async function redirect(path: string, body?: object, onSuccess?: () => void, onFailure?: (e: any) => void) {
  busy.value = true; error.value = ''
  try {
    const url = (await api.post(path, body)).data.url
    onSuccess?.()
    window.location.assign(url)
  } catch (e) {
    onFailure?.(e)
    error.value = message(e); busy.value = false
  }
}
const checkout = (planKey: string) => {
  const attemptId = checkoutAttempts.get(planKey)
  return redirect('/billing/checkout', { planKey, attemptId },
    () => checkoutAttempts.clear(planKey),
    (e) => { if ([409, 410].includes(e.response?.status)) checkoutAttempts.clear(planKey) },
  )
}
const portal = () => redirect('/billing/portal')
onMounted(load)
</script>
