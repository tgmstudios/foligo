import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
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
  _count?: {
    content: number
    members: number
    assets: number
  }
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
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CODE' | 'LINK' | 'EMBED'
  data: any
  order: number
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
}

export interface UpdateProjectData {
  name?: string
  description?: string
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
    setCurrentProject
  }
})

// Import auth store for type checking
import { useAuthStore } from './auth'
