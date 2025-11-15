<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white">User Management</h1>
        <p class="text-gray-400 mt-2">Manage user accounts and permissions</p>
      </div>
      <div class="flex items-center space-x-4">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          type="text"
          placeholder="Search users..."
          class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p class="text-gray-400 mt-4">Loading users...</p>
      </div>

      <div v-else-if="users.length === 0" class="text-center py-12">
        <p class="text-gray-400">No users found</p>
      </div>

      <div v-else>
        <table class="w-full">
          <thead class="bg-gray-700 border-b border-gray-600">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Projects</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-gray-700 transition-colors cursor-pointer"
              @click="$router.push(`/admin/users/${user.id}`)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-white">{{ user.name }}</div>
                  <div class="text-sm text-gray-400">{{ user.email }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <span
                    v-if="user.isAdmin"
                    class="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded"
                  >
                    Admin
                  </span>
                  <span
                    v-else
                    class="px-2 py-1 text-xs font-medium bg-gray-600 text-white rounded"
                  >
                    User
                  </span>
                  <span
                    v-if="!user.hasCompletedOnboarding"
                    class="px-2 py-1 text-xs font-medium bg-yellow-600 text-white rounded"
                  >
                    Pending
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {{ user._count.projectsOwned }} owned, {{ user._count.projectAccess }} member
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click.stop="$router.push(`/admin/users/${user.id}`)"
                  class="text-primary-400 hover:text-primary-300 mr-4"
                >
                  View
                </button>
                <button
                  @click.stop="handleDeleteUser(user)"
                  class="text-red-400 hover:text-red-300"
                  :disabled="user.id === currentUserId"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination.pages > 1" class="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          <div class="text-sm text-gray-400">
            Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
            {{ pagination.total }} users
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span class="text-gray-400">
              Page {{ pagination.page }} of {{ pagination.pages }}
            </span>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page === pagination.pages"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const loading = ref(true)
const users = ref<any[]>([])
const searchQuery = ref('')
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  pages: 0
})

const currentUserId = computed(() => authStore.user?.id)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchUsers = async () => {
  try {
    loading.value = true
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await api.get('/admin/users', { params })
    users.value = response.data.users
    pagination.value = response.data.pagination
  } catch (error: any) {
    console.error('Failed to fetch users:', error)
    toast.error(error.response?.data?.message || 'Failed to load users')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchUsers()
}

const changePage = (page: number) => {
  pagination.value.page = page
  fetchUsers()
}

const handleDeleteUser = async (user: any) => {
  if (user.id === currentUserId.value) {
    toast.error('You cannot delete your own account')
    return
  }

  if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
    return
  }

  try {
    await api.delete(`/admin/users/${user.id}`)
    toast.success('User deleted successfully')
    fetchUsers()
  } catch (error: any) {
    console.error('Failed to delete user:', error)
    toast.error(error.response?.data?.message || 'Failed to delete user')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

