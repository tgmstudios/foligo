<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="closeModal"></div>
      
      <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <form @submit.prevent="handleSubmit">
          <!-- Header -->
          <div class="bg-gray-800 px-6 pt-6 pb-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-white">
                Create New {{ contentType }}
              </h3>
              <button
                type="button"
                @click="closeModal"
                class="text-gray-400 hover:text-gray-400"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content Type Selection -->
          <div class="px-6 pb-4">
            <label class="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="type in contentTypes"
                :key="type.value"
                @click="contentType = type.value"
                :class="[
                  'p-3 border rounded-lg text-left transition-colors',
                  contentType === type.value
                    ? 'border-primary-500 bg-primary-900 text-primary-700'
                    : 'border-gray-600 hover:border-gray-500'
                ]"
              >
                <div class="text-lg mb-1">{{ type.icon }}</div>
                <div class="font-medium">{{ type.label }}</div>
                <div class="text-sm text-gray-400">{{ type.description }}</div>
              </button>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="px-6 pb-4 space-y-4">
            <!-- Project Selection -->
            <div v-if="!project">
              <label for="project" class="block text-sm font-medium text-gray-300 mb-1">
                Project *
              </label>
              <select
                id="project"
                v-model="form.projectId"
                required
                class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
            <div v-else class="p-3 bg-gray-800 rounded-md">
              <div class="text-sm text-gray-600">Project:</div>
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
                class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter a title for your content"
              />
            </div>

            <!-- Slug -->
            <div>
              <label for="slug" class="block text-sm font-medium text-gray-300 mb-1">
                URL Slug
              </label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-800 text-gray-400 text-sm">
                  {{ project?.subdomain }}.foligo.tech/
                </span>
                <input
                  id="slug"
                  v-model="form.slug"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-600 rounded-r-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Brief description of your content"
              ></textarea>
            </div>

            <!-- Metadata (type-specific fields) -->
            <div v-if="contentType === 'PROJECT'" class="space-y-3">
              <h4 class="text-sm font-medium text-gray-300">Project Details</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Technologies</label>
                  <input
                    v-model="form.metadata.technologies"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Project URL</label>
                  <input
                    v-model="form.metadata.projectUrl"
                    type="url"
                    class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            <div v-if="contentType === 'EXPERIENCE'" class="space-y-3">
              <h4 class="text-sm font-medium text-gray-300">Experience Details</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Company</label>
                  <input
                    v-model="form.metadata.company"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Position</label>
                  <input
                    v-model="form.metadata.position"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Job Title"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    v-model="form.metadata.startDate"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    v-model="form.metadata.endDate"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <div v-if="contentType === 'BLOG'" class="space-y-3">
              <h4 class="text-sm font-medium text-gray-300">Blog Details</h4>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Tags</label>
                <input
                  v-model="form.metadata.tags"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="technology, programming, web-development"
                />
              </div>
            </div>

            <!-- Publish Status -->
            <div class="flex items-center">
              <input
                id="isPublished"
                v-model="form.isPublished"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 rounded"
              />
              <label for="isPublished" class="ml-2 block text-sm text-gray-300">
                Publish immediately
              </label>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-800 px-6 py-3 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="isLoading || !form.title.trim()"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Creating...' : 'Create Content' }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
const contentType = ref<'PROJECT' | 'BLOG' | 'EXPERIENCE'>('BLOG')

const projects = computed(() => projectStore.projects)

const contentTypes = [
  {
    value: 'PROJECT' as const,
    label: 'Project',
    description: 'Portfolio project',
    icon: '🚀'
  },
  {
    value: 'BLOG' as const,
    label: 'Blog Post',
    description: 'Article or blog post',
    icon: '📝'
  },
  {
    value: 'EXPERIENCE' as const,
    label: 'Experience',
    description: 'Work experience',
    icon: '💼'
  }
]

const form = reactive({
  projectId: props.project?.id || '',
  title: '',
  slug: '',
  excerpt: '',
  content: '', // Will be filled by markdown editor
  metadata: {
    technologies: '',
    projectUrl: '',
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    tags: ''
  },
  isPublished: false
})

const closeModal = () => {
  emit('close')
}

const openAIChatbot = () => {
  console.log('Opening AI chatbot...', { contentType: contentType.value, form: form })
  showAIChatbot.value = true
}

const handleAIContentGenerated = (content: any) => {
  // Update form with AI-generated content
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
  
  // Close AI chatbot
  showAIChatbot.value = false
  
  // Show success message or auto-submit
  emit('created', content)
  closeModal()
}

const handleSubmit = async () => {
  const targetProjectId = form.projectId || props.project?.id
  if (!targetProjectId) return

  try {
    isLoading.value = true

    const contentData = {
      contentType: contentType.value,
      title: form.title,
      slug: form.slug || undefined,
      excerpt: form.excerpt || undefined,
      content: form.content || `# ${form.title}\n\nStart writing your content here...`,
      metadata: form.metadata,
      isPublished: form.isPublished
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
      metadata: {
        technologies: '',
        projectUrl: '',
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        tags: ''
      },
      isPublished: false
    })
  } catch (error) {
    console.error('Failed to create content:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
