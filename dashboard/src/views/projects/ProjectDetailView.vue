<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Project Details</h1>
          <p class="text-gray-600 mt-1">{{ project?.name || 'Loading...' }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="showSettingsModal = true"
            class="btn btn-outline"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <router-link
            :to="`/projects/${projectId}/edit`"
            class="btn btn-primary"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Content
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="projectStore.isLoading" class="space-y-6">
      <div class="card p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div class="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>

    <!-- Project Not Found -->
    <div v-else-if="!project" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
      <p class="mt-1 text-sm text-gray-500">The project you're looking for doesn't exist or you don't have access to it.</p>
      <div class="mt-6">
        <router-link to="/projects" class="btn btn-primary">
          Back to Projects
        </router-link>
      </div>
    </div>

    <!-- Project Content -->
    <div v-else class="space-y-6">
      <!-- Project Info -->
      <div class="card p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ project.name }}</h2>
            <p class="text-gray-600 mb-4">{{ project.description || 'No description provided' }}</p>
            
            <div class="flex items-center space-x-6 text-sm text-gray-500">
              <div class="flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Created {{ formatDate(project.createdAt) }}
              </div>
              <div class="flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Updated {{ formatDate(project.updatedAt) }}
              </div>
              <div class="flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ project._count?.content || 0 }} content blocks
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <span
              v-if="project.ownerId === authStore.user?.id"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              Owner
            </span>
            <span
              v-else
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              Member
            </span>
          </div>
        </div>
      </div>

      <!-- Team Members -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Team Members</h3>
          <button
            v-if="canManageMembers"
            @click="showAddMemberModal = true"
            class="btn btn-outline btn-sm"
          >
            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Member
          </button>
        </div>
        
        <div v-if="project.members && project.members.length > 0" class="space-y-3">
          <div
            v-for="member in project.members"
            :key="member.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center">
              <div class="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-gray-600">
                  {{ member.user.name.charAt(0) }}
                </span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">{{ member.user.name }}</p>
                <p class="text-xs text-gray-500">{{ member.user.email }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-red-100 text-red-800': member.role === 'ADMIN',
                  'bg-yellow-100 text-yellow-800': member.role === 'EDITOR',
                  'bg-green-100 text-green-800': member.role === 'VIEWER'
                }"
              >
                {{ member.role }}
              </span>
              <button
                v-if="canManageMembers && member.userId !== authStore.user?.id"
                @click="removeMember(member)"
                class="text-gray-400 hover:text-danger-500"
                title="Remove member"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-4 text-gray-500">
          No team members yet
        </div>
      </div>

      <!-- Content Overview -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Content Overview</h3>
          <router-link
            :to="`/projects/${projectId}/edit`"
            class="btn btn-primary btn-sm"
          >
            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Content
          </router-link>
        </div>
        
        <div v-if="project.content && project.content.length > 0" class="space-y-3">
          <div
            v-for="content in project.content"
            :key="content.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center">
              <div class="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <span class="text-xs font-medium text-gray-600">{{ content.type.charAt(0) }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ content.type }}</p>
                <p class="text-xs text-gray-500">Order: {{ content.order }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span
                v-if="content.aiAnalysis"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
              >
                AI Analyzed
              </span>
              <span class="text-xs text-gray-500">{{ formatDate(content.updatedAt) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No content yet</h3>
          <p class="mt-1 text-sm text-gray-500">Start by adding your first content block.</p>
          <div class="mt-6">
            <router-link
              :to="`/projects/${projectId}/edit`"
              class="btn btn-primary"
            >
              Add Content
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div
      v-if="showAddMemberModal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showAddMemberModal = false"></div>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form @submit.prevent="addMember">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                Add Team Member
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label for="memberEmail" class="label">Email Address</label>
                  <input
                    id="memberEmail"
                    v-model="memberForm.email"
                    type="email"
                    required
                    class="input"
                    placeholder="Enter member's email address"
                  />
                </div>
                
                <div>
                  <label for="memberRole" class="label">Role</label>
                  <select
                    id="memberRole"
                    v-model="memberForm.role"
                    class="input"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                :disabled="isAddingMember"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ isAddingMember ? 'Adding...' : 'Add Member' }}
              </button>
              <button
                type="button"
                @click="showAddMemberModal = false"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore, type ProjectMember } from '@/stores/projects'
import { format } from 'date-fns'

const route = useRoute()
const authStore = useAuthStore()
const projectStore = useProjectStore()

const projectId = route.params.id as string
const showAddMemberModal = ref(false)
const showSettingsModal = ref(false)
const isAddingMember = ref(false)

const memberForm = reactive({
  email: '',
  role: 'VIEWER' as 'VIEWER' | 'EDITOR' | 'ADMIN'
})

const project = computed(() => projectStore.currentProject)

const canManageMembers = computed(() => {
  if (!project.value || !authStore.user) return false
  return project.value.ownerId === authStore.user.id
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const addMember = async () => {
  if (!memberForm.email || !projectId) return

  try {
    isAddingMember.value = true
    await projectStore.addProjectMember(projectId, memberForm.email, memberForm.role)
    showAddMemberModal.value = false
    memberForm.email = ''
    memberForm.role = 'VIEWER'
  } catch (error) {
    console.error('Failed to add member:', error)
  } finally {
    isAddingMember.value = false
  }
}

const removeMember = async (member: ProjectMember) => {
  if (!confirm(`Are you sure you want to remove ${member.user.name} from this project?`)) {
    return
  }

  try {
    await projectStore.removeProjectMember(projectId, member.userId)
  } catch (error) {
    console.error('Failed to remove member:', error)
  }
}

onMounted(async () => {
  await projectStore.fetchProject(projectId)
})
</script>
