<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="closeModal"></div>
      
      <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
        <form @submit.prevent="handleSubmit">
          <div class="flex h-[600px]">
            <!-- Sidebar: Content Type Selection -->
            <div class="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
              <div class="p-6 border-b border-gray-700">
                <h3 class="text-lg font-semibold text-white mb-2">Create New Content</h3>
                <p class="text-sm text-gray-400">Choose a content type</p>
              </div>
              
              <div class="flex-1 overflow-y-auto p-4 space-y-2">
                <button
                  v-for="type in contentTypes"
                  :key="type.value"
                  @click="contentType = type.value"
                  type="button"
                  :class="[
                    'w-full p-4 rounded-lg text-left transition-all border-2',
                    contentType === type.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                  ]"
                >
                  <div class="flex items-start space-x-3">
                    <div class="text-2xl flex-shrink-0">{{ type.icon }}</div>
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-white mb-1">{{ type.label }}</div>
                      <div class="text-xs text-gray-400 leading-relaxed">{{ type.description }}</div>
                      <div v-if="type.features && type.features.length > 0" class="mt-2 space-y-1">
                        <div
                          v-for="feature in type.features"
                          :key="feature"
                          class="text-xs text-gray-500 flex items-center"
                        >
                          <svg class="w-3 h-3 mr-1.5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                          </svg>
                          {{ feature }}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col overflow-hidden">
              <!-- Header -->
              <div class="bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-700">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg leading-6 font-medium text-white">
                      {{ selectedType?.label || 'Create Content' }}
                    </h3>
                    <p class="text-sm text-gray-400 mt-1">{{ selectedType?.description }}</p>
                  </div>
                  <button
                    type="button"
                    @click="closeModal"
                    class="text-gray-400 hover:text-gray-300"
                  >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Form Fields -->
              <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <!-- Project Selection -->
                <div v-if="!project">
                  <label for="project" class="block text-sm font-medium text-gray-300 mb-1">
                    Project *
                  </label>
                  <select
                    id="project"
                    v-model="form.projectId"
                    required
                    class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a project</option>
                    <option
                      v-for="proj in projects"
                      :key="proj.id"
                      :value="proj.id"
                    >
                      {{ proj.name }}
                    </option>
                  </select>
                </div>
                <div v-else class="p-3 bg-gray-700 rounded-md">
                  <div class="text-xs text-gray-400 mb-1">Project</div>
                  <div class="font-medium text-white">{{ project.name }}</div>
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
                    class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    :placeholder="selectedType?.placeholder || 'Enter a title'"
                  />
                </div>

                <!-- Slug -->
                <div>
                  <label for="slug" class="block text-sm font-medium text-gray-300 mb-1">
                    URL Slug
                  </label>
                  <div class="flex">
                    <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-400 text-sm">
                      {{ project?.subdomain || 'project' }}.foligo.tech/
                    </span>
                    <input
                      id="slug"
                      v-model="form.slug"
                      type="text"
                      class="flex-1 px-3 py-2 border border-gray-600 rounded-r-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                    class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Brief description (optional)"
                  ></textarea>
                </div>

                <!-- Type-specific fields -->
                <div v-if="contentType === 'PROJECT'" class="space-y-4 pt-2 border-t border-gray-700">
                  <h4 class="text-sm font-semibold text-gray-300">Project Details</h4>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">Start Date</label>
                      <input
                        v-model="form.metadata.startDate"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">End Date</label>
                      <input
                        v-model="form.metadata.endDate"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select category</option>
                      <option value="JOB">Job Experience</option>
                      <option value="EDUCATION">Education</option>
                      <option value="CERTIFICATION">Certification/License</option>
                    </select>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">Start Date</label>
                      <input
                        v-model="form.metadata.startDate"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-400 mb-1">End Date</label>
                      <input
                        v-model="form.metadata.endDate"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                      class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                    class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
              </div>

              <!-- Footer -->
              <div class="bg-gray-800 px-6 py-4 border-t border-gray-700 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  :disabled="isLoading || !form.title.trim()"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isLoading ? 'Creating...' : `Create ${selectedType?.label || 'Content'}` }}
                </button>
                <button
                  type="button"
                  @click="closeModal"
                  class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Gemini AI Chatbot -->
  <GeminiChatbot
    v-if="showAIChatbot"
    :is-open="showAIChatbot"
    :content-type="contentType"
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
    categoryTag: ''
  }
})

const closeModal = () => {
  emit('close')
}

const openAIChatbot = () => {
  console.log('Opening AI chatbot...', { contentType: contentType.value, form: form })
  showAIChatbot.value = true
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
    }

    if (contentType.value === 'EXPERIENCE') {
      if (form.metadata.experienceCategory) contentData.experienceCategory = form.metadata.experienceCategory
      if (form.metadata.startDate) contentData.startDate = form.metadata.startDate
      if (form.metadata.endDate) contentData.endDate = form.metadata.endDate
    }

    if (contentType.value === 'SKILL') {
      // Skills are handled differently - they need a tag
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
        categoryTag: ''
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
