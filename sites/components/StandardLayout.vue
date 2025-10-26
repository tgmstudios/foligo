<template>
  <div class="min-h-screen bg-slate-900 text-slate-100">
    <!-- Header -->
    <CommonHeader 
      :site-name="siteData.siteConfig.siteName || siteData.project.name"
      :site-description="siteData.siteConfig.siteDescription || ''"
    />

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Content -->
      <article class="prose prose-lg max-w-none">
        <header class="mb-8">
          <h1 class="text-4xl font-bold text-white mb-4">{{ props.contentData.title || 'Untitled' }}</h1>
          <div class="flex items-center text-sm text-slate-400 mb-6">
            <span>{{ props.contentData.createdAt ? new Date(props.contentData.createdAt).toLocaleDateString() : 'No date' }}</span>
            <span class="mx-2">•</span>
            <span class="capitalize">{{ props.contentData.contentType?.toLowerCase() || 'post' }}</span>
          </div>
          <p v-if="props.contentData.excerpt" class="text-xl text-slate-200">{{ cleanExcerpt }}</p>
        </header>

        <!-- Content Body -->
        <div class="content-body" v-html="renderedContent"></div>
      </article>

      <!-- Navigation -->
      <div class="mt-12 pt-8 border-t border-slate-700">
        <div class="flex justify-between">
          <NuxtLink 
            to="/blog"
            class="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white"
          >
            ← Back to Blog
          </NuxtLink>
          <NuxtLink 
            to="/"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
            :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
          >
            Home →
          </NuxtLink>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 border-t border-slate-700 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
          <p class="text-slate-400">
            © {{ new Date().getFullYear() }} {{ siteData.siteConfig.siteName || siteData.project.name }}. 
            Powered by <a href="https://foligo.tech" class="text-blue-400 hover:text-blue-300">Foligo</a>.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '~/utils/markdownRenderer'

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

// Clean excerpt from markdown
const cleanExcerpt = computed(() => {
  if (!props.contentData?.excerpt) return ''
  return props.contentData.excerpt
    .replace(/^#+\s+/gim, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/gim, '$1') // Remove bold
    .replace(/\*(.*?)\*/gim, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/gim, '$1') // Remove links
    .replace(/`([^`]+)`/gim, '$1') // Remove inline code
    .trim()
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
  color: #e2e8f0 !important; /* text-slate-200 */
}

/* Override any dark text colors */
.content-body > * {
  color: #e2e8f0 !important;
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

.content-body h1 {
  color: #ffffff !important;
}

.content-body h2 {
  color: #f1f5f9 !important; /* text-slate-100 */
}

.content-body h3 {
  color: #f8fafc !important; /* text-slate-50 */
}

.content-body p {
  margin-bottom: 1.5rem;
  color: #e2e8f0 !important; /* text-slate-200 */
}

.content-body a {
  color: #60a5fa !important; /* text-blue-400 */
}

.content-body a:hover {
  color: #93c5fd !important; /* text-blue-300 */
}

.content-body ul,
.content-body ol {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
  color: #e2e8f0 !important; /* text-slate-200 */
}

.content-body li {
  margin-bottom: 0.5rem;
  color: #e2e8f0 !important; /* text-slate-200 */
}

.content-body strong {
  color: #ffffff !important;
  font-weight: 600;
}

.content-body em {
  color: #cbd5e1 !important; /* text-slate-300 */
}

.content-body blockquote {
  border-left: 4px solid var(--primary-color);
  padding-left: 1rem;
  margin: 2rem 0;
  font-style: italic;
  color: #cbd5e1; /* text-slate-300 */
}

.content-body code {
  background-color: #1e293b !important; /* bg-slate-800 */
  color: #93c5fd !important; /* text-blue-300 */
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.content-body pre {
  background-color: #1e293b !important; /* bg-slate-800 */
  border: 1px solid #334155 !important; /* border-slate-700 */
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}

.content-body pre code {
  background-color: transparent !important;
  padding: 0;
  color: #f8fafc !important; /* text-slate-50 */
  font-size: 0.875rem;
  line-height: 1.6;
}

/* Override default text color for non-specialized elements */
.content-body p {
  color: #e2e8f0 !important;
}
</style>
