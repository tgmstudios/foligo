import type { Component } from 'vue'

/** Minimal shape every adapter's document must expose for shell-level chrome
 *  (gallery cards, the left-toolbar "other documents" switcher). */
export interface StudioDocumentSummary {
  id: string
  title: string
  updatedAt: string
  createdAt: string
  status?: string
}

export type StudioSaveKind = 'autosave' | 'manual'

export interface StudioSaveResult {
  savedAt: string
  /** Only set for 'manual' saves (or agent-turn saves) that created a revision row. */
  revisionId?: string
}

export interface StudioMetaFieldSchema {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'linked-entity'
  options?: Array<{ value: string; label: string }>
}

export interface StudioRevisionSummary {
  id: string
  createdAt: string
  label?: string
}

export interface StudioRevisionDetail extends StudioRevisionSummary {
  content: string
}

export interface StudioQuickAction {
  id: string
  label: string
  icon?: Component
  handler: (documentId: string) => void
}

/**
 * Everything the Editor Studio shell needs from a content type to render and
 * drive one document. `components.editor`/`components.preview` are mounted
 * directly via `<component :is>` — for now their prop/event contracts follow
 * whatever the resume adapter's underlying components already expose
 * (DocumentEditor: `modelValue`/`saving` + `update:modelValue`/`save`;
 * PreviewPane: `pdfUrl`/`compiling`/`compileError`/`closable` + `recompile`/`close`).
 * A second adapter will tell us whether that contract needs generalizing —
 * not worth inventing a fictional one against a single implementation.
 */
export interface EditorStudioAdapter<TDoc = any> {
  type: string
  label: string

  loadDocument(id: string): Promise<TDoc>
  createDocument(initial?: Partial<TDoc>): Promise<TDoc>
  cloneDocument(id: string): Promise<TDoc>
  deleteDocument(id: string): Promise<void>
  listDocuments(): Promise<StudioDocumentSummary[]>
  saveDocument(id: string, patch: Partial<TDoc>, kind: StudioSaveKind): Promise<StudioSaveResult>

  supportsCompile: boolean
  compileDocument?(id: string): Promise<{ previewUrl: string } | { error: string; log?: string }>

  supportsRevisions: boolean
  listRevisions?(id: string): Promise<StudioRevisionSummary[]>
  getRevision?(id: string, revisionId: string): Promise<StudioRevisionDetail>
  restoreRevision?(id: string, revisionId: string): Promise<TDoc>

  supportsChat: boolean
  getChatUrl?(id: string): string

  metaFields: StudioMetaFieldSchema[]
  getMetaValues(doc: Partial<TDoc>): Record<string, any>
  saveMeta(id: string, values: Record<string, any>): Promise<void>
  /** Dynamic options for a 'select'/'linked-entity' meta field whose choices aren't known statically. */
  getFieldOptions?(fieldKey: string): Promise<Array<{ value: string; label: string }>>

  /** @-mention / insert-reference capability for the shared CommandPalette. No-op for resume. */
  supportsContentReferences: boolean
  onInsertReference?(ref: { id: string; type: string; label: string }): void

  supportsMediaImport: boolean
  onMediaSelected?(media: { id: string; url: string; filename: string }): void

  quickActions?: StudioQuickAction[]

  components: {
    editor: Component
    preview: Component
  }
}
