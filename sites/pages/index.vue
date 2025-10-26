<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-300">Loading site...</p>
      </div>
    </div>

    <!-- Error State -->
    <SiteNotFound v-else-if="error" :error="error" />

    <!-- Site Content -->
    <div v-else-if="siteData" class="min-h-screen" :style="siteStyles">

      <!-- Layout Switch -->
      <PortfolioLayout 
        v-if="layoutComponent === 'PortfolioLayout'"
        :site-data="siteData"
      />
      <DefaultLayout 
        v-else-if="layoutComponent === 'DefaultLayout'"
        :site-data="siteData"
        :route="route"
      />
      <GridLayout 
        v-else-if="layoutComponent === 'GridLayout'"
        :site-data="siteData"
        :route="route"
      />
      <ListLayout 
        v-else-if="layoutComponent === 'ListLayout'"
        :site-data="siteData"
        :route="route"
      />
      <MasonryLayout 
        v-else-if="layoutComponent === 'MasonryLayout'"
        :site-data="siteData"
        :route="route"
      />
      <div v-else class="min-h-screen bg-slate-900 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-white mb-4">Layout Error</h1>
          <p class="text-slate-300">Unknown layout component: {{ layoutComponent }}</p>
        </div>
      </div>
    </div>

    <!-- Fallback State -->
    <div v-else class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-white mb-4">No Site Data</h1>
        <p class="text-slate-300">Unable to load site data.</p>
        <button @click="loadSiteData" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Retry
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watchEffect } from 'vue'
import { siteApi } from '~/utils/siteApi'
import { useSubdomain } from '~/composables/useSubdomain'

// Get the current route and hostname
const route = useRoute()
const config = useRuntimeConfig()
const { extractSubdomain } = useSubdomain()

// Debug variables
const isDev = process.dev || process.env.NODE_ENV === 'development'
const hostname = ref('')
const subdomain = ref('')

// Extract subdomain from hostname
const getSubdomain = () => {
  let host = ''
  
  if (process.client) {
    host = window.location.hostname
  } else if (process.server) {
    const headers = useRequestHeaders()
    host = headers.host || headers['x-forwarded-host'] || ''
  }
  
  hostname.value = host
  console.log('Extracting subdomain from hostname:', host)
  
  if (!host) {
    console.log('No hostname found')
    return null
  }
  
  // Development fallback - if we're on localhost, use 'test' as subdomain
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('localhost')) {
    console.log('Development mode detected, using test subdomain')
    subdomain.value = 'test'
    return 'test'
  }
  
  const extracted = extractSubdomain()
  subdomain.value = extracted
  console.log('Subdomain extraction result:', { host, extracted })
  return extracted
}

// Apply dark mode to HTML element
useHead({
  htmlAttrs: {
    class: 'dark'
  }
})

// Fetch site data based on subdomain
const { data: siteData, pending, error, refresh } = await useFetch(() => {
  const extractedSubdomain = getSubdomain()
  console.log('Building API URL with subdomain:', extractedSubdomain)
  
  if (!extractedSubdomain) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid subdomain'
    })
  }
  
  const url = `/api/site/${extractedSubdomain}`
  console.log('Final API URL:', url)
  return url
}, {
  key: 'site-data',
  baseURL: config.public.apiBaseUrl,
  server: true,
  transform: (data) => data,
  onRequestError({ request, error }) {
    console.error('Request error:', error)
  },
  onResponseError({ response }) {
    console.error('Response error:', response.status, response.statusText)
  }
})

// Update meta tags when siteData is available
watchEffect(() => {
  if (siteData.value) {
    useHead({
      title: siteData.value.siteConfig?.metaTitle || siteData.value.project?.name || 'Portfolio',
      meta: [
        { name: 'description', content: siteData.value.siteConfig?.metaDescription || siteData.value.project?.description || '' },
        { name: 'theme-color', content: siteData.value.siteConfig?.primaryColor || '#3B82F6' }
      ],
      link: siteData.value.siteConfig?.favicon ? [{ rel: 'icon', href: siteData.value.siteConfig.favicon }] : []
    })
  }
})

// Dynamic styles based on site config
const siteStyles = computed(() => {
  if (!siteData.value?.siteConfig) return {}
  
  const config = siteData.value.siteConfig
  return {
    '--primary-color': config.primaryColor,
    '--secondary-color': config.secondaryColor,
    '--accent-color': config.accentColor,
    '--background-color': config.backgroundColor,
    '--text-color': config.textColor,
    backgroundColor: config.backgroundColor,
    color: config.textColor
  }
})

// Layout component based on site config
const layoutComponent = computed(() => {
  if (!siteData.value?.siteConfig) {
    return 'DefaultLayout'
  }
  
  const config = siteData.value.siteConfig
  const content = siteData.value.content
  
  // Check if there's any content
  const hasContent = content?.projects?.length || content?.blogs?.length || content?.experiences?.length || content?.other?.length
  
  // If no content, use DefaultLayout for better empty state handling
  if (!hasContent) {
    return 'DefaultLayout'
  }
  
  // Home page layout - default to PortfolioLayout for better UX
  switch (config.indexLayout) {
    case 'portfolio':
      return 'PortfolioLayout'
    case 'grid':
      return 'GridLayout'
    case 'list':
      return 'ListLayout'
    case 'masonry':
      return 'MasonryLayout'
    default:
      return 'PortfolioLayout' // Default to portfolio layout
  }
})

// Manual retry function
const loadSiteData = () => {
  refresh()
}

// Handle client-side navigation
onMounted(() => {
  if (process.client) {
    console.log('Component mounted, refreshing data...')
    // Refresh data when navigating to different subdomains
    const handleRouteChange = () => {
      console.log('Route changed, refreshing data...')
      refresh()
    }
    
    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange)
    
    // Cleanup
    onUnmounted(() => {
      window.removeEventListener('popstate', handleRouteChange)
    })
  }
})
</script>

<style>
:root {
  --primary-color: #3B82F6;
  --secondary-color: #1E40AF;
  --accent-color: #F59E0B;
  --background-color: #FFFFFF;
  --text-color: #1F2937;
}

/* Dynamic CSS variables will be applied via the computed siteStyles */
</style>
