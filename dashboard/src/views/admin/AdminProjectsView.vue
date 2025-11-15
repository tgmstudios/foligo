<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white">Portfolio Management</h1>
        <p class="text-gray-400 mt-2">Manage all portfolios on the platform</p>
      </div>
      <div class="flex items-center space-x-4">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          type="text"
          placeholder="Search portfolios..."
          class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>

    <!-- Projects Table -->
    <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p class="text-gray-400 mt-4">Loading portfolios...</p>
      </div>

      <div v-else-if="projects.length === 0" class="text-center py-12">
        <p class="text-gray-400">No portfolios found</p>
      </div>

      <div v-else>
        <table class="w-full">
          <thead class="bg-gray-700 border-b border-gray-600">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Portfolio</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Owner</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Content</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <tr
              v-for="project in projects"
              :key="project.id"
              class="hover:bg-gray-700 transition-colors cursor-pointer"
              @click="$router.push(`/admin/projects/${project.id}`)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-white">{{ project.name }}</div>
                  <div v-if="project.subdomain" class="text-sm text-gray-400">
                    {{ project.subdomain }}.foligo.tech
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-300">{{ project.owner.name }}</div>
                <div class="text-sm text-gray-400">{{ project.owner.email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="project.isPublished"
                  class="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded"
                >
                  Published
                </span>
                <span
                  v-else
                  class="px-2 py-1 text-xs font-medium bg-gray-600 text-white rounded"
                >
                  Draft
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {{ project._count.content }} items, {{ project._count.members }} members
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {{ formatDate(project.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click.stop="$router.push(`/admin/projects/${project.id}`)"
                  class="text-primary-400 hover:text-primary-300 mr-4"
                >
                  View
                </button>
                <button
                  @click.stop="handleDeleteProject(project)"
                  class="text-red-400 hover:text-red-300"
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
            {{ pagination.total }} portfolios
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const router = useRouter()
const toast = useToast()

const loading = ref(true)
const projects = ref<any[]>([])
const searchQuery = ref('')
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  pages: 0
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchProjects = async () => {
  try {
    loading.value = true
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await api.get('/admin/projects', { params })
    projects.value = response.data.projects
    pagination.value = response.data.pagination
  } catch (error: any) {
    console.error('Failed to fetch projects:', error)
    toast.error(error.response?.data?.message || 'Failed to load portfolios')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchProjects()
}

const changePage = (page: number) => {
  pagination.value.page = page
  fetchProjects()
}

const handleDeleteProject = async (project: any) => {
  if (!confirm(`Are you sure you want to delete portfolio "${project.name}"? This action cannot be undone.`)) {
    return
  }

  try {
    await api.delete(`/admin/projects/${project.id}`)
    toast.success('Portfolio deleted successfully')
    fetchProjects()
  } catch (error: any) {
    console.error('Failed to delete project:', error)
    toast.error(error.response?.data?.message || 'Failed to delete portfolio')
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

