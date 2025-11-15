<template>
  <div class="p-6">
    <!-- Welcome Section -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">
        Welcome back, {{ authStore.user?.name }}!
      </h1>
      <p class="text-gray-400 mt-1">
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
            <p class="text-sm font-medium text-gray-400">Total Projects</p>
            <p class="text-2xl font-semibold text-white">{{ projectStore.totalProjects }}</p>
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
            <p class="text-sm font-medium text-gray-400">Total Posts</p>
            <p class="text-2xl font-semibold text-white">{{ totalContentBlocks }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Team Members</p>
            <p class="text-2xl font-semibold text-white">{{ totalTeamMembers }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Published Posts</p>
            <p class="text-2xl font-semibold text-white">{{ totalPublishedPosts }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column: Recent Content and Projects -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Recent Content -->
        <div class="card">
          <div class="px-6 py-4 border-b border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-white">Recent Content</h3>
              <router-link to="/content" class="text-sm text-primary-600 hover:text-primary-500">
                View all
              </router-link>
            </div>
          </div>
          <div class="p-6">
            <div v-if="projectStore.isLoading" class="space-y-4">
              <div v-for="i in 3" :key="i" class="animate-pulse">
                <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
            <div v-else-if="projectStore.recentContent.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-white">No content yet</h3>
              <p class="mt-1 text-sm text-gray-400">Create your first content piece.</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="content in projectStore.recentContent"
                :key="content.id"
                class="flex items-center justify-between p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center">
                    <h4 class="text-sm font-medium text-white truncate">
                      {{ content.title }}
                    </h4>
                    <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="{
                        'bg-blue-100 text-blue-800': content.type === 'PROJECT',
                        'bg-green-100 text-green-800': content.type === 'BLOG',
                        'bg-purple-100 text-purple-800': content.type === 'EXPERIENCE'
                      }"
                    >
                      {{ content.type }}
                    </span>
                    <span v-if="content.aiAnalysis" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      AI Generated
                    </span>
                  </div>
                  <p class="text-sm text-gray-400 truncate">{{ content.excerpt || 'No excerpt' }}</p>
                  <div class="mt-1 flex items-center text-xs text-gray-400">
                    <span>{{ content.projectName }}</span>
                    <span class="mx-2">•</span>
                    <span>{{ formatDate(content.updatedAt) }}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <router-link
                    :to="`/portfolios/${content.projectId}/content/${content.id}/edit`"
                    class="text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    Edit
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Projects -->
        <div class="card">
          <div class="px-6 py-4 border-b border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-white">Recent Projects</h3>
              <router-link to="/projects" class="text-sm text-primary-600 hover:text-primary-500">
                View all
              </router-link>
            </div>
          </div>
          <div class="p-6">
            <div v-if="projectStore.isLoading" class="space-y-4">
              <div v-for="i in 3" :key="i" class="animate-pulse">
                <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
            <div v-else-if="projectStore.recentProjects.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-white">No projects yet</h3>
              <p class="mt-1 text-sm text-gray-400">Get started by creating your first project.</p>
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
                class="flex items-center justify-between p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center">
                    <h4 class="text-sm font-medium text-white truncate">
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
                  <p class="text-sm text-gray-400 truncate">{{ project.description || 'No description' }}</p>
                  <div class="mt-1 flex items-center text-xs text-gray-400">
                    <span>{{ project._count?.content || 0 }} posts</span>
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
                    class="text-gray-400 hover:text-gray-400"
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

      <!-- Quick Actions & Activity Sidebar -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <div class="card">
          <div class="px-6 py-4 border-b border-gray-700">
            <h3 class="text-lg font-medium text-white">Quick Actions</h3>
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
          <div class="px-6 py-4 border-b border-gray-700">
            <h3 class="text-lg font-medium text-white">Recent Activity</h3>
          </div>
          <div class="p-6">
            <div v-if="projectStore.recentActivity.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-white">No recent activity</h3>
              <p class="mt-1 text-sm text-gray-400">Start creating to see activity here.</p>
            </div>
            <div v-else class="space-y-4">
              <div v-for="(activity, index) in projectStore.recentActivity" :key="index" class="flex items-start">
                <div class="flex-shrink-0">
                  <div :class="`h-8 w-8 ${activity.color === 'green' ? 'bg-green-100' : activity.color === 'purple' ? 'bg-purple-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`">
                    <svg :class="`h-4 w-4 ${activity.color === 'green' ? 'text-green-600' : activity.color === 'purple' ? 'text-purple-600' : 'text-blue-600'}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="activity.icon" />
                    </svg>
                  </div>
                </div>
                <div class="ml-3 flex-1 min-w-0">
                  <p class="text-sm text-white">
                    <span class="font-medium">{{ activity.title }}</span>
                  </p>
                  <p class="text-xs text-gray-400">{{ activity.description }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatTimeAgo(activity.timestamp) }}</p>
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
import { format, formatDistanceToNow } from 'date-fns'
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

const totalPublishedPosts = computed(() => {
  return projectStore.projects.reduce((total, project) => {
    return total + (project.content?.filter(c => c.isPublished && c.status !== 'REVISION' && !c.revisionOf).length || 0)
  }, 0)
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const formatTimeAgo = (date: Date) => {
  return formatDistanceToNow(date, { addSuffix: true })
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
