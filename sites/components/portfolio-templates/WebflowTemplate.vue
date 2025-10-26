<template>
  <div class="webflow-portfolio min-h-screen bg-white">
    <!-- Navigation -->
    <nav 
      class="fixed top-0 left-0 right-0 z-50"
      :class="{ 'nav-scrolled': isScrolled }"
    >
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex justify-between items-center h-20">
          <!-- Logo -->
          <div class="text-lg font-semibold tracking-tight">
            {{ siteData.siteConfig.siteName }}
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-12">
            <a 
              v-for="link in navigationLinks" 
              :key="link.id"
              :href="link.href"
              class="text-sm font-medium hover:text-purple-600 transition-colors"
            >
              {{ link.label }}
            </a>
          </div>

          <!-- Mobile Menu Button -->
          <button 
            class="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            @click="toggleMenu"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                v-if="!isMenuOpen"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path 
                v-else
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div 
        v-show="isMenuOpen"
        class="md:hidden bg-white border-t border-gray-100"
      >
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex flex-col space-y-4">
            <a 
              v-for="link in navigationLinks" 
              :key="link.id"
              :href="link.href"
              class="text-lg font-medium hover:text-purple-600 transition-colors"
              @click="closeMenu"
            >
              {{ link.label }}
            </a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative min-h-screen pt-20 flex items-center">
      <!-- Background Pattern -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute w-[800px] h-[800px] -top-96 -right-96 bg-purple-100 rounded-full opacity-20"></div>
        <div class="absolute w-[600px] h-[600px] -bottom-48 -left-48 bg-blue-100 rounded-full opacity-20"></div>
      </div>

      <div class="max-w-7xl mx-auto px-6 relative">
        <div class="max-w-3xl">
          <h1 class="text-5xl md:text-7xl font-bold leading-tight mb-8">
            {{ siteData.siteConfig.heroTitle || 'Creating Digital Experiences That Matter' }}
          </h1>
          <p class="text-xl text-gray-600 leading-relaxed mb-12">
            {{ siteData.siteConfig.heroText }}
          </p>
          <div class="flex flex-wrap gap-4">
            <button 
              class="px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors"
              @click="scrollToProjects"
            >
              View Projects
            </button>
            <button 
              class="px-8 py-4 border-2 border-black rounded-full font-medium hover:bg-black hover:text-white transition-colors"
              @click="scrollToContact"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Projects -->
    <section id="projects" class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-3xl font-bold mb-16">Selected Works</h2>
        <div class="grid grid-cols-1 gap-24">
          <div 
            v-for="(project, index) in featuredProjects" 
            :key="project.id"
            class="group"
            @click="openProject(project)"
          >
            <!-- Project Card -->
            <div 
              class="grid grid-cols-1 md:grid-cols-2 gap-12"
              :class="{ 'md:grid-flow-dense': index % 2 === 1 }"
            >
              <!-- Project Info -->
              <div class="flex flex-col justify-center">
                <h3 class="text-3xl font-bold mb-4 group-hover:text-purple-600 transition-colors">
                  {{ project.title }}
                </h3>
                <p class="text-gray-600 mb-8">{{ project.description }}</p>
                <div class="flex flex-wrap gap-2 mb-8">
                  <span 
                    v-for="tag in project.metadata?.tags || []"
                    :key="tag"
                    class="px-4 py-2 bg-gray-100 rounded-full text-sm"
                  >
                    {{ tag }}
                  </span>
                </div>
                <button class="inline-flex items-center text-purple-600 font-medium group">
                  <span class="mr-2">View Project</span>
                  <svg 
                    class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>

              <!-- Project Image -->
              <div class="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                <img 
                  :src="project.thumbnail" 
                  :alt="project.title"
                  class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                >
                <!-- Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Process Section -->
    <section class="py-24 bg-gray-50">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-3xl font-bold mb-16">How I Work</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div 
            v-for="(step, index) in processSteps"
            :key="index"
            class="relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="text-4xl font-bold text-purple-600 mb-4">0{{ index + 1 }}</div>
            <h3 class="text-xl font-bold mb-4">{{ step.title }}</h3>
            <p class="text-gray-600">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Skills Section -->
    <section class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <!-- Skills Content -->
          <div>
            <h2 class="text-3xl font-bold mb-8">Expertise</h2>
            <div class="space-y-8">
              <div 
                v-for="skill in skills"
                :key="skill.name"
              >
                <div class="flex justify-between items-center mb-2">
                  <div class="font-medium">{{ skill.name }}</div>
                  <div class="text-sm text-gray-600">{{ skill.level }}%</div>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-purple-600 rounded-full transition-all duration-1000"
                    :style="{ width: `${skill.level}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tools -->
          <div>
            <h2 class="text-3xl font-bold mb-8">Tools & Technologies</h2>
            <div class="grid grid-cols-2 gap-4">
              <div 
                v-for="tool in tools"
                :key="tool"
                class="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {{ tool }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-24 bg-gray-50">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="text-3xl font-bold mb-16">Client Testimonials</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div 
            v-for="testimonial in testimonials"
            :key="testimonial.name"
            class="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-center mb-6">
              <img 
                :src="testimonial.avatar" 
                :alt="testimonial.name"
                class="w-12 h-12 rounded-full object-cover mr-4"
              >
              <div>
                <div class="font-medium">{{ testimonial.name }}</div>
                <div class="text-sm text-gray-600">{{ testimonial.role }}</div>
              </div>
            </div>
            <p class="text-gray-600">{{ testimonial.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-24">
      <div class="max-w-7xl mx-auto px-6">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-3xl font-bold mb-8">Let's Work Together</h2>
          <p class="text-xl text-gray-600 mb-12">
            {{ siteData.siteConfig.contactText || 'Have a project in mind? Let's create something amazing together.' }}
          </p>
          <a 
            :href="'mailto:' + contactEmail"
            class="inline-block px-8 py-4 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors"
          >
            Start a Project
          </a>

          <!-- Social Links -->
          <div class="mt-12 flex justify-center space-x-6">
            <a 
              v-for="social in socialLinks" 
              :key="social.type"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="p-3 hover:bg-gray-100 rounded-full transition-colors"
            >
              <component :is="social.icon" class="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Project Modal -->
    <transition name="fade">
      <div 
        v-if="selectedProject"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-black bg-opacity-90"
          @click="closeProject"
        ></div>

        <!-- Modal Content -->
        <div class="relative min-h-screen py-16">
          <!-- Close Button -->
          <button 
            @click="closeProject"
            class="fixed top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            aria-label="Close modal"
          >
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="max-w-6xl mx-auto px-6 relative">
            <!-- Project Header -->
            <div class="max-w-3xl mb-16 text-white">
              <h2 class="text-4xl font-bold mb-8">{{ selectedProject.title }}</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div v-if="selectedProject.metadata?.client">
                  <div class="text-sm text-gray-400 mb-1">Client</div>
                  <div class="font-medium">{{ selectedProject.metadata.client }}</div>
                </div>
                <div v-if="selectedProject.metadata?.year">
                  <div class="text-sm text-gray-400 mb-1">Year</div>
                  <div class="font-medium">{{ selectedProject.metadata.year }}</div>
                </div>
                <div v-if="selectedProject.metadata?.role">
                  <div class="text-sm text-gray-400 mb-1">Role</div>
                  <div class="font-medium">{{ selectedProject.metadata.role }}</div>
                </div>
                <div v-if="selectedProject.metadata?.duration">
                  <div class="text-sm text-gray-400 mb-1">Duration</div>
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
                class="w-full rounded-2xl"
              >
            </div>

            <!-- Project Description -->
            <div class="max-w-3xl mx-auto mt-16">
              <div class="prose prose-lg prose-invert">
                <div v-html="selectedProject.content"></div>
              </div>

              <!-- Project Tags -->
              <div v-if="selectedProject.metadata?.tags" class="mt-8">
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="tag in selectedProject.metadata.tags"
                    :key="tag"
                    class="px-4 py-2 bg-white/10 rounded-full text-sm text-white"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
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
const isMenuOpen = ref(false)
const isScrolled = ref(false)

// Computed
const navigationLinks = computed(() => [
  { id: 'projects', label: 'Projects', href: '#projects' },
  { id: 'process', label: 'Process', href: '#process' },
  { id: 'expertise', label: 'Expertise', href: '#expertise' },
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

const processSteps = computed(() => 
  props.siteData.siteConfig.processSteps || [
    {
      title: 'Discovery',
      description: 'Understanding your goals, audience, and project requirements through in-depth consultation.'
    },
    {
      title: 'Design',
      description: 'Creating visually stunning and functional solutions that align with your brand.'
    },
    {
      title: 'Development',
      description: 'Bringing designs to life with clean, efficient, and scalable code.'
    }
  ]
)

const skills = computed(() => 
  props.siteData.siteConfig.skills || [
    { name: 'UI/UX Design', level: 95 },
    { name: 'Web Development', level: 90 },
    { name: 'Branding', level: 85 },
    { name: 'Motion Design', level: 80 }
  ]
)

const tools = computed(() => 
  props.siteData.siteConfig.tools || [
    'Figma',
    'Adobe Creative Suite',
    'VS Code',
    'React',
    'Vue.js',
    'Node.js',
    'Git',
    'Webflow'
  ]
)

const testimonials = computed(() => 
  props.siteData.siteConfig.testimonials || [
    {
      name: 'Sarah Johnson',
      role: 'CEO at TechStart',
      avatar: '/images/testimonial-1.jpg',
      text: 'Working together was an absolute pleasure. The attention to detail and creative solutions exceeded our expectations.'
    },
    {
      name: 'Mike Chen',
      role: 'Creative Director',
      avatar: '/images/testimonial-2.jpg',
      text: 'Incredible talent and professionalism. Delivered exactly what we needed, on time and within budget.'
    },
    {
      name: 'Emma Williams',
      role: 'Product Manager',
      avatar: '/images/testimonial-3.jpg',
      text: 'A true professional who understands both design and development. Made our project a huge success.'
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

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const scrollToProjects = () => {
  document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToContact = () => {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
}

// Scroll handling
const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.nav-scrolled {
  @apply bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm;
}

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

/* Prose customization */
:deep(.prose-invert) {
  --tw-prose-invert-body: theme('colors.gray.300');
  --tw-prose-invert-headings: theme('colors.white');
  --tw-prose-invert-links: theme('colors.purple.400');
}
</style>