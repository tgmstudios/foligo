<template>
  <div class="stripe-portfolio min-h-screen bg-white text-gray-900">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="text-lg font-serif">
            {{ siteData.siteConfig.siteName }}
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <a 
              v-for="link in navigationLinks" 
              :key="link.id"
              :href="link.href"
              class="text-sm hover:text-gray-600 transition-colors duration-200"
            >
              {{ link.label }}
            </a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-32 pb-20">
      <div class="max-w-3xl mx-auto px-6 text-center">
        <h1 class="font-serif text-4xl md:text-6xl leading-tight mb-8">
          {{ siteData.siteConfig.heroTitle || 'Crafting Digital Experiences Through Design' }}
        </h1>
        <p class="text-xl text-gray-600 leading-relaxed">
          {{ siteData.siteConfig.heroText }}
        </p>
      </div>
    </section>

    <!-- Featured Project -->
    <section v-if="featuredProject" class="pb-20">
      <div class="max-w-7xl mx-auto px-6">
        <div 
          class="group cursor-pointer"
          @click="openProject(featuredProject)"
        >
          <div class="aspect-[16/9] overflow-hidden mb-8">
            <img 
              :src="featuredProject.thumbnail" 
              :alt="featuredProject.title"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            >
          </div>
          <div class="max-w-3xl mx-auto">
            <h2 class="font-serif text-3xl mb-4">{{ featuredProject.title }}</h2>
            <p class="text-gray-600">{{ featuredProject.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Projects Grid -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-6">
        <h2 class="font-serif text-3xl mb-12">Selected Works</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div 
            v-for="project in nonFeaturedProjects" 
            :key="project.id"
            class="group cursor-pointer"
            @click="openProject(project)"
          >
            <!-- Project Image -->
            <div class="aspect-[4/3] overflow-hidden mb-6">
              <img 
                :src="project.thumbnail" 
                :alt="project.title"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              >
            </div>
            
            <!-- Project Info -->
            <h3 class="font-serif text-2xl mb-3">{{ project.title }}</h3>
            <p class="text-gray-600 text-sm">{{ project.metadata?.category }}</p>
            <p class="mt-4 text-gray-600">{{ project.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
          <!-- Bio -->
          <div>
            <h2 class="font-serif text-3xl mb-8">About</h2>
            <div class="prose prose-lg">
              <div v-html="siteData.siteConfig.about"></div>
            </div>
          </div>

          <!-- Experience & Recognition -->
          <div class="space-y-12">
            <!-- Experience -->
            <div v-if="experience.length">
              <h3 class="font-serif text-2xl mb-6">Experience</h3>
              <ul class="space-y-6">
                <li v-for="item in experience" :key="item.company">
                  <div class="font-serif text-lg">{{ item.company }}</div>
                  <div class="text-gray-600">{{ item.role }}</div>
                  <div class="text-sm text-gray-500">{{ item.period }}</div>
                </li>
              </ul>
            </div>

            <!-- Awards/Recognition -->
            <div v-if="awards.length">
              <h3 class="font-serif text-2xl mb-6">Recognition</h3>
              <ul class="space-y-4">
                <li 
                  v-for="award in awards" 
                  :key="award.title"
                  class="text-gray-600"
                >
                  {{ award.title }} — {{ award.year }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-3xl mx-auto px-6 text-center">
        <h2 class="font-serif text-3xl mb-8">Get in Touch</h2>
        <p class="text-xl text-gray-600 mb-8">
          {{ siteData.siteConfig.contactText || 'Interested in working together? Let's start a conversation.' }}
        </p>
        <a 
          :href="'mailto:' + contactEmail"
          class="inline-block text-lg border-b-2 border-gray-900 hover:border-gray-600 transition-colors"
        >
          {{ contactEmail }}
        </a>

        <!-- Social Links -->
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
      <!-- Close Button -->
      <button 
        @click="closeProject"
        class="fixed top-6 right-6 text-gray-400 hover:text-gray-600 z-50"
        aria-label="Close modal"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Project Content -->
      <div class="max-w-7xl mx-auto px-6 py-24">
        <!-- Header -->
        <div class="max-w-3xl mb-12">
          <h2 class="font-serif text-4xl mb-6">{{ selectedProject.title }}</h2>
          <div class="grid grid-cols-2 gap-8 text-sm">
            <div v-if="selectedProject.metadata?.client">
              <div class="text-gray-500 mb-1">Client</div>
              <div class="font-serif">{{ selectedProject.metadata.client }}</div>
            </div>
            <div v-if="selectedProject.metadata?.year">
              <div class="text-gray-500 mb-1">Year</div>
              <div class="font-serif">{{ selectedProject.metadata.year }}</div>
            </div>
            <div v-if="selectedProject.metadata?.role">
              <div class="text-gray-500 mb-1">Role</div>
              <div class="font-serif">{{ selectedProject.metadata.role }}</div>
            </div>
            <div v-if="selectedProject.metadata?.category">
              <div class="text-gray-500 mb-1">Category</div>
              <div class="font-serif">{{ selectedProject.metadata.category }}</div>
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
            class="w-full"
          >
        </div>

        <!-- Project Description -->
        <div class="max-w-3xl mx-auto mt-16">
          <div class="prose prose-lg">
            <div v-html="selectedProject.content"></div>
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

const featuredProject = computed(() => 
  projects.value.find(p => p.metadata?.featured) || projects.value[0]
)

const nonFeaturedProjects = computed(() => 
  projects.value.filter(p => p !== featuredProject.value)
)

const experience = computed(() => 
  props.siteData.siteConfig.experience || []
)

const awards = computed(() => 
  props.siteData.siteConfig.awards || []
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
.stripe-portfolio {
  /* Assuming you have a serif font loaded */
  --font-serif: 'Freight Text Pro', Georgia, serif;
}

.font-serif {
  font-family: var(--font-serif);
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

/* Custom prose styles */
:deep(.prose) {
  --tw-prose-body: theme('colors.gray.600');
  --tw-prose-headings: theme('colors.gray.900');
  --tw-prose-links: theme('colors.gray.900');
  font-family: var(--font-sans);
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4) {
  font-family: var(--font-serif);
}
</style>