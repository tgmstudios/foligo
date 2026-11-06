<template>
  <div v-if="pending" class="state">Loading…</div>
  <SiteNotFound v-else-if="error || !siteData" :error="error" />
  <BuilderCanvas v-else-if="siteData.siteConfig?.builderPublished" :document="siteData.siteConfig.builderPublished" :path="route.path" :collections="siteData.content || {}" />
  <PublicPortfolio v-else :site-data="siteData" :route="route" />
</template>

<script setup>
import { resolveBuilderContent } from '~/utils/builder-content.mjs'
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
  baseURL: (process.server && runtime.apiInternalUrl) || runtime.public.apiBaseUrl,
  server: true
})

const published = siteData.value?.siteConfig?.builderPublished
if (published && !resolveBuilderContent(published, route.path, siteData.value.content || {})) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

usePublicSiteHead(siteData, runtime)
</script>

<style scoped>
.state { min-height: 100vh; display: grid; place-items: center; background: #0d1117; color: #e6edf3; font: 600 1rem system-ui; }
</style>
