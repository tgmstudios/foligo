<template>
  <div class="yuga-portfolio min-h-screen bg-black text-white">
    <!-- Floating Navigation -->
    <nav class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/80 backdrop-blur-md rounded-full px-8 py-4">
      <div class="flex items-center space-x-8">
        <a 
          v-for="link in navigationLinks" 
          :key="link.id"
          :href="link.href"
          class="text-sm uppercase tracking-wider hover:text-blue-400 transition-colors duration-300"
        >
          {{ link.label }}
        </a>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="h-screen relative overflow-hidden">
      <!-- Background Video/Image -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black">
        <video 
          v-if="heroVideo"
          class="w-full h-full object-cover"
          autoplay
          loop
          muted
          playsinline
        >
          <source :src="heroVideo" type="video/mp4">
        </video>
        <img 
          v-else
          :src="heroImage" 
          alt="Hero background"
          class="w-full h-full object-cover"
        >
      </div>

      <!-- Hero Content -->
      <div class="absolute inset-0 flex items-center justify-center text-center">
        <div class="max-w-4xl px-6">
          <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {{ siteData.siteConfig.heroTitle || 'Creating Digital Realms' }}
          </h1>
          <p class="text-xl md:text-2xl text-gray-300">
            {{ siteData.siteConfig.heroText }}
          </p>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>

    <!-- Featured Projects -->
    <section class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-4xl font-bold mb-16">Featured Work</h2>
        <div class="grid grid-cols-1 gap-24">
          <div 
            v-for="project in featuredProjects" 
            :key="project.id"
            class="group relative"
          >
            <!-- Project Image/Video -->
            <div 
              class="aspect-[16/9] overflow-hidden rounded-lg cursor-pointer"
              @click="openProject(project)"
            >
              <video 
                v-if="project.metadata?.video"
                class="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                :src="project.metadata.video"
                muted
                loop
                playsinline
                @mouseenter="playVideo"
                @mouseleave="pauseVideo"
              ></video>
              <img 
                v-else
                :src="project.thumbnail" 
                :alt="project.title"
                class="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
              >
            </div>

            <!-- Project Info -->
            <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 class="text-2xl font-bold mb-4">{{ project.title }}</h3>
                <p class="text-gray-400">{{ project.description }}</p>
              </div>
              <div class="space-y-4">
                <div v-if="project.metadata?.role">
                  <div class="text-sm text-gray-500 mb-1">Role</div>
                  <div class="text-gray-300">{{ project.metadata.role }}</div>
                </div>
                <div v-if="project.metadata?.technologies">
                  <div class="text-sm text-gray-500 mb-1">Technologies</div>
                  <div class="flex flex-wrap gap-2">
                    <span 
                      v-for="tech in project.metadata.technologies" 
                      :key="tech"
                      class="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
                    >
                      {{ tech }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Experience -->
    <section class="py-24 bg-gray-900">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-4xl font-bold mb-16">Experience</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div 
            v-for="exp in experience" 
            :key="exp.company"
            class="group"
          >
            <div class="mb-4">
              <div class="text-2xl font-bold mb-2">{{ exp.company }}</div>
              <div class="text-blue-400">{{ exp.role }}</div>
              <div class="text-gray-500">{{ exp.period }}</div>
            </div>
            <p class="text-gray-400">{{ exp.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Skills & Technologies -->
    <section class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-4xl font-bold mb-16">Skills & Technologies</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div 
            v-for="(category, index) in skills" 
            :key="index"
            class="space-y-4"
          >
            <h3 class="text-xl font-bold text-blue-400">{{ category.name }}</h3>
            <ul class="space-y-2">
              <li 
                v-for="skill in category.items" 
                :key="skill"
                class="text-gray-400"
              >
                {{ skill }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section class="py-24 bg-gradient-to-b from-gray-900 to-black">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h2 class="text-4xl font-bold mb-8">Let's Create Together</h2>
        <p class="text-xl text-gray-300 mb-12">
          {{ siteData.siteConfig.contactText || 'Ready to bring your digital vision to life? Get in touch.' }}
        </p>
        <a 
          :href="'mailto:' + contactEmail"
          class="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-full text-lg font-bold transition-colors duration-300"
        >
          Start a Project
        </a>

        <!-- Social Links -->
        <div class="mt-12 flex justify-center space-x-8">
          <a 
            v-for="social in socialLinks" 
            :key="social.type"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-400 hover:text-blue-400 transition-colors"
          >
            <component :is="social.icon" class="w-6 h-6" />
          </a>
        </div>
      </div>
    </section>

    <!-- Project Modal -->
    <div 
      v-if="selectedProject"
      class="fixed inset-0 bg-black z-50 overflow-y-auto"
    >
      <!-- Close Button -->
      <button 
        @click="closeProject"
        class="fixed top-6 right-6 text-gray-400 hover:text-white z-50 p-2"
        aria-label="Close modal"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Project Content -->
      <div class="max-w-7xl mx-auto px-6 py-24">
        <!-- Header -->
        <div class="max-w-4xl mb-16">
          <h2 class="text-5xl font-bold mb-8">{{ selectedProject.title }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div v-if="selectedProject.metadata?.client">
              <div class="text-gray-500 mb-1">Client</div>
              <div class="text-xl">{{ selectedProject.metadata.client }}</div>
            </div>
            <div v-if="selectedProject.metadata?.year">
              <div class="text-gray-500 mb-1">Year</div>
              <div class="text-xl">{{ selectedProject.metadata.year }}</div>
            </div>
            <div v-if="selectedProject.metadata?.role">
              <div class="text-gray-500 mb-1">Role</div>
              <div class="text-xl">{{ selectedProject.metadata.role }}</div>
            </div>
            <div v-if="selectedProject.metadata?.duration">
              <div class="text-gray-500 mb-1">Duration</div>
              <div class="text-xl">{{ selectedProject.metadata.duration }}</div>
            </div>
          </div>
        </div>

        <!-- Project Media -->
        <div class="space-y-24">
          <!-- Video -->
          <video 
            v-if="selectedProject.metadata?.video"
            class="w-full rounded-lg"
            controls
            :src="selectedProject.metadata.video"
          ></video>

          <!-- Images -->
          <img 
            v-for="(image, index) in selectedProject.images" 
            :key="index"
            :src="image"
            :alt="`${selectedProject.title} - Image ${index + 1}`"
            class="w-full rounded-lg"
          >
        </div>

        <!-- Project Description -->
        <div class="max-w-4xl mx-auto mt-24">
          <div class="prose prose-invert prose-lg">
            <div v-html="selectedProject.content"></div>
          </div>
        </div>

        <!-- Technologies Used -->
        <div v-if="selectedProject.metadata?.technologies" class="mt-16">
          <h3 class="text-2xl font-bold mb-8">Technologies Used</h3>
          <div class="flex flex-wrap gap-4">
            <span 
              v-for="tech in selectedProject.metadata.technologies" 
              :key="tech"
              class="px-4 py-2 bg-gray-800 rounded-full text-gray-300"
            >
              {{ tech }}
            </span>
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
  { id: 'experience', label: 'Experience', href: '#experience' },
  { id: 'skills', label: 'Skills', href: '#skills' },
  { id: 'contact', label: 'Contact', href: '#contact' }
])

const heroVideo = computed(() => 
  props.siteData.siteConfig.heroVideo
)

const heroImage = computed(() => 
  props.siteData.siteConfig.heroImage || props.siteData.siteConfig.headerImage
)

const featuredProjects = computed(() => 
  props.contentData.projects?.filter(p => p.metadata?.featured) || 
  props.contentData.projects?.slice(0, 3) || []
)

const experience = computed(() => 
  props.siteData.siteConfig.experience || []
)

const skills = computed(() => 
  props.siteData.siteConfig.skills || [
    {
      name: 'Design',
      items: ['UI/UX', 'Visual Design', 'Motion Design']
    },
    {
      name: 'Development',
      items: ['React', 'Three.js', 'WebGL']
    },
    {
      name: '3D',
      items: ['Blender', 'Cinema 4D', 'Unity']
    },
    {
      name: 'Other',
      items: ['Project Management', 'Team Leadership']
    }
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

const playVideo = (event) => {
  event.target.play()
}

const pauseVideo = (event) => {
  event.target.pause()
}
</script>

<style scoped>
.yuga-portfolio {
  font-family: var(--font-sans);
  background-color: #000;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #444;
}

/* Animations */
@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Prose customization */
:deep(.prose) {
  --tw-prose-invert-body: theme('colors.gray.300');
  --tw-prose-invert-headings: theme('colors.white');
  --tw-prose-invert-links: theme('colors.blue.400');
}
</style>