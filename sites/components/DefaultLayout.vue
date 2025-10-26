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
        <p v-if="siteData?.siteConfig?.profileBio || siteData?.project?.description" class="text-xl text-slate-300 max-w-3xl mx-auto">
          {{ siteData?.siteConfig?.profileBio || siteData?.project?.description }}
        </p>
      </div>

      <!-- Content Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div v-if="siteData?.content?.projects?.length" class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-600">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-white">{{ siteData?.content?.projects?.length }} Projects</h3>
          <p class="text-slate-400 mb-4">Explore my latest work</p>
          <NuxtLink 
            to="/projects"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            View Projects
          </NuxtLink>
        </div>

        <div v-if="siteData?.content?.blogs?.length" class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-purple-600">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-white">{{ siteData?.content?.blogs?.length }} Blog Posts</h3>
          <p class="text-slate-400 mb-4">Read my latest thoughts</p>
          <NuxtLink 
            to="/blog"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            Read Blog
          </NuxtLink>
        </div>

        <div v-if="siteData?.content?.experiences?.length" class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-amber-600">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-white">{{ siteData?.content?.experiences?.length }} Experiences</h3>
          <p class="text-slate-400 mb-4">Learn about my journey</p>
          <NuxtLink 
            to="/experience"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-colors"
          >
            View Experience
          </NuxtLink>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="text-center">
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
import { ref } from 'vue'

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
</script>
