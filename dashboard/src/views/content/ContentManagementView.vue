<template>
  <div class="p-6">
    <!-- Header with Project Filter -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Content Management</h1>
          <p class="text-gray-600 mt-1">Create and manage all your content</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="showCreateContentModal = true"
            class="btn btn-primary"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Content
          </button>
        </div>
      </div>
    </div>

    <!-- Project Info -->
    <div v-if="selectedProject" class="mb-6">
      <div class="p-4 bg-gray-800 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium text-white">{{ selectedProject.name }}</h3>
            <p class="text-sm text-gray-600">{{ selectedProject.description || 'No description' }}</p>
          </div>
          <div class="text-sm text-gray-400">
            {{ selectedProject._count?.content || 0 }} content items
          </div>
        </div>
      </div>
    </div>

    <!-- Content Type Filter -->
    <div class="mb-6">
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-300">Content Type:</label>
        <div class="flex space-x-2">
          <button
            v-for="type in contentTypes"
            :key="type.value"
            @click="selectedContentType = type.value"
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              selectedContentType === type.value
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-700'
            ]"
          >
            {{ type.icon }} {{ type.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search content..."
          class="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Content List -->
    <div v-if="projectStore.isLoading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="card p-6 animate-pulse">
        <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div class="h-3 bg-gray-700 rounded w-full mb-2"></div>
        <div class="h-3 bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="filteredContent.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-white">No content found</h3>
      <p class="mt-1 text-sm text-gray-400">
        {{ searchQuery ? 'Try adjusting your search criteria.' : 'Get started by creating your first piece of content.' }}
      </p>
      <div v-if="!searchQuery" class="mt-6">
        <button
          @click="showCreateContentModal = true"
          class="btn btn-primary"
        >
          Add Content
        </button>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="content in filteredContent"
        :key="content.id"
        class="card p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start flex-1">
            <div class="h-10 w-10 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
              <span class="text-sm font-medium text-gray-600">
                {{ getContentIcon(content.contentType) }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-2">
                <h3 class="text-lg font-semibold text-white">{{ content.title }}</h3>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-green-500/20 text-green-400 border border-green-700/50': content.isPublished,
                    'bg-amber-500/20 text-amber-400 border border-amber-700/50': !content.isPublished
                  }"
                >
                  {{ content.isPublished ? 'Published' : 'Draft' }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">{{ content.contentType }} • {{ getProjectName(content.projectId) }}</p>
              <p v-if="content.excerpt" class="text-sm text-gray-300 line-clamp-2">{{ content.excerpt }}</p>
              <div class="flex items-center text-xs text-gray-400 mt-2">
                <span>{{ formatDate(content.updatedAt) }}</span>
                <span class="mx-2">•</span>
                <span>{{ content.content.length }} characters</span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2 ml-4">
            <router-link
              :to="`/projects/${content.projectId}/content/${content.id}/edit`"
              class="text-primary-600 hover:text-primary-500 text-sm"
            >
              Edit
            </router-link>
            <button
              @click="deleteContent(content)"
              class="text-gray-400 hover:text-danger-500"
              title="Delete content"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Content Modal -->
    <CreateContentModal
      :is-open="showCreateContentModal"
      :project="selectedProject"
      @close="showCreateContentModal = false"
      @created="handleContentCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProjectStore, type Content, type Project } from '@/stores/projects'
import { format } from 'date-fns'
import CreateContentModal from '@/components/content/CreateContentModal.vue'

const projectStore = useProjectStore()

const showCreateContentModal = ref(false)
const selectedProjectId = ref('')
const selectedProject = ref<Project | null>(null)
const selectedContentType = ref('')
const searchQuery = ref('')

const contentTypes = [
  { value: '', label: 'All', icon: '📄' },
  { value: 'PROJECT', label: 'Projects', icon: '🚀' },
  { value: 'BLOG', label: 'Blogs', icon: '📝' },
  { value: 'EXPERIENCE', label: 'Experience', icon: '💼' }
]

// Listen for project changes from header
const handleProjectChange = (event: CustomEvent) => {
  selectedProjectId.value = event.detail.projectId
  selectedProject.value = event.detail.project
}

const allContent = computed(() => {
  const content: Content[] = []
  projectStore.projects.forEach(project => {
    if (project.content) {
      project.content.forEach(c => {
        content.push({ ...c, projectId: project.id })
      })
    }
  })
  return content
})

const filteredContent = computed(() => {
  let content = allContent.value

  // Filter by project
  if (selectedProjectId.value) {
    content = content.filter(c => c.projectId === selectedProjectId.value)
  }

  // Filter by content type
  if (selectedContentType.value) {
    content = content.filter(c => c.contentType === selectedContentType.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    content = content.filter(c => 
      c.title.toLowerCase().includes(query) ||
      c.excerpt?.toLowerCase().includes(query) ||
      c.content.toLowerCase().includes(query)
    )
  }

  // Sort by updated date (newest first)
  return content.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

const getContentIcon = (contentType: string) => {
  switch (contentType) {
    case 'PROJECT':
      return '🚀'
    case 'BLOG':
      return '📝'
    case 'EXPERIENCE':
      return '💼'
    default:
      return '📄'
  }
}

const getProjectName = (projectId: string) => {
  const project = projectStore.projects.find(p => p.id === projectId)
  return project?.name || 'Unknown Project'
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const deleteContent = async (content: Content) => {
  if (!confirm(`Are you sure you want to delete "${content.title}"?`)) {
    return
  }

  try {
    await projectStore.deleteContent(content.id)
  } catch (error) {
    console.error('Failed to delete content:', error)
  }
}

const handleContentCreated = (newContent: Content) => {
  showCreateContentModal.value = false
  // Content is automatically added to the project by the store
}

onMounted(() => {
  projectStore.fetchProjects()
  window.addEventListener('project-changed', handleProjectChange as EventListener)
  
  // Check if there's already a project selected in the header
  const currentProjectId = (window as any).selectedProjectId
  if (currentProjectId) {
    selectedProjectId.value = currentProjectId
    const project = projectStore.projects.find(p => p.id === currentProjectId)
    if (project) {
      selectedProject.value = project
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('project-changed', handleProjectChange as EventListener)
})
</script>
