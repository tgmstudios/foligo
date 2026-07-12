import type { EditorStudioAdapter, StudioDocumentSummary } from '@/studio/types'
import type { Content } from '@/stores/projects'
import api, { API_URL } from '@/services/api'
import MarkdownCodeEditor from '@/components/editor/MarkdownCodeEditor.vue'
import MarkdownPreview from '@/components/studio/MarkdownPreview.vue'

function toSummary(doc: Content): StudioDocumentSummary {
  return {
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    status: doc.status,
  }
}

/**
 * Content items are always scoped to one project, so (unlike the resume
 * adapter, which is a single module-level singleton) this is a factory —
 * ContentStudioView creates one instance per mount, closing over the
 * project id from the route.
 */
export function createContentAdapter(projectId: string): EditorStudioAdapter<Content> {
  return {
    type: 'content',
    label: 'Content',

    loadDocument: async (id) => (await api.get(`/content/${id}`)).data,

    createDocument: async (initial) => {
      const response = await api.post(`/projects/${projectId}/content`, {
        contentType: (initial as any)?.contentType || 'BLOG',
        title: initial?.title || 'Untitled',
        content: initial?.content || ' ',
      })
      return response.data
    },

    cloneDocument: async (id) => {
      const source: Content = (await api.get(`/content/${id}`)).data
      const response = await api.post(`/projects/${projectId}/content`, {
        contentType: source.contentType,
        title: `${source.title} (copy)`,
        content: source.content,
        excerpt: source.excerpt,
      })
      return response.data
    },

    deleteDocument: async (id) => {
      await api.delete(`/content/${id}`)
    },

    listDocuments: async () => {
      const response = await api.get(`/projects/${projectId}/content`)
      return (response.data as Content[]).map(toSummary)
    },

    saveDocument: async (id, patch, _kind) => {
      // Content has no autosave-vs-manual distinction — every save revisions.
      const data: Record<string, any> = {}
      if (patch.content !== undefined) data.content = patch.content
      const response = await api.put(`/content/${id}/fields`, data)
      return { savedAt: new Date().toISOString(), revisionId: response.data?.id }
    },

    supportsCompile: false,

    supportsRevisions: true,
    listRevisions: async (id) => {
      const response = await api.get(`/projects/${projectId}/content/${id}/revisions`)
      return (response.data as Content[]).map((r) => ({ id: r.id, createdAt: r.revisedAt || r.createdAt }))
    },
    getRevision: async (id, revisionId) => {
      const response = await api.get(`/projects/${projectId}/content/${id}/revisions/${revisionId}`)
      const r: Content = response.data
      return { id: r.id, createdAt: r.revisedAt || r.createdAt, content: r.content }
    },
    restoreRevision: async (id, revisionId) => {
      const response = await api.post(`/projects/${projectId}/content/${id}/revisions/${revisionId}/restore`)
      return response.data
    },

    supportsChat: true,
    getChatUrl: (id) => `${API_URL}/content/${id}/chat`,

    metaFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'PUBLISHED', label: 'Published' },
          { value: 'HIDDEN', label: 'Hidden' },
        ],
      },
    ],
    getMetaValues: (doc) => ({ title: doc.title, excerpt: doc.excerpt ?? '', status: doc.status ?? 'DRAFT' }),
    saveMeta: async (id, values) => {
      await api.put(`/content/${id}/fields`, { title: values.title, excerpt: values.excerpt, status: values.status })
    },

    supportsContentReferences: false,
    supportsMediaImport: true,

    components: {
      editor: MarkdownCodeEditor,
      preview: MarkdownPreview,
    },
  }
}
