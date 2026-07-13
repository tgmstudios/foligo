import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { useAuthStore } from './auth'
import { withErrorToast, syncEntityInState, syncNestedEntityInState } from '@/composables/useApiAction'
import type { Project, SiteConfig, Content, CreateProjectData, UpdateProjectData } from '@/types/project'

// Re-exported so existing `import { Content, ... } from '@/stores/projects'`
// call sites across the dashboard keep working unchanged.
export type {
  Project,
  SiteConfig,
  ProjectMember,
  Content,
  ContentLink,
  ContentTag,
  ContentMeta,
  ContentBlock,
  Skill,
  ExperienceRole,
  CreateProjectData,
  UpdateProjectData
} from '@/types/project'

export const useProjectStore = defineStore('projects', () => {
  // ── State ────────────────────────────────────────────────────────────
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const isLoading = ref(false)
  const isCreating = ref(false)

  // ── Getters ──────────────────────────────────────────────────────────
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

  const recentContent = computed(() => {
    const allContent: Content[] = []
    projects.value.forEach(project => {
      if (project.content) {
        project.content.forEach(content => {
          // Filter out revisions - they should not appear in recent content
          if (content.status !== 'REVISION' && !content.revisionOf) {
            allContent.push({
              ...content,
              projectName: project.name,
              projectId: project.id
            })
          }
        })
      }
    })
    return allContent
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  })

  // Note: the "recentActivity" mixed activity feed getter (project + content
  // events with inline SVG icon paths) was extracted to
  // composables/useRecentActivity.ts. Its only consumer, DashboardView.vue,
  // now calls useRecentActivity(computed(() => projectStore.projects))
  // directly instead of going through the store.

  // ── Actions: Project CRUD ───────────────────────────────────────────
  async function fetchProjects() {
    return withErrorToast(async () => {
      isLoading.value = true
      try {
        const response = await api.get('/projects')
        projects.value = [...response.data.ownedProjects, ...response.data.memberProjects]

        // Fetch content for each project in parallel via the dedicated content endpoint
        const results = await Promise.allSettled(
          projects.value.map(project => api.get(`/projects/${project.id}/content`))
        )
        results.forEach((result, index) => {
          const project = projects.value[index]
          if (result.status === 'fulfilled') {
            project.content = result.value.data
          } else {
            console.error(`Failed to fetch content for project ${project.name}:`, result.reason)
          }
        })

        return response.data
      } finally {
        isLoading.value = false
      }
    }, 'Failed to fetch projects')
  }

  async function fetchProject(id: string) {
    return withErrorToast(async () => {
      isLoading.value = true
      try {
        const response = await api.get(`/projects/${id}`)
        currentProject.value = response.data

        // Update project in projects array with proper reactivity
        const index = projects.value.findIndex(p => p.id === id)
        if (index !== -1) {
          // Use splice to ensure Vue reactivity
          projects.value.splice(index, 1, response.data)
        } else {
          // Project not in array, add it
          projects.value.push(response.data)
        }

        return response.data
      } finally {
        isLoading.value = false
      }
    }, 'Failed to fetch project')
  }

  async function createProject(data: CreateProjectData) {
    return withErrorToast(async () => {
      isCreating.value = true
      try {
        const response = await api.post('/projects', data)
        projects.value.unshift(response.data)
        return response.data
      } finally {
        isCreating.value = false
      }
    }, 'Failed to create project', `Project "${data.name}" created successfully`)
  }

  async function updateProject(id: string, data: UpdateProjectData) {
    return withErrorToast(async () => {
      isLoading.value = true
      try {
        const response = await api.put(`/projects/${id}`, data)
        syncEntityInState(projects, currentProject, id, () => response.data)
        return response.data
      } finally {
        isLoading.value = false
      }
    }, 'Failed to update project', 'Project updated successfully')
  }

  async function deleteProject(id: string) {
    return withErrorToast(async () => {
      isLoading.value = true
      try {
        await api.delete(`/projects/${id}`)
        syncEntityInState(projects, currentProject, id, null, { remove: true })
      } finally {
        isLoading.value = false
      }
    }, 'Failed to delete project', 'Project deleted successfully')
  }

  function setCurrentProject(project: Project | null) {
    currentProject.value = project
  }

  // ── Actions: Membership ──────────────────────────────────────────────
  async function addProjectMember(projectId: string, email: string, role: 'ADMIN' | 'EDITOR' | 'VIEWER') {
    return withErrorToast(async () => {
      const response = await api.post(`/projects/${projectId}/members`, { email, role })

      const project = projects.value.find(p => p.id === projectId)
      if (project && project.members) {
        project.members.push(response.data)
      }

      return response.data
    }, 'Failed to add member', 'Member added successfully')
  }

  async function removeProjectMember(projectId: string, userId: string) {
    return withErrorToast(async () => {
      await api.delete(`/projects/${projectId}/members/${userId}`)

      const project = projects.value.find(p => p.id === projectId)
      if (project && project.members) {
        project.members = project.members.filter(m => m.userId !== userId)
      }
    }, 'Failed to remove member', 'Member removed successfully')
  }

  async function updateMemberRole(projectId: string, userId: string, role: 'ADMIN' | 'EDITOR' | 'VIEWER') {
    return withErrorToast(async () => {
      const response = await api.put(`/projects/${projectId}/members/${userId}`, { role })

      const project = projects.value.find(p => p.id === projectId)
      if (project && project.members) {
        const member = project.members.find(m => m.userId === userId)
        if (member) {
          member.role = role
        }
      }

      return response.data
    }, 'Failed to update member role', 'Member role updated successfully')
  }

  // ── Actions: Site Config ──────────────────────────────────────────────
  async function fetchSiteConfig(projectId: string) {
    return withErrorToast(
      async () => (await api.get(`/projects/${projectId}/site-config`)).data,
      'Failed to fetch site configuration'
    )
  }

  async function updateSiteConfig(projectId: string, config: Partial<SiteConfig>) {
    return withErrorToast(async () => {
      const response = await api.put(`/projects/${projectId}/site-config`, config)
      syncEntityInState(projects, currentProject, projectId, (project) => ({
        ...project,
        siteConfig: response.data
      }))
      return response.data
    }, 'Failed to update site configuration', 'Site configuration updated successfully')
  }

  async function publishProject(projectId: string, isPublished: boolean) {
    return withErrorToast(
      async () => {
        const response = await api.post(`/projects/${projectId}/publish`, { isPublished })
        syncEntityInState(projects, currentProject, projectId, (project) => ({
          ...project,
          isPublished
        }))
        return response.data
      },
      'Failed to update publish status',
      (result) => result.message
    )
  }

  // ── Actions: Content CRUD ─────────────────────────────────────────────
  async function createContent(projectId: string, contentData: {
    contentType: 'PROJECT' | 'BLOG' | 'EXPERIENCE' | 'SKILL'
    title: string
    slug?: string
    excerpt?: string
    content: string
    metadata?: any
    status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'REVISION'
    // Skills and tags
    skills?: Array<{ id: string; name: string; category?: string }>
    tags?: Array<{ id: string; name: string; category?: string }>
    // Project-specific fields
    startDate?: string
    endDate?: string
    isOngoing?: boolean
    featuredImage?: string
    projectLinks?: {
      github?: string
      devpost?: string
      other?: string[]
    }
    contributors?: string[]
    // Experience-specific fields
    experienceCategory?: 'JOB' | 'EDUCATION' | 'CERTIFICATION'
    location?: string
    locationType?: 'REMOTE' | 'HYBRID' | 'ONSITE'
  }) {
    return withErrorToast(async () => {
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

      return response.data
    }, 'Failed to create content', 'Content created successfully')
  }

  async function updatePostOrder(projectId: string, order: Array<{ contentId: string; order: number }>) {
    return withErrorToast(async () => {
      const response = await api.put(`/projects/${projectId}/content/order`, { order })

      // Refresh projects to get updated order
      await fetchProjects()

      return response.data
    }, 'Failed to update post order', 'Post order updated successfully')
  }

  async function updateContent(contentId: string, contentData: Partial<Content>) {
    return withErrorToast(async () => {
      const response = await api.put(`/content/${contentId}/fields`, contentData)
      syncNestedEntityInState(projects, currentProject, contentId, () => response.data)
      return response.data
    }, 'Failed to update content', 'Content updated successfully')
  }

  async function deleteContent(contentId: string) {
    return withErrorToast(async () => {
      await api.delete(`/content/${contentId}`)
      syncNestedEntityInState(projects, currentProject, contentId, null, { remove: true })
    }, 'Failed to delete content', 'Content deleted successfully')
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
    recentContent,

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
    deleteContent,
    updatePostOrder
  }
})
