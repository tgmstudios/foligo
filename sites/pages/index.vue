<template>
  <MarketingLanding v-if="isMarketingHost" />
  <div v-else-if="pending" class="state">Loading portfolio…</div>
  <SiteNotFound v-else-if="error || !siteData" :error="error" />
  <BuilderCanvas v-else-if="siteData.siteConfig?.builderPublished" :document="siteData.siteConfig.builderPublished" :path="route.path" :collections="siteData.content || {}" />
  <PublicPortfolio v-else :site-data="siteData" :route="route" />
</template>

<script setup>
import { computed } from 'vue'
import MarketingLanding from '~/components/MarketingLanding.vue'
import { getDashboardRedirect } from '~/utils/dashboard-routing.js'
import { usePublicSiteHead } from '~/composables/usePublicSiteHead.js'

const route = useRoute()
const runtime = useRuntimeConfig()
const headers = process.server ? useRequestHeaders(['host', 'x-forwarded-host']) : {}
const host = computed(() => (process.client ? window.location.hostname : (headers['x-forwarded-host'] || headers.host || '').split(':')[0]).toLowerCase())
const stagingMarketingHost = (runtime.public.stagingMarketingHost || '').toLowerCase()
const stagingSiteSuffix = (runtime.public.stagingSiteSuffix || '').toLowerCase()
const isMarketingHost = computed(() => ['foligo.org', 'www.foligo.org', 'localhost', '127.0.0.1'].includes(host.value) || (!!stagingMarketingHost && host.value === stagingMarketingHost))
const legacyDashboardRedirect = computed(() => getDashboardRedirect(
  `https://${host.value}${route.fullPath}`,
  runtime.public.dashboardUrl,
))

if (legacyDashboardRedirect.value) {
  await navigateTo(legacyDashboardRedirect.value, { external: true, redirectCode: 308 })
}

const subdomain = computed(() => {
  if (stagingSiteSuffix && host.value.endsWith(stagingSiteSuffix)) return host.value.slice(0, -stagingSiteSuffix.length) || null
  const parts = host.value.split('.')
  return parts.length >= 3 && parts.slice(-2).join('.') === 'foligo.org' ? parts[0] : null
})

const { data: siteData, pending, error } = await useFetch(() => (subdomain.value ? `/api/site/${subdomain.value}` : null), {
  key: () => `public-site-${subdomain.value || 'marketing'}`,
  baseURL: (process.server && runtime.apiInternalUrl) || runtime.public.apiBaseUrl,
  server: true,
  immediate: !isMarketingHost.value
})

usePublicSiteHead(siteData, runtime)
</script>

<style scoped>
.state { min-height: 100vh; display: grid; place-items: center; background: #0d1117; color: #e6edf3; font: 600 1rem system-ui; }
</style>
