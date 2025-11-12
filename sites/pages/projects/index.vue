<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-300">Loading projects...</p>
      </div>
    </div>

    <!-- Error State -->
    <SiteNotFound v-else-if="error" :error="error" />

    <!-- Projects Archive -->
    <ArchiveLayout
      v-else-if="siteData"
      :site-data="siteData"
      title="Projects"
      subtitle="Explore my latest projects and work"
      :show-empty-state="!siteData?.content?.projects?.length"
      empty-state-title="No Projects Yet"
      empty-state-message="Projects will appear here once they're published."
      :pending="pending"
      :error="error"
      fallback-title="No Projects Found"
      fallback-message="No projects are available at this time."
    >
      <!-- Projects List -->
      <div v-if="siteData?.content?.projects?.length" class="space-y-8">
        <div 
          v-for="project in siteData.content.projects" 
          :key="project.id"
          class="bg-slate-800 rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-l-4 border-blue-600"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="text-xl font-semibold mb-3 text-white">{{ project.title }}</h3>
              <p v-if="project.excerpt" class="text-slate-300 mb-4">{{ project.excerpt }}</p>
              <div class="flex items-center text-sm text-slate-500">
                <span>{{ new Date(project.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
            <NuxtLink 
              :to="`/project/${project.slug}`"
              class="ml-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              View Project
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
