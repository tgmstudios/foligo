<template>
  <div class="amie-portfolio min-h-screen bg-[#FFF8F0] text-gray-900">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-[#FFF8F0]">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex justify-between items-center h-20">
          <!-- Logo -->
          <div 
            class="text-lg font-medium cursor-pointer transform hover:scale-105 transition-transform"
            @mouseover="playHoverSound"
          >
            {{ siteData.siteConfig.siteName }}
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <a 
              v-for="link in navigationLinks" 
              :key="link.id"
              :href="link.href"
              class="relative px-2 py-1 group"
              @mouseover="playHoverSound"
            >
              <span class="relative z-10">{{ link.label }}</span>
              <span class="absolute inset-0 bg-[#FFD1DC] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-md"></span>
            </a>
          </div>

          <!-- Theme Toggle -->
          <button 
            class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            @click="toggleTheme"
            @mouseover="playHoverSound"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="isDarkMode" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              <path v-else d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-32 pb-20">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 
              class="text-5xl md:text-7xl font-bold leading-tight mb-8 cursor-default"
              @mouseover="playPopSound"
            >
              {{ siteData.siteConfig.heroTitle || 'Hello! I Make Cool Things' }}
            </h1>
            <p class="text-xl text-gray-600 leading-relaxed">
              {{ siteData.siteConfig.heroText }}
            </p>
            <div class="mt-12 flex space-x-6">
              <button 
                class="px-8 py-4 bg-[#FFD1DC] rounded-full font-medium transform hover:scale-105 transition-all hover:shadow-lg"
                @click="scrollToProjects"
                @mouseover="playHoverSound"
              >
                View Projects
              </button>
              <button 
                class="px-8 py-4 border-2 border-gray-900 rounded-full font-medium transform hover:scale-105 transition-all hover:shadow-lg"
                @click="scrollToContact"
                @mouseover="playHoverSound"
              >
                Get in Touch
              </button>
            </div>
          </div>
          <div class="relative">
            <img 
              :src="heroImage" 
              alt="Hero"
              class="w-full rounded-2xl shadow-xl transform hover:rotate-2 transition-transform duration-300"
              @mouseover="playPopSound"
            >
            <!-- Decorative Elements -->
            <div class="absolute -top-4 -left-4 w-20 h-20 bg-[#FFD1DC] rounded-full opacity-50"></div>
            <div class="absolute -bottom-4 -right-4 w-32 h-32 bg-[#B4E4FF] rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Projects Grid -->
    <section id="projects" class="py-20">
      <div class="max-w-7xl mx-auto px-6">
        <h2 
          class="text-4xl font-bold mb-12"
          @mouseover="playPopSound"
        >
          Selected Work
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div 
            v-for="project in projects" 
            :key="project.id"
            class="group cursor-pointer"
            @click="openProject(project)"
            @mouseover="playHoverSound"
          >
            <!-- Project Card -->
            <div class="bg-white rounded-2xl overflow-hidden shadow-lg transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-300">
              <!-- Project Image -->
              <div class="aspect-[4/3] overflow-hidden">
                <img 
                  :src="project.thumbnail" 
                  :alt="project.title"
                  class="w-full h-full object-cover"
                >
              </div>
              
              <!-- Project Info -->
              <div class="p-6">
                <h3 class="text-xl font-bold mb-2">{{ project.title }}</h3>
                <p class="text-gray-600 mb-4">{{ project.description }}</p>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="tag in project.metadata?.tags || []"
                    :key="tag"
                    class="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 
              class="text-4xl font-bold mb-8"
              @mouseover="playPopSound"
            >
              About Me
            </h2>
            <div class="prose prose-lg">
              <div v-html="siteData.siteConfig.about"></div>
            </div>
            <!-- Fun Facts -->
            <div class="mt-12 grid grid-cols-2 gap-6">
              <div 
                v-for="(fact, index) in funFacts"
                :key="index"
                class="p-6 bg-[#FFF8F0] rounded-xl transform hover:scale-105 transition-transform cursor-default"
                @mouseover="playPopSound"
              >
                <div class="text-3xl font-bold mb-2">{{ fact.number }}</div>
                <div class="text-gray-600">{{ fact.text }}</div>
              </div>
            </div>
          </div>
          
          <!-- Skills & Tools -->
          <div class="space-y-12">
            <div>
              <h3 
                class="text-2xl font-bold mb-6"
                @mouseover="playPopSound"
              >
                Things I'm Good At
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div 
                  v-for="skill in skills"
                  :key="skill.name"
                  class="flex items-center space-x-3"
                >
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="bg-[#FFD1DC] h-2 rounded-full"
                      :style="{ width: `${skill.level}%` }"
                    ></div>
                  </div>
                  <span class="text-sm whitespace-nowrap">{{ skill.name }}</span>
                </div>
              </div>
            </div>

            <!-- Tools -->
            <div>
              <h3 
                class="text-2xl font-bold mb-6"
                @mouseover="playPopSound"
              >
                Tools I Use
              </h3>
              <div class="flex flex-wrap gap-4">
                <span 
                  v-for="tool in tools"
                  :key="tool"
                  class="px-4 py-2 bg-gray-100 rounded-full transform hover:scale-110 transition-transform cursor-default"
                  @mouseover="playHoverSound"
                >
                  {{ tool }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-20">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h2 
          class="text-4xl font-bold mb-8"
          @mouseover="playPopSound"
        >
          Let's Work Together!
        </h2>
        <p class="text-xl text-gray-600 mb-12">
          {{ siteData.siteConfig.contactText || 'Have a project in mind? Let's create something amazing.' }}
        </p>
        <a 
          :href="'mailto:' + contactEmail"
          class="inline-block px-8 py-4 bg-gray-900 text-white rounded-full font-medium transform hover:scale-105 transition-all hover:shadow-lg"
          @mouseover="playHoverSound"
        >
          {{ contactEmail }}
        </a>

        <!-- Social Links -->
        <div class="mt-12 flex justify-center space-x-6">
          <a 
            v-for="social in socialLinks" 
            :key="social.type"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md transform hover:scale-110 transition-transform"
            @mouseover="playHoverSound"
          >
            <component :is="social.icon" class="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>

    <!-- Project Modal -->
    <div 
      v-if="selectedProject"
      class="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto"
      @click.self="closeProject"
    >
      <div class="min-h-screen py-12">
        <!-- Close Button -->
        <button 
          @click="closeProject"
          class="fixed top-8 right-8 w-12 h-12 bg-white rounded-full flex items-center justify-center transform hover:rotate-90 transition-transform"
          @mouseover="playHoverSound"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Project Content -->
        <div class="max-w-6xl mx-auto px-6">
          <div class="bg-white rounded-3xl overflow-hidden">
            <!-- Project Header -->
            <div class="p-12">
              <h2 class="text-4xl font-bold mb-6">{{ selectedProject.title }}</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div v-if="selectedProject.metadata?.client">
                  <div class="text-sm text-gray-500 mb-1">Client</div>
                  <div class="font-medium">{{ selectedProject.metadata.client }}</div>
                </div>
                <div v-if="selectedProject.metadata?.year">
                  <div class="text-sm text-gray-500 mb-1">Year</div>
                  <div class="font-medium">{{ selectedProject.metadata.year }}</div>
                </div>
                <div v-if="selectedProject.metadata?.role">
                  <div class="text-sm text-gray-500 mb-1">Role</div>
                  <div class="font-medium">{{ selectedProject.metadata.role }}</div>
                </div>
                <div v-if="selectedProject.metadata?.duration">
                  <div class="text-sm text-gray-500 mb-1">Duration</div>
                  <div class="font-medium">{{ selectedProject.metadata.duration }}</div>
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
            <div class="p-12">
              <div class="prose prose-lg max-w-none">
                <div v-html="selectedProject.content"></div>
              </div>

              <!-- Project Tags -->
              <div v-if="selectedProject.metadata?.tags" class="mt-8">
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="tag in selectedProject.metadata.tags"
                    :key="tag"
                    class="px-4 py-2 bg-gray-100 rounded-full text-sm"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

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
const isDarkMode = ref(false)

// Audio setup
let hoverSound, popSound
onMounted(() => {
  hoverSound = new Audio('/sounds/hover.mp3') // You'll need to add these sound files
  popSound = new Audio('/sounds/pop.mp3')
})

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

const funFacts = computed(() => 
  props.siteData.siteConfig.funFacts || [
    { number: '5+', text: 'Years Experience' },
    { number: '50+', text: 'Projects Completed' },
    { number: '30+', text: 'Happy Clients' },
    { number: '3', text: 'Coffee Cups Daily' }
  ]
)

const skills = computed(() => 
  props.siteData.siteConfig.skills || [
    { name: 'UI Design', level: 90 },
    { name: 'Motion Design', level: 85 },
    { name: 'Front-end Dev', level: 80 },
    { name: '3D Modeling', level: 75 }
  ]
)

const tools = computed(() => 
  props.siteData.siteConfig.tools || [
    'Figma',
    'After Effects',
    'VS Code',
    'Blender',
    'Photoshop',
    'React',
    'Vue',
    'Three.js'
  ]
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
  playPopSound()
}

const closeProject = () => {
  selectedProject.value = null
  document.body.style.overflow = ''
  playHoverSound()
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  playPopSound()
}

const scrollToProjects = () => {
  document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToContact = () => {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
}

const playHoverSound = () => {
  if (hoverSound) {
    hoverSound.currentTime = 0
    hoverSound.play()
  }
}

const playPopSound = () => {
  if (popSound) {
    popSound.currentTime = 0
    popSound.play()
  }
}
</script>

<style scoped>
.amie-portfolio {
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
.hover-scale {
  @apply transform transition-transform duration-200;
}

.hover-scale:hover {
  @apply scale-105;
}

/* Custom prose styles */
:deep(.prose) {
  max-width: none;
}

:deep(.prose) h1,
:deep(.prose) h2,
:deep(.prose) h3 {
  @apply font-bold;
}
</style>