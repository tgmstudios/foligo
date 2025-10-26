<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <form @submit.prevent="handleSubmit">
          <div class="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-600 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-white mb-4">
                  Create New Project
                </h3>
                
                <div class="space-y-4">
                  <div>
                    <label for="projectName" class="label">Project Name</label>
                    <input
                      id="projectName"
                      v-model="form.name"
                      type="text"
                      required
                      class="input"
                      placeholder="Enter project name"
                    />
                  </div>
                  
                  <div>
                    <label for="projectDescription" class="label">Description (Optional)</label>
                    <textarea
                      id="projectDescription"
                      v-model="form.description"
                      rows="3"
                      class="input"
                      placeholder="Brief description of your project..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <label class="label">Template</label>
                    <div class="grid grid-cols-2 gap-3">
                      <div
                        v-for="template in templates"
                        :key="template.id"
                        @click="form.template = template.id"
                        class="cursor-pointer rounded-lg border-2 p-3 transition-all duration-200"
                        :class="form.template === template.id 
                          ? 'border-primary-500 bg-primary-900' 
                          : 'border-gray-600 hover:border-gray-500'"
                      >
                        <div class="text-center">
                          <div class="text-2xl mb-1">{{ template.icon }}</div>
                          <div class="text-sm font-medium text-white">{{ template.name }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="isLoading || !form.name.trim()"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Creating...' : 'Create Project' }}
            </button>
            <button
              type="button"
              @click="$emit('close')"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
    description: 'Start from scratch'
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '💼',
    description: 'Showcase your work'
  },
  {
    id: 'blog',
    name: 'Blog',
    icon: '📝',
    description: 'Share your thoughts'
  },
  {
    id: 'showcase',
    name: 'Showcase',
    icon: '🚀',
    description: 'Highlight projects'
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
