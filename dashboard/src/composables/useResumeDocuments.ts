import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

export interface ResumeDocumentSummary {
  id: string
  name: string
  jobDescription: string | null
  linkedJobId: string | null
  linkedJob: { id: string; company: string; position: string; category: string | null } | null
  isTemplate: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ResumeDocument extends ResumeDocumentSummary {
  content: string
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  pdfPath: string | null
}

export interface ResumeDocumentRevisionSummary {
  id: string
  createdAt: string
}

export interface ResumeDocumentRevisionDetail extends ResumeDocumentRevisionSummary {
  content: string
  jobDescription: string | null
}

export function useResumeDocuments() {
  const toast = useToast()
  const documents = ref<ResumeDocumentSummary[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  async function fetchDocuments() {
    isLoading.value = true
    try {
      const response = await api.get('/resume/documents')
      documents.value = response.data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load resume history')
    } finally {
      isLoading.value = false
    }
  }

  async function createDocument(params: { name?: string; content?: string; jobDescription?: string; linkedJobId?: string } = {}): Promise<ResumeDocument> {
    const response = await api.post('/resume/documents', params)
    await fetchDocuments()
    return response.data
  }

  async function loadDocument(id: string): Promise<ResumeDocument> {
    const response = await api.get(`/resume/documents/${id}`)
    return response.data
  }

  async function updateDocument(
    id: string,
    data: { name?: string; content?: string; jobDescription?: string | null; linkedJobId?: string | null; isTemplate?: boolean; isDefault?: boolean },
    kind?: 'autosave' | 'manual'
  ) {
    isSaving.value = true
    try {
      const response = await api.patch(`/resume/documents/${id}`, kind ? { ...data, kind } : data)
      await fetchDocuments()
      return response.data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save resume')
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function cloneDocument(id: string): Promise<ResumeDocument> {
    const response = await api.post(`/resume/documents/${id}/clone`)
    await fetchDocuments()
    return response.data
  }

  async function deleteDocument(id: string) {
    try {
      await api.delete(`/resume/documents/${id}`)
      documents.value = documents.value.filter(d => d.id !== id)
      toast.success('Resume deleted')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete resume')
      throw error
    }
  }

  async function listRevisions(id: string): Promise<ResumeDocumentRevisionSummary[]> {
    const response = await api.get(`/resume/documents/${id}/revisions`)
    return response.data
  }

  async function getRevision(id: string, revisionId: string): Promise<ResumeDocumentRevisionDetail> {
    const response = await api.get(`/resume/documents/${id}/revisions/${revisionId}`)
    return response.data
  }

  async function restoreRevision(id: string, revisionId: string): Promise<ResumeDocument> {
    const response = await api.post(`/resume/documents/${id}/revisions/${revisionId}/restore`)
    return response.data
  }

  async function compileDocument(id: string): Promise<{ pdfUrl: string } | { error: string; log?: string }> {
    try {
      const response = await api.post(`/resume/documents/${id}/compile`, {}, { responseType: 'blob' })
      // Construct the Blob's type explicitly rather than trusting it to be inferred
      // correctly from the response's Content-Type in every environment/proxy —
      // an iframe/embed shown a non-"application/pdf" blob will offer a download
      // instead of rendering inline.
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
      const pdfUrl = URL.createObjectURL(pdfBlob)
      return { pdfUrl }
    } catch (error: any) {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text()
        try {
          const parsed = JSON.parse(text)
          return { error: parsed.message || 'Compilation failed', log: parsed.log }
        } catch {
          // fall through to generic error below
        }
      }
      return { error: error.response?.data?.message || 'Compilation failed' }
    }
  }

  return {
    documents,
    isLoading,
    isSaving,
    fetchDocuments,
    createDocument,
    loadDocument,
    updateDocument,
    cloneDocument,
    deleteDocument,
    compileDocument,
    listRevisions,
    getRevision,
    restoreRevision,
  }
}
