<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="relative inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full max-h-[90vh] flex flex-col w-full">
        <form @submit.prevent="handleSubmit" class="flex flex-col h-full max-h-[90vh]">
          <!-- Header -->
          <div class="px-4 pt-5 pb-4 border-b border-gray-700 sm:px-6 sm:pt-6 sm:pb-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-primary-600">
                  <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-medium text-white">
                    Create New Portfolio
                  </h3>
                  <p class="text-sm text-gray-400 mt-0.5">
                    A collection of your work, content, and projects
                  </p>
                </div>
              </div>
              <button
                type="button"
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div class="space-y-4">
              <div>
                <label for="projectName" class="block text-sm font-medium text-gray-300 mb-1">
                  Portfolio Name *
                </label>
                <input
                  id="projectName"
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="e.g., My Professional Portfolio"
                />
                <p class="mt-1 text-xs text-gray-400">This will be the name of your portfolio site</p>
              </div>
              
              <div>
                <label for="projectDescription" class="block text-sm font-medium text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="projectDescription"
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                  placeholder="Brief description of what this portfolio will showcase..."
                ></textarea>
                <p class="mt-1 text-xs text-gray-400">Help others understand the purpose of this portfolio</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Starting Template
                </label>
                <p class="text-xs text-gray-400 mb-3">Choose a template to get started quickly (you can customize everything later)</p>
                <div class="grid grid-cols-2 gap-2 sm:gap-3">
                  <div
                    v-for="template in templates"
                    :key="template.id"
                    @click="form.template = template.id"
                    class="cursor-pointer rounded-lg border-2 p-3 sm:p-4 transition-all duration-200 hover:scale-[1.02]"
                    :class="form.template === template.id 
                      ? 'border-primary-500 bg-primary-900/50 shadow-lg shadow-primary-500/20' 
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'"
                  >
                    <div class="text-center">
                      <div class="text-2xl sm:text-3xl mb-1 sm:mb-2">{{ template.icon }}</div>
                      <div class="text-xs sm:text-sm font-medium text-white mb-0.5 sm:mb-1">{{ template.name }}</div>
                      <div class="text-xs text-gray-400 leading-tight">{{ template.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="px-4 py-3 border-t border-gray-700 sm:px-6 sm:flex sm:flex-row-reverse sm:py-4">
            <button
              type="submit"
              :disabled="isLoading || !form.name.trim()"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isLoading ? 'Creating...' : 'Create Portfolio' }}
            </button>
            <button
              type="button"
              @click="$emit('close')"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useProjectStore } from '@/stores/projects'

const emit = defineEmits<{
  close: []
  created: []
}>()

const projectStore = useProjectStore()

const isLoading = ref(false)

const form = reactive({
  name: '',
  description: '',
  template: 'blank'
})

const templates = [
  {
    id: 'blank',
    name: 'Blank',
    icon: '📄',
    description: 'Start from scratch with full control'
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '💼',
    description: 'Professional work showcase'
  },
  {
    id: 'blog',
    name: 'Blog',
    icon: '📝',
    description: 'Content-focused site'
  },
  {
    id: 'showcase',
    name: 'Showcase',
    icon: '🚀',
    description: 'Highlight key projects'
  }
]

const handleSubmit = async () => {
  if (!form.name.trim()) return

  try {
    isLoading.value = true
    await projectStore.createProject({
      name: form.name,
      description: form.description
    })
    
    emit('created')
  } catch (error) {
    console.error('Failed to create project:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
