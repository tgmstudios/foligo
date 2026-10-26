<template>
  <div v-if="pending" class="state">Loading…</div>
  <SiteNotFound v-else-if="error || !siteData" :error="error" />
  <PublicPortfolio v-else :site-data="siteData" :route="route" />
</template>

<script setup>
import { useSubdomain } from '~/composables/useSubdomain'
import { usePublicSiteHead } from '~/composables/usePublicSiteHead.js'

const route = useRoute()
const runtime = useRuntimeConfig()
const { extractSubdomain } = useSubdomain()

const { data: siteData, pending, error } = await useFetch(() => {
  const subdomain = extractSubdomain()
  if (!subdomain) {
    throw createError({ statusCode: 404, statusMessage: 'Invalid subdomain' })
  }
  return `/api/site/${subdomain}`
}, {
  key: 'public-site',
  baseURL: runtime.public.apiBaseUrl,
  server: true
})

usePublicSiteHead(siteData, runtime)
</script>

<style scoped>
.state { min-height: 100vh; display: grid; place-items: center; background: #0d1117; color: #e6edf3; font: 600 1rem system-ui; }
</style>
