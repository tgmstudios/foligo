<template>
  <div v-if="siteData" class="min-h-screen bg-slate-900 text-slate-100">
    <!-- Header -->
    <CommonHeader 
      :site-name="siteData?.siteConfig?.siteName || siteData?.project?.name || 'Portfolio'"
      :site-description="siteData?.siteConfig?.siteDescription || ''"
    />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <!-- Profile Image -->
        <div v-if="siteData?.siteConfig?.profileImage && showProfileImage" class="mb-8">
          <img 
            :src="siteData.siteConfig.profileImage" 
            :alt="siteData?.siteConfig?.profileName || 'Profile'"
            class="w-32 h-32 mx-auto rounded-full object-cover border-4 border-slate-700 shadow-lg"
            @error="handleImageError"
            @load="handleImageLoad"
          />
        </div>
        <div v-else-if="siteData?.siteConfig?.profileName" class="mb-8">
          <div class="w-32 h-32 mx-auto rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center">
            <svg class="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>
        <h2 class="text-4xl font-bold text-white mb-4">
          Welcome to {{ siteData?.siteConfig?.siteName || siteData?.project?.name }}
        </h2>
        <p v-if="siteData?.siteConfig?.profileBio || siteData.project.description" class="text-xl text-slate-300 max-w-3xl mx-auto">
          {{ siteData?.siteConfig?.profileBio || siteData.project.description }}
        </p>
      </div>

      <!-- Masonry Grid -->
      <div v-if="hasContent" class="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        <!-- Projects -->
        <div 
          v-for="project in siteData.content.projects" 
          :key="project.id"
          class="break-inside-avoid bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow mb-8 border border-slate-700"
        >
          <div class="aspect-w-16 aspect-h-9 mb-4 bg-slate-700 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center bg-blue-600">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <p class="text-sm text-slate-400">Project</p>
            </div>
          </div>
          <h4 class="text-lg font-semibold mb-2 text-white">{{ project.title }}</h4>
          <p v-if="project.excerpt" class="text-slate-300 mb-4 text-sm">{{ project.excerpt }}</p>
          <NuxtLink 
            :to="`/project/${project.slug}`"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            View Project
          </NuxtLink>
        </div>

        <!-- Blog Posts -->
        <div 
          v-for="blog in siteData.content.blogs" 
          :key="blog.id"
          class="break-inside-avoid bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow mb-8 border border-slate-700"
        >
          <div class="aspect-w-16 aspect-h-9 mb-4 bg-slate-700 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center bg-purple-600">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <p class="text-sm text-slate-400">Blog Post</p>
            </div>
          </div>
          <h4 class="text-lg font-semibold mb-2 text-white">{{ blog.title }}</h4>
          <p v-if="blog.excerpt" class="text-slate-300 mb-4 text-sm">{{ blog.excerpt }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500">{{ new Date(blog.createdAt).toLocaleDateString() }}</span>
            <NuxtLink 
              :to="`/blog/${blog.slug}`"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              Read More
            </NuxtLink>
          </div>
        </div>

        <!-- Experiences -->
        <div 
          v-for="experience in siteData.content.experiences" 
          :key="experience.id"
          class="break-inside-avoid bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow mb-8 border border-slate-700"
        >
          <div class="aspect-w-16 aspect-h-9 mb-4 bg-slate-700 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center bg-amber-600">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
                </svg>
              </div>
              <p class="text-sm text-slate-400">Experience</p>
            </div>
          </div>
          <h4 class="text-lg font-semibold mb-2 text-white">{{ experience.title }}</h4>
          <p v-if="experience.excerpt" class="text-slate-300 mb-4 text-sm">{{ experience.excerpt }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500">{{ new Date(experience.createdAt).toLocaleDateString() }}</span>
            <NuxtLink 
              :to="`/experience/${experience.slug}`"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-colors"
            >
              Learn More
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
          <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">No Content Yet</h3>
        <p class="text-slate-300 mb-6">This site is ready to showcase your projects, blog posts, and experiences.</p>
        <a 
          href="https://foligo.tech"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Add Content
        </a>
      </div>

      <!-- Call to Action -->
      <div class="text-center mt-12">
        <NuxtLink 
          to="/contact"
          class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          Get In Touch
        </NuxtLink>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-slate-800 border-t border-slate-700 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  console.error('Profile image URL:', props.siteData?.siteConfig?.profileImage)
  showProfileImage.value = false
}

const handleImageLoad = () => {
  console.log('Profile image loaded successfully:', props.siteData?.siteConfig?.profileImage)
  showProfileImage.value = true
}

const hasContent = computed(() => {
  const content = props.siteData?.content
  return content?.projects?.length || content?.blogs?.length || content?.experiences?.length || content?.other?.length
})
</script>
