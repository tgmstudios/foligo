<template>
  <div class="analogue-portfolio min-h-screen bg-white">
    <!-- Fixed Navigation -->
    <header class="fixed top-0 left-0 right-0 h-[90px] bg-white z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
        <!-- Logo -->
        <div class="flex items-center">
          <img 
            :src="siteData.siteConfig.logo || '/default-logo.svg'" 
            :alt="siteData.siteConfig.siteName"
            class="h-8"
          >
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex space-x-8">
          <a href="#work" class="text-gray-900 hover:text-gray-600">Work</a>
          <a href="#about" class="text-gray-900 hover:text-gray-600">About</a>
          <a href="#pricing" class="text-gray-900 hover:text-gray-600">Pricing</a>
          <a href="#contact" class="text-gray-900 hover:text-gray-600">Contact</a>
        </nav>

        <!-- Mobile Menu Button -->
        <button 
          class="md:hidden text-gray-900 p-2"
          @click="toggleMobileMenu"
          aria-label="Toggle menu"
        >
          <div class="w-6 h-0.5 bg-gray-900 mb-2"></div>
          <div class="w-6 h-0.5 bg-gray-900"></div>
        </button>
      </div>
    </header>

    <!-- Mobile Menu Drawer -->
    <div 
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 md:hidden"
    >
      <!-- Overlay -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        @click="toggleMobileMenu"
      ></div>

      <!-- Drawer -->
      <div class="fixed inset-y-0 left-0 w-64 bg-white transform transition-transform duration-300">
        <div class="p-6">
          <div class="flex items-center justify-between mb-8">
            <img 
              :src="siteData.siteConfig.logo || '/default-logo.svg'" 
              :alt="siteData.siteConfig.siteName"
              class="h-6"
            >
            <button 
              @click="toggleMobileMenu"
              class="text-gray-500"
              aria-label="Close menu"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav class="space-y-6">
            <a 
              v-for="item in navigationItems" 
              :key="item.href"
              :href="item.href"
              class="block text-gray-900 hover:text-gray-600"
              @click="toggleMobileMenu"
            >
              {{ item.text }}
            </a>
          </nav>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="pt-[90px]">
      <!-- Hero Section -->
      <section 
        class="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-24"
        :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
      >
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-5xl md:text-6xl font-extrabold mb-6">
            Small Team, Big Results
          </h1>
          <p class="text-2xl md:text-3xl font-light opacity-90">
            {{ siteData.siteConfig.siteDescription }}
          </p>
        </div>
      </section>

      <!-- Services Grid -->
      <section class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              v-for="service in services" 
              :key="service.title"
              class="p-6 bg-white rounded-lg shadow-sm"
            >
              <div class="w-12 h-12 mb-4" v-html="service.icon"></div>
              <h3 class="text-xl font-bold mb-2">{{ service.title }}</h3>
              <p class="text-gray-600">{{ service.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Case Studies -->
      <section id="work" class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="relative overflow-hidden">
            <div 
              class="flex transition-transform duration-500"
              :style="{ transform: `translateX(-${activeSlide * 100}%)` }"
            >
              <div 
                v-for="(project, index) in projects" 
                :key="project.id"
                class="w-full flex-shrink-0 px-4"
              >
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                  <img 
                    :src="project.thumbnail" 
                    :alt="project.title"
                    class="w-full h-64 object-cover"
                  >
                  <div class="p-6">
                    <img 
                      :src="project.logo" 
                      :alt="project.title + ' logo'"
                      class="h-8 mb-4"
                    >
                    <h3 class="text-2xl font-bold mb-2">{{ project.title }}</h3>
                    <p class="text-gray-600 mb-4">{{ project.description }}</p>
                    <div class="text-lg font-semibold text-blue-600">
                      {{ project.result }}
                    </div>
                    <button 
                      @click="openProject(project)"
                      class="mt-4 text-blue-600 font-medium hover:text-blue-800"
                    >
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Carousel Controls -->
            <button 
              class="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
              @click="prevSlide"
              aria-label="Previous slide"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              class="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg"
              @click="nextSlide"
              aria-label="Next slide"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="py-24 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-4xl font-bold text-center mb-16">Transparent Pricing</h2>
          <ol class="space-y-8">
            <li 
              v-for="(step, index) in pricingSteps" 
              :key="index"
              class="flex items-start animate-slide-up"
              :style="{ animationDelay: `${index * 100}ms` }"
            >
              <span 
                class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-4"
              >
                {{ index + 1 }}
              </span>
              <div>
                <h3 class="text-xl font-bold mb-2">{{ step.title }}</h3>
                <p class="text-gray-600">{{ step.description }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <!-- Contact -->
      <section id="contact" class="py-24">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="bg-white rounded-lg shadow-xl overflow-hidden">
            <div class="p-8">
              <h2 class="text-3xl font-bold mb-8">Get Started</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 class="text-lg font-semibold mb-4">Contact Information</h3>
                  <div class="space-y-4">
                    <a 
                      :href="'mailto:' + contactEmail"
                      class="block text-blue-600 hover:text-blue-800"
                    >
                      {{ contactEmail }}
                    </a>
                    <p class="text-gray-600">{{ contactPhone }}</p>
                  </div>
                </div>
                <div>
                  <a 
                    :href="bookingLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors"
                    :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
                  >
                    Book a Call
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="text-sm">
            {{ siteData.siteConfig.address }}
          </div>
          <div class="flex space-x-6 mt-4 md:mt-0">
            <a 
              v-for="social in socialLinks" 
              :key="social.type"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-400 hover:text-white"
            >
              <component :is="social.icon" class="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Project Modal -->
    <div 
      v-if="selectedProject"
      class="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto"
      @click.self="closeProject"
    >
      <div class="min-h-screen flex items-center justify-center p-4">
        <div class="bg-white max-w-4xl w-full rounded-lg">
          <div class="p-8">
            <div class="flex justify-between items-start mb-6">
              <img 
                :src="selectedProject.logo" 
                :alt="selectedProject.title + ' logo'"
                class="h-8"
              >
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
              <h2 class="text-3xl font-bold mb-4">{{ selectedProject.title }}</h2>
              <div class="text-lg text-blue-600 mb-6">{{ selectedProject.result }}</div>
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
const isMobileMenuOpen = ref(false)
const selectedProject = ref(null)
const activeSlide = ref(0)

// Computed
const navigationItems = [
  { text: 'Work', href: '#work' },
  { text: 'About', href: '#about' },
  { text: 'Pricing', href: '#pricing' },
  { text: 'Contact', href: '#contact' }
]

const services = computed(() => 
  props.contentData.services?.map(service => ({
    title: service.title,
    description: service.description,
    icon: service.icon || '<svg>...</svg>' // Default icon
  })) || []
)

const projects = computed(() => 
  props.contentData.projects?.map(project => ({
    id: project.id,
    title: project.title,
    description: project.excerpt,
    thumbnail: project.thumbnail,
    fullImage: project.fullImage,
    logo: project.metadata?.logo,
    result: project.metadata?.result,
    content: project.content
  })) || []
)

const pricingSteps = computed(() => 
  props.contentData.pricing?.steps || [
    { title: 'Initial Consultation', description: 'Free 30-minute discovery call' },
    { title: 'Project Scope', description: 'Detailed proposal and timeline' },
    { title: 'Transparent Pricing', description: 'Clear project-based pricing' }
  ]
)

const socialLinks = computed(() => {
  const links = props.siteData.siteConfig.socialLinks || []
  return links.map(link => ({
    type: link.type,
    url: link.url,
    icon: `Icon${link.type}` // You'll need to register these icons
  }))
})

const contactEmail = computed(() => 
  props.siteData.siteConfig.contactEmail || 'hello@example.com'
)

const contactPhone = computed(() => 
  props.siteData.siteConfig.contactPhone || '+1 (555) 123-4567'
)

const bookingLink = computed(() => 
  props.siteData.siteConfig.bookingLink || '#'
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

const nextSlide = () => {
  activeSlide.value = (activeSlide.value + 1) % projects.value.length
}

const prevSlide = () => {
  activeSlide.value = activeSlide.value === 0 
    ? projects.value.length - 1 
    : activeSlide.value - 1
}
</script>

<style scoped>
.analogue-portfolio {
  scroll-behavior: smooth;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
}

/* Hide scrollbar for carousel */
.overflow-hidden::-webkit-scrollbar {
  display: none;
}
</style>