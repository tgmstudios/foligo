<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
         :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
      <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">F</span>
            </div>
          </div>
          <div class="ml-3">
            <h1 class="text-xl font-bold text-gray-900">Foligo</h1>
          </div>
        </div>
        <button
          @click="sidebarOpen = false"
          class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
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
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-medium">{{ authStore.userInitials }}</span>
            </div>
          </div>
          <div class="ml-3 flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
          </div>
          <div class="ml-2">
            <button
              @click="showUserMenu = !showUserMenu"
              class="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- User Menu Dropdown -->
        <div v-if="showUserMenu" class="absolute bottom-16 left-4 right-4 bg-white rounded-md shadow-lg border border-gray-200 py-1">
          <button
            @click="handleLogout"
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
      class="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
    ></div>
    
    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top bar -->
      <div class="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div class="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center">
            <button
              @click="sidebarOpen = true"
              class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 class="ml-2 text-lg font-semibold text-gray-900">{{ pageTitle }}</h2>
          </div>
          
          <!-- Project Selector -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium text-gray-700">Project:</label>
              <select
                v-model="selectedProjectId"
                @change="onProjectChange"
                class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
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
            <!-- Notifications -->
            <button class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h5l-5-5v5zM12 2l-2 2h4l-2-2z" />
              </svg>
              <span class="absolute top-1 right-1 h-2 w-2 bg-danger-500 rounded-full"></span>
            </button>
            
            <!-- Search -->
            <div class="hidden md:block">
              <div class="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  class="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()

const sidebarOpen = ref(false)
const showUserMenu = ref(false)
const selectedProjectId = ref('')

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

// Close sidebar on route change (mobile)
watch(route, () => {
  sidebarOpen.value = false
})

// Load projects on mount
onMounted(() => {
  projectStore.fetchProjects().then(() => {
    // Auto-select first project if none is selected
    if (!selectedProjectId.value && projectStore.projects.length > 0) {
      selectedProjectId.value = projectStore.projects[0].id
      onProjectChange()
    }
  })
})
</script>
