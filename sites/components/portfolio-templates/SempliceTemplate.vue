<template>
  <div class="semplice-portfolio min-h-screen bg-white text-gray-900">
    <!-- Navigation -->
    <nav 
      class="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
      :class="{ 'bg-white': isScrolled }"
    >
      <div class="max-w-screen-2xl mx-auto px-8">
        <div class="flex justify-between items-center h-20">
          <!-- Logo -->
          <div class="text-lg tracking-tight">
            {{ siteData.siteConfig.siteName }}
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-12">
            <a 
              v-for="link in navigationLinks" 
              :key="link.id"
              :href="link.href"
              class="text-sm tracking-wide hover:text-gray-500 transition-colors"
            >
              {{ link.label }}
            </a>
          </div>

          <!-- Menu Button (Mobile) -->
          <button 
            class="md:hidden"
            @click="toggleMenu"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Menu -->
    <div 
      v-if="isMenuOpen"
      class="fixed inset-0 bg-white z-40 md:hidden"
    >
      <div class="flex flex-col h-full">
        <div class="flex justify-between items-center h-20 px-8">
          <div class="text-lg tracking-tight">
            {{ siteData.siteConfig.siteName }}
          </div>
          <button 
            @click="toggleMenu"
            aria-label="Close menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 flex flex-col justify-center items-center space-y-8">
          <a 
            v-for="link in navigationLinks" 
            :key="link.id"
            :href="link.href"
            class="text-2xl tracking-wide"
            @click="toggleMenu"
          >
            {{ link.label }}
          </a>
        </div>
      </div>
    </div>

    <!-- Hero Section -->
    <section class="min-h-screen pt-20 flex items-center">
      <div class="max-w-screen-2xl mx-auto px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 class="text-4xl md:text-6xl font-light leading-tight mb-8">
              {{ siteData.siteConfig.heroTitle || 'Design & Art Direction' }}
            </h1>
            <p class="text-xl text-gray-600 leading-relaxed">
              {{ siteData.siteConfig.heroText }}
            </p>
          </div>
          <div class="aspect-square">
            <img 
              :src="heroImage" 
              alt="Hero"
              class="w-full h-full object-cover"
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Projects Grid -->
    <section class="py-24">
      <div class="max-w-screen-2xl mx-auto px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div 
            v-for="project in projects" 
            :key="project.id"
            class="group cursor-pointer"
            @click="openProject(project)"
          >
            <!-- Project Image -->
            <div class="aspect-[4/3] overflow-hidden mb-6">
              <img 
                :src="project.thumbnail" 
                :alt="project.title"
                class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              >
            </div>
            
            <!-- Project Info -->
            <h3 class="text-2xl font-light mb-2">{{ project.title }}</h3>
            <p class="text-gray-600">{{ project.metadata?.category }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-24 bg-gray-50">
      <div class="max-w-screen-2xl mx-auto px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 class="text-3xl font-light mb-8">About</h2>
            <div class="prose prose-lg">
              <div v-html="siteData.siteConfig.about"></div>
            </div>
          </div>
          <div>
            <!-- Experience -->
            <div v-if="experience.length" class="mb-16">
              <h3 class="text-xl font-light mb-6">Experience</h3>
              <ul class="space-y-8">
                <li v-for="item in experience" :key="item.company">
                  <div class="text-lg">{{ item.company }}</div>
                  <div class="text-gray-600">{{ item.role }}</div>
                  <div class="text-sm text-gray-500 mt-1">{{ item.period }}</div>
                </li>
              </ul>
            </div>

            <!-- Services -->
            <div v-if="services.length">
              <h3 class="text-xl font-light mb-6">Services</h3>
              <ul class="grid grid-cols-2 gap-4">
                <li 
                  v-for="service in services" 
                  :key="service"
                  class="text-gray-600"
                >
                  {{ service }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="py-24">
      <div class="max-w-screen-2xl mx-auto px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 class="text-3xl font-light mb-8">Contact</h2>
            <p class="text-xl text-gray-600 mb-8">
              {{ siteData.siteConfig.contactText || 'Interested in working together? Let's discuss your project.' }}
            </p>
            <a 
              :href="'mailto:' + contactEmail"
              class="text-xl hover:text-gray-600 transition-colors"
            >
              {{ contactEmail }}
            </a>
          </div>
          <div class="space-y-8">
            <!-- Location -->
            <div v-if="location">
              <div class="text-sm text-gray-500 mb-1">Location</div>
              <div>{{ location }}</div>
            </div>

            <!-- Social Links -->
            <div class="space-y-4">
              <div class="text-sm text-gray-500">Connect</div>
              <div class="flex space-x-6">
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
          </div>
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
          class="fixed top-8 right-8 text-gray-400 hover:text-gray-600 z-50"
          aria-label="Close modal"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Project Content -->
        <div class="max-w-screen-xl mx-auto px-8 py-32">
          <!-- Project Header -->
          <div class="max-w-3xl mb-16">
            <h2 class="text-4xl font-light mb-8">{{ selectedProject.title }}</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div v-if="selectedProject.metadata?.client">
                <div class="text-sm text-gray-500 mb-1">Client</div>
                <div>{{ selectedProject.metadata.client }}</div>
              </div>
              <div v-if="selectedProject.metadata?.year">
                <div class="text-sm text-gray-500 mb-1">Year</div>
                <div>{{ selectedProject.metadata.year }}</div>
              </div>
              <div v-if="selectedProject.metadata?.role">
                <div class="text-sm text-gray-500 mb-1">Role</div>
                <div>{{ selectedProject.metadata.role }}</div>
              </div>
              <div v-if="selectedProject.metadata?.category">
                <div class="text-sm text-gray-500 mb-1">Category</div>
                <div>{{ selectedProject.metadata.category }}</div>
              </div>
            </div>
          </div>

          <!-- Project Images -->
          <div class="space-y-24">
            <img 
              v-for="(image, index) in selectedProject.images" 
              :key="index"
              :src="image"
              :alt="`${selectedProject.title} - Image ${index + 1}`"
              class="w-full"
            >
          </div>

          <!-- Project Description -->
          <div class="max-w-3xl mx-auto mt-24">
            <div class="prose prose-lg">
              <div v-html="selectedProject.content"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

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
const isMenuOpen = ref(false)
const isScrolled = ref(false)

// Computed
const navigationLinks = computed(() => [
  { id: 'projects', label: 'Projects', href: '#projects' },
  { id: 'about', label: 'About', href: '#about' },
  { id: 'contact', label: 'Contact', href: '#contact' }
])

const heroImage = computed(() => 
  props.siteData.siteConfig.heroImage || props.siteData.siteConfig.headerImage
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

const experience = computed(() => 
  props.siteData.siteConfig.experience || []
)

const services = computed(() => 
  props.siteData.siteConfig.services || []
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

const location = computed(() => 
  props.siteData.siteConfig.location
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

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  document.body.style.overflow = isMenuOpen.value ? 'hidden' : ''
}

// Scroll handling
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.semplice-portfolio {
  font-family: var(--font-sans);
}

/* Navigation transition */
.nav-scrolled {
  @apply shadow-sm;
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

/* Project hover effect */
.group:hover .transition-transform {
  transform: scale(1.05);
}

/* Typography */
.font-light {
  font-weight: 300;
}

/* Prose customization */
:deep(.prose) {
  max-width: none;
}

:deep(.prose) h1,
:deep(.prose) h2,
:deep(.prose) h3,
:deep(.prose) h4 {
  font-weight: 300;
}
</style>