<template>
  <div class="bao-portfolio min-h-screen bg-white text-gray-900">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="text-lg font-light tracking-wide">
            {{ siteData.siteConfig.siteName }}
          </div>
          <div class="hidden md:flex space-x-8">
            <a 
              v-for="link in navigationLinks" 
              :key="link.id"
              :href="link.href"
              class="text-sm tracking-wider hover:text-gray-600 transition-colors"
            >
              {{ link.label }}
            </a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-32 pb-24">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-5xl md:text-7xl font-light leading-tight mb-8">
          {{ siteData.siteConfig.heroTitle || 'Creative Direction & Design' }}
        </h1>
        <div class="max-w-2xl text-lg text-gray-600 leading-relaxed">
          {{ siteData.siteConfig.heroText }}
        </div>
      </div>
    </section>

    <!-- Projects Grid -->
    <section class="pb-24">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <div 
            v-for="project in projects" 
            :key="project.id"
            class="group cursor-pointer"
            @click="openProject(project)"
          >
            <!-- Project Image -->
            <div class="aspect-[4/3] overflow-hidden mb-4">
              <img 
                :src="project.thumbnail" 
                :alt="project.title"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              >
            </div>
            
            <!-- Project Info -->
            <h3 class="text-xl font-light mb-2">{{ project.title }}</h3>
            <p class="text-sm text-gray-600">{{ project.metadata?.category || 'Project' }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-24 bg-gray-50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
          <div>
            <h2 class="text-3xl font-light mb-6">About</h2>
            <div class="prose prose-lg">
              <div v-html="siteData.siteConfig.about"></div>
            </div>
          </div>
          <div class="space-y-12">
            <!-- Experience -->
            <div v-if="experience.length">
              <h3 class="text-xl font-light mb-4">Experience</h3>
              <ul class="space-y-4">
                <li v-for="item in experience" :key="item.company" class="text-sm">
                  <div class="font-medium">{{ item.company }}</div>
                  <div class="text-gray-600">{{ item.role }}</div>
                  <div class="text-gray-500">{{ item.period }}</div>
                </li>
              </ul>
            </div>

            <!-- Clients -->
            <div v-if="clients.length">
              <h3 class="text-xl font-light mb-4">Select Clients</h3>
              <ul class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <li v-for="client in clients" :key="client">{{ client }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section class="py-24">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-light mb-8">Get in Touch</h2>
        <a 
          :href="'mailto:' + contactEmail"
          class="text-lg hover:text-gray-600 transition-colors"
        >
          {{ contactEmail }}
        </a>
        <div class="mt-12 flex justify-center space-x-8">
          <a 
            v-for="social in socialLinks" 
            :key="social.type"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <component :is="social.icon" class="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>

    <!-- Project Modal -->
    <div 
      v-if="selectedProject"
      class="fixed inset-0 bg-white z-50 overflow-y-auto"
    >
      <div class="min-h-screen">
        <!-- Close Button -->
        <button 
          @click="closeProject"
          class="fixed top-4 right-4 text-gray-400 hover:text-gray-600 z-50 p-2"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Project Content -->
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div class="max-w-3xl mx-auto">
            <h2 class="text-4xl font-light mb-4">{{ selectedProject.title }}</h2>
            <div class="grid grid-cols-2 gap-8 text-sm mb-12">
              <div v-if="selectedProject.metadata?.client">
                <div class="text-gray-500 mb-1">Client</div>
                <div>{{ selectedProject.metadata.client }}</div>
              </div>
              <div v-if="selectedProject.metadata?.year">
                <div class="text-gray-500 mb-1">Year</div>
                <div>{{ selectedProject.metadata.year }}</div>
              </div>
              <div v-if="selectedProject.metadata?.role">
                <div class="text-gray-500 mb-1">Role</div>
                <div>{{ selectedProject.metadata.role }}</div>
              </div>
              <div v-if="selectedProject.metadata?.category">
                <div class="text-gray-500 mb-1">Category</div>
                <div>{{ selectedProject.metadata.category }}</div>
              </div>
            </div>
          </div>

          <!-- Project Images -->
          <div class="space-y-12">
            <img 
              v-for="(image, index) in selectedProject.images" 
              :key="index"
              :src="image"
              :alt="`${selectedProject.title} - Image ${index + 1}`"
              class="w-full"
            >
          </div>

          <!-- Project Description -->
          <div class="max-w-3xl mx-auto mt-12">
            <div class="prose prose-lg max-w-none">
              <div v-html="selectedProject.content"></div>
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
const navigationLinks = computed(() => [
  { id: 'work', label: 'Work', href: '#work' },
  { id: 'about', label: 'About', href: '#about' },
  { id: 'contact', label: 'Contact', href: '#contact' }
])

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

const experience = computed(() => 
  props.siteData.siteConfig.experience || []
)

const clients = computed(() => 
  props.siteData.siteConfig.clients || []
)

const socialLinks = computed(() => {
  const links = props.siteData.siteConfig.socialLinks || []
  return links.map(link => ({
    type: link.type,
    url: link.url,
    icon: `Icon${link.type}`
  }))
})

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
.bao-portfolio {
  font-family: var(--font-sans);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Hover effects */
.group:hover img {
  transform: scale(1.05);
}

/* Typography adjustments */
.font-light {
  font-weight: 300;
}

/* Prose customization */
:deep(.prose) {
  font-weight: 300;
}

:deep(.prose strong) {
  font-weight: 500;
}
</style>