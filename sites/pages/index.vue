<template>
  <MarketingLanding v-if="isMarketingHost" />
  <div v-else-if="pending" class="state">Loading portfolio…</div>
  <SiteNotFound v-else-if="error || !siteData" :error="error" />
  <PublicPortfolio v-else :site-data="siteData" :route="route" />
</template>

<script setup>
import { computed } from 'vue'
import MarketingLanding from '~/components/MarketingLanding.vue'
import { getDashboardRedirect } from '~/utils/dashboard-routing.js'

const route = useRoute()
const runtime = useRuntimeConfig()
const headers = process.server ? useRequestHeaders(['host', 'x-forwarded-host']) : {}
const host = computed(() => (process.client ? window.location.hostname : (headers['x-forwarded-host'] || headers.host || '').split(':')[0]).toLowerCase())
const isMarketingHost = computed(() => ['foligo.tech', 'www.foligo.tech', 'localhost', '127.0.0.1'].includes(host.value))
const legacyDashboardRedirect = computed(() => getDashboardRedirect(
  `https://${host.value}${route.fullPath}`,
  runtime.public.dashboardUrl,
))

if (legacyDashboardRedirect.value) {
  await navigateTo(legacyDashboardRedirect.value, { external: true, redirectCode: 308 })
}

const subdomain = computed(() => {
  const parts = host.value.split('.')
  return parts.length >= 3 && parts.slice(-2).join('.') === 'foligo.tech' ? parts[0] : null
})

const { data: siteData, pending, error } = await useFetch(() => (subdomain.value ? `/api/site/${subdomain.value}` : null), {
  key: () => `public-site-${subdomain.value || 'marketing'}`,
  baseURL: runtime.public.apiBaseUrl,
  server: true,
  immediate: !isMarketingHost.value
})

useHead(() => (siteData.value ? {
  title: siteData.value.siteConfig?.metaTitle || siteData.value.project?.name || 'Portfolio',
  meta: [
    { name: 'description', content: siteData.value.siteConfig?.metaDescription || siteData.value.project?.description || '' },
    { name: 'theme-color', content: siteData.value.siteConfig?.primaryColor || '#3B82F6' }
  ],
  link: siteData.value.siteConfig?.favicon ? [{ rel: 'icon', href: siteData.value.siteConfig.favicon }] : []
} : {}))
</script>

<style scoped>
.state { min-height: 100vh; display: grid; place-items: center; background: #0d1117; color: #e6edf3; font: 600 1rem system-ui; }
</style>
