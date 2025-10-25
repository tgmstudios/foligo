<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading experience...</p>
      </div>
    </div>

    <!-- Error State -->
    <SiteNotFound v-else-if="error" :error="error" />

    <!-- Experience Content -->
    <div v-else-if="contentData" class="min-h-screen" :style="siteStyles">
      <!-- Dynamic Head -->
      <Head>
        <Title>{{ contentData.title }} - {{ siteData.project.name }}</Title>
        <Meta name="description" :content="contentData.excerpt || contentData.title" />
        <Meta name="theme-color" :content="siteData.siteConfig.primaryColor" />
      </Head>

      <!-- Layout Switch -->
      <div v-if="layoutComponent === 'StandardLayout'" class="min-h-screen bg-white">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
              <div>
                <h1 class="text-3xl font-bold" :style="{ color: siteData.siteConfig.primaryColor }">
                  {{ siteData.siteConfig.siteName || siteData.project.name }}
                </h1>
              </div>
              <nav class="hidden md:flex space-x-8">
                <NuxtLink to="/" class="text-gray-700 hover:text-gray-900">Home</NuxtLink>
                <NuxtLink to="/projects" class="text-gray-700 hover:text-gray-900">Projects</NuxtLink>
                <NuxtLink to="/blog" class="text-gray-700 hover:text-gray-900">Blog</NuxtLink>
                <NuxtLink to="/experience" class="text-gray-700 hover:text-gray-900 font-semibold">Experience</NuxtLink>
                <NuxtLink to="/contact" class="text-gray-700 hover:text-gray-900">Contact</NuxtLink>
              </nav>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <article class="prose prose-lg max-w-none">
            <header class="mb-8">
              <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ contentData.title }}</h1>
              <div class="flex items-center text-sm text-gray-500 mb-6">
                <span>{{ new Date(contentData.createdAt).toLocaleDateString() }}</span>
                <span class="mx-2">•</span>
                <span class="capitalize">{{ contentData.contentType.toLowerCase() }}</span>
              </div>
              <p v-if="contentData.excerpt" class="text-xl text-gray-600">{{ contentData.excerpt }}</p>
            </header>
            <div class="content-body" v-html="renderedContent"></div>
          </article>
        </main>
      </div>
      <div v-else class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Layout Not Supported</h1>
          <p class="text-gray-600">Layout component: {{ layoutComponent }}</p>
        </div>
      </div>
    </div>

    <!-- Fallback State -->
    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Experience Not Found</h1>
        <p class="text-gray-600">The requested experience could not be found.</p>
        <div class="mt-6 space-x-4">
          <NuxtLink to="/" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Back to Home
          </NuxtLink>
          <NuxtLink to="/experience" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            View All Experience
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

// Render markdown content
const renderedContent = computed(() => {
  if (!contentData.value?.content) return ''
  
  // Simple markdown rendering
  return contentData.value.content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    .replace(/^(.*)$/gim, '<p>$1</p>')
})
</script>
