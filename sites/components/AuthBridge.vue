<template>
  <main class="bridge-page">
    <section class="bridge-card" :aria-labelledby="`${mode}-title`">
      <NuxtLink class="brand" to="/" aria-label="Foligo home"><span>f.</span>foligo</NuxtLink>
      <p class="eyebrow">Foligo workspace</p>
      <h1 :id="`${mode}-title`">{{ mode === 'signup' ? 'Create your Foligo account' : 'Continue to Foligo' }}</h1>
      <p>{{ mode === 'signup' ? 'Opening the secure workspace where you can start building.' : 'Opening the secure workspace where your projects live.' }}</p>
      <a class="button" :href="destination">{{ mode === 'signup' ? 'Create an account' : 'Log in' }} <span aria-hidden="true">→</span></a>
      <p class="fallback">If you are not redirected, <a :href="destination">continue to your workspace</a>.</p>
      <noscript><p class="noscript">JavaScript is off. Use the link above to continue.</p></noscript>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted } from 'vue'
const props = defineProps({ mode: { type: String, required: true } })
const config = useRuntimeConfig()
const route = useRoute()
const dashboardUrl = computed(() => process.server
  ? process.env.DASHBOARD_URL || config.public.dashboardUrl
  : window.ENV?.DASHBOARD_URL || config.public.dashboardUrl)
const destination = computed(() => {
  const base = dashboardUrl.value.replace(/\/$/, '')
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(route.query)) {
    if (Array.isArray(value)) value.forEach(item => params.append(key, item))
    else if (value != null) params.append(key, value)
  }
  const query = params.toString()
  return `${base}/${props.mode === 'signup' ? 'signup' : 'login'}${query ? `?${query}` : ''}`
})
onMounted(() => { window.location.replace(destination.value) })
useHead(() => ({ title: props.mode === 'signup' ? 'Create your account — Foligo' : 'Log in — Foligo', meta: [{ name: 'robots', content: 'noindex' }] }))
</script>

<style scoped>
.bridge-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:#111019;color:#f2eee6;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.bridge-card{width:min(100%,520px);padding:42px;background:#1d1a27;border:1px solid rgba(242,238,230,.16);box-shadow:14px 14px 0 rgba(170,140,255,.22)}.brand{display:inline-block;color:#f2eee6;text-decoration:none;font-weight:850;font-size:1.35rem;letter-spacing:-.08em}.brand span{color:#d6ff61;font-style:italic}.eyebrow{margin:48px 0 12px;color:#d6ff61;font-size:.68rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.bridge-card h1{font-size:clamp(2.25rem,6vw,3.6rem);line-height:.96;letter-spacing:-.075em;margin:0}.bridge-card>p:not(.eyebrow):not(.fallback):not(.noscript){color:#c1bacb;line-height:1.55;margin:18px 0 28px}.button{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 20px;background:#d6ff61;color:#191722;font-weight:800;text-decoration:none;border:1px solid #d6ff61}.button:hover{background:#ebffad}.fallback,.noscript{color:#aca6b4;font-size:.8rem;line-height:1.5;margin:22px 0 0}.fallback a{color:#d6ff61}.button:focus-visible,.brand:focus-visible,.fallback a:focus-visible{outline:3px solid #d6ff61;outline-offset:4px}@media (max-width:540px){.bridge-card{padding:30px 24px}}
</style>
