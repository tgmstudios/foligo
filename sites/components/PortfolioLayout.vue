<template>
  <div v-if="siteData" class="min-h-screen bg-slate-900">
    <!-- Header -->
    <CommonHeader 
      :site-name="siteData?.siteConfig?.siteName || siteData?.project?.name || 'Portfolio'"
      :site-description="siteData?.siteConfig?.siteDescription || ''"
    />

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Hero Section -->
      <div class="text-center mb-16">
        <!-- Profile Image -->
        <div v-if="siteData?.siteConfig?.profileImage && showProfileImage" class="mb-8">
          <img 
            :src="siteData.siteConfig.profileImage" 
            :alt="siteData?.siteConfig?.profileName || 'Profile'"
            class="w-40 h-40 mx-auto rounded-full object-cover border-4 border-slate-700 shadow-lg"
            @error="handleImageError"
            @load="handleImageLoad"
          />
        </div>
        <div v-else class="mb-8">
          <div class="w-40 h-40 mx-auto rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center">
            <svg class="w-24 h-24 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>

        <!-- Greeting -->
        <h1 class="text-5xl md:text-6xl font-bold text-white mb-6">
          Hello, I'm {{ siteData?.siteConfig?.profileName || siteData?.siteConfig?.siteName || siteData?.project?.name }}.
        </h1>

        <!-- Bio -->
        <p v-if="siteData?.siteConfig?.profileBio || siteData?.project?.description" class="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          {{ siteData?.siteConfig?.profileBio || siteData?.project?.description }}
        </p>
      </div>

      <!-- Latest Posts Section -->
      <div v-if="latestPosts.length > 0" class="mb-16">
        <h2 class="text-3xl font-bold text-white mb-8 text-center">Latest Posts</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div 
            v-for="post in latestPosts" 
            :key="post.id"
            class="bg-slate-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-slate-700 group"
          >
            <!-- Post Image -->
            <div class="aspect-video bg-slate-700 relative overflow-hidden">
              <div v-if="post.image" class="w-full h-full bg-cover bg-center" :style="{ backgroundImage: `url(${post.image})` }"></div>
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-16 h-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>

            <!-- Post Content -->
            <div class="p-6">
              <!-- Post Type Badge -->
              <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3"
                :class="{
                  'bg-blue-600 text-white': post.contentType === 'PROJECT',
                  'bg-purple-600 text-white': post.contentType === 'BLOG',
                  'bg-amber-600 text-white': post.contentType === 'EXPERIENCE'
                }"
              >
                {{ getContentTypeLabel(post.contentType) }}
              </span>

              <h3 class="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                {{ post.title }}
              </h3>

              <p v-if="post.excerpt" class="text-slate-300 text-sm mb-4 line-clamp-3">
                {{ post.excerpt }}
              </p>

              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">
                  {{ new Date(post.createdAt).toLocaleDateString() }}
                </span>
                <NuxtLink 
                  :to="getPostLink(post)"
                  class="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Read More →
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div v-if="hasContent" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <NuxtLink 
          v-if="siteData?.content?.projects?.length"
          to="/projects"
          class="group bg-slate-800 border border-slate-700 rounded-lg p-8 hover:border-blue-600 transition-all"
        >
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-600 group-hover:bg-blue-700 transition-colors">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">Projects</h3>
          <p class="text-slate-400">{{ siteData.content.projects.length }} {{ siteData.content.projects.length === 1 ? 'project' : 'projects' }}</p>
        </NuxtLink>

        <NuxtLink 
          v-if="siteData?.content?.blogs?.length"
          to="/blog"
          class="group bg-slate-800 border border-slate-700 rounded-lg p-8 hover:border-purple-600 transition-all"
        >
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-purple-600 group-hover:bg-purple-700 transition-colors">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">Blog</h3>
          <p class="text-slate-400">{{ siteData.content.blogs.length }} {{ siteData.content.blogs.length === 1 ? 'post' : 'posts' }}</p>
        </NuxtLink>

        <NuxtLink 
          v-if="siteData?.content?.experiences?.length"
          to="/experience"
          class="group bg-slate-800 border border-slate-700 rounded-lg p-8 hover:border-amber-600 transition-all"
        >
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-amber-600 group-hover:bg-amber-700 transition-colors">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">Experience</h3>
          <p class="text-slate-400">{{ siteData.content.experiences.length }} {{ siteData.content.experiences.length === 1 ? 'entry' : 'entries' }}</p>
        </NuxtLink>
      </div>

      <!-- Call to Action -->
      <div class="text-center">
        <NuxtLink 
          to="/contact"
          class="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Get In Touch
        </NuxtLink>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-slate-800 border-t border-slate-700 mt-16">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
          <p class="text-slate-400">
            © {{ new Date().getFullYear() }} {{ siteData?.siteConfig?.siteName || siteData?.project?.name }}. 
            Powered by <a href="https://foligo.tech" class="text-blue-400 hover:text-blue-300">Foligo</a>.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  siteData: {
    type: Object,
    required: true
  }
})

// Image loading states
const showProfileImage = ref(true)

const handleImageError = (event) => {
  console.error('Failed to load profile image:', event.target.src)
  console.error('Profile image URL:', props.siteData?.siteConfig?.profileImage)
  showProfileImage.value = false
}

const handleImageLoad = () => {
  console.log('Profile image loaded successfully:', props.siteData?.siteConfig?.profileImage)
  showProfileImage.value = true
}

// Debug: Log the site data
console.log('Portfolio Layout - Site Data:', {
  profileName: props.siteData?.siteConfig?.profileName,
  profileBio: props.siteData?.siteConfig?.profileBio,
  profileImage: props.siteData?.siteConfig?.profileImage,
  siteConfig: props.siteData?.siteConfig
})

const hasContent = computed(() => {
  const content = props.siteData?.content
  return content?.projects?.length || content?.blogs?.length || content?.experiences?.length
})

// Get latest posts from all content types
const latestPosts = computed(() => {
  if (!props.siteData?.content) return []
  
  const allPosts = [
    ...(props.siteData.content.projects || []).map(p => ({ ...p, type: 'project' })),
    ...(props.siteData.content.blogs || []).map(p => ({ ...p, type: 'blog' })),
    ...(props.siteData.content.experiences || []).map(p => ({ ...p, type: 'experience' }))
  ]
  
  // Sort by createdAt and take latest 6
  return allPosts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
})

const getContentTypeLabel = (type) => {
  switch(type) {
    case 'PROJECT': return 'Project'
    case 'BLOG': return 'Blog'
    case 'EXPERIENCE': return 'Experience'
    default: return 'Post'
  }
}

const getPostLink = (post) => {
  const type = post.type || post.contentType?.toLowerCase() || 'blog'
  return `/${type === 'experience' ? 'experience' : type === 'project' ? 'project' : 'blog'}/${post.slug}`
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

