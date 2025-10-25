<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Welcome to {{ siteData.siteConfig.siteName || siteData.project.name }}
        </h2>
        <p v-if="siteData.project.description" class="text-xl text-gray-600 max-w-3xl mx-auto">
          {{ siteData.project.description }}
        </p>
      </div>

      <!-- Content List -->
      <div v-if="hasContent" class="space-y-8">
        <!-- Projects -->
        <div v-if="siteData.content.projects?.length" class="space-y-6">
          <h3 class="text-2xl font-bold" :style="{ color: siteData.siteConfig.primaryColor }">Projects</h3>
          <div class="space-y-6">
            <div 
              v-for="project in siteData.content.projects" 
              :key="project.id"
              class="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-l-4"
              :style="{ borderLeftColor: siteData.siteConfig.primaryColor }"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="text-xl font-semibold mb-3">{{ project.title }}</h4>
                  <p v-if="project.excerpt" class="text-gray-600 mb-4">{{ project.excerpt }}</p>
                  <div class="flex items-center text-sm text-gray-500">
                    <span>{{ new Date(project.createdAt).toLocaleDateString() }}</span>
                  </div>
                </div>
                <NuxtLink 
                  :to="`/project/${project.slug}`"
                  class="ml-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                  :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
                >
                  View Project
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Blog Posts -->
        <div v-if="siteData.content.blogs?.length" class="space-y-6">
          <h3 class="text-2xl font-bold" :style="{ color: siteData.siteConfig.primaryColor }">Blog Posts</h3>
          <div class="space-y-6">
            <div 
              v-for="blog in siteData.content.blogs" 
              :key="blog.id"
              class="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-l-4"
              :style="{ borderLeftColor: siteData.siteConfig.secondaryColor }"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="text-xl font-semibold mb-3">{{ blog.title }}</h4>
                  <p v-if="blog.excerpt" class="text-gray-600 mb-4">{{ blog.excerpt }}</p>
                  <div class="flex items-center text-sm text-gray-500">
                    <span>{{ new Date(blog.createdAt).toLocaleDateString() }}</span>
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
            </div>
          </div>
        </div>

        <!-- Experiences -->
        <div v-if="siteData.content.experiences?.length" class="space-y-6">
          <h3 class="text-2xl font-bold" :style="{ color: siteData.siteConfig.primaryColor }">Experience</h3>
          <div class="space-y-6">
            <div 
              v-for="experience in siteData.content.experiences" 
              :key="experience.id"
              class="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow border-l-4"
              :style="{ borderLeftColor: siteData.siteConfig.accentColor }"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="text-xl font-semibold mb-3">{{ experience.title }}</h4>
                  <p v-if="experience.excerpt" class="text-gray-600 mb-4">{{ experience.excerpt }}</p>
                  <div class="flex items-center text-sm text-gray-500">
                    <span>{{ new Date(experience.createdAt).toLocaleDateString() }}</span>
                  </div>
                </div>
                <NuxtLink 
                  :to="`/experience/${experience.slug}`"
                  class="ml-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                  :style="{ backgroundColor: siteData.siteConfig.accentColor }"
                >
                  Learn More
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
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
