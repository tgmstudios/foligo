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

      <!-- Masonry Grid -->
      <div v-if="hasContent" class="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        <!-- Projects -->
        <div 
          v-for="project in siteData.content.projects" 
          :key="project.id"
          class="break-inside-avoid bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow mb-8"
        >
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
          <h4 class="text-lg font-semibold mb-2">{{ project.title }}</h4>
          <p v-if="project.excerpt" class="text-gray-600 mb-4 text-sm">{{ project.excerpt }}</p>
          <NuxtLink 
            :to="`/project/${project.slug}`"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
            :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
          >
            View Project
          </NuxtLink>
        </div>

        <!-- Blog Posts -->
        <div 
          v-for="blog in siteData.content.blogs" 
          :key="blog.id"
          class="break-inside-avoid bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow mb-8"
        >
          <div class="aspect-w-16 aspect-h-9 mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center" :style="{ backgroundColor: siteData.siteConfig.secondaryColor }">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <p class="text-sm text-gray-500">Blog Post</p>
            </div>
          </div>
          <h4 class="text-lg font-semibold mb-2">{{ blog.title }}</h4>
          <p v-if="blog.excerpt" class="text-gray-600 mb-4 text-sm">{{ blog.excerpt }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">{{ new Date(blog.createdAt).toLocaleDateString() }}</span>
            <NuxtLink 
              :to="`/blog/${blog.slug}`"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
              :style="{ backgroundColor: siteData.siteConfig.secondaryColor }"
            >
              Read More
            </NuxtLink>
          </div>
        </div>

        <!-- Experiences -->
        <div 
          v-for="experience in siteData.content.experiences" 
          :key="experience.id"
          class="break-inside-avoid bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow mb-8"
        >
          <div class="aspect-w-16 aspect-h-9 mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center" :style="{ backgroundColor: siteData.siteConfig.accentColor }">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
                </svg>
              </div>
              <p class="text-sm text-gray-500">Experience</p>
            </div>
          </div>
          <h4 class="text-lg font-semibold mb-2">{{ experience.title }}</h4>
          <p v-if="experience.excerpt" class="text-gray-600 mb-4 text-sm">{{ experience.excerpt }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">{{ new Date(experience.createdAt).toLocaleDateString() }}</span>
            <NuxtLink 
              :to="`/experience/${experience.slug}`"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
              :style="{ backgroundColor: siteData.siteConfig.accentColor }"
            >
              Learn More
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Content Yet</h3>
        <p class="text-gray-600 mb-6">This site is ready to showcase your projects, blog posts, and experiences.</p>
        <a 
          href="https://app.foligo.tech"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
          :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
        >
          Add Content
        </a>
      </div>

      <!-- Call to Action -->
      <div class="text-center mt-12">
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
import { computed } from 'vue'

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

const hasContent = computed(() => {
  const content = props.siteData.content
  return content?.projects?.length || content?.blogs?.length || content?.experiences?.length || content?.other?.length
})
</script>
