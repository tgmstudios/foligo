<template>
  <div class="martinez-portfolio min-h-screen bg-black text-white">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 h-16 bg-black z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
        <!-- Logo -->
        <div class="text-xl font-mono">
          {{ siteData.siteConfig.siteName }}®
        </div>

        <!-- Social Links -->
        <nav class="flex space-x-6">
          <a 
            v-for="social in socialLinks" 
            :key="social.type"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-white hover:text-gray-300 transition-colors"
            :aria-label="social.type"
          >
            <component :is="social.icon" class="w-5 h-5" />
          </a>
        </nav>
      </div>
    </header>

    <!-- Intro Panel -->
    <section class="h-screen pt-16 flex items-center justify-center bg-black">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl md:text-6xl font-mono mb-4">
          HI, WELCOME HOME<br>
          IT'S ME — {{ siteData.siteConfig.siteName }}®
        </h1>
        
        <!-- Marquee -->
        <div class="overflow-hidden whitespace-nowrap mt-8">
          <div class="animate-marquee inline-block">
            <span v-for="(keyword, index) in keywords" :key="index" class="mx-4 text-lg uppercase">
              {{ keyword }}
            </span>
          </div>
          <div class="animate-marquee2 inline-block">
            <span v-for="(keyword, index) in keywords" :key="index" class="mx-4 text-lg uppercase">
              {{ keyword }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Works -->
    <section class="py-24">
      <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div 
          v-for="project in projects" 
          :key="project.id"
          class="group relative aspect-square overflow-hidden"
          @click="openProject(project)"
        >
          <!-- Project Image -->
          <img 
            :src="project.thumbnail" 
            :alt="project.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          >

          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div class="text-center">
              <h3 class="text-xl font-mono uppercase mb-2">{{ project.title }}</h3>
              <div class="flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <div class="fixed bottom-0 left-0 right-0 bg-black border-t border-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-end">
        <a 
          :href="'mailto:' + contactEmail"
          class="text-white hover:text-gray-300 transition-colors font-mono text-lg"
        >
          LET'S TALK
        </a>
      </div>
    </div>

    <!-- Project Modal -->
    <div 
      v-if="selectedProject"
      class="fixed inset-0 bg-black z-50 overflow-y-auto"
      @click.self="closeProject"
    >
      <div class="min-h-screen">
        <!-- Close Button -->
        <button 
          @click="closeProject"
          class="fixed top-4 right-4 text-white hover:text-gray-300 z-50"
          aria-label="Close modal"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Project Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 class="text-3xl font-mono uppercase mb-6">{{ selectedProject.title }}</h2>
              <div class="prose prose-invert max-w-none">
                <div v-html="selectedProject.content"></div>
              </div>
              <div class="mt-8 space-y-2 text-sm">
                <div><strong>Client:</strong> {{ selectedProject.metadata?.client }}</div>
                <div><strong>Role:</strong> {{ selectedProject.metadata?.role }}</div>
                <div><strong>Year:</strong> {{ selectedProject.metadata?.year }}</div>
              </div>
            </div>
            <div class="space-y-8">
              <img 
                v-for="(image, index) in selectedProject.images" 
                :key="index"
                :src="image"
                :alt="`${selectedProject.title} - Image ${index + 1}`"
                class="w-full"
              >
            </div>
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

const keywords = computed(() => 
  props.siteData.siteConfig.keywords || [
    'Designer',
    'Art Direction',
    'Creative',
    'Digital',
    'Interactive',
    'Motion'
  ]
)

const projects = computed(() => 
  props.contentData.projects?.map(project => ({
    id: project.id,
    title: project.title,
    description: project.excerpt,
    thumbnail: project.thumbnail,
    content: project.content,
    metadata: project.metadata,
    images: project.metadata?.images || [project.thumbnail]
  })) || []
)

const contactEmail = computed(() => 
  props.siteData.siteConfig.contactEmail || 'hello@example.com'
)

// Methods
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
.martinez-portfolio {
  font-family: var(--font-mono);
}

/* Marquee animation */
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

.animate-marquee {
  animation: marquee 20s linear infinite;
}

.animate-marquee2 {
  animation: marquee 20s linear infinite;
  animation-delay: 10s;
}

/* Project hover effect */
.group:hover .transition-transform {
  transform: scale(1.05);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Prose overrides for dark theme */
:deep(.prose) {
  color: white;
}

:deep(.prose strong) {
  color: white;
}

:deep(.prose a) {
  color: white;
  text-decoration: underline;
}
</style>