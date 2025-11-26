import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

export function useResumeTemplates() {
  const toast = useToast()
  const templates = ref<any[]>([])
  const isSaving = ref(false)

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/resume/templates')
      templates.value = response.data
    } catch (error: any) {
      console.error('Fetch templates error:', error)
      toast.error('Failed to load templates')
    }
  }

  const saveTemplate = async (data: {
    name: string
    description?: string
    templatePath: string
    fileName: string
  }) => {
    try {
      isSaving.value = true
      const response = await api.post('/resume/templates', data)
      await fetchTemplates()
      toast.success('Template saved to library!')
      return response.data
    } catch (error: any) {
      console.error('Save template error:', error)
      toast.error(error.response?.data?.message || 'Failed to save template')
      throw error
    } finally {
      isSaving.value = false
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await api.delete(`/resume/templates/${id}`)
      await fetchTemplates()
      toast.success('Template deleted')
    } catch (error: any) {
      console.error('Delete template error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete template')
    }
  }

  return {
    templates,
    isSaving,
    fetchTemplates,
    saveTemplate,
    deleteTemplate
  }
}


