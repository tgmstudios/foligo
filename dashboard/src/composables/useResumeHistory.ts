import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

export function useResumeHistory() {
  const toast = useToast()
  const history = ref<any[]>([])
  const isSaving = ref(false)

  const fetchHistory = async () => {
    try {
      const response = await api.get('/resume/history')
      history.value = response.data
    } catch (error: any) {
      console.error('Fetch history error:', error)
      toast.error('Failed to load history')
    }
  }

  const saveToHistory = async (data: {
    name: string
    templateId?: string | null
    jobDescription: string
    resumeData: any
    contentItemIds: string[]
    resumeSize: string
  }) => {
    try {
      isSaving.value = true
      await api.post('/resume/history', data)
      await fetchHistory()
      toast.success('Resume saved to history!')
    } catch (error: any) {
      console.error('Save history error:', error)
      toast.error(error.response?.data?.message || 'Failed to save to history')
      throw error
    } finally {
      isSaving.value = false
    }
  }

  const loadFromHistory = async (id: string) => {
    try {
      const response = await api.get(`/resume/history/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Load history error:', error)
      toast.error(error.response?.data?.message || 'Failed to load from history')
      throw error
    }
  }

  const deleteHistory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume from history?')) return

    try {
      await api.delete(`/resume/history/${id}`)
      await fetchHistory()
      toast.success('Resume deleted from history')
    } catch (error: any) {
      console.error('Delete history error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete from history')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    history,
    isSaving,
    fetchHistory,
    saveToHistory,
    loadFromHistory,
    deleteHistory,
    formatDate
  }
}


