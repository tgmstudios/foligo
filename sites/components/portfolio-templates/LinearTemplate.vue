<template>
  <div 
    class="linear-portfolio min-h-screen text-gray-900 antialiased"
    :class="{ 'theme-dark': isDarkMode }"
  >
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80">
      <div class="max-w-6xl mx-auto px-6">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="text-base font-medium">
            {{ siteData.siteConfig.siteName }}
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <a 
              v-for="link in navigationLinks" 
              :key="link.id"
              :href="link.href"
              class="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {{ link.label }}
            </a>
          </div>

          <!-- Theme Toggle -->
          <button 
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
    <section class="pt-32 pb-20">
      <div class="max-w-6xl mx-auto px-6">
        <div class="max-w-3xl">
          <h1 class="text-4xl md:text-6xl font-medium leading-tight mb-8">
            {{ siteData.siteConfig.heroTitle || 'Building Digital Products with Purpose' }}
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ siteData.siteConfig.heroText }}
          </p>
        </div>
      </div>
    </section>

    <!-- Featured Work -->
    <section class="py-20">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-2xl font-medium mb-12">Featured Work</h2>
        <div class="space-y-24">
          <div 
            v-for="project in featuredProjects" 
            :key="project.id"
            class="group cursor-pointer"
            @click="openProject(project)"
          >
            <!-- Project Card -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
              <!-- Project Info -->
              <div class="order-2 md:order-1">
                <div class="sticky top-24">
                  <h3 class="text-2xl font-medium mb-4">{{ project.title }}</h3>
                  <p class="text-gray-600 dark:text-gray-400 mb-6">{{ project.description }}</p>
                  <div class="flex flex-wrap gap-2 mb-8">
                    <span 
                      v-for="tag in project.metadata?.tags || []"
                      :key="tag"
                      class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                    >
                      {{ tag }}
                    </span>
                  </div>
                  <div class="inline-flex items-center text-blue-600 dark:text-blue-400">
                    <span class="mr-2">View Project</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Project Image -->
              <div class="order-1 md:order-2">
                <div class="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  <img 
                    :src="project.thumbnail" 
                    :alt="project.title"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Work -->
    <section class="py-20 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-2xl font-medium mb-12">Recent Work</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div 
            v-for="project in recentProjects" 
            :key="project.id"
            class="group cursor-pointer"
            @click="openProject(project)"
          >
            <!-- Project Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <!-- Project Image -->
              <div class="aspect-[4/3] overflow-hidden">
                <img 
                  :src="project.thumbnail" 
                  :alt="project.title"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                >
              </div>
              
              <!-- Project Info -->
              <div class="p-6">
                <h3 class="text-lg font-medium mb-2">{{ project.title }}</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">{{ project.metadata?.category }}</p>
                <div class="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                  <span class="mr-2">View Details</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-20">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <!-- About Content -->
          <div>
            <h2 class="text-2xl font-medium mb-8">About</h2>
            <div class="prose dark:prose-invert">
              <div v-html="siteData.siteConfig.about"></div>
            </div>
          </div>

          <!-- Experience -->
          <div>
            <h3 class="text-2xl font-medium mb-8">Experience</h3>
            <div class="space-y-12">
              <div 
                v-for="exp in experience" 
                :key="exp.company"
                class="group"
              >
                <div class="flex justify-between items-start mb-2">
                  <div class="font-medium">{{ exp.company }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ exp.period }}</div>
                </div>
                <div class="text-gray-600 dark:text-gray-400">{{ exp.role }}</div>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ exp.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="py-20 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 class="text-2xl font-medium mb-8">Let's Connect</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-8">
              {{ siteData.siteConfig.contactText || 'Interested in working together? Feel free to reach out.' }}
            </p>
            <a 
              :href="'mailto:' + contactEmail"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {{ contactEmail }}
            </a>
          </div>

          <!-- Social Links -->
          <div>
            <h3 class="text-2xl font-medium mb-8">Find Me Online</h3>
            <div class="space-y-4">
              <a 
                v-for="social in socialLinks" 
                :key="social.type"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center group"
              >
                <component 
                  :is="social.icon" 
                  class="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" 
                />
                <span class="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {{ social.type }}
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Project Modal -->
    <div 
      v-if="selectedProject"
      class="fixed inset-0 bg-black/90 dark:bg-black/95 z-50 overflow-y-auto"
    >
      <!-- Close Button -->
      <button 
        @click="closeProject"
        class="fixed top-8 right-8 text-white/70 hover:text-white transition-colors z-50"
        aria-label="Close modal"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Project Content -->
      <div class="max-w-6xl mx-auto px-6 py-24">
        <!-- Project Header -->
        <div class="max-w-3xl mb-16 text-white">
          <h2 class="text-4xl font-medium mb-8">{{ selectedProject.title }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-white/70">
            <div v-if="selectedProject.metadata?.client">
              <div class="text-sm mb-1">Client</div>
              <div class="font-medium text-white">{{ selectedProject.metadata.client }}</div>
            </div>
            <div v-if="selectedProject.metadata?.year">
              <div class="text-sm mb-1">Year</div>
              <div class="font-medium text-white">{{ selectedProject.metadata.year }}</div>
            </div>
            <div v-if="selectedProject.metadata?.role">
              <div class="text-sm mb-1">Role</div>
              <div class="font-medium text-white">{{ selectedProject.metadata.role }}</div>
            </div>
            <div v-if="selectedProject.metadata?.duration">
              <div class="text-sm mb-1">Duration</div>
              <div class="font-medium text-white">{{ selectedProject.metadata.duration }}</div>
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
            class="w-full rounded-lg"
          >
        </div>

        <!-- Project Description -->
        <div class="max-w-3xl mx-auto mt-16">
          <div class="prose prose-invert prose-lg">
            <div v-html="selectedProject.content"></div>
          </div>

          <!-- Project Tags -->
          <div v-if="selectedProject.metadata?.tags" class="mt-8">
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="tag in selectedProject.metadata.tags"
                :key="tag"
                class="px-3 py-1 bg-white/10 rounded-lg text-sm text-white/90"
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
  import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
  }
  // Dynamically import social icons
  const socialIcons = {
    Twitter: defineAsyncComponent(() => import('../icons/IconTwitter.vue')),
    GitHub: defineAsyncComponent(() => import('../icons/IconGithub.vue')),
    LinkedIn: defineAsyncComponent(() => import('../icons/IconLinkedIn.vue')),
    Instagram: defineAsyncComponent(() => import('../icons/IconInstagram.vue')),
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

const recentProjects = computed(() => 
  projects.value.filter(p => !p.metadata?.featured).slice(0, 4)
)

const experience = computed(() => 
  props.siteData.siteConfig.experience || []
)

const socialLinks = computed(() => {
  const links = props.siteData.siteConfig.socialLinks || []
  return links.map(link => ({
    type: link.type,
    url: link.url,
    icon: socialIcons[link.type] || null
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
<style scoped>
.linear-portfolio {
  background-color: white;
  color: #111827;
  transition-property: color, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.theme-dark .linear-portfolio {
  background-color: #111827;
  color: white;
}

/* Smooth scrolling */
:deep(html) {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
:deep(::-webkit-scrollbar) {
  width: 10px;
}

:deep(::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(::-webkit-scrollbar-thumb) {
  background: #888;
  border-radius: 5px;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: #666;
}

/* Prose customization */
:deep(.prose) {
  max-width: none;
}

:deep(.prose-invert) {
  --tw-prose-body: rgb(209 213 219);
  --tw-prose-headings: rgb(255 255 255);
  --tw-prose-links: rgb(96 165 250);
}
</style>