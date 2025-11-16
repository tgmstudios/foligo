<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">{{ pageTitle }}</h1>
          <p class="text-gray-400 mt-1">{{ pageDescription }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            v-if="isPortfoliosPage"
            @click="showCreateModal = true"
            class="btn btn-primary"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Portfolio
          </button>
          <router-link
            v-else
            :to="`/content/new/${contentTypeFilter || 'blog'}`"
            class="btn btn-primary"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create {{ contentTypeLabel }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
      <div class="text-6xl mb-4">{{ pageIcon }}</div>
      <h3 class="mt-2 text-lg font-medium text-white">No {{ contentTypeLabel.toLowerCase() }} found</h3>
      <p class="mt-1 text-sm text-gray-400">
        {{ searchQuery ? 'Try adjusting your search criteria.' : `Get started by creating your first ${contentTypeLabel.toLowerCase()}.` }}
      </p>
      <div v-if="!searchQuery" class="mt-6">
        <button
          v-if="isPortfoliosPage"
          @click="showCreateModal = true"
          class="btn btn-primary"
        >
          Create Portfolio
        </button>
        <router-link
          v-else
          :to="`/content/new/${contentTypeFilter || 'blog'}`"
          class="btn btn-primary"
        >
          Create {{ contentTypeLabel }}
        </router-link>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in filteredContent"
        :key="item.id"
        class="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateToItem(item)"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start flex-1">
            <div class="h-12 w-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <span class="text-xl">{{ getItemIcon(item) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-2">
                <h3 class="text-lg font-semibold text-white">{{ getItemTitle(item) }}</h3>
                <span
                  :class="getStatusClass(item.status)"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                >
                  {{ formatContentStatus(item.status) }}
                </span>
              </div>
              <p v-if="getItemSubtitle(item)" class="text-sm text-gray-400 mb-2">{{ getItemSubtitle(item) }}</p>
              <p v-if="item.excerpt" class="text-sm text-gray-300 line-clamp-2 mb-2">{{ item.excerpt }}</p>
              <div class="flex items-center text-xs text-gray-400 mt-2 space-x-3">
                <span>{{ formatDate(item.updatedAt) }}</span>
                <span v-if="!isPortfoliosPage">•</span>
                <span v-if="!isPortfoliosPage">{{ getPortfolioName(item.projectId) }}</span>
                <span v-if="item.content">•</span>
                <span v-if="item.content">{{ item.content.length }} characters</span>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2 ml-4" @click.stop>
            <router-link
              :to="getEditRoute(item)"
              class="text-primary-400 hover:text-primary-300 text-sm font-medium"
            >
              Edit
            </router-link>
            <button
              @click.stop="deleteItem(item)"
              class="text-gray-400 hover:text-red-400"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore, type Content, type Project } from '@/stores/projects'
import { format } from 'date-fns'
import { formatContentStatus } from '@/utils'
import CreateProjectModal from '@/components/projects/CreateProjectModal.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

// Route-based configuration
const pageConfig = computed(() => {
  const type = route.name as string
  const configs: Record<string, any> = {
    'dashboard': {
      title: 'Dashboard',
      description: 'Overview of all your content',
      icon: '📊',
      contentTypeFilter: '',
      contentTypeLabel: 'Content',
      isPortfoliosPage: false
    },
    'blogs': {
      title: 'Blog Posts',
      description: 'Manage your blog posts and articles',
      icon: '📝',
      contentTypeFilter: 'BLOG',
      contentTypeLabel: 'Blog Post',
      isPortfoliosPage: false
    },
    'projects-content': {
      title: 'Projects',
      description: 'Showcase your portfolio projects',
      icon: '🚀',
      contentTypeFilter: 'PROJECT',
      contentTypeLabel: 'Project',
      isPortfoliosPage: false
    },
    'experience': {
      title: 'Experience',
      description: 'Manage your work history and education',
      icon: '💼',
      contentTypeFilter: 'EXPERIENCE',
      contentTypeLabel: 'Experience',
      isPortfoliosPage: false
    },
    'portfolios': {
      title: 'Portfolios',
      description: 'Manage your portfolio sites',
      icon: '🎨',
      contentTypeFilter: '',
      contentTypeLabel: 'Portfolio',
      isPortfoliosPage: true
    }
  }
  return configs[type] || configs['dashboard']
})

const pageTitle = computed(() => pageConfig.value.title)
const pageDescription = computed(() => pageConfig.value.description)
const pageIcon = computed(() => pageConfig.value.icon)
const contentTypeFilter = computed(() => pageConfig.value.contentTypeFilter)
const contentTypeLabel = computed(() => pageConfig.value.contentTypeLabel)
const isPortfoliosPage = computed(() => pageConfig.value.isPortfoliosPage)

const searchQuery = ref('')
const selectedPortfolioId = ref('')
const selectedPortfolio = ref<Project | null>(null)

const portfolios = computed(() => projectStore.projects)

// Watch for portfolio changes from header
watch(() => (window as any).selectedProjectId, (newId) => {
  if (newId && !selectedPortfolioId.value) {
    selectedPortfolioId.value = newId
  }
})

// Listen for project changes from header
const handlePortfolioChange = (event: CustomEvent) => {
  selectedPortfolioId.value = event.detail.projectId
  selectedPortfolio.value = event.detail.project
}

const allContent = computed(() => {
  const content: Content[] = []
  projectStore.projects.forEach(portfolio => {
    if (portfolio.content) {
      portfolio.content.forEach(c => {
        content.push({ ...c, projectId: portfolio.id })
      })
    }
  })
  return content
})

const filteredContent = computed(() => {
  if (isPortfoliosPage.value) {
    // For portfolios page, return portfolios (projects)
    let portfolios = projectStore.projects
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      portfolios = portfolios.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }
    
    return portfolios.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }
  
  // For content pages, filter content
  let content = allContent.value

  // Filter out revisions
  content = content.filter(c => c.status !== 'REVISION' && !c.revisionOf)

  // Filter by content type
  if (contentTypeFilter.value) {
    content = content.filter(c => c.contentType === contentTypeFilter.value)
  }

  // Filter by portfolio
  if (selectedPortfolioId.value) {
    content = content.filter(c => c.projectId === selectedPortfolioId.value)
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

watch(selectedPortfolioId, (id) => {
  if (id) {
    selectedPortfolio.value = projectStore.projects.find(p => p.id === id) || null
  } else {
    selectedPortfolio.value = null
  }
})

const getItemIcon = (item: Content | Project) => {
  if (isPortfoliosPage.value) {
    return '🎨'
  }
  const content = item as Content
  switch (content.contentType) {
    case 'PROJECT':
      return '🚀'
    case 'BLOG':
      return '📝'
    case 'EXPERIENCE':
      return '💼'
    case 'SKILL':
      return '⚡'
    default:
      return '📄'
  }
}

const getItemTitle = (item: Content | Project) => {
  if (isPortfoliosPage.value) {
    return (item as Project).name
  }
  return (item as Content).title
}

const getItemSubtitle = (item: Content | Project) => {
  if (isPortfoliosPage.value) {
    return (item as Project).description || null
  }
  const content = item as Content
  if (content.contentType === 'EXPERIENCE' && content.experienceCategory) {
    return content.experienceCategory
  }
  return null
}

const getPortfolioName = (portfolioId: string) => {
  const portfolio = projectStore.projects.find(p => p.id === portfolioId)
  return portfolio?.name || 'Unknown Portfolio'
}

const getStatusClass = (status?: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'bg-amber-500/20 text-amber-400 border border-amber-700/50',
    PUBLISHED: 'bg-green-500/20 text-green-400 border border-green-700/50',
    HIDDEN: 'bg-yellow-500/20 text-yellow-400 border border-yellow-700/50',
    REVISION: 'bg-blue-500/20 text-blue-400 border border-blue-700/50'
  }
  return classes[status || 'DRAFT'] || classes.DRAFT
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const navigateToItem = (item: Content | Project) => {
  if (isPortfoliosPage.value) {
    router.push(`/portfolios/${(item as Project).id}`)
  } else {
    router.push(`/portfolios/${(item as Content).projectId}/content/${(item as Content).id}/edit`)
  }
}

const getEditRoute = (item: Content | Project) => {
  if (isPortfoliosPage.value) {
    return `/portfolios/${(item as Project).id}`
  }
  return `/portfolios/${(item as Content).projectId}/content/${(item as Content).id}/edit`
}

const deleteItem = async (item: Content | Project) => {
  const name = isPortfoliosPage.value ? (item as Project).name : (item as Content).title
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return
  }

  try {
    if (isPortfoliosPage.value) {
      await projectStore.deleteProject((item as Project).id)
    } else {
      await projectStore.deleteContent((item as Content).id)
    }
  } catch (error) {
    console.error('Failed to delete:', error)
  }
}

onMounted(() => {
  projectStore.fetchProjects()
  window.addEventListener('project-changed', handlePortfolioChange as EventListener)
  
  // Check if there's already a portfolio selected in the header
  const currentPortfolioId = (window as any).selectedProjectId
  if (currentPortfolioId) {
    selectedPortfolioId.value = currentPortfolioId
    const portfolio = projectStore.projects.find(p => p.id === currentPortfolioId)
    if (portfolio) {
      selectedPortfolio.value = portfolio
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('project-changed', handlePortfolioChange as EventListener)
})

const showCreateModal = ref(false)

const handleProjectCreated = () => {
  showCreateModal.value = false
  projectStore.fetchProjects()
}
</script>

