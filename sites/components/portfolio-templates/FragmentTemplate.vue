<template>
  <div class="fragment-portfolio min-h-screen bg-white" :class="{ 'cursor-none': !isTouch }">
    <!-- Custom Cursor -->
    <div 
      v-if="!isTouch"
      ref="cursor"
      class="fixed w-4 h-4 rounded-full bg-black pointer-events-none mix-blend-difference z-50 transition-transform duration-100"
      :class="{ 'scale-[4]': isHovering }"
    ></div>

    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-40 mix-blend-difference">
      <div class="max-w-[1800px] mx-auto px-8">
        <div class="flex justify-between items-center h-24">
          <!-- Logo -->
          <div 
            class="text-sm font-medium tracking-widest uppercase cursor-pointer"
            @mouseenter="onLinkHover"
            @mouseleave="onLinkLeave"
          >
            {{ siteData.siteConfig.siteName }}
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-12">
            <a 
              v-for="link in navigationLinks" 
              :key="link.id"
              :href="link.href"
              class="text-sm tracking-widest uppercase hover:opacity-60 transition-opacity"
              @mouseenter="onLinkHover"
              @mouseleave="onLinkLeave"
            >
              {{ link.label }}
            </a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="min-h-screen pt-24 flex items-center relative overflow-hidden">
      <!-- Background Text -->
      <div class="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
        <div class="text-[20vw] font-bold leading-none">
          CREATE
        </div>
      </div>

      <div class="max-w-[1800px] mx-auto px-8 relative">
        <div class="max-w-2xl">
          <h1 class="text-7xl md:text-9xl font-bold leading-none mb-12">
            {{ siteData.siteConfig.heroTitle || 'Art Direction & Design' }}
          </h1>
          <p class="text-xl max-w-lg">
            {{ siteData.siteConfig.heroText }}
          </p>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-12 left-8">
        <div class="flex items-center text-sm tracking-widest uppercase">
          <div class="w-12 h-px bg-black mr-4"></div>
          Scroll
        </div>
      </div>
    </section>

    <!-- Projects Grid -->
    <section class="py-32">
      <div class="max-w-[1800px] mx-auto px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div 
            v-for="project in projects" 
            :key="project.id"
            class="group cursor-pointer"
            @click="openProject(project)"
            @mouseenter="onLinkHover"
            @mouseleave="onLinkLeave"
          >
            <!-- Project Image -->
            <div class="relative aspect-[3/4] mb-6 overflow-hidden">
              <img 
                :src="project.thumbnail" 
                :alt="project.title"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              >
              <!-- Text Overlay -->
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                <div class="text-white text-center">
                  <div class="text-sm tracking-widest uppercase mb-2">View Project</div>
                  <div class="h-px w-12 bg-white mx-auto"></div>
                </div>
              </div>
            </div>
            
            <!-- Project Info -->
            <div>
              <h3 class="text-2xl font-medium mb-2">{{ project.title }}</h3>
              <p class="text-sm uppercase tracking-widest text-gray-600">{{ project.metadata?.category }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-32 bg-black text-white">
      <div class="max-w-[1800px] mx-auto px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-24">
          <!-- Text Content -->
          <div>
            <h2 class="text-5xl font-bold mb-12">About</h2>
            <div class="prose prose-invert">
              <div v-html="siteData.siteConfig.about"></div>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-12 content-start">
            <div 
              v-for="stat in stats" 
              :key="stat.label"
              class="group"
              @mouseenter="onLinkHover"
              @mouseleave="onLinkLeave"
            >
              <div class="text-4xl font-bold mb-2 group-hover:translate-x-2 transition-transform">
                {{ stat.value }}
              </div>
              <div class="text-sm uppercase tracking-widest text-gray-400">
                {{ stat.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section class="py-32">
      <div class="max-w-[1800px] mx-auto px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div 
            v-for="service in services" 
            :key="service.title"
            class="group"
            @mouseenter="onLinkHover"
            @mouseleave="onLinkLeave"
          >
            <div class="text-6xl font-bold mb-8 group-hover:translate-x-2 transition-transform">
              {{ service.number }}
            </div>
            <h3 class="text-xl font-medium mb-4">{{ service.title }}</h3>
            <p class="text-gray-600">{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="py-32 bg-black text-white">
      <div class="max-w-[1800px] mx-auto px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div>
            <h2 class="text-5xl font-bold mb-12">Let's Create Something</h2>
            <p class="text-xl mb-12">
              {{ siteData.siteConfig.contactText || 'Have a project in mind? Let's discuss your ideas and make them reality.' }}
            </p>
            <a 
              :href="'mailto:' + contactEmail"
              class="text-2xl hover:opacity-60 transition-opacity"
              @mouseenter="onLinkHover"
              @mouseleave="onLinkLeave"
            >
              {{ contactEmail }}
            </a>
          </div>

          <!-- Social Links -->
          <div>
            <h3 class="text-sm uppercase tracking-widest mb-8">Connect</h3>
            <div class="space-y-6">
              <a 
                v-for="social in socialLinks" 
                :key="social.type"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="block text-xl hover:opacity-60 transition-opacity"
                @mouseenter="onLinkHover"
                @mouseleave="onLinkLeave"
              >
                {{ social.type }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Project Modal -->
    <transition name="modal">
      <div 
        v-if="selectedProject"
        class="fixed inset-0 z-50 overflow-y-auto bg-white"
      >
        <!-- Close Button -->
        <button 
          @click="closeProject"
          class="fixed top-8 right-8 z-50 mix-blend-difference"
          @mouseenter="onLinkHover"
          @mouseleave="onLinkLeave"
        >
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="pt-32 pb-16">
          <!-- Project Header -->
          <div class="max-w-[1800px] mx-auto px-8 mb-16">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div>
                <h2 class="text-6xl font-bold mb-8">{{ selectedProject.title }}</h2>
                <p class="text-xl text-gray-600 mb-12">{{ selectedProject.description }}</p>
                <div class="grid grid-cols-2 gap-8">
                  <div v-if="selectedProject.metadata?.client">
                    <div class="text-sm uppercase tracking-widest text-gray-600 mb-2">Client</div>
                    <div>{{ selectedProject.metadata.client }}</div>
                  </div>
                  <div v-if="selectedProject.metadata?.year">
                    <div class="text-sm uppercase tracking-widest text-gray-600 mb-2">Year</div>
                    <div>{{ selectedProject.metadata.year }}</div>
                  </div>
                  <div v-if="selectedProject.metadata?.role">
                    <div class="text-sm uppercase tracking-widest text-gray-600 mb-2">Role</div>
                    <div>{{ selectedProject.metadata.role }}</div>
                  </div>
                  <div v-if="selectedProject.metadata?.duration">
                    <div class="text-sm uppercase tracking-widest text-gray-600 mb-2">Duration</div>
                    <div>{{ selectedProject.metadata.duration }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Project Images -->
          <div class="max-w-[1800px] mx-auto px-8">
            <div class="space-y-32">
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
    </transition>
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
const isHovering = ref(false)
const cursor = ref(null)
const isTouch = ref(false)

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

const stats = computed(() => 
  props.siteData.siteConfig.stats || [
    { label: 'Projects Completed', value: '120+' },
    { label: 'Years Experience', value: '10' },
    { label: 'Awards Won', value: '15' },
    { label: 'Happy Clients', value: '85+' }
  ]
)

const services = computed(() => 
  props.siteData.siteConfig.services || [
    {
      number: '01',
      title: 'Art Direction',
      description: 'Creating visual concepts and setting the tone for brand communication.'
    },
    {
      number: '02',
      title: 'Web Design',
      description: 'Crafting beautiful and functional digital experiences.'
    },
    {
      number: '03',
      title: 'Brand Identity',
      description: 'Developing distinctive and memorable brand identities.'
    }
  ]
)

const socialLinks = computed(() => {
  const links = props.siteData.siteConfig.socialLinks || []
  return links.map(link => ({
    type: link.type,
    url: link.url
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

const onLinkHover = () => {
  isHovering.value = true
}

const onLinkLeave = () => {
  isHovering.value = false
}

const updateCursorPosition = (e) => {
  if (cursor.value) {
    cursor.value.style.transform = `translate(${e.clientX - 8}px, ${e.clientY - 8}px)`
  }
}

// Lifecycle
onMounted(() => {
  isTouch.value = 'ontouchstart' in window
  if (!isTouch.value) {
    document.addEventListener('mousemove', updateCursorPosition)
  }
})

onUnmounted(() => {
  if (!isTouch.value) {
    document.removeEventListener('mousemove', updateCursorPosition)
  }
})
</script>

<style>
.fragment-portfolio {
  font-feature-settings: "salt" on, "ss01" on;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.5s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Cursor transition */
.scale-[4] {
  transform: scale(4);
}

/* Typography */
.fragment-portfolio h1,
.fragment-portfolio h2,
.fragment-portfolio h3 {
  font-feature-settings: "salt" on, "ss01" on, "ss02" on;
}

/* Prose customization */
:deep(.prose-invert) {
  --tw-prose-invert-body: theme('colors.gray.300');
  --tw-prose-invert-headings: theme('colors.white');
  max-width: none;
}

:deep(.prose-invert) h1,
:deep(.prose-invert) h2,
:deep(.prose-invert) h3 {
  font-weight: 700;
}
</style>