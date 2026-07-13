import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

export interface CoverLetterDocument {
  id: string
  title: string
  content: string
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  pdfPath: string | null
  jobId: string | null
  isTemplate: boolean
  isDefault: boolean
  job?: { id: string; company: string; position: string } | null
  createdAt: string
  updatedAt: string
}

export function useCoverLetterDocuments() {
  const toast = useToast()
  const documents = ref<CoverLetterDocument[]>([])
  const isLoading = ref(false)

  async function fetchDocuments() {
    isLoading.value = true
    try {
      const { data } = await api.get('/goapply/cover-letters')
      documents.value = data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load cover letters')
    } finally {
      isLoading.value = false
    }
  }

  async function createDocument(initial: Partial<CoverLetterDocument> = {}) {
    const { data } = await api.post('/goapply/cover-letters', {
      title: initial.title || 'Untitled Cover Letter',
      ...(initial.content !== undefined ? { content: initial.content } : {}),
      jobId: initial.jobId || null,
    })
    await fetchDocuments()
    return data as CoverLetterDocument
  }

  async function loadDocument(id: string) {
    const { data } = await api.get(`/goapply/cover-letters/${id}`)
    return data as CoverLetterDocument
  }

  async function updateDocument(id: string, patch: Partial<CoverLetterDocument>, kind: 'autosave' | 'manual' = 'manual') {
    const { data } = await api.patch(`/goapply/cover-letters/${id}`, { ...patch, kind })
    return data
  }

  async function cloneDocument(id: string) {
    const { data } = await api.post(`/goapply/cover-letters/${id}/clone`)
    await fetchDocuments()
    return data as CoverLetterDocument
  }

  async function deleteDocument(id: string) {
    await api.delete(`/goapply/cover-letters/${id}`)
    documents.value = documents.value.filter(document => document.id !== id)
    toast.success('Cover letter deleted')
  }

  const listRevisions = async (id: string) => (await api.get(`/goapply/cover-letters/${id}/revisions`)).data
  const getRevision = async (id: string, revisionId: string) => (await api.get(`/goapply/cover-letters/${id}/revisions/${revisionId}`)).data
  const restoreRevision = async (id: string, revisionId: string) => (await api.post(`/goapply/cover-letters/${id}/revisions/${revisionId}/restore`)).data

  async function compileDocument(id: string): Promise<{ pdfUrl: string } | { error: string; log?: string }> {
    try {
      const response = await api.post(`/goapply/cover-letters/${id}/compile`, {}, { responseType: 'blob' })
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

  return { documents, isLoading, fetchDocuments, createDocument, loadDocument, updateDocument, cloneDocument, deleteDocument, compileDocument, listRevisions, getRevision, restoreRevision }
}
