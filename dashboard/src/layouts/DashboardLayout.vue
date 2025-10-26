<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out"
         :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
      <div class="flex items-center justify-between h-16 px-6 border-b border-gray-700">
        <router-link to="/" class="flex items-center hover:opacity-80 transition-opacity">
          <div class="flex-shrink-0">
            <img :src="squiggleLogo" alt="Foligo" class="h-8 w-auto" />
          </div>
          <div class="ml-3">
            <h1 class="text-xl font-bold text-white">Foligo</h1>
          </div>
        </router-link>
        <button
          @click="sidebarOpen = false"
          class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <nav class="mt-6 px-3">
        <div class="space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="sidebar-item"
            :class="$route.name === item.routeName ? 'sidebar-item-active' : 'sidebar-item-inactive'"
          >
            <svg class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            {{ item.name }}
          </router-link>
        </div>
      </nav>
      
      <!-- User Profile -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-medium">{{ authStore.userInitials }}</span>
            </div>
          </div>
          <div class="ml-3 flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-gray-400 truncate">{{ authStore.user?.email }}</p>
          </div>
          <div class="ml-2">
            <button
              @click="showUserMenu = !showUserMenu"
              class="p-1 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- User Menu Dropdown -->
        <div v-if="showUserMenu" class="absolute bottom-16 left-4 right-4 bg-gray-700 rounded-md shadow-lg border border-gray-600 py-1">
          <button
            @click="handleLogout"
            class="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
    
      <!-- Mobile sidebar overlay -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 z-40 bg-black bg-opacity-75 lg:hidden"
    ></div>
    
    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top bar -->
      <div class="sticky top-0 z-40 bg-gray-800 shadow-sm border-b border-gray-700">
        <div class="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center">
            <button
              @click="sidebarOpen = true"
              class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 class="ml-2 text-lg font-semibold text-white">{{ pageTitle }}</h2>
          </div>
          
          <!-- Project Selector -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-300">Project:</label>
              <select
                v-model="selectedProjectId"
                @change="onProjectChange"
                class="px-3 py-1.5 text-sm border border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-gray-700 text-white"
              >
                <option value="">All Projects</option>
                <option
                  v-for="project in projects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.name }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- AI Content Creator -->
            <button 
              @click="handleCreateContent"
              :disabled="!selectedProjectId"
              class="p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed relative"
              title="Create content with AI"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
            
            <!-- Search -->
            <div class="hidden md:block">
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search projects and posts..."
                  @input="handleSearch"
                  class="w-64 pl-10 pr-4 py-2 border border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-gray-700 text-white"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div v-if="searchResults.length > 0" class="absolute z-50 right-0 mt-2 w-96 bg-gray-800 rounded-md shadow-lg border border-gray-600 max-h-96 overflow-y-auto">
                  <div class="py-2">
                    <div v-for="result in searchResults" :key="result.id" class="px-4 py-2 hover:bg-gray-700 cursor-pointer" @click="navigateToResult(result)">
                      <div class="flex items-start">
                        <div class="flex-shrink-0">
                          <div :class="`h-8 w-8 ${result.type === 'project' ? 'bg-blue-100' : 'bg-green-100'} rounded-lg flex items-center justify-center`">
                            <svg :class="`h-5 w-5 ${result.type === 'project' ? 'text-blue-600' : 'text-green-600'}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path v-if="result.type === 'project'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                        <div class="ml-3 flex-1 min-w-0">
                          <p class="text-sm font-medium text-white truncate">{{ result.title }}</p>
                          <p class="text-xs text-gray-400 truncate">{{ result.subtitle }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Page content -->
      <main class="flex-1">
        <router-view />
      </main>
    </div>

    <!-- AI Content Creator Modal -->
    <AIContentCreatorModal
      ref="aiModalRef"
      mode="create"
      @content-generated="handleContentGenerated"
      :key="`ai-modal-${selectedProjectId}`"
    />
  </div>
</template>

<script setup lang="ts">
import squiggleLogo from '@/assets/logos/squiggle.svg'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projects'
import AIContentCreatorModal from '@/components/AIContentCreatorModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()

const sidebarOpen = ref(false)
const showUserMenu = ref(false)
const selectedProjectId = ref('')
const searchQuery = ref('')
const searchResults = ref<Array<{id: string, type: string, title: string, subtitle: string, route: string}>>([])

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    routeName: 'dashboard',
    icon: 'DashboardIcon'
  },
  {
    name: 'Content',
    href: '/content',
    routeName: 'content',
    icon: 'ContentIcon'
  },
  {
    name: 'Projects',
    href: '/projects',
    routeName: 'projects',
    icon: 'ProjectsIcon'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    routeName: 'analytics',
    icon: 'AnalyticsIcon'
  }
]

const projects = computed(() => projectStore.projects)

const selectedProject = computed(() => {
  if (!selectedProjectId.value) return null
  return projectStore.projects.find(p => p.id === selectedProjectId.value)
})

const onProjectChange = () => {
  // Store the selected project ID globally for easy access
  ;(window as any).selectedProjectId = selectedProjectId.value
  
  // Emit event for child components to listen to
  window.dispatchEvent(new CustomEvent('project-changed', { 
    detail: { projectId: selectedProjectId.value, project: selectedProject.value }
  }))
}

const pageTitle = computed(() => {
  const routeNames: Record<string, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    'project-detail': 'Project Details',
    'content-editor': 'Content Editor',
    analytics: 'Analytics',
    users: 'Users',
    settings: 'Settings'
  }
  return routeNames[route.name as string] || 'Dashboard'
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const aiModalRef = ref<InstanceType<typeof AIContentCreatorModal> | null>(null)

const handleCreateContent = () => {
  if (!selectedProjectId.value) {
    alert('Please select a project first')
    return
  }
  
  // Open AI content creation modal
  if (aiModalRef.value) {
    aiModalRef.value.open()
  }
}

const handleContentGenerated = async (data: { content: string; title?: string; metadata: any }) => {
  if (!selectedProjectId.value) return
  
  // Navigate to content editor or create a new content item
  try {
    const newContent = await projectStore.createContent(selectedProjectId.value, {
      contentType: data.metadata.contentType || 'BLOG',
      title: data.title || 'AI Generated Content',
      content: data.content,
      isPublished: false
    })
    
    // Navigate to the content editor
    router.push(`/projects/${selectedProjectId.value}/content/${newContent.id}/edit`)
  } catch (error) {
    console.error('Failed to create content:', error)
    alert('Failed to create content. Please try again.')
  }
}

const handleSearch = () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase()
  const results: Array<{id: string, type: string, title: string, subtitle: string, route: string}> = []

  // Search projects
  projectStore.projects.forEach(project => {
    if (project.name.toLowerCase().includes(query) || 
        (project.description && project.description.toLowerCase().includes(query))) {
      results.push({
        id: project.id,
        type: 'project',
        title: project.name,
        subtitle: project.description || 'No description',
        route: `/projects/${project.id}`
      })
    }
  })

  // Search content/posts
  projectStore.projects.forEach(project => {
    if (project.content) {
      project.content.forEach(content => {
        if (content.title.toLowerCase().includes(query) ||
            content.excerpt?.toLowerCase().includes(query) ||
            content.content.toLowerCase().includes(query)) {
          results.push({
            id: content.id,
            type: 'post',
            title: content.title,
            subtitle: `${content.type} in ${project.name}`,
            route: `/projects/${project.id}/content/${content.id}/edit`
          })
        }
      })
    }
  })

  searchResults.value = results.slice(0, 10) // Limit to 10 results
}

const navigateToResult = (result: {id: string, type: string, title: string, subtitle: string, route: string}) => {
  router.push(result.route)
  searchQuery.value = ''
  searchResults.value = []
}

// Close search results when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.search-container')) {
    searchResults.value = []
  }
}

// Close sidebar on route change (mobile)
watch(route, () => {
  sidebarOpen.value = false
})

watch(searchQuery, () => {
  if (!searchQuery.value) {
    searchResults.value = []
  }
})

// Load projects on mount and setup click handler
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  projectStore.fetchProjects().then(() => {
    // Auto-select first project if none is selected
    if (!selectedProjectId.value && projectStore.projects.length > 0) {
      selectedProjectId.value = projectStore.projects[0].id
      onProjectChange()
    }
  })
})
</script>
