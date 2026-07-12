<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <div class="relative inline-block w-full overflow-hidden text-left align-bottom transition-all transform bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:max-w-md sm:w-full sm:align-middle">
        <form @submit.prevent="handleSubmit">
          <div class="px-6 pt-6 pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-white">
                Quick add {{ category === 'JOB' ? 'job' : 'education' }}
              </h3>
              <button type="button" @click="$emit('close')" class="text-gray-400 hover:text-gray-300">×</button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">
                  {{ category === 'JOB' ? 'Company' : 'School' }} *
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  class="input"
                  :placeholder="category === 'JOB' ? 'e.g., Acme Corp' : 'e.g., MIT'"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input v-model="form.startDate" type="date" class="input" />
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">End Date</label>
                  <input v-model="form.endDate" type="date" class="input" :disabled="form.isOngoing" />
                </div>
              </div>
              <label class="flex items-center gap-2 text-sm text-gray-300">
                <input v-model="form.isOngoing" type="checkbox" class="rounded border-gray-600 bg-gray-700" />
                {{ category === 'JOB' ? "I currently work here" : "I'm currently enrolled" }}
              </label>

              <div class="pt-2 border-t border-gray-700">
                <template v-if="projectStore.projects.length > 0">
                  <label class="block text-sm font-medium text-gray-300 mb-1">Portfolio *</label>
                  <select v-model="form.projectId" required class="input">
                    <option value="">Select a portfolio</option>
                    <option v-for="p in projectStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <p class="mt-1 text-xs text-gray-400">This will be saved to your portfolio as a draft.</p>
                </template>
                <template v-else>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Portfolio name *</label>
                  <input v-model="newProjectName" type="text" required class="input" placeholder="e.g., My Portfolio" />
                  <p class="mt-1 text-xs text-gray-400">
                    You don't have a portfolio yet — this creates one to hold your experience/education entries.
                  </p>
                </template>
              </div>
            </div>
          </div>

          <div class="flex flex-row-reverse gap-3 px-6 py-3 bg-gray-800 border-t border-gray-700">
            <button
              type="submit"
              :disabled="isSubmitting || !form.title.trim()"
              class="px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {{ isSubmitting ? 'Creating...' : 'Create' }}
            </button>
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-300 transition-colors bg-gray-700 rounded-md hover:bg-gray-600"
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
import { reactive, ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useProjectStore, type Content } from '@/stores/projects'
import type { LinkableExperienceCategory } from '@/stores/goapply'

const props = defineProps<{
  isOpen: boolean
  category: LinkableExperienceCategory
}>()

const emit = defineEmits<{
  close: []
  created: [content: Content]
}>()

const toast = useToast()
const projectStore = useProjectStore()

const isSubmitting = ref(false)
const newProjectName = ref('')

const form = reactive({
  title: '',
  startDate: '',
  endDate: '',
  isOngoing: false,
  projectId: '',
})

onMounted(async () => {
  if (projectStore.projects.length === 0) {
    await projectStore.fetchProjects()
  }
  if (!form.projectId && projectStore.projects.length > 0) {
    form.projectId = projectStore.projects[0].id
  }
})

async function handleSubmit() {
  if (!form.title.trim()) return

  try {
    isSubmitting.value = true

    let projectId = form.projectId
    if (projectStore.projects.length === 0) {
      if (!newProjectName.value.trim()) return
      const project = await projectStore.createProject({ name: newProjectName.value.trim() })
      projectId = project.id
    }

    if (!projectId) {
      toast.error('Select a portfolio to add this to')
      return
    }

    const content = await projectStore.createContent(projectId, {
      contentType: 'EXPERIENCE',
      title: form.title.trim(),
      content: `# ${form.title.trim()}`,
      experienceCategory: props.category,
      startDate: form.startDate || undefined,
      endDate: form.isOngoing ? undefined : (form.endDate || undefined),
      isOngoing: form.isOngoing,
      status: 'DRAFT',
    })

    emit('created', content)
  } catch (error) {
    // projectStore actions already toast on failure
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50;
}
</style>
