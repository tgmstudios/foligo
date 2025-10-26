<template>
  <div class="guglieri-portfolio min-h-screen bg-white">
    <!-- Fixed Header -->
    <header class="guglieri-header fixed top-0 left-0 right-0 h-[80px] z-50 bg-black">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
        <!-- Name -->
        <h1 class="text-white font-serif text-xl">
          {{ siteData.siteConfig.siteName || siteData.project.name }}
        </h1>

        <!-- Social Icons - Desktop -->
        <nav class="hidden md:flex space-x-6">
          <template v-for="social in socialLinks" :key="social.type">
            <a 
              :href="social.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-white hover:text-gray-300 transition-colors"
              :aria-label="social.type"
            >
              <component :is="social.icon" class="w-5 h-5" />
            </a>
          </template>
        </nav>

        <!-- Mobile Menu Button -->
        <button 
          class="md:hidden text-white p-2"
          @click="toggleMobileMenu"
          aria-label="Toggle menu"
        >
          <div class="w-6 h-0.5 bg-white mb-1.5"></div>
          <div class="w-6 h-0.5 bg-white mb-1.5"></div>
          <div class="w-6 h-0.5 bg-white"></div>
        </button>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    <div 
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-black bg-opacity-90 z-40 md:hidden"
      @click="toggleMobileMenu"
    >
      <nav class="flex flex-col items-center justify-center h-full space-y-8">
        <template v-for="social in socialLinks" :key="social.type">
          <a 
            :href="social.url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-white hover:text-gray-300 transition-colors text-xl"
            :aria-label="social.type"
          >
            {{ social.type }}
          </a>
        </template>
      </nav>
    </div>

    <!-- Main Content -->
    <main class="pt-[80px]">
      <!-- Hero/Intro -->
      <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 class="font-serif text-4xl md:text-5xl mb-6 leading-tight">
          {{ introPhrase }}
        </h2>
        <p class="text-lg text-gray-600 mb-8">
          {{ biographyText }}
        </p>
        <hr class="border-t border-gray-200">
      </section>

      <!-- Works Grid -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <template v-for="project in projects" :key="project.id">
            <div 
              class="work-item group transition-transform duration-200 hover:scale-[1.02]"
              @click="openProject(project)"
            >
              <div class="relative aspect-[4/3] mb-4 overflow-hidden">
                <img 
                  :src="project.thumbnail" 
                  :alt="project.title"
                  class="w-full h-full object-cover"
                >
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200"></div>
              </div>
              <h3 class="font-sans font-bold text-lg mb-1">{{ project.title }}</h3>
              <p class="text-sm text-gray-600">{{ project.tagline }}</p>
              <p class="text-sm text-gray-400">{{ project.date }}</p>
            </div>
          </template>
        </div>
      </section>

      <!-- Footer/Contact -->
      <footer class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <a 
          :href="'mailto:' + contactEmail"
          class="text-xl font-bold hover:text-gray-600 transition-colors inline-flex items-center group"
        >
          Let's collaborate
          <svg 
            class="w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>
      </footer>
    </main>

    <!-- Project Modal -->
    <div 
      v-if="selectedProject"
      class="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto"
      @click.self="closeProject"
    >
      <div class="min-h-screen flex items-center justify-center p-4">
        <div class="bg-white max-w-4xl w-full rounded-lg p-8">
          <div class="flex justify-between items-start mb-6">
            <h2 class="text-3xl font-bold">{{ selectedProject.title }}</h2>
            <button 
              @click="closeProject"
              class="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="prose max-w-none">
            <img 
              :src="selectedProject.fullImage || selectedProject.thumbnail" 
              :alt="selectedProject.title"
              class="w-full rounded-lg mb-6"
            >
            <div v-html="selectedProject.description"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  siteData: {
    type: Object,
    required: true
  },
  contentData: {
    type: Object,
    required: true
  }
})

// State
const isMobileMenuOpen = ref(false)
const selectedProject = ref(null)

// Computed
const socialLinks = computed(() => {
  const links = props.siteData.siteConfig.socialLinks || []
  return links.map(link => ({
    type: link.type,
    url: link.url,
    icon: `Icon${link.type}` // You'll need to register these icons
  }))
})

const introPhrase = computed(() => 
  props.siteData.siteConfig.introPhrase || "Life is tough, say something nice"
)

const biographyText = computed(() => 
  props.contentData.biography || "Creative Director based in New York"
)

const contactEmail = computed(() => 
  props.siteData.siteConfig.contactEmail || "hello@example.com"
)

const projects = computed(() => 
  props.contentData.projects?.map(project => ({
    id: project.id,
    title: project.title,
    tagline: project.excerpt,
    thumbnail: project.thumbnail,
    fullImage: project.fullImage,
    description: project.content,
    date: new Date(project.createdAt).toLocaleDateString()
  })) || []
)

// Methods
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const openProject = (project) => {
  selectedProject.value = project
  document.body.style.overflow = 'hidden'
}

const closeProject = () => {
  selectedProject.value = null
  document.body.style.overflow = ''
}
</script>

<style scoped>
.guglieri-portfolio {
  font-family: system-ui, -apple-system, sans-serif;
}

.guglieri-header {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Fade-in animation */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.work-item {
  animation: fadeIn 0.6s ease-out;
}

/* Scale animation on scroll (you'll need to implement intersection observer) */
.work-item.in-view {
  animation: scaleUp 0.4s ease-out forwards;
}

@keyframes scaleUp {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>