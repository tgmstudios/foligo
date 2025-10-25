<template>
  <div class="min-h-screen bg-white">
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
            <NuxtLink to="/experience" class="text-gray-700 hover:text-gray-900">Experience</NuxtLink>
            <NuxtLink to="/contact" class="text-gray-700 hover:text-gray-900">Contact</NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Debug Info (only in development) -->
    <div v-if="isDev" class="fixed bottom-4 right-4 bg-blue-100 p-4 rounded-lg text-xs z-50 max-w-md">
      <h3 class="font-bold mb-2">StandardLayout Debug:</h3>
      <p>Content Data: {{ props.contentData ? 'Received' : 'Not received' }}</p>
      <p>Title: {{ props.contentData?.title || 'N/A' }}</p>
      <p>Content Type: {{ props.contentData?.contentType || 'N/A' }}</p>
      <p>Has Content: {{ props.contentData?.content ? 'Yes' : 'No' }}</p>
    </div>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Content -->
      <article class="prose prose-lg max-w-none">
        <header class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ props.contentData.title }}</h1>
          <div class="flex items-center text-sm text-gray-500 mb-6">
            <span>{{ new Date(props.contentData.createdAt).toLocaleDateString() }}</span>
            <span class="mx-2">•</span>
            <span class="capitalize">{{ props.contentData.contentType.toLowerCase() }}</span>
          </div>
          <p v-if="props.contentData.excerpt" class="text-xl text-gray-600">{{ props.contentData.excerpt }}</p>
        </header>

        <!-- Content Body -->
        <div class="content-body" v-html="renderedContent"></div>

        <!-- Metadata -->
        <div v-if="props.contentData.metadata" class="mt-8 pt-8 border-t border-gray-200">
          <h3 class="text-lg font-semibold mb-4">Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(value, key) in props.contentData.metadata" :key="key" class="flex">
              <span class="font-medium text-gray-700 capitalize w-24">{{ key }}:</span>
              <span class="text-gray-600">{{ value }}</span>
            </div>
          </div>
        </div>
      </article>

      <!-- Navigation -->
      <div class="mt-12 pt-8 border-t border-gray-200">
        <div class="flex justify-between">
          <NuxtLink 
            to="/"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Home
          </NuxtLink>
          <NuxtLink 
            to="/contact"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
            :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
          >
            Get In Touch
          </NuxtLink>
        </div>
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
</template>

<script setup>
import { computed } from 'vue'
import { siteApi } from '~/utils/siteApi'
import { renderMarkdown } from '~/utils/markdownRenderer'

// Debug variables
const isDev = process.dev || process.env.NODE_ENV === 'development'

const props = defineProps({
  siteData: {
    type: Object,
    required: true
  },
  contentData: {
    type: Object,
    required: true
  },
  route: {
    type: Object,
    required: true
  }
})

// Render markdown content
const renderedContent = computed(() => {
  if (!props.contentData?.content) return ''
  return renderMarkdown(props.contentData.content)
})
</script>

<style scoped>
.prose {
  color: inherit;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  color: inherit;
}

.content-body {
  line-height: 1.7;
}

.content-body h1,
.content-body h2,
.content-body h3,
.content-body h4,
.content-body h5,
.content-body h6 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.content-body p {
  margin-bottom: 1.5rem;
}

.content-body ul,
.content-body ol {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.content-body li {
  margin-bottom: 0.5rem;
}

.content-body blockquote {
  border-left: 4px solid var(--primary-color);
  padding-left: 1rem;
  margin: 2rem 0;
  font-style: italic;
  color: #6b7280;
}

.content-body code {
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.content-body pre {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}

.content-body pre code {
  background-color: transparent;
  padding: 0;
}
</style>
