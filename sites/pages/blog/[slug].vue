<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading blog post...</p>
      </div>
    </div>

    <!-- Error State -->
    <SiteNotFound v-else-if="error" :error="error" />

    <!-- Blog Content -->
    <div v-else-if="contentData" class="min-h-screen" :style="siteStyles">
      <!-- Dynamic Head -->
      <Head>
        <Title>{{ contentData.title || 'Post' }} - {{ siteData.project.name }}</Title>
        <Meta name="description" :content="contentData.excerpt || contentData.title" />
        <Meta name="theme-color" :content="siteData.siteConfig.primaryColor" />
      </Head>

      <!-- Layout Switch -->
      <StandardLayout 
        v-if="layoutComponent === 'StandardLayout'"
        :site-data="siteData"
        :content-data="contentData"
        :route="route"
      />
      <WideLayout 
        v-else-if="layoutComponent === 'WideLayout'"
        :site-data="siteData"
        :content-data="contentData"
        :route="route"
      />
      <MinimalLayout 
        v-else-if="layoutComponent === 'MinimalLayout'"
        :site-data="siteData"
        :content-data="contentData"
        :route="route"
      />
      <div v-else class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Unknown Layout</h1>
          <p class="text-gray-600">Layout component: {{ layoutComponent }}</p>
        </div>
      </div>
    </div>

    <!-- Fallback State -->
    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
        <p class="text-gray-600">The requested blog post could not be found.</p>
        <div class="mt-6 space-x-4">
          <NuxtLink to="/" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Back to Home
          </NuxtLink>
          <NuxtLink to="/blog" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            View All Posts
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSubdomain } from '~/composables/useSubdomain'

// Get the current route and hostname
const route = useRoute()
const config = useRuntimeConfig()
const { extractSubdomain } = useSubdomain()

// Debug variables
const isDev = process.dev || (process.client && window.ENV?.NODE_ENV === 'development') || process.env.NODE_ENV === 'development'

// Extract subdomain from hostname
const getSubdomain = () => {
  let host = ''
  
  if (process.client) {
    host = window.location.hostname
  } else if (process.server) {
    const headers = useRequestHeaders()
    host = headers.host || headers['x-forwarded-host'] || ''
  }
  
  if (!host) {
    return null
  }
  
  // Development fallback - if we're on localhost, use 'test' as subdomain
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('localhost')) {
    return 'test'
  }
  
  return extractSubdomain()
}

// Fetch site data
const { data: siteData } = await useFetch(() => {
  const extractedSubdomain = getSubdomain()
  
  if (!extractedSubdomain) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid subdomain'
    })
  }
  
  return `/api/site/${extractedSubdomain}`
}, {
  key: 'site-data',
  baseURL: config.public.apiBaseUrl,
  server: true
})

// Fetch content data
const { data: contentData, pending, error } = await useFetch(() => {
  const extractedSubdomain = getSubdomain()
  const slug = route.params.slug
  
  if (!extractedSubdomain || !slug) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Content not found'
    })
  }
  
  return `/api/site/${extractedSubdomain}/content/${slug}`
}, {
  key: 'content-data',
  baseURL: config.public.apiBaseUrl,
  server: true
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
  if (!siteData.value?.siteConfig) return 'StandardLayout'
  
  const config = siteData.value.siteConfig
  
  switch (config.singleLayout) {
    case 'standard':
      return 'StandardLayout'
    case 'wide':
      return 'WideLayout'
    case 'minimal':
      return 'MinimalLayout'
    default:
      return 'StandardLayout'
  }
})

</script>
