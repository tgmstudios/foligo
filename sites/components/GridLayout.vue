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

      <!-- Content Grid -->
      <div v-if="hasContent" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Projects -->
        <div v-if="siteData.content.projects?.length" class="space-y-6">
          <h3 class="text-2xl font-bold" :style="{ color: siteData.siteConfig.primaryColor }">Projects</h3>
          <div class="space-y-4">
            <div 
              v-for="project in siteData.content.projects.slice(0, 3)" 
              :key="project.id"
              class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h4 class="text-lg font-semibold mb-2">{{ project.title }}</h4>
              <p v-if="project.excerpt" class="text-gray-600 mb-4">{{ project.excerpt }}</p>
              <NuxtLink 
                :to="`/project/${project.slug}`"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
              >
                View Project
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Blog Posts -->
        <div v-if="siteData.content.blogs?.length" class="space-y-6">
          <h3 class="text-2xl font-bold" :style="{ color: siteData.siteConfig.primaryColor }">Latest Posts</h3>
          <div class="space-y-4">
            <div 
              v-for="blog in siteData.content.blogs.slice(0, 3)" 
              :key="blog.id"
              class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h4 class="text-lg font-semibold mb-2">{{ blog.title }}</h4>
              <p v-if="blog.excerpt" class="text-gray-600 mb-4">{{ blog.excerpt }}</p>
              <NuxtLink 
                :to="`/blog/${blog.slug}`"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
              >
                Read More
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Experiences -->
        <div v-if="siteData.content.experiences?.length" class="space-y-6">
          <h3 class="text-2xl font-bold" :style="{ color: siteData.siteConfig.primaryColor }">Experience</h3>
          <div class="space-y-4">
            <div 
              v-for="experience in siteData.content.experiences.slice(0, 3)" 
              :key="experience.id"
              class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h4 class="text-lg font-semibold mb-2">{{ experience.title }}</h4>
              <p v-if="experience.excerpt" class="text-gray-600 mb-4">{{ experience.excerpt }}</p>
              <NuxtLink 
                :to="`/experience/${experience.slug}`"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
              >
                Learn More
              </NuxtLink>
            </div>
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
