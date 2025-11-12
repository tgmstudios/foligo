<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-300">Loading experiences...</p>
      </div>
    </div>

    <!-- Error State -->
    <SiteNotFound v-else-if="error" :error="error" />

    <!-- Experience Archive -->
    <ArchiveLayout
      v-else-if="siteData"
      :site-data="siteData"
      title="Experience"
      subtitle="Professional journey and achievements"
      :show-empty-state="!siteData?.content?.experiences?.length"
      empty-state-title="No Experience Yet"
      empty-state-message="Experience entries will appear here once they're published."
      :pending="pending"
      :error="error"
      fallback-title="No Experiences Found"
      fallback-message="No experiences are available at this time."
      empty-state-icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
    >
      <!-- Experience List -->
      <div v-if="siteData?.content?.experiences?.length" class="space-y-8">
        <div 
          v-for="experience in siteData.content.experiences" 
          :key="experience.id"
          class="bg-slate-800 rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-l-4 border-amber-600"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="text-xl font-semibold mb-3 text-white">{{ experience.title }}</h3>
              <p v-if="experience.excerpt" class="text-slate-300 mb-4">{{ experience.excerpt }}</p>
              <div class="flex items-center text-sm text-slate-500">
                <span>{{ new Date(experience.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
            <NuxtLink 
              :to="`/experience/${experience.slug}`"
              class="ml-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-colors"
            >
              Learn More
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
