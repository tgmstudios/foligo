<template>
  <div class="wells-portfolio min-h-screen bg-white">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 h-20 bg-white z-50 border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
        <!-- Logo/Initials -->
        <h1 class="text-4xl font-bold">
          {{ getInitials(siteData.siteConfig.siteName) }}
        </h1>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <a 
            v-for="item in navigation" 
            :key="item.text"
            :href="item.href"
            class="text-gray-900 hover:text-gray-600 transition-colors"
          >
            {{ item.text }}
          </a>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative h-screen pt-20">
      <!-- Background Image with Blur -->
      <div 
        class="absolute inset-0 bg-cover bg-center"
        :style="{
          backgroundImage: `url(${heroImage})`,
          filter: 'blur(8px)',
          opacity: 0.3
        }"
      ></div>

      <!-- Content -->
      <div class="relative h-full flex items-center justify-center">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p class="text-xl md:text-2xl text-gray-600 mb-6">
            {{ siteData.siteConfig.siteDescription }}
          </p>
          <div class="text-sm uppercase tracking-wider">
            {{ location }}
          </div>
        </div>
      </div>
    </section>

    <!-- Projects Grid -->
    <section class="py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div 
            v-for="project in projects" 
            :key="project.id"
            class="group relative aspect-[3/4] overflow-hidden bg-gray-100 cursor-pointer"
            @click="openProject(project)"
          >
            <!-- Project Image -->
            <img 
              :src="project.thumbnail" 
              :alt="project.title"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            >

            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-opacity duration-300 flex items-center justify-center">
              <div class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                <div class="text-xl font-bold mb-2">{{ project.title }}</div>
                <div class="text-sm uppercase tracking-wider">{{ project.category }}</div>
                <div class="mt-4 font-medium">VIEW</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-24 bg-gray-50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl md:text-4xl font-bold uppercase tracking-wider text-center mb-4">
          FROM BRAND POSITIONING TO ART DIRECTION…
        </h2>
        <div 
          class="h-1 w-32 mx-auto"
          :style="{ backgroundColor: siteData.siteConfig.primaryColor }"
        ></div>
        <div class="mt-12 prose prose-lg max-w-none">
          {{ aboutContent }}
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <!-- Social/Contact Links -->
        <div class="flex space-x-8 mb-8 md:mb-0">
          <a 
            :href="'mailto:' + contactEmail"
            class="text-gray-900 hover:text-gray-600 transition-colors"
          >
            Email
          </a>
          <a 
            v-for="social in socialLinks" 
            :key="social.type"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-900 hover:text-gray-600 transition-colors"
          >
            {{ social.type }}
          </a>
        </div>

        <!-- Logo -->
        <div class="text-2xl font-bold">
          {{ getInitials(siteData.siteConfig.siteName) }}
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
        <div class="bg-white max-w-4xl w-full">
          <div class="p-8">
            <!-- Close Button -->
            <div class="flex justify-end mb-6">
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

            <!-- Project Content -->
            <div class="prose max-w-none">
              <h2 class="text-3xl font-bold mb-6">{{ selectedProject.title }}</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <img 
                    :src="selectedProject.thumbnail" 
                    :alt="selectedProject.title"
                    class="w-full"
                  >
                </div>
                <div>
                  <h3 class="text-xl font-bold mb-4">Project Details</h3>
                  <div class="space-y-4">
                    <p>{{ selectedProject.description }}</p>
                    <div class="text-sm">
                      <div><strong>Client:</strong> {{ selectedProject.metadata?.client }}</div>
                      <div><strong>Role:</strong> {{ selectedProject.metadata?.role }}</div>
                      <div><strong>Year:</strong> {{ selectedProject.metadata?.year }}</div>
                    </div>
                  </div>
                </div>
              </div>
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
const navigation = [
  { text: 'Meet', href: '#about' },
  { text: 'Projects', href: '#projects' },
  { text: 'View', href: '#work' },
  { text: 'Discover', href: '#discover' },
  { text: 'Email', href: `mailto:${props.siteData.siteConfig.contactEmail}` },
  { text: 'Instagram', href: props.siteData.siteConfig.socialLinks?.find(link => link.type === 'instagram')?.url || '#' }
]

const heroImage = computed(() => 
  props.contentData.hero?.image || props.siteData.siteConfig.heroImage || '/default-hero.jpg'
)

const location = computed(() => 
  props.siteData.siteConfig.location || 'New York, NY'
)

const projects = computed(() => 
  props.contentData.projects?.map(project => ({
    id: project.id,
    title: project.title,
    description: project.excerpt,
    thumbnail: project.thumbnail,
    category: project.metadata?.category || 'Project',
    content: project.content,
    metadata: project.metadata
  })) || []
)

const aboutContent = computed(() => 
  props.contentData.about?.content || props.siteData.project.description || ''
)

const contactEmail = computed(() => 
  props.siteData.siteConfig.contactEmail || 'hello@example.com'
)

const socialLinks = computed(() => {
  const links = props.siteData.siteConfig.socialLinks || []
  return links.map(link => ({
    type: link.type,
    url: link.url
  }))
})

// Methods
const getInitials = (name) => {
  return name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase() || 'JW'
}

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
.wells-portfolio {
  font-family: var(--font-sans);
}

/* Hover animations */
.group:hover .transition-transform {
  transform: scale(1.05);
}

/* Modal animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>