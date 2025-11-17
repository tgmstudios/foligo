<template>
  <div class="min-h-screen" :style="siteStyles">
    <!-- Header -->
    <CommonHeader 
      :site-name="siteData?.siteConfig?.siteName || siteData?.project?.name || 'Portfolio'"
      :site-description="siteData?.siteConfig?.siteDescription || ''"
    />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Single Post View -->
      <div v-if="isSinglePost && contentData" class="max-w-4xl mx-auto">
        <article class="prose prose-lg max-w-none">
          <header class="mb-8">
            <h1 class="text-4xl font-bold mb-4" :style="{ color: siteData.siteConfig.textColor }">
              {{ contentData.title || 'Untitled' }}
            </h1>
            <div class="flex items-center text-sm mb-6" :style="{ color: siteData.siteConfig.textColor + '80' }">
              <span>{{ contentData.createdAt ? new Date(contentData.createdAt).toLocaleDateString() : 'No date' }}</span>
              <span class="mx-2">•</span>
              <span class="capitalize">{{ contentData.contentType?.toLowerCase() || 'post' }}</span>
            </div>
            <p v-if="contentData.excerpt" class="text-xl mb-6" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
              {{ cleanExcerpt }}
            </p>
          </header>

          <!-- Featured Image -->
          <div v-if="contentData.featuredImage" class="mb-8 rounded-lg overflow-hidden">
            <img 
              :src="contentData.featuredImage" 
              :alt="contentData.title"
              class="w-full h-auto object-cover"
            />
          </div>

          <!-- Content Body -->
          <div class="content-body" v-html="renderedContent"></div>
        </article>

        <!-- Navigation -->
        <div class="mt-12 pt-8 border-t" :style="{ borderColor: siteData.siteConfig.textColor + '20' }">
          <div class="flex justify-between">
            <NuxtLink 
              :to="getArchiveLink(contentData.contentType)"
              class="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors"
              :style="{
                borderColor: siteData.siteConfig.primaryColor + '40',
                color: siteData.siteConfig.primaryColor,
                backgroundColor: 'transparent'
              }"
              @mouseover="(e) => e.target.style.backgroundColor = siteData.siteConfig.primaryColor + '10'"
              @mouseleave="(e) => e.target.style.backgroundColor = 'transparent'"
            >
              ← Back to {{ getArchiveName(contentData.contentType) }}
            </NuxtLink>
            <NuxtLink 
              to="/"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white transition-opacity"
              :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
            >
              Home →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Archive Page View -->
      <div v-else-if="isArchivePage" class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold mb-4" :style="{ color: siteData.siteConfig.textColor }">
            {{ archiveTitle }}
          </h2>
          <p class="text-xl max-w-3xl mx-auto" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            {{ archiveDescription }}
          </p>
        </div>

        <!-- Archive Content Grid -->
        <div v-if="archiveItems.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div 
            v-for="item in archiveItems" 
            :key="item.id"
            class="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border"
            :style="{
              backgroundColor: siteData.siteConfig.backgroundColor,
              borderColor: siteData.siteConfig.textColor + '20'
            }"
          >
            <h3 class="text-xl font-semibold mb-3" :style="{ color: siteData.siteConfig.textColor }">
              {{ item.title }}
            </h3>
            <p v-if="item.excerpt" class="mb-4" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
              {{ item.excerpt }}
            </p>
            <div class="flex items-center justify-between text-sm mb-4" :style="{ color: siteData.siteConfig.textColor + '80' }">
              <span>{{ new Date(item.createdAt).toLocaleDateString() }}</span>
              <span class="capitalize">{{ item.contentType.toLowerCase() }}</span>
            </div>
            <NuxtLink 
              :to="`/${getContentTypeSlug(item.contentType)}/${item.slug}`"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-opacity"
              :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
            >
              View {{ getContentTypeName(item.contentType) }}
            </NuxtLink>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <div class="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" 
               :style="{ backgroundColor: siteData.siteConfig.textColor + '10' }">
            <svg class="w-12 h-12" :style="{ color: siteData.siteConfig.textColor + '60' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium mb-2" :style="{ color: siteData.siteConfig.textColor }">
            No {{ archiveTitle }} Yet
          </h3>
          <p :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            {{ archiveTitle }} will appear here when they're published.
          </p>
        </div>

        <!-- Back to Home -->
        <div class="text-center mt-12">
          <NuxtLink 
            to="/"
            class="inline-flex items-center px-6 py-3 border text-base font-medium rounded-md transition-colors"
            :style="{
              borderColor: siteData.siteConfig.textColor + '30',
              color: siteData.siteConfig.textColor,
              backgroundColor: 'transparent'
            }"
            @mouseover="(e) => e.target.style.backgroundColor = siteData.siteConfig.textColor + '10'"
            @mouseleave="(e) => e.target.style.backgroundColor = 'transparent'"
          >
            ← Back to Home
          </NuxtLink>
        </div>
      </div>

      <!-- Home Page View -->
      <div v-else>
        <!-- Hero Section -->
        <div class="text-center mb-12">
          <!-- Profile Image -->
          <div v-if="siteData?.siteConfig?.profileImage && showProfileImage" class="mb-8">
            <img 
              :src="siteData.siteConfig.profileImage" 
              :alt="siteData?.siteConfig?.profileName || 'Profile'"
              class="w-32 h-32 mx-auto rounded-full object-cover border-4 shadow-lg"
              :style="{ borderColor: siteData.siteConfig.primaryColor + '40' }"
              @error="handleImageError"
              @load="handleImageLoad"
            />
          </div>
          <div v-else-if="siteData?.siteConfig?.profileName" class="mb-8">
            <div class="w-32 h-32 mx-auto rounded-full flex items-center justify-center border-4 shadow-lg"
                 :style="{
                   backgroundColor: siteData.siteConfig.textColor + '10',
                   borderColor: siteData.siteConfig.primaryColor + '40'
                 }">
              <svg class="w-16 h-16" :style="{ color: siteData.siteConfig.textColor + '60' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
          <h2 class="text-4xl font-bold mb-4" :style="{ color: siteData.siteConfig.textColor }">
            Welcome to {{ siteData?.siteConfig?.siteName || siteData?.project?.name }}
          </h2>
          <p v-if="siteData?.siteConfig?.profileBio || siteData?.project?.description" 
             class="text-xl max-w-3xl mx-auto" 
             :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            {{ siteData?.siteConfig?.profileBio || siteData?.project?.description }}
          </p>
        </div>

        <!-- Content Overview -->
        <div v-if="hasContent" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <!-- Projects -->
          <div v-if="siteData?.content?.projects?.length" class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                 :style="{ backgroundColor: siteData.siteConfig.primaryColor }">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2" :style="{ color: siteData.siteConfig.textColor }">
              {{ siteData?.content?.projects?.length }} Projects
            </h3>
            <p class="mb-4" :style="{ color: siteData.siteConfig.textColor + 'CC' }">Explore my latest work</p>
            <NuxtLink 
              to="/projects"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-opacity"
              :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
            >
              View Projects
            </NuxtLink>
          </div>

          <!-- Blog Posts -->
          <div v-if="siteData?.content?.blogs?.length" class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                 :style="{ backgroundColor: siteData.siteConfig.secondaryColor }">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2" :style="{ color: siteData.siteConfig.textColor }">
              {{ siteData?.content?.blogs?.length }} Blog Posts
            </h3>
            <p class="mb-4" :style="{ color: siteData.siteConfig.textColor + 'CC' }">Read my latest thoughts</p>
            <NuxtLink 
              to="/blog"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-opacity"
              :style="{ backgroundColor: siteData.siteConfig.secondaryColor }"
            >
              Read Blog
            </NuxtLink>
          </div>

          <!-- Experiences -->
          <div v-if="siteData?.content?.experiences?.length" class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                 :style="{ backgroundColor: siteData.siteConfig.accentColor }">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-2" :style="{ color: siteData.siteConfig.textColor }">
              {{ siteData?.content?.experiences?.length }} Experiences
            </h3>
            <p class="mb-4" :style="{ color: siteData.siteConfig.textColor + 'CC' }">Learn about my journey</p>
            <NuxtLink 
              to="/experiences"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-opacity"
              :style="{ backgroundColor: siteData.siteConfig.accentColor }"
            >
              View Experiences
            </NuxtLink>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border"
               :style="{
                 backgroundColor: siteData.siteConfig.textColor + '10',
                 borderColor: siteData.siteConfig.textColor + '20'
               }">
            <svg class="w-12 h-12" :style="{ color: siteData.siteConfig.textColor + '60' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2" :style="{ color: siteData.siteConfig.textColor }">
            No Content Yet
          </h3>
          <p class="mb-6" :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            This site is ready to showcase your projects, blog posts, and experiences.
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t mt-16" :style="{ borderColor: siteData.siteConfig.textColor + '20' }">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
          <p :style="{ color: siteData.siteConfig.textColor + 'CC' }">
            © {{ new Date().getFullYear() }} {{ siteData?.siteConfig?.siteName || siteData?.project?.name }}. 
            Powered by <a href="https://foligo.tech" :style="{ color: siteData.siteConfig.primaryColor }" class="hover:underline">Foligo</a>.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { renderMarkdown } from '~/utils/markdownRenderer'
import mermaid from 'mermaid'

const props = defineProps({
  siteData: {
    type: Object,
    required: true
  },
  contentData: {
    type: Object,
    default: null
  },
  route: {
    type: Object,
    required: true
  }
})

// Image loading states
const showProfileImage = ref(true)

const handleImageError = (event) => {
  console.error('Failed to load profile image:', event.target.src)
  showProfileImage.value = false
}

const handleImageLoad = () => {
  showProfileImage.value = true
}

// Determine page type
const isSinglePost = computed(() => {
  return !!props.contentData
})

const isArchivePage = computed(() => {
  const slug = props.route.params.slug
  if (!slug || slug.length === 0) return false
  
  const firstSegment = slug[0]
  const archiveKeywords = ['projects', 'blog', 'experiences', 'contact', 'about']
  
  // If it's an archive keyword and there's only one segment, it's an archive page
  // If there are multiple segments, it might be a single post (e.g., /blog/my-post)
  return archiveKeywords.includes(firstSegment) && slug.length === 1
})

// Archive page data
const archiveType = computed(() => {
  if (!isArchivePage.value) return null
  const slug = props.route.params.slug
  return slug[0]
})

const archiveItems = computed(() => {
  if (!isArchivePage.value || !props.siteData?.content) return []
  
  switch (archiveType.value) {
    case 'projects':
      return props.siteData.content.projects || []
    case 'blog':
      return props.siteData.content.blogs || []
    case 'experiences':
      return props.siteData.content.experiences || []
    default:
      return []
  }
})

const archiveTitle = computed(() => {
  switch (archiveType.value) {
    case 'projects':
      return 'Projects'
    case 'blog':
      return 'Blog'
    case 'experiences':
      return 'Experiences'
    default:
      return 'Archive'
  }
})

const archiveDescription = computed(() => {
  switch (archiveType.value) {
    case 'projects':
      return 'Explore my portfolio of projects and creative work'
    case 'blog':
      return 'Thoughts, insights, and stories from my journey'
    case 'experiences':
      return 'Learn about my professional journey and experiences'
    default:
      return ''
  }
})

// Content helpers
const getContentTypeSlug = (contentType) => {
  const mapping = {
    'PROJECT': 'project',
    'BLOG': 'blog',
    'EXPERIENCE': 'experience'
  }
  return mapping[contentType] || 'post'
}

const getContentTypeName = (contentType) => {
  const mapping = {
    'PROJECT': 'Project',
    'BLOG': 'Post',
    'EXPERIENCE': 'Experience'
  }
  return mapping[contentType] || 'Item'
}

const getArchiveLink = (contentType) => {
  const mapping = {
    'PROJECT': '/projects',
    'BLOG': '/blog',
    'EXPERIENCE': '/experiences'
  }
  return mapping[contentType] || '/'
}

const getArchiveName = (contentType) => {
  const mapping = {
    'PROJECT': 'Projects',
    'BLOG': 'Blog',
    'EXPERIENCE': 'Experiences'
  }
  return mapping[contentType] || 'Archive'
}

// Dynamic styles based on site config
const siteStyles = computed(() => {
  if (!props.siteData?.siteConfig) return {}
  
  const config = props.siteData.siteConfig
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

const hasContent = computed(() => {
  const content = props.siteData?.content
  return content?.projects?.length || content?.blogs?.length || content?.experiences?.length || content?.other?.length
})

// Initialize mermaid
onMounted(() => {
  if (process.client) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      }
    })
    
    // Render mermaid diagrams after content is rendered
    nextTick(() => {
      renderMermaidDiagrams()
    })
  }
})

// Watch for content changes and re-render mermaid
watch([renderedContent, () => props.contentData], () => {
  if (process.client) {
    nextTick(() => {
      renderMermaidDiagrams()
    })
  }
}, { deep: true })

// Function to render mermaid diagrams
const renderMermaidDiagrams = () => {
  if (!process.client) return
  
  const mermaidElements = document.querySelectorAll('.mermaid:not([data-processed])')
  
  mermaidElements.forEach((element, index) => {
    const id = `mermaid-${Date.now()}-${index}`
    const originalContent = element.textContent.trim()
    
    if (!originalContent) return
    
    element.setAttribute('data-processed', 'true')
    element.setAttribute('id', id)
    
    // Store original content in a data attribute
    element.setAttribute('data-mermaid-content', originalContent)
    
    // Use mermaid's render method - works with most versions
    try {
      // For mermaid v10+, use the async render method
      if (typeof mermaid.render === 'function') {
        mermaid.render(id, originalContent).then((result) => {
          // result can be either a string (svg) or an object with svg property
          const svg = typeof result === 'string' ? result : result.svg
          element.innerHTML = svg
          element.classList.add('mermaid-rendered')
        }).catch((error) => {
          console.error('Mermaid rendering error:', error)
          element.innerHTML = `<pre style="color: red; padding: 1rem; background: rgba(255,0,0,0.1); border: 1px solid red; border-radius: 0.25rem;">Error rendering diagram: ${error.message}</pre>`
        })
      } else if (typeof mermaid.run === 'function') {
        // Fallback to mermaid.run() if available
        mermaid.run({
          nodes: [element]
        }).catch((error) => {
          console.error('Mermaid rendering error:', error)
          element.innerHTML = `<pre style="color: red; padding: 1rem; background: rgba(255,0,0,0.1); border: 1px solid red; border-radius: 0.25rem;">Error rendering diagram: ${error.message}</pre>`
        })
      } else {
        // Last resort: try to use mermaid's contentLoaded
        mermaid.contentLoaded()
      }
    } catch (error) {
      console.error('Mermaid initialization error:', error)
      element.innerHTML = `<pre style="color: red; padding: 1rem; background: rgba(255,0,0,0.1); border: 1px solid red; border-radius: 0.25rem;">Error initializing diagram: ${error.message}</pre>`
    }
  })
}
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
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.prose h1 {
  font-size: 2.25rem;
  line-height: 2.5rem;
}

.prose h2 {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.prose h3 {
  font-size: 1.5rem;
  line-height: 2rem;
}

.content-body {
  line-height: 1.7;
}

.content-body > * {
  margin-bottom: 1.5rem;
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
  font-size: 2.25rem;
  line-height: 2.5rem;
}

.content-body h2 {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.content-body h3 {
  font-size: 1.5rem;
  line-height: 2rem;
}

.content-body p {
  margin-bottom: 1.5rem;
}

.content-body a {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.content-body a:hover {
  opacity: 0.8;
}

.content-body ul,
.content-body ol {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.content-body li {
  margin-bottom: 0.5rem;
}

.content-body strong {
  font-weight: 600;
}

.content-body em {
  font-style: italic;
}

.content-body blockquote {
  border-left: 4px solid;
  padding-left: 1rem;
  margin: 2rem 0;
  font-style: italic;
  opacity: 0.8;
}

.content-body code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
}

.content-body pre {
  background-color: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}

.content-body pre code {
  background-color: transparent;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.6;
}

.content-body img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1.5rem 0;
}

.content-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.content-body th,
.content-body td {
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  text-align: left;
}

.content-body th {
  font-weight: 600;
  background-color: rgba(0, 0, 0, 0.05);
}

/* Mermaid diagram styling */
.content-body .mermaid {
  margin: 2rem 0;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.5);
  padding: 1rem;
  border-radius: 0.5rem;
}

.content-body .mermaid svg {
  max-width: 100%;
  height: auto;
}
</style>

