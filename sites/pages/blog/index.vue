<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-300">Loading blog posts...</p>
      </div>
    </div>

    <!-- Error State -->
    <SiteNotFound v-else-if="error" :error="error" />

    <!-- Blog Archive -->
    <ArchiveLayout
      v-else-if="siteData"
      :site-data="siteData"
      title="Blog"
      subtitle="Thoughts, insights, and stories"
      :show-empty-state="!siteData?.content?.blogs?.length"
      empty-state-title="No Blog Posts Yet"
      empty-state-message="Blog posts will appear here once they're published."
      :pending="pending"
      :error="error"
      fallback-title="No Blog Posts Found"
      fallback-message="No blog posts are available at this time."
      empty-state-icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    >
      <!-- Blog Posts List -->
      <div v-if="siteData?.content?.blogs?.length" class="space-y-8">
        <div 
          v-for="blog in siteData.content.blogs" 
          :key="blog.id"
          class="bg-slate-800 rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-l-4 border-purple-600"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="text-xl font-semibold mb-3 text-white">{{ blog.title }}</h3>
              <p v-if="blog.excerpt" class="text-slate-300 mb-4">{{ blog.excerpt }}</p>
              <div class="flex items-center text-sm text-slate-500">
                <span>{{ new Date(blog.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
            <NuxtLink 
              :to="`/blog/${blog.slug}`"
              class="ml-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              Read More
            </NuxtLink>
          </div>
        </div>
      </div>
    </ArchiveLayout>
  </div>
</template>

<script setup>
import { useSubdomain } from '~/composables/useSubdomain'

const config = useRuntimeConfig()
const { extractSubdomain } = useSubdomain()

const getSubdomain = () => {
  let host = ''
  
  if (process.client) {
    host = window.location.hostname
  } else if (process.server) {
    const headers = useRequestHeaders()
    host = headers.host || headers['x-forwarded-host'] || ''
  }
  
  if (!host) return null
  
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
</script>
