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
            <NuxtLink v-if="siteData.content.projects?.length" to="/projects" class="text-gray-700 hover:text-gray-900">Projects</NuxtLink>
            <NuxtLink to="/blog" class="text-blue-600 font-medium">Blog</NuxtLink>
            <NuxtLink v-if="siteData.content.experiences?.length" to="/experience" class="text-gray-700 hover:text-gray-900">Experience</NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">Blog</h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Thoughts, insights, and stories from my journey
        </p>
      </div>

      <!-- Blog Posts List -->
      <div v-if="siteData.content.blogs?.length" class="space-y-8">
        <article 
          v-for="blog in siteData.content.blogs" 
          :key="blog.id"
          class="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-l-4"
          :style="{ borderLeftColor: siteData.siteConfig.secondaryColor }"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="text-2xl font-semibold mb-3">
                <NuxtLink 
                  :to="`/blog/${blog.slug}`"
                  class="text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {{ blog.title }}
                </NuxtLink>
              </h3>
              <p v-if="blog.excerpt" class="text-gray-600 mb-4 text-lg">{{ blog.excerpt }}</p>
              <div class="flex items-center text-sm text-gray-500">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>{{ new Date(blog.createdAt).toLocaleDateString() }}</span>
                <span class="mx-2">•</span>
                <span class="capitalize">{{ blog.contentType.toLowerCase() }}</span>
              </div>
            </div>
            <NuxtLink 
              :to="`/blog/${blog.slug}`"
              class="ml-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
              :style="{ backgroundColor: siteData.siteConfig.secondaryColor }"
            >
              Read More
            </NuxtLink>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Blog Posts Yet</h3>
        <p class="text-gray-600">Blog posts will appear here when they're published.</p>
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
