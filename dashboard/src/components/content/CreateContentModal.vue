<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="closeModal"></div>
      
      <div class="relative inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full max-h-[90vh] flex flex-col w-full">
        <form @submit.prevent="handleSubmit" class="flex flex-col h-full max-h-[90vh]">
          <!-- Header -->
          <div class="px-4 pt-5 pb-4 border-b border-gray-700 sm:px-6 sm:pt-6 sm:pb-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="text-2xl sm:text-3xl flex-shrink-0">{{ selectedType?.icon || '📝' }}</div>
                <div>
                  <h3 class="text-lg font-medium text-white">
                    {{ selectedType?.label || 'Create Content' }}
                  </h3>
                  <p class="text-sm text-gray-400 mt-0.5">{{ selectedType?.description }}</p>
                </div>
              </div>
              <button
                type="button"
                @click="closeModal"
                class="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content Type Selection (Mobile: Tabs, Desktop: Compact Grid) -->
          <div class="px-4 pt-4 border-b border-gray-700 sm:px-6">
            <div class="flex overflow-x-auto pb-2 sm:pb-0 sm:grid sm:grid-cols-4 sm:gap-2 scrollbar-hide">
              <button
                v-for="type in contentTypes"
                :key="type.value"
                @click="contentType = type.value"
                type="button"
                :class="[
                  'flex-shrink-0 px-3 py-2 rounded-lg text-left transition-all border-2 sm:flex-col sm:items-center sm:text-center sm:p-3',
                  contentType === type.value
                    ? 'border-primary-500 bg-primary-500/10 shadow-md shadow-primary-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                ]"
              >
                <div class="text-lg sm:text-2xl mr-2 sm:mr-0 sm:mb-1">{{ type.icon }}</div>
                <div class="flex-1 min-w-0 sm:flex-none">
                  <div class="text-xs sm:text-sm font-medium text-white truncate sm:whitespace-normal">{{ type.label }}</div>
                </div>
              </button>
            </div>
          </div>

          <!-- Form Content -->
          <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div class="space-y-4">
              <!-- Portfolio Selection -->
              <div v-if="!project">
                <label for="project" class="block text-sm font-medium text-gray-300 mb-1">
                  Portfolio *
                </label>
                <select
                  id="project"
                  v-model="form.projectId"
                  required
                  class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="">Select a portfolio</option>
                  <option
                    v-for="proj in projects"
                    :key="proj.id"
                    :value="proj.id"
                  >
                    {{ proj.name }}
                  </option>
                </select>
                <p class="mt-1 text-xs text-gray-400">Content will be added to the selected portfolio</p>
              </div>
              <div v-else class="p-3 bg-gray-700 rounded-md">
                <div class="text-xs text-gray-400 mb-1">Portfolio</div>
                <div class="font-medium text-white text-sm">{{ project.name }}</div>
              </div>

              <!-- Title -->
              <div>
                <label for="title" class="block text-sm font-medium text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                  :placeholder="selectedType?.placeholder || 'Enter a title'"
                />
              </div>

              <!-- Slug -->
              <div>
                <label for="slug" class="block text-sm font-medium text-gray-300 mb-1">
                  URL Slug
                </label>
                <div class="flex">
                  <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-400 text-xs sm:text-sm">
                    {{ project?.subdomain || 'project' }}.foligo.tech/
                  </span>
                  <input
                    id="slug"
                    v-model="form.slug"
                    type="text"
                    class="flex-1 px-3 py-2 border border-gray-600 rounded-r-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="url-friendly-slug"
                  />
                </div>
                <p class="mt-1 text-xs text-gray-400">
                  Leave empty to auto-generate from title
                </p>
              </div>

              <!-- Excerpt -->
              <div>
                <label for="excerpt" class="block text-sm font-medium text-gray-300 mb-1">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  v-model="form.excerpt"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                  placeholder="Brief description (optional)"
                ></textarea>
              </div>

              <!-- Type-specific fields -->
              <div v-if="contentType === 'PROJECT'" class="space-y-4 pt-2 border-t border-gray-700">
                <h4 class="text-sm font-semibold text-gray-300">Project Details</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">Start Date</label>
                    <input
                      v-model="form.metadata.startDate"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">End Date</label>
                    <input
                      v-model="form.metadata.endDate"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div v-if="contentType === 'EXPERIENCE'" class="space-y-4 pt-2 border-t border-gray-700">
                <h4 class="text-sm font-semibold text-gray-300">Experience Details</h4>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">Category *</label>
                  <select
                    v-model="form.metadata.experienceCategory"
                    class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                  >
                    <option value="">Select category</option>
                    <option value="JOB">Job Experience</option>
                    <option value="EDUCATION">Education</option>
                    <option value="CERTIFICATION">Certification/License</option>
                  </select>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">Start Date</label>
                    <input
                      v-model="form.metadata.startDate"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-400 mb-1">End Date</label>
                    <input
                      v-model="form.metadata.endDate"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div v-if="contentType === 'SKILL'" class="space-y-4 pt-2 border-t border-gray-700">
                <h4 class="text-sm font-semibold text-gray-300">Skill Details</h4>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">Category Tag</label>
                  <input
                    v-model="form.metadata.categoryTag"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="e.g., Programming Languages, Frameworks, Tools"
                  />
                  <p class="mt-1 text-xs text-gray-500">The category this skill belongs to</p>
                </div>
              </div>

              <!-- Status -->
              <div class="pt-2 border-t border-gray-700">
                <label for="status" class="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  v-model="form.status"
                  class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-4 py-3 border-t border-gray-700 sm:px-6 sm:flex sm:flex-row-reverse sm:py-4">
            <button
              type="submit"
              :disabled="isLoading || !form.title.trim()"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isLoading ? 'Creating...' : `Create ${selectedType?.label || 'Content'}` }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Gemini AI Chatbot -->
  <GeminiChatbot
    v-if="showAIChatbot && (contentType === 'BLOG' || contentType === 'PROJECT' || contentType === 'EXPERIENCE')"
    :is-open="showAIChatbot"
    :content-type="contentType as 'BLOG' | 'PROJECT' | 'EXPERIENCE'"
    :initial-info="form"
    :project-id="form.projectId || project?.id"
    @close="showAIChatbot = false"
    @content-generated="handleAIContentGenerated"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useProjectStore } from '@/stores/projects'
import type { Project } from '@/stores/projects'
import GeminiChatbot from './GeminiChatbot.vue'

interface Props {
  isOpen: boolean
  project: Project | null
}

interface Emits {
  (e: 'close'): void
  (e: 'created', content: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const projectStore = useProjectStore()

const isLoading = ref(false)
const showAIChatbot = ref(false)
const contentType = ref<'PROJECT' | 'BLOG' | 'EXPERIENCE' | 'SKILL'>('BLOG')

const projects = computed(() => projectStore.projects)

const contentTypes = [
  {
    value: 'PROJECT' as const,
    label: 'Project',
    icon: '🚀',
    description: 'Showcase your portfolio projects',
    placeholder: 'Project name (e.g., E-Commerce Platform)',
    features: [
      'Dates & timeline',
      'GitHub & Devpost links',
      'Contributors',
      'Skills & technologies',
      'Featured images',
      'Content blocks'
    ]
  },
  {
    value: 'BLOG' as const,
    label: 'Blog Post',
    icon: '📝',
    description: 'Write articles and blog posts',
    placeholder: 'Blog post title',
    features: [
      'Markdown editor',
      'Tags & categories',
      'Content blocks',
      'SEO-friendly'
    ]
  },
  {
    value: 'EXPERIENCE' as const,
    label: 'Experience',
    icon: '💼',
    description: 'Document work history & education',
    placeholder: 'Job title or degree name',
    features: [
      'Job/Education/Certification',
      'Multiple roles per job',
      'Location & work type',
      'Skills & achievements',
      'Date ranges'
    ]
  },
  {
    value: 'SKILL' as const,
    label: 'Skill',
    icon: '⚡',
    description: 'Quickly add skills to your profile',
    placeholder: 'Skill name (e.g., Node.js)',
    features: [
      'Categorized by tags',
      'Link to projects',
      'Link to experiences',
      'Quick creation'
    ]
  }
]

const selectedType = computed(() => {
  return contentTypes.find(t => t.value === contentType.value)
})

const form = reactive({
  projectId: props.project?.id || '',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'HIDDEN',
  metadata: {
    startDate: '',
    endDate: '',
    experienceCategory: '',
    categoryTag: '',
    isOngoing: undefined as boolean | undefined,
    projectLinks: undefined as any,
    contributors: undefined as any,
    location: undefined as string | undefined,
    locationType: undefined as string | undefined
  }
})

const closeModal = () => {
  emit('close')
}

const handleAIContentGenerated = (content: any) => {
  if (content.content) {
    form.content = content.content
  }
  if (content.title) {
    form.title = content.title
  }
  if (content.excerpt) {
    form.excerpt = content.excerpt
  }
  if (content.metadata) {
    form.metadata = { ...form.metadata, ...content.metadata }
  }
  
  showAIChatbot.value = false
  emit('created', content)
  closeModal()
}

const handleSubmit = async () => {
  const targetProjectId = form.projectId || props.project?.id
  if (!targetProjectId) return

  try {
    isLoading.value = true

    const contentData: any = {
      contentType: contentType.value,
      title: form.title,
      slug: form.slug || undefined,
      excerpt: form.excerpt || undefined,
      content: form.content || `# ${form.title}\n\nStart writing your content here...`,
      status: form.status
    }

    // Add type-specific fields
    if (contentType.value === 'PROJECT') {
      if (form.metadata.startDate) contentData.startDate = form.metadata.startDate
      if (form.metadata.endDate) contentData.endDate = form.metadata.endDate
      if (form.metadata.isOngoing !== undefined) contentData.isOngoing = form.metadata.isOngoing
      if (form.metadata.projectLinks) contentData.projectLinks = form.metadata.projectLinks
      if (form.metadata.contributors) contentData.contributors = form.metadata.contributors
    }

    if (contentType.value === 'EXPERIENCE') {
      if (form.metadata.experienceCategory) contentData.experienceCategory = form.metadata.experienceCategory
      if (form.metadata.startDate) contentData.startDate = form.metadata.startDate
      if (form.metadata.endDate) contentData.endDate = form.metadata.endDate
      if (form.metadata.isOngoing !== undefined) contentData.isOngoing = form.metadata.isOngoing
      if (form.metadata.location) contentData.location = form.metadata.location
      if (form.metadata.locationType) contentData.locationType = form.metadata.locationType
    }

    if (contentType.value === 'SKILL') {
      // Skills are handled differently - they have their own category system
      // For now, we'll create it as regular content and the user can configure it in the editor
    }

    const newContent = await projectStore.createContent(targetProjectId, contentData)
    
    emit('created', newContent)
    closeModal()
    
    // Reset form
    Object.assign(form, {
      projectId: props.project?.id || '',
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      status: 'DRAFT',
      metadata: {
        startDate: '',
        endDate: '',
        experienceCategory: '',
        categoryTag: '',
        isOngoing: undefined,
        projectLinks: undefined,
        contributors: undefined,
        location: undefined,
        locationType: undefined
      }
    })
    contentType.value = 'BLOG'
  } catch (error) {
    console.error('Failed to create content:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
