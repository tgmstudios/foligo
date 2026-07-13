import type { EditorStudioAdapter } from '@/studio/types'
import { useCoverLetterDocuments, type CoverLetterDocument } from '@/composables/useCoverLetterDocuments'
import { API_URL } from '@/composables/useAgenticChat'
import api from '@/services/api'
import DocumentEditor from '@/components/agentic-editor/DocumentEditor.vue'
import PreviewPane from '@/components/agentic-editor/PreviewPane.vue'

const documentsApi = useCoverLetterDocuments()

export const coverLetterAdapter: EditorStudioAdapter<CoverLetterDocument> = {
  type: 'cover-letter',
  label: 'Cover Letter',
  loadDocument: documentsApi.loadDocument,
  createDocument: documentsApi.createDocument,
  cloneDocument: documentsApi.cloneDocument,
  deleteDocument: documentsApi.deleteDocument,
  listDocuments: async () => {
    await documentsApi.fetchDocuments()
    return documentsApi.documents.value.map(doc => ({ id: doc.id, title: doc.title, createdAt: doc.createdAt, updatedAt: doc.updatedAt, status: doc.job ? `${doc.job.company} – ${doc.job.position}` : undefined }))
  },
  saveDocument: async (id, patch, kind) => {
    const result = await documentsApi.updateDocument(id, patch, kind)
    return { savedAt: new Date().toISOString(), revisionId: result.revisionId }
  },
  supportsCompile: true,
  compileDocument: async (id) => {
    const result = await documentsApi.compileDocument(id)
    return 'error' in result ? result : { previewUrl: result.pdfUrl }
  },
  supportsRevisions: true,
  listRevisions: documentsApi.listRevisions,
  getRevision: documentsApi.getRevision,
  restoreRevision: documentsApi.restoreRevision,
  supportsChat: true,
  getChatUrl: (id) => `${API_URL}/goapply/cover-letters/${id}/chat`,
  metaFields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'jobId', label: 'Linked job', type: 'linked-entity' },
  ],
  getMetaValues: doc => ({ title: doc.title, jobId: doc.jobId ?? null }),
  saveMeta: async (id, values) => { await documentsApi.updateDocument(id, { title: values.title, jobId: values.jobId }) },
  getFieldOptions: async field => field === 'jobId'
    ? (await api.get('/goapply/jobs')).data.map((job: any) => ({ value: job.id, label: `${job.company} – ${job.position}` }))
    : [],
  supportsContentReferences: false,
  supportsMediaImport: false,
  components: { editor: DocumentEditor, preview: PreviewPane },
}
