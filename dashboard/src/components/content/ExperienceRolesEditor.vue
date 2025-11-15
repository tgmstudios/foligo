<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-white">Experience Roles</h3>
      <button
        @click="showCreateModal = true"
        class="btn btn-sm btn-primary"
      >
        + Add Role
      </button>
    </div>

    <!-- Roles List -->
    <div class="space-y-4">
      <div
        v-for="role in roles"
        :key="role.id"
        class="p-4 bg-gray-700 rounded-md"
      >
        <div class="flex items-center justify-between mb-2">
          <div>
            <h4 class="text-white font-medium">{{ role.title }}</h4>
            <p class="text-sm text-gray-400">
              {{ formatDate(role.startDate) }} - 
              {{ role.isCurrent ? 'Present' : (role.endDate ? formatDate(role.endDate) : 'Ongoing') }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="editRole(role)"
              class="text-sm text-primary-400 hover:text-primary-300"
            >
              Edit
            </button>
            <button
              @click="deleteRole(role.id)"
              class="text-sm text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
        <p v-if="role.description" class="text-sm text-gray-300 mt-2">
          {{ role.description }}
        </p>
        <div v-if="role.skills && role.skills.length > 0" class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="skill in role.skills"
            :key="skill.id"
            class="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded"
          >
            {{ skill.name }}
          </span>
        </div>
      </div>
      <div v-if="roles.length === 0" class="text-center text-gray-400 py-8">
        No roles yet. Add your first role to get started.
      </div>
    </div>

    <!-- Create/Edit Role Modal -->
    <div
      v-if="showCreateModal || editingRole"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="closeModal"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form @submit.prevent="saveRole">
            <div class="bg-gray-800 px-6 pt-6 pb-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-white">
                  {{ editingRole ? 'Edit Role' : 'Create Role' }}
                </h3>
                <button
                  type="button"
                  @click="closeModal"
                  class="text-gray-400 hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="label">Title *</label>
                  <input
                    v-model="roleForm.title"
                    type="text"
                    required
                    class="input"
                    placeholder="e.g., Software Engineer, Senior Developer"
                  />
                </div>
                <div>
                  <label class="label">Description</label>
                  <textarea
                    v-model="roleForm.description"
                    rows="3"
                    class="input"
                    placeholder="Role description"
                  ></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">Start Date *</label>
                    <input
                      v-model="roleForm.startDate"
                      type="date"
                      required
                      class="input"
                    />
                  </div>
                  <div>
                    <label class="label">End Date</label>
                    <input
                      v-model="roleForm.endDate"
                      type="date"
                      class="input"
                      :disabled="roleForm.isCurrent"
                    />
                  </div>
                </div>
                <div>
                  <label class="flex items-center space-x-2">
                    <input
                      v-model="roleForm.isCurrent"
                      type="checkbox"
                      class="rounded"
                    />
                    <span class="text-sm text-gray-300">Current role</span>
                  </label>
                </div>
                <div>
                  <label class="label">Skills</label>
                  <SkillsManager
                    v-model="roleForm.skills"
                    :project-id="projectId"
                  />
                </div>
              </div>
            </div>
            
            <div class="bg-gray-800 px-6 py-3 flex justify-end space-x-3">
              <button
                type="button"
                @click="closeModal"
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSaving"
                class="btn btn-primary"
              >
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import SkillsManager from './SkillsManager.vue'
import type { ExperienceRole, Skill } from '@/stores/projects'

interface Props {
  contentId: string
  projectId: string
}

const props = defineProps<Props>()

const roles = ref<ExperienceRole[]>([])
const showCreateModal = ref(false)
const editingRole = ref<ExperienceRole | null>(null)
const isSaving = ref(false)

const roleForm = ref({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  skills: [] as Skill[]
})

const fetchRoles = async () => {
  try {
    const response = await api.get(`/projects/${props.projectId}/content/${props.contentId}/roles`)
    roles.value = response.data
  } catch (error) {
    console.error('Failed to fetch roles:', error)
  }
}

const editRole = (role: ExperienceRole) => {
  editingRole.value = role
  roleForm.value = {
    title: role.title,
    description: role.description || '',
    startDate: role.startDate.split('T')[0],
    endDate: role.endDate ? role.endDate.split('T')[0] : '',
    isCurrent: role.isCurrent,
    skills: role.skills || []
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingRole.value = null
  roleForm.value = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    skills: []
  }
}

const saveRole = async () => {
  try {
    isSaving.value = true
    
    const data = {
      ...roleForm.value,
      skillIds: roleForm.value.skills.map(s => s.id)
    }
    
    if (editingRole.value) {
      // Update existing role
      await api.put(`/experience-roles/${editingRole.value.id}`, data)
    } else {
      // Create new role
      await api.post(`/projects/${props.projectId}/content/${props.contentId}/roles`, data)
    }
    
    await fetchRoles()
    closeModal()
  } catch (error) {
    console.error('Failed to save role:', error)
  } finally {
    isSaving.value = false
  }
}

const deleteRole = async (roleId: string) => {
  if (!confirm('Are you sure you want to delete this role?')) return
  
  try {
    await api.delete(`/experience-roles/${roleId}`)
    roles.value = roles.value.filter(r => r.id !== roleId)
  } catch (error) {
    console.error('Failed to delete role:', error)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

onMounted(() => {
  fetchRoles()
})
</script>

