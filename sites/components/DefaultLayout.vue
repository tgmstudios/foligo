<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <NuxtLink to="/blog" class="text-gray-700 hover:text-gray-900">Blog</NuxtLink>
            <NuxtLink to="/experience" class="text-gray-700 hover:text-gray-900">Experience</NuxtLink>
            <NuxtLink to="/contact" class="text-gray-700 hover:text-gray-900">Contact</NuxtLink>
          </nav>
          
          <!-- Mobile menu button -->
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Mobile menu dropdown -->
      <div v-if="mobileMenuOpen" class="md:hidden border-t bg-white">
        <div class="px-4 py-2 space-y-1">
          <NuxtLink to="/" class="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">Home</NuxtLink>
          <NuxtLink to="/projects" class="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">Projects</NuxtLink>
          <NuxtLink to="/blog" class="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">Blog</NuxtLink>
          <NuxtLink to="/experience" class="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">Experience</NuxtLink>
          <NuxtLink to="/contact" class="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">Contact</NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Welcome to {{ siteData.siteConfig.siteName || siteData.project.name }}
        </h2>
        <p v-if="siteData.project.description" class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ siteData.project.description }}
        </p>
      </div>

      <!-- Content Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div v-if="siteData.content.projects?.length" class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" :style="{ backgroundColor: siteData.siteConfig.primaryColor }">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ siteData.content.projects.length }} Projects</h3>
          <p class="text-gray-600 mb-4">Explore my latest work</p>
          <NuxtLink 
            to="/projects"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
            :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
          >
            View Projects
          </NuxtLink>
        </div>

        <div v-if="siteData.content.blogs?.length" class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" :style="{ backgroundColor: siteData.siteConfig.secondaryColor }">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ siteData.content.blogs.length }} Blog Posts</h3>
          <p class="text-gray-600 mb-4">Read my latest thoughts</p>
          <NuxtLink 
            to="/blog"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
            :style="{ backgroundColor: siteData.siteConfig.secondaryColor }"
          >
            Read Blog
          </NuxtLink>
        </div>

        <div v-if="siteData.content.experiences?.length" class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" :style="{ backgroundColor: siteData.siteConfig.accentColor }">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">{{ siteData.content.experiences.length }} Experiences</h3>
          <p class="text-gray-600 mb-4">Learn about my journey</p>
          <NuxtLink 
            to="/experience"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
            :style="{ backgroundColor: siteData.siteConfig.accentColor }"
          >
            View Experience
          </NuxtLink>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="text-center">
        <NuxtLink 
          to="/contact"
          class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
          :style="{ backgroundColor: siteData.siteConfig.accentColor }"
        >
          Get In Touch
        </NuxtLink>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-50 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
defineProps({
  siteData: {
    type: Object,
    required: true
  },
  route: {
    type: Object,
    required: true
  }
})
</script>
