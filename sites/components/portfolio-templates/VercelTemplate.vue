<template>
  <div class="vercel-portfolio min-h-screen bg-white dark:bg-black text-black dark:text-white">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="text-sm font-medium">
            {{ siteData.siteConfig.siteName }}
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <a 
              v-for="link in navigationLinks" 
              :key="link.id"
              :href="link.href"
              class="text-sm hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              {{ link.label }}
            </a>
          </div>

          <!-- Theme Toggle -->
          <button 
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
            @click="toggleTheme"
            aria-label="Toggle theme"
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
    <section class="pt-32 pb-24">
      <div class="max-w-7xl mx-auto px-6">
        <div class="max-w-4xl">
          <h1 class="text-5xl md:text-7xl font-bold leading-tight mb-8">
            {{ siteData.siteConfig.heroTitle || 'Building the Future of Digital Experiences' }}
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ siteData.siteConfig.heroText }}
          </p>
        </div>
      </div>
    </section>

    <!-- Featured Work -->
    <section class="py-24 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-3xl font-bold mb-16">Featured Projects</h2>
        <div class="grid grid-cols-1 gap-24">
          <div 
            v-for="project in featuredProjects" 
            :key="project.id"
            class="group cursor-pointer"
            @click="openProject(project)"
          >
            <!-- Project Card -->
            <div class="relative">
              <!-- Project Image -->
              <div class="aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                <img 
                  :src="project.thumbnail" 
                  :alt="project.title"
                  class="w-full h-full object-cover"
                >
              </div>
              
              <!-- Project Info Overlay -->
              <div class="absolute inset-0 flex items-end p-8">
                <div class="w-full max-w-2xl">
                  <h3 class="text-2xl font-bold mb-4 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                    {{ project.title }}
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">{{ project.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Work Grid -->
    <section class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-3xl font-bold mb-16">All Projects</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div 
            v-for="project in projects" 
            :key="project.id"
            class="group cursor-pointer"
            @click="openProject(project)"
          >
            <!-- Project Card -->
            <div class="relative">
              <!-- Project Image -->
              <div class="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
                <img 
                  :src="project.thumbnail" 
                  :alt="project.title"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                >
              </div>
              
              <!-- Project Info -->
              <h3 class="text-lg font-medium mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                {{ project.title }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ project.metadata?.category }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-24 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <!-- About Content -->
          <div>
            <h2 class="text-3xl font-bold mb-8">About</h2>
            <div class="prose dark:prose-invert">
              <div v-html="siteData.siteConfig.about"></div>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-8">
            <div 
              v-for="stat in stats" 
              :key="stat.label"
              class="p-8 rounded-xl bg-white dark:bg-gray-800"
            >
              <div class="text-4xl font-bold mb-2">{{ stat.value }}</div>
              <div class="text-gray-600 dark:text-gray-400">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Experience -->
    <section class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-3xl font-bold mb-16">Experience</h2>
        <div class="space-y-16">
          <div 
            v-for="exp in experience" 
            :key="exp.company"
            class="group relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gray-200 dark:before:bg-gray-800"
          >
            <div class="absolute left-0 top-2 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 -translate-x-1/2"></div>
            <div class="space-y-2">
              <div class="text-xl font-bold">{{ exp.company }}</div>
              <div class="text-blue-500 dark:text-blue-400">{{ exp.role }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">{{ exp.period }}</div>
              <p class="text-gray-600 dark:text-gray-400 mt-4">{{ exp.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="py-24 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-6">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-3xl font-bold mb-8">Get in Touch</h2>
          <p class="text-xl text-gray-600 dark:text-gray-400 mb-12">
            {{ siteData.siteConfig.contactText || 'Ready to start your next project? Let's talk about your ideas.' }}
          </p>
          <a 
            :href="'mailto:' + contactEmail"
            class="inline-block px-8 py-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Send Message
          </a>

          <!-- Social Links -->
          <div class="mt-12 flex justify-center space-x-6">
            <a 
              v-for="social in socialLinks" 
              :key="social.type"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <component :is="social.icon" class="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Project Modal -->
    <div 
      v-if="selectedProject"
      class="fixed inset-0 bg-white dark:bg-black z-50 overflow-y-auto"
    >
      <!-- Close Button -->
      <button 
        @click="closeProject"
        class="fixed top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors z-50"
        aria-label="Close modal"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Project Content -->
      <div class="max-w-7xl mx-auto px-6 py-24">
        <!-- Project Header -->
        <div class="max-w-4xl mb-16">
          <h2 class="text-4xl font-bold mb-8">{{ selectedProject.title }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div v-if="selectedProject.metadata?.client">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Client</div>
              <div class="font-medium">{{ selectedProject.metadata.client }}</div>
            </div>
            <div v-if="selectedProject.metadata?.year">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Year</div>
              <div class="font-medium">{{ selectedProject.metadata.year }}</div>
            </div>
            <div v-if="selectedProject.metadata?.role">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Role</div>
              <div class="font-medium">{{ selectedProject.metadata.role }}</div>
            </div>
            <div v-if="selectedProject.metadata?.duration">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
              <div class="font-medium">{{ selectedProject.metadata.duration }}</div>
            </div>
          </div>
        </div>

        <!-- Project Images -->
        <div class="space-y-16">
          <img 
            v-for="(image, index) in selectedProject.images" 
            :key="index"
            :src="image"
            :alt="`${selectedProject.title} - Image ${index + 1}`"
            class="w-full rounded-xl"
          >
        </div>

        <!-- Project Description -->
        <div class="max-w-4xl mx-auto mt-16">
          <div class="prose dark:prose-invert prose-lg">
            <div v-html="selectedProject.content"></div>
          </div>

          <!-- Project Tags -->
          <div v-if="selectedProject.metadata?.tags" class="mt-8">
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="tag in selectedProject.metadata.tags"
                :key="tag"
                class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
              >
                {{ tag }}
              </span>
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
const isDarkMode = ref(false)

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

const featuredProjects = computed(() => 
  projects.value.filter(p => p.metadata?.featured).slice(0, 3)
)

const experience = computed(() => 
  props.siteData.siteConfig.experience || []
)

const stats = computed(() => 
  props.siteData.siteConfig.stats || [
    { label: 'Years Experience', value: '8+' },
    { label: 'Projects Completed', value: '100+' },
    { label: 'Awards Won', value: '12' },
    { label: 'Happy Clients', value: '50+' }
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
}

const closeProject = () => {
  selectedProject.value = null
  document.body.style.overflow = ''
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
}

// Initialize theme
onMounted(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDarkMode.value = prefersDark
  document.documentElement.classList.toggle('dark', prefersDark)
})
</script>

<style>
.vercel-portfolio {
  font-feature-settings: "ss01", "ss02", "ss03", "ss04", "ss05", "ss06", "zero", "cv01", "cv02", "cv03", "cv04";
}

/* Dark mode */
.dark {
  color-scheme: dark;
}

/* Prose dark mode */
.dark .prose {
  --tw-prose-body: theme('colors.gray.300');
  --tw-prose-headings: theme('colors.white');
  --tw-prose-links: theme('colors.blue.400');
  --tw-prose-bold: theme('colors.white');
  --tw-prose-counters: theme('colors.gray.400');
  --tw-prose-bullets: theme('colors.gray.400');
  --tw-prose-quotes: theme('colors.gray.100');
  --tw-prose-quote-borders: theme('colors.gray.700');
  --tw-prose-captions: theme('colors.gray.400');
  --tw-prose-code: theme('colors.white');
  --tw-prose-code-bg: theme('colors.gray.800');
  --tw-prose-pre-code: theme('colors.gray.100');
  --tw-prose-pre-bg: theme('colors.gray.800');
  --tw-prose-hr: theme('colors.gray.700');
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

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>