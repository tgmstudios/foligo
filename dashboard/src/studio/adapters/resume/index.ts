import type { EditorStudioAdapter, StudioDocumentSummary } from '@/studio/types'
import { useResumeDocuments, type ResumeDocument } from '@/composables/useResumeDocuments'
import { API_URL } from '@/composables/useAgenticChat'
import DocumentEditor from '@/components/agentic-editor/DocumentEditor.vue'
import PreviewPane from '@/components/agentic-editor/PreviewPane.vue'
import api from '@/services/api'

// Composables here hold no lifecycle hooks (no onMounted/onUnmounted), just
// refs + plain functions, so a single module-scoped instance is safe to share
// across every Studio view instance rather than re-creating it per adapter call.
const documentsApi = useResumeDocuments()

function toSummary(doc: { id: string; name: string; updatedAt: string; createdAt: string; jobDescription: string | null }): StudioDocumentSummary {
  return {
    id: doc.id,
    title: doc.name,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    status: doc.jobDescription ? 'Tailored' : undefined,
  }
}

export const resumeAdapter: EditorStudioAdapter<ResumeDocument> = {
  type: 'resume',
  label: 'Resume',

  loadDocument: (id) => documentsApi.loadDocument(id),

  createDocument: (initial) =>
    documentsApi.createDocument({
      name: initial?.name,
      content: initial?.content,
      jobDescription: initial?.jobDescription ?? undefined,
    }),

  cloneDocument: (id) => documentsApi.cloneDocument(id),

  deleteDocument: (id) => documentsApi.deleteDocument(id),

  listDocuments: async () => {
    await documentsApi.fetchDocuments()
    return documentsApi.documents.value.map(toSummary)
  },

  saveDocument: async (id, patch, kind) => {
    const result = await documentsApi.updateDocument(
      id,
      { content: patch.content, jobDescription: patch.jobDescription },
      kind
    )
    return { savedAt: new Date().toISOString(), revisionId: result.revisionId }
  },

  supportsCompile: true,
  compileDocument: async (id) => {
    const result = await documentsApi.compileDocument(id)
    return 'error' in result ? result : { previewUrl: result.pdfUrl }
  },

  supportsRevisions: true,
  listRevisions: (id) => documentsApi.listRevisions(id),
  getRevision: (id, revisionId) => documentsApi.getRevision(id, revisionId),
  restoreRevision: (id, revisionId) => documentsApi.restoreRevision(id, revisionId),

  supportsChat: true,
  getChatUrl: (id) => `${API_URL}/resume/documents/${id}/chat`,

  metaFields: [
    { key: 'name', label: 'Title', type: 'text' },
    { key: 'linkedJobId', label: 'Linked job', type: 'linked-entity' },
  ],
  getMetaValues: (doc) => ({ name: doc.name, linkedJobId: doc.linkedJobId ?? null }),
  saveMeta: async (id, values) => {
    await documentsApi.updateDocument(id, { name: values.name, linkedJobId: values.linkedJobId })
  },
  getFieldOptions: async (fieldKey) => {
    if (fieldKey !== 'linkedJobId') return []
    const response = await api.get('/goapply/jobs')
    return response.data.map((job: { id: string; company: string; position: string }) => ({
      value: job.id,
      label: `${job.company} – ${job.position}`,
    }))
  },

  supportsContentReferences: false,
  supportsMediaImport: true,

  components: {
    editor: DocumentEditor,
    preview: PreviewPane,
  },
}
