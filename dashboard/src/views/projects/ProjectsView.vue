<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Projects</h1>
          <p class="text-gray-400 mt-1">Manage your portfolio projects and content</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="btn btn-primary"
        >
          <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Project
        </button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="mb-6 flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search projects..."
            class="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <select
          v-model="filterType"
          class="px-3 py-2 border border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Projects</option>
          <option value="owned">My Projects</option>
          <option value="member">Member Projects</option>
        </select>
        <select
          v-model="sortBy"
          class="px-3 py-2 border border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="updated">Last Updated</option>
          <option value="created">Date Created</option>
          <option value="name">Name</option>
        </select>
      </div>
    </div>

    <!-- Projects Grid -->
    <div v-if="projectStore.isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="card p-6 animate-pulse">
        <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div class="h-3 bg-gray-700 rounded w-full mb-2"></div>
        <div class="h-3 bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="filteredProjects.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-white">No projects found</h3>
      <p class="mt-1 text-sm text-gray-400">
        {{ searchQuery ? 'Try adjusting your search criteria.' : 'Get started by creating a new project.' }}
      </p>
      <div v-if="!searchQuery" class="mt-6">
        <button
          @click="showCreateModal = true"
          class="btn btn-primary"
        >
          Create Project
        </button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="card p-6 hover:shadow-md transition-shadow cursor-pointer"
        @click="$router.push(`/projects/${project.id}`)"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white truncate">{{ project.name }}</h3>
            <p class="text-sm text-gray-400 mt-1 line-clamp-2">{{ project.description || 'No description' }}</p>
          </div>
          <div class="flex items-center space-x-1 ml-2">
            <span
              v-if="project.ownerId === authStore.user?.id"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
            >
              Owner
            </span>
            <span
              v-else
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-800"
            >
              Member
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between text-sm text-gray-400 mb-4">
          <div class="flex items-center space-x-4">
            <span class="flex items-center">
              <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ project._count?.content || 0 }}
            </span>
            <span class="flex items-center">
              <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              {{ project._count?.members || 0 }}
            </span>
          </div>
          <span>{{ formatDate(project.updatedAt) }}</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="h-6 w-6 bg-gray-700 rounded-full flex items-center justify-center">
              <span class="text-xs font-medium text-gray-400">
                {{ project.owner?.name?.charAt(0) || '?' }}
              </span>
            </div>
            <span class="ml-2 text-sm text-gray-400">{{ project.owner?.name || 'Unknown' }}</span>
          </div>
          
          <div class="flex items-center space-x-1">
            <button
              @click.stop="$router.push(`/projects/${project.id}`)"
              class="p-1 text-gray-400 hover:text-gray-300"
              title="Edit"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              v-if="project.ownerId === authStore.user?.id"
              @click.stop="confirmDelete(project)"
              class="p-1 text-gray-400 hover:text-danger-500"
              title="Delete"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleProjectCreated"
    />

    <!-- Delete Confirmation Modal -->
    <div
      v-if="projectToDelete"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="projectToDelete = null"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-white">
                  Delete Project
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-400">
                    Are you sure you want to delete "{{ projectToDelete.name }}"? This action cannot be undone and will permanently delete all content and data associated with this project.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="deleteProject"
              :disabled="isDeleting"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-danger-600 text-base font-medium text-white hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
            <button
              @click="projectToDelete = null"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore, type Project } from '@/stores/projects'
import { format } from 'date-fns'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'

const authStore = useAuthStore()
const projectStore = useProjectStore()

const showCreateModal = ref(false)
const projectToDelete = ref<Project | null>(null)
const isDeleting = ref(false)

const searchQuery = ref('')
const filterType = ref('all')
const sortBy = ref('updated')

const filteredProjects = computed(() => {
  let projects = projectStore.projects

  // Filter by type
  if (filterType.value === 'owned') {
    projects = projects.filter(p => p.ownerId === authStore.user?.id)
  } else if (filterType.value === 'member') {
    projects = projects.filter(p => p.ownerId !== authStore.user?.id)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    projects = projects.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    )
  }

  // Sort projects
  projects.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'updated':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  return projects
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const confirmDelete = (project: Project) => {
  projectToDelete.value = project
}

const deleteProject = async () => {
  if (!projectToDelete.value) return

  try {
    isDeleting.value = true
    await projectStore.deleteProject(projectToDelete.value.id)
    projectToDelete.value = null
  } catch (error) {
    console.error('Failed to delete project:', error)
  } finally {
    isDeleting.value = false
  }
}

const handleProjectCreated = () => {
  showCreateModal.value = false
}

onMounted(async () => {
  await projectStore.fetchProjects()
})
</script>
