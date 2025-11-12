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
            <NuxtLink to="/projects" class="text-blue-600 font-medium">Projects</NuxtLink>
            <NuxtLink v-if="siteData.content.blogs?.length" to="/blog" class="text-gray-700 hover:text-gray-900">Blog</NuxtLink>
            <NuxtLink v-if="siteData.content.experiences?.length" to="/experience" class="text-gray-700 hover:text-gray-900">Experience</NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">Projects</h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Explore my portfolio of projects and creative work
        </p>
      </div>

      <!-- Projects Grid -->
      <div v-if="siteData.content.projects?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div 
          v-for="project in siteData.content.projects" 
          :key="project.id"
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <!-- Project Image Placeholder -->
          <div class="aspect-w-16 aspect-h-9 mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center" :style="{ backgroundColor: siteData.siteConfig.primaryColor }">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <p class="text-sm text-gray-500">Project</p>
            </div>
          </div>
          
          <h3 class="text-xl font-semibold mb-3">{{ project.title }}</h3>
          <p v-if="project.excerpt" class="text-gray-600 mb-4">{{ project.excerpt }}</p>
          
          <!-- Project Metadata -->
          <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span>{{ new Date(project.createdAt).toLocaleDateString() }}</span>
            <span class="capitalize">{{ project.contentType.toLowerCase() }}</span>
          </div>
          
          <NuxtLink 
            :to="`/project/${project.slug}`"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
            :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
          >
            View Project
          </NuxtLink>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
        <p class="text-gray-600">Projects will appear here when they're published.</p>
      </div>

      <!-- Back to Home -->
      <div class="text-center mt-12">
        <NuxtLink 
          to="/"
          class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Back to Home
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
