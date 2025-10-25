<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Users</h1>
          <p class="text-gray-600 mt-1">Manage team members and user access</p>
        </div>
        <button
          @click="showInviteModal = true"
          class="btn btn-primary"
        >
          <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Invite User
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="card">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">All Users</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Projects
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in users" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-600">
                      {{ user.name.charAt(0) }}
                    </span>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                    <div class="text-sm text-gray-500">
                      {{ user.isAdmin ? 'Admin' : 'User' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ user.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ user.projectCount || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="viewUser(user)"
                  class="text-primary-600 hover:text-primary-500 mr-3"
                >
                  View
                </button>
                <button
                  v-if="user.id !== authStore.user?.id"
                  @click="confirmDeleteUser(user)"
                  class="text-danger-600 hover:text-danger-500"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite User Modal -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showInviteModal = false"></div>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form @submit.prevent="inviteUser">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                Invite User
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label for="inviteEmail" class="label">Email Address</label>
                  <input
                    id="inviteEmail"
                    v-model="inviteForm.email"
                    type="email"
                    required
                    class="input"
                    placeholder="Enter user's email address"
                  />
                </div>
                
                <div>
                  <label for="inviteRole" class="label">Role</label>
                  <select
                    id="inviteRole"
                    v-model="inviteForm.role"
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
                :disabled="isInviting"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ isInviting ? 'Inviting...' : 'Send Invite' }}
              </button>
              <button
                type="button"
                @click="showInviteModal = false"
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
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { format } from 'date-fns'

const authStore = useAuthStore()

const users = ref([
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    isAdmin: true,
    projectCount: 5,
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    isAdmin: false,
    projectCount: 3,
    createdAt: '2024-02-20T14:45:00Z'
  }
])

const showInviteModal = ref(false)
const isInviting = ref(false)

const inviteForm = reactive({
  email: '',
  role: 'VIEWER' as 'VIEWER' | 'EDITOR' | 'ADMIN'
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const viewUser = (user: any) => {
  console.log('View user:', user)
  // TODO: Implement user view
}

const confirmDeleteUser = (user: any) => {
  if (confirm(`Are you sure you want to delete ${user.name}?`)) {
    console.log('Delete user:', user)
    // TODO: Implement user deletion
  }
}

const inviteUser = async () => {
  try {
    isInviting.value = true
    console.log('Invite user:', inviteForm)
    // TODO: Implement user invitation
    showInviteModal.value = false
    inviteForm.email = ''
    inviteForm.role = 'VIEWER'
  } catch (error) {
    console.error('Failed to invite user:', error)
  } finally {
    isInviting.value = false
  }
}

onMounted(() => {
  // TODO: Fetch users from API
})
</script>
