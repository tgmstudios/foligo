import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'
import { useAuthStore } from './auth'

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  subdomain?: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  owner?: {
    id: string
    name: string
    email: string
  }
  members?: ProjectMember[]
  content?: Content[]
  assets?: Asset[]
  siteConfig?: SiteConfig
  _count?: {
    content: number
    members: number
    assets: number
  }
}

export interface SiteConfig {
  id: string
  projectId: string
  siteName?: string
  siteDescription?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  indexLayout: string
  archiveLayout: string
  singleLayout: string
  metaTitle?: string
  metaDescription?: string
  favicon?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: 'ADMIN' | 'EDITOR' | 'VIEWER'
  user: {
    id: string
    name: string
    email: string
  }
}

export interface Content {
  id: string
  projectId: string
  type: 'PROJECT' | 'BLOG' | 'EXPERIENCE'
  contentType: string
  title: string
  slug?: string
  excerpt?: string
  content: string // Markdown content
  metadata?: any // Additional metadata (tags, categories, etc.)
  order: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  aiAnalysis?: AIAnalysis
}

export interface AIAnalysis {
  id: string
  contentId: string
  tags: string[]
  summary?: string
  altText?: string
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  projectId: string
  url: string
  fileType: string
  size: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectData {
  name: string
  description?: string
  subdomain?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  subdomain?: string
}

export const useProjectStore = defineStore('projects', () => {
  const toast = useToast()
  
  // State
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const isLoading = ref(false)
  const isCreating = ref(false)

  // Getters
  const ownedProjects = computed(() => 
    projects.value.filter(p => p.ownerId === useAuthStore().user?.id)
  )
  
  const memberProjects = computed(() => 
    projects.value.filter(p => p.ownerId !== useAuthStore().user?.id)
  )
  
  const totalProjects = computed(() => projects.value.length)
  
  const recentProjects = computed(() => 
    [...projects.value]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  )

  // Actions
  async function fetchProjects() {
    try {
      isLoading.value = true
      const response = await api.get('/projects')
      projects.value = [...response.data.ownedProjects, ...response.data.memberProjects]
      
      // Also fetch content for each project using the dedicated content endpoint
      for (const project of projects.value) {
        try {
          const contentResponse = await api.get(`/projects/${project.id}/content`)
          if (project.content) {
            project.content = contentResponse.data
          } else {
            project.content = contentResponse.data
          }
          console.log(`Fetched content for project ${project.name}:`, contentResponse.data.length, 'items')
        } catch (error) {
          console.error(`Failed to fetch content for project ${project.name}:`, error)
        }
      }
      
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch projects'
      toast.error(message)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProject(id: string) {
    try {
      isLoading.value = true
      const response = await api.get(`/projects/${id}`)
      currentProject.value = response.data
      
      // Update project in projects array
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = response.data
      }
      
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch project'
      toast.error(message)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function createProject(data: CreateProjectData) {
    try {
      isCreating.value = true
      const response = await api.post('/projects', data)
      projects.value.unshift(response.data)
      toast.success(`Project "${data.name}" created successfully`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create project'
      toast.error(message)
      throw error
    } finally {
      isCreating.value = false
    }
  }

  async function updateProject(id: string, data: UpdateProjectData) {
    try {
      isLoading.value = true
      const response = await api.put(`/projects/${id}`, data)
      
      // Update project in array
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = response.data
      }
      
      // Update current project if it's the same
      if (currentProject.value?.id === id) {
        currentProject.value = response.data
      }
      
      toast.success('Project updated successfully')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update project'
      toast.error(message)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function deleteProject(id: string) {
    try {
      isLoading.value = true
      await api.delete(`/projects/${id}`)
      
      // Remove from projects array
      projects.value = projects.value.filter(p => p.id !== id)
      
      // Clear current project if it's the same
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }
      
      toast.success('Project deleted successfully')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete project'
      toast.error(message)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function addProjectMember(projectId: string, email: string, role: 'ADMIN' | 'EDITOR' | 'VIEWER') {
    try {
      const response = await api.post(`/projects/${projectId}/members`, { email, role })
      
      // Update project members
      const project = projects.value.find(p => p.id === projectId)
      if (project && project.members) {
        project.members.push(response.data)
      }
      
      toast.success('Member added successfully')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add member'
      toast.error(message)
      throw error
    }
  }

  async function removeProjectMember(projectId: string, userId: string) {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`)
      
      // Update project members
      const project = projects.value.find(p => p.id === projectId)
      if (project && project.members) {
        project.members = project.members.filter(m => m.userId !== userId)
      }
      
      toast.success('Member removed successfully')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove member'
      toast.error(message)
      throw error
    }
  }

  async function updateMemberRole(projectId: string, userId: string, role: 'ADMIN' | 'EDITOR' | 'VIEWER') {
    try {
      const response = await api.put(`/projects/${projectId}/members/${userId}`, { role })
      
      // Update project members
      const project = projects.value.find(p => p.id === projectId)
      if (project && project.members) {
        const member = project.members.find(m => m.userId === userId)
        if (member) {
          member.role = role
        }
      }
      
      toast.success('Member role updated successfully')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update member role'
      toast.error(message)
      throw error
    }
  }

  function setCurrentProject(project: Project | null) {
    currentProject.value = project
  }

  async function fetchSiteConfig(projectId: string) {
    try {
      const response = await api.get(`/projects/${projectId}/site-config`)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch site configuration'
      toast.error(message)
      throw error
    }
  }

  async function updateSiteConfig(projectId: string, config: Partial<SiteConfig>) {
    try {
      const response = await api.put(`/projects/${projectId}/site-config`, config)
      
      // Update project in array
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index].siteConfig = response.data
      }
      
      // Update current project if it's the same
      if (currentProject.value?.id === projectId) {
        currentProject.value.siteConfig = response.data
      }
      
      toast.success('Site configuration updated successfully')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update site configuration'
      toast.error(message)
      throw error
    }
  }

  async function publishProject(projectId: string, isPublished: boolean) {
    try {
      const response = await api.post(`/projects/${projectId}/publish`, { isPublished })
      
      // Update project in array
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index].isPublished = isPublished
      }
      
      // Update current project if it's the same
      if (currentProject.value?.id === projectId) {
        currentProject.value.isPublished = isPublished
      }
      
      toast.success(response.data.message)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update publish status'
      toast.error(message)
      throw error
    }
  }

  async function createContent(projectId: string, contentData: {
    contentType: 'PROJECT' | 'BLOG' | 'EXPERIENCE'
    title: string
    slug?: string
    excerpt?: string
    content: string
    metadata?: any
    isPublished?: boolean
  }) {
    try {
      console.log('Creating content for project:', projectId)
      console.log('Content data:', contentData)
      console.log('Auth token:', localStorage.getItem('auth_token'))
      console.log('Available projects:', projects.value.map(p => ({ id: p.id, name: p.name, ownerId: p.ownerId })))
      console.log('Current project:', currentProject.value)
      
      // Check if project exists and user has access
      const project = projects.value.find(p => p.id === projectId)
      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }
      
      const response = await api.post(`/projects/${projectId}/content`, contentData)
      
      // Update project content
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1 && projects.value[index].content) {
        projects.value[index].content!.push(response.data)
      }
      
      // Update current project if it's the same
      if (currentProject.value?.id === projectId && currentProject.value.content) {
        currentProject.value.content.push(response.data)
      }
      
      toast.success('Content created successfully')
      return response.data
    } catch (error: any) {
      console.error('Create content error:', error)
      console.error('Error response:', error.response)
      console.error('Error status:', error.response?.status)
      console.error('Error data:', error.response?.data)
      
      const message = error.response?.data?.message || 'Failed to create content'
      toast.error(message)
      throw error
    }
  }

  async function updateContent(contentId: string, contentData: Partial<Content>) {
    try {
      const response = await api.put(`/content/${contentId}/fields`, contentData)
      
      // Update content in projects array
      projects.value.forEach(project => {
        if (project.content) {
          const contentIndex = project.content.findIndex(c => c.id === contentId)
          if (contentIndex !== -1) {
            project.content[contentIndex] = response.data
          }
        }
      })
      
      // Update current project if it has this content
      if (currentProject.value?.content) {
        const contentIndex = currentProject.value.content.findIndex(c => c.id === contentId)
        if (contentIndex !== -1) {
          currentProject.value.content[contentIndex] = response.data
        }
      }
      
      toast.success('Content updated successfully')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update content'
      toast.error(message)
      throw error
    }
  }

  async function deleteContent(contentId: string) {
    try {
      await api.delete(`/content/${contentId}`)
      
      // Remove content from projects array
      projects.value.forEach(project => {
        if (project.content) {
          project.content = project.content.filter(c => c.id !== contentId)
        }
      })
      
      // Remove from current project if it has this content
      if (currentProject.value?.content) {
        currentProject.value.content = currentProject.value.content.filter(c => c.id !== contentId)
      }
      
      toast.success('Content deleted successfully')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete content'
      toast.error(message)
      throw error
    }
  }

  return {
    // State
    projects,
    currentProject,
    isLoading,
    isCreating,
    
    // Getters
    ownedProjects,
    memberProjects,
    totalProjects,
    recentProjects,
    
    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    addProjectMember,
    removeProjectMember,
    updateMemberRole,
    setCurrentProject,
    fetchSiteConfig,
    updateSiteConfig,
    publishProject,
    createContent,
    updateContent,
    deleteContent
  }
})

