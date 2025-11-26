import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import api, { aiApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { ResumeData } from './useResumeEditing'

export function useResumeGeneration() {
  const toast = useToast()
  const authStore = useAuthStore()
  const isGenerating = ref(false)
  const isRendering = ref(false)
  const isImproving = ref(false)

  const generateResumeContent = async (params: {
    jobDescription: string
    contentItems: any[]
    resumeSize: 'small' | 'medium' | 'large'
  }) => {
    try {
      isGenerating.value = true

      const userProfile = {
        name: authStore.user?.name || '',
        email: authStore.user?.email || '',
        bio: (authStore.user as any)?.bio || '',
        skills: []
      }

      toast.info('Generating tailored resume content...')
      const response = await aiApi.post('/resume/tailor', {
        jobDescription: params.jobDescription,
        userProfile,
        contentItems: params.contentItems.map(item => ({
          id: item.id,
          title: item.title || item.name,
          name: item.title || item.name,
          description: item.excerpt || item.description || item.content || '',
          tech: item.skills?.map((s: any) => s.name || s).join(', ') || ''
        })),
        size: params.resumeSize
      })

      return response.data
    } catch (error: any) {
      console.error('Generate error:', error)
      if (error.code === 'ECONNABORTED' || error.message?.includes('canceled')) {
        toast.error('Request timed out. Resume generation can take a while. Please try again.')
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate resume content')
      }
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  const improveText = async (params: {
    originalText: string
    jobDescription: string
    context?: string
    size: 'small' | 'medium' | 'large'
  }) => {
    if (isImproving.value) return

    try {
      isImproving.value = true

      const response = await aiApi.post('/resume/improve-text', {
        originalText: params.originalText,
        jobDescription: params.jobDescription,
        context: params.context || '',
        size: params.size
      })

      return response.data.improvedText
    } catch (error: any) {
      console.error('Improve text error:', error)
      if (error.code === 'ECONNABORTED' || error.message?.includes('canceled')) {
        toast.error('Request timed out. Please try again.')
      } else {
        toast.error(error.response?.data?.message || 'Failed to improve text')
      }
      throw error
    } finally {
      isImproving.value = false
    }
  }

  const renderResume = async (templatePath: string, data: any) => {
    try {
      isRendering.value = true

      toast.info('Rendering resume document...')
      const response = await api.post(
        '/resume/render',
        { templatePath, data },
        { responseType: 'blob' }
      )

      // Download the file
      const url = URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'resume.docx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Resume generated and downloaded successfully!')
    } catch (error: any) {
      console.error('Render error:', error)
      toast.error(error.response?.data?.message || 'Failed to render resume')
      throw error
    } finally {
      isRendering.value = false
    }
  }

  const initializeResumeData = (resumeData: any): ResumeData => {
    return {
      summary: resumeData.summary || '',
      education: (resumeData.education || []).map((e: any) => ({
        ...e,
        enabled: true
      })),
      experience: (resumeData.experience || []).map((exp: any) => ({
        ...exp,
        roles: (exp.roles || []).map((r: any) => ({
          ...r,
          bullets: Array.isArray(r.bullets) ? r.bullets : [],
          enabled: true
        })),
        enabled: true
      })),
      projects: (resumeData.projects || []).map((p: any) => ({
        title: p.title || '',
        bullets: Array.isArray(p.bullets) ? p.bullets : (p.description ? [p.description] : []),
        enabled: true
      })),
      proficiencies: (resumeData.proficiencies || []).map((p: any) => ({
        category: typeof p === 'object' ? (p.category || Object.keys(p)[0] || '') : '',
        skills: typeof p === 'object' ? (Array.isArray(p.skills) ? p.skills : (p[Object.keys(p)[0]] || [])) : [],
        enabled: true
      })),
      honors: resumeData.honors || []
    }
  }

  return {
    isGenerating,
    isRendering,
    isImproving,
    generateResumeContent,
    improveText,
    renderResume,
    initializeResumeData
  }
}

