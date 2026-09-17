<template>
  <MarketingLanding v-if="isMarketingHost" />

  <div v-else>
    <div v-if="pending" class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-300">Loading site...</p>
      </div>
    </div>

    <SiteNotFound v-else-if="error" :error="error" />

    <div v-else-if="siteData" class="min-h-screen" :style="siteStyles">
      <UnifiedLayout :site-data="siteData" :route="route" />
    </div>

    <div v-else class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-white mb-4">No Site Data</h1>
        <p class="text-slate-300">Unable to load site data.</p>
        <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" @click="refresh">
          Retry
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MarketingLanding from '~/components/MarketingLanding.vue'

const route = useRoute()
const config = useRuntimeConfig()
const requestHeaders = process.server ? useRequestHeaders(['host', 'x-forwarded-host']) : {}
const host = computed(() => process.client
  ? window.location.hostname
  : (requestHeaders['x-forwarded-host'] || requestHeaders.host || '').split(':')[0])
const isMarketingHost = computed(() => {
  const currentHost = host.value.toLowerCase()
  return currentHost === 'foligo.tech' || currentHost === 'www.foligo.tech' || currentHost === 'localhost' || currentHost === '127.0.0.1'
})

const portfolioSubdomain = computed(() => {
  const parts = host.value.toLowerCase().split('.')
  return parts.length >= 3 && parts.slice(-2).join('.') === 'foligo.tech' ? parts[0] : null
})

const { data: siteData, pending, error, refresh } = await useFetch(() => {
  if (!portfolioSubdomain.value) {
    return null
  }
  return `/api/site/${portfolioSubdomain.value}`
}, {
  key: () => `site-data-${portfolioSubdomain.value || 'marketing'}`,
  baseURL: config.public.apiBaseUrl,
  server: true,
  immediate: !isMarketingHost.value
})

useHead(() => siteData.value ? {
  title: siteData.value.siteConfig?.metaTitle || siteData.value.project?.name || 'Portfolio',
  meta: [
    { name: 'description', content: siteData.value.siteConfig?.metaDescription || siteData.value.project?.description || '' },
    { name: 'theme-color', content: siteData.value.siteConfig?.primaryColor || '#3B82F6' }
  ],
  link: siteData.value.siteConfig?.favicon ? [{ rel: 'icon', href: siteData.value.siteConfig.favicon }] : []
} : {})

const siteStyles = computed(() => {
  const siteConfig = siteData.value?.siteConfig
  if (!siteConfig) return {}
  return {
    '--primary-color': siteConfig.primaryColor,
    '--secondary-color': siteConfig.secondaryColor,
    '--accent-color': siteConfig.accentColor,
    '--background-color': siteConfig.backgroundColor,
    '--text-color': siteConfig.textColor,
    backgroundColor: siteConfig.backgroundColor,
    color: siteConfig.textColor
  }
})
</script>
