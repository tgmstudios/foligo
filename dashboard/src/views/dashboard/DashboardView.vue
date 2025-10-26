<template>
  <div class="p-6">
    <!-- Welcome Section -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Welcome back, {{ authStore.user?.name }}!
      </h1>
      <p class="text-gray-600 mt-1">
        Here's what's happening with your portfolio projects today.
      </p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Projects</p>
            <p class="text-2xl font-semibold text-gray-900">{{ projectStore.totalProjects }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Content Blocks</p>
            <p class="text-2xl font-semibold text-gray-900">{{ totalContentBlocks }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Team Members</p>
            <p class="text-2xl font-semibold text-gray-900">{{ totalTeamMembers }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">AI Analyses</p>
            <p class="text-2xl font-semibold text-gray-900">{{ totalAIAnalyses }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Recent Projects -->
      <div class="lg:col-span-2">
        <div class="card">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">Recent Projects</h3>
              <router-link to="/projects" class="text-sm text-primary-600 hover:text-primary-500">
                View all
              </router-link>
            </div>
          </div>
          <div class="p-6">
            <div v-if="projectStore.isLoading" class="space-y-4">
              <div v-for="i in 3" :key="i" class="animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div v-else-if="projectStore.recentProjects.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by creating your first project.</p>
              <div class="mt-6">
                <button
                  @click="showCreateProjectModal = true"
                  class="btn btn-primary"
                >
                  Create Project
                </button>
              </div>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="project in projectStore.recentProjects"
                :key="project.id"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center">
                    <h4 class="text-sm font-medium text-gray-900 truncate">
                      {{ project.name }}
                    </h4>
                    <span
                      v-if="project.ownerId === authStore.user?.id"
                      class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      Owner
                    </span>
                    <span
                      v-else
                      class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      Member
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 truncate">{{ project.description || 'No description' }}</p>
                  <div class="mt-1 flex items-center text-xs text-gray-400">
                    <span>{{ project._count?.content || 0 }} content blocks</span>
                    <span class="mx-2">•</span>
                    <span>{{ project._count?.members || 0 }} members</span>
                    <span class="mx-2">•</span>
                    <span>{{ formatDate(project.updatedAt) }}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <router-link
                    :to="`/projects/${project.id}`"
                    class="text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    View
                  </router-link>
                  <router-link
                    :to="`/projects/${project.id}/edit`"
                    class="text-gray-400 hover:text-gray-500"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Activity -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <div class="card">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div class="p-6 space-y-3">
            <button
              @click="showCreateProjectModal = true"
              class="w-full btn btn-primary"
            >
              <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Project
            </button>
            <button
              @click="showCreateContentModal = true"
              class="w-full btn btn-outline"
            >
              <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Create Content
            </button>
            <router-link to="/analytics" class="w-full btn btn-outline">
              <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Analytics
            </router-link>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <div class="ml-3 flex-1 min-w-0">
                  <p class="text-sm text-gray-900">
                    <span class="font-medium">You created</span> a new project
                  </p>
                  <p class="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-3 flex-1 min-w-0">
                  <p class="text-sm text-gray-900">
                    <span class="font-medium">You updated</span> project content
                  </p>
                  <p class="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg class="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-3 flex-1 min-w-0">
                  <p class="text-sm text-gray-900">
                    <span class="font-medium">AI analysis</span> completed
                  </p>
                  <p class="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-if="showCreateProjectModal"
      @close="showCreateProjectModal = false"
      @created="handleProjectCreated"
    />

    <!-- Create Content Modal -->
    <CreateContentModal
      v-if="showCreateContentModal"
      :is-open="showCreateContentModal"
      :project="selectedProject"
      @close="showCreateContentModal = false"
      @created="handleContentCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projects'
import { format } from 'date-fns'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'
import CreateContentModal from '@/components/content/CreateContentModal.vue'

const authStore = useAuthStore()
const projectStore = useProjectStore()

const showCreateProjectModal = ref(false)
const showCreateContentModal = ref(false)
const selectedProject = ref(null)

const totalContentBlocks = computed(() => {
  return projectStore.projects.reduce((total, project) => {
    return total + (project._count?.content || 0)
  }, 0)
})

const totalTeamMembers = computed(() => {
  return projectStore.projects.reduce((total, project) => {
    return total + (project._count?.members || 0)
  }, 0)
})

const totalAIAnalyses = computed(() => {
  return projectStore.projects.reduce((total, project) => {
    return total + (project.content?.filter(c => c.aiAnalysis).length || 0)
  }, 0)
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const handleProjectCreated = () => {
  showCreateProjectModal.value = false
  // Refresh projects
  projectStore.fetchProjects()
}

const handleContentCreated = () => {
  showCreateContentModal.value = false
  // Refresh projects to get updated content counts
  projectStore.fetchProjects()
}

onMounted(async () => {
  await projectStore.fetchProjects()
})
</script>
