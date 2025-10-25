<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading site...</p>
      </div>
    </div>

    <!-- Error State -->
    <SiteNotFound v-else-if="error" :error="error" />

    <!-- Site Content -->
    <div v-else-if="siteData" class="min-h-screen" :style="siteStyles">
      <!-- Dynamic Head -->
      <Head>
        <Title>{{ siteData.siteConfig.metaTitle || siteData.project.name }}</Title>
        <Meta name="description" :content="siteData.siteConfig.metaDescription || siteData.project.description" />
        <Meta name="theme-color" :content="siteData.siteConfig.primaryColor" />
        <Link v-if="siteData.siteConfig.favicon" rel="icon" :href="siteData.siteConfig.favicon" />
      </Head>

      <!-- Layout Switch -->
      <component 
        :is="layoutComponent" 
        :site-data="siteData"
        :route="route"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { siteApi } from '~/utils/siteApi'
import { useSubdomain } from '~/composables/useSubdomain'

// Get the current route and hostname
const route = useRoute()
const config = useRuntimeConfig()
const { extractSubdomain } = useSubdomain()

// Extract subdomain from hostname
const getSubdomain = () => {
  let host = ''
  
  if (process.client) {
    host = window.location.hostname
  } else if (process.server) {
    const headers = useRequestHeaders()
    host = headers.host || headers['x-forwarded-host'] || ''
  }
  
  console.log('Server-side subdomain extraction:', { host, extracted: extractSubdomain() })
  
  if (!host) {
    return null
  }
  
  // Development fallback - if we're on localhost, use 'test' as subdomain
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('localhost')) {
    console.log('Development mode detected, using test subdomain')
    return 'test'
  }
  
  return extractSubdomain()
}

// Fetch site data based on subdomain
const { data: siteData, pending, error, refresh } = await useFetch(() => {
  const extractedSubdomain = getSubdomain()
  console.log('API request - subdomain:', extractedSubdomain)
  
  if (!extractedSubdomain) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid subdomain'
    })
  }
  
  const url = `/api/site/${extractedSubdomain}`
  console.log('API request URL:', url)
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

// Layout component based on route and site config
const layoutComponent = computed(() => {
  if (!siteData.value?.siteConfig) return 'DefaultLayout'
  
  const config = siteData.value.siteConfig
  const path = route.path
  const slug = route.params.slug
  
  // Determine layout based on route
  if (path === '/' || path === '' || !slug || slug.length === 0) {
    // Home page layout
    switch (config.indexLayout) {
      case 'grid':
        return 'GridLayout'
      case 'list':
        return 'ListLayout'
      case 'masonry':
        return 'MasonryLayout'
      default:
        return 'GridLayout'
    }
  } else if (slug[0] === 'projects') {
    // Projects archive page
    return 'ProjectsArchive'
  } else if (slug[0] === 'blog') {
    // Blog archive page
    return 'BlogArchive'
  } else if (slug[0] === 'blog' || slug[0] === 'project' || slug[0] === 'experience') {
    // Single content page layout
    switch (config.singleLayout) {
      case 'wide':
        return 'WideLayout'
      case 'minimal':
        return 'MinimalLayout'
      case 'standard':
      default:
        return 'StandardLayout'
    }
  } else {
    // Default layout for other pages
    return 'DefaultLayout'
  }
})

// Handle client-side navigation
onMounted(() => {
  if (process.client) {
    // Refresh data when navigating to different subdomains
    const handleRouteChange = () => {
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
