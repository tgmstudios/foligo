<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading blog posts...</p>
      </div>
    </div>

    <!-- Error State -->
    <SiteNotFound v-else-if="error" :error="error" />

    <!-- Blog Archive -->
    <div v-else-if="siteData" class="min-h-screen" :style="siteStyles">
      <!-- Dynamic Head -->
      <Head>
        <Title>Blog - {{ siteData.project.name }}</Title>
        <Meta name="description" :content="`Read blog posts by ${siteData.project.name}`" />
        <Meta name="theme-color" :content="siteData.siteConfig.primaryColor" />
      </Head>

      <!-- Blog Archive Layout -->
      <div class="min-h-screen bg-white">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
              <div>
                <h1 class="text-3xl font-bold" :style="{ color: siteData.siteConfig.primaryColor }">
                  {{ siteData.siteConfig.siteName || siteData.project.name }}
                </h1>
                <p v-if="siteData.siteConfig.siteDescription" class="text-gray-600 mt-2">
                  {{ siteData.siteConfig.siteDescription }}
                </p>
              </div>
              <nav class="hidden md:flex space-x-8">
                <NuxtLink to="/" class="text-gray-700 hover:text-gray-900">Home</NuxtLink>
                <NuxtLink to="/projects" class="text-gray-700 hover:text-gray-900">Projects</NuxtLink>
                <NuxtLink to="/blog" class="text-gray-700 hover:text-gray-900 font-semibold">Blog</NuxtLink>
                <NuxtLink to="/experience" class="text-gray-700 hover:text-gray-900">Experience</NuxtLink>
                <NuxtLink to="/contact" class="text-gray-700 hover:text-gray-900">Contact</NuxtLink>
              </nav>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Page Title -->
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold text-gray-900 mb-4">Blog</h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              Thoughts, insights, and stories
            </p>
          </div>

          <!-- Blog Posts List -->
          <div v-if="siteData.content.blogs?.length" class="space-y-8">
            <div 
              v-for="blog in siteData.content.blogs" 
              :key="blog.id"
              class="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-l-4"
              :style="{ borderLeftColor: siteData.siteConfig.secondaryColor }"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="text-xl font-semibold mb-3">{{ blog.title }}</h3>
                  <p v-if="blog.excerpt" class="text-gray-600 mb-4">{{ blog.excerpt }}</p>
                  <div class="flex items-center text-sm text-gray-500">
                    <span>{{ new Date(blog.createdAt).toLocaleDateString() }}</span>
                  </div>
                </div>
                <NuxtLink 
                  :to="`/blog/${blog.slug}`"
                  class="ml-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                  :style="{ backgroundColor: siteData.siteConfig.secondaryColor }"
                >
                  Read More
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No Blog Posts Yet</h3>
            <p class="text-gray-600 mb-6">Blog posts will appear here once they're published.</p>
            <NuxtLink 
              to="/"
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
              :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
            >
              Back to Home
            </NuxtLink>
          </div>
        </main>

        <!-- Footer -->
        <footer class="bg-gray-50 mt-16">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="text-center">
              <p class="text-gray-600">
                © {{ new Date().getFullYear() }} {{ siteData.siteConfig.siteName || siteData.project.name }}. 
                Powered by <a href="https://foligo.tech" class="text-blue-600 hover:text-blue-800">Foligo</a>.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>

    <!-- Fallback State -->
    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">No Blog Posts Found</h1>
        <p class="text-gray-600">No blog posts are available at this time.</p>
        <NuxtLink to="/" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Back to Home
        </NuxtLink>
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
const { data: siteData, pending, error } = await useFetch(() => {
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
  if (!siteData.value?.siteConfig) return 'ListLayout'
  
  const config = siteData.value.siteConfig
  
  switch (config.archiveLayout) {
    case 'grid':
      return 'GridLayout'
    case 'list':
      return 'ListLayout'
    case 'masonry':
      return 'MasonryLayout'
    default:
      return 'ListLayout'
  }
})
</script>
