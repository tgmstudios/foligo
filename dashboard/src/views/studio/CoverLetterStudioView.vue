<template>
  <StudioShell :focus-mode="focusMode">
    <template #header="{ sideBySide, previewOpen, togglePreview }">
      <StudioHeader
        :title="documentTitle"
        :dirty="dirty"
        :saving="isSaving"
        :focus-mode="focusMode"
        :show-history="true"
        :show-meta="true"
        :show-export="!!pdfUrl"
        show-preview-toggle
        :side-by-side="sideBySide"
        :preview-open="previewOpen"
        @back="goBack"
        @save="saveAndCompile"
        @toggle-focus="focusMode = !focusMode"
        @open-history="showHistory = true"
        @open-meta="showMeta = true"
        @export="downloadPdf"
        @toggle-preview="togglePreview"
      />
    </template>

    <template #editor>
      <component
        :is="adapter.components.editor"
        :model-value="content"
        :saving="isSaving"
        @update:model-value="onContentInput"
        @save="saveAndCompile"
      />
    </template>

    <template #preview>
      <component
        :is="adapter.components.preview"
        :pdf-url="pdfUrl"
        :compiling="compiling"
        :compile-error="compileError"
        @recompile="saveAndCompile"
      />
    </template>

    <template #chat>
      <StudioChatSidebar
        v-model="selectedProvider"
        :messages="chat.messages.value"
        :streaming="chat.streaming.value"
        :sessions="chatSessions.sessions.value"
        :active-session-id="chatSessions.activeSessionId.value"
        :sessions-loading="chatSessions.loadingSessions.value"
        placeholder="Ask the agent to edit your cover letter…"
        empty-state-text="Ask the agent to draft a paragraph, tailor the letter to the linked job, or tweak wording — it'll edit the document directly."
        @send="chat.sendMessage"
        @stop="chat.stop"
        @select-session="selectChatSession"
        @new-session="newChatSession"
      />
    </template>

    <template #left-toolbar><StudioLeftToolbar :adapter="adapter" :document-id="documentId" @switch-document="id => router.push({ name: 'studio-cover-letter', params: { id } })" /></template>
  </StudioShell>
  <RevisionHistoryPopup :is-open="showHistory" :adapter="adapter" :document-id="documentId" :current-content="content" @close="showHistory = false" @restored="onRevisionRestored" />
  <MetaEditorPopover v-if="loadedDoc" :is-open="showMeta" :adapter="adapter" :document-id="documentId" :initial-values="adapter.getMetaValues(loadedDoc)" @close="showMeta = false" @saved="openDocument(documentId)" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useToast } from 'vue-toastification'
import '@/studio/adapters'
import { getAdapter } from '@/studio/registry'
import { useAgenticChat } from '@/composables/useAgenticChat'
import { useChatSessions } from '@/composables/useChatSessions'
import { useAutosave } from '@/composables/useAutosave'
import type { CoverLetterDocument } from '@/composables/useCoverLetterDocuments'
import StudioShell from '@/components/studio/StudioShell.vue'
import StudioHeader from '@/components/studio/StudioHeader.vue'
import StudioLeftToolbar from '@/components/studio/StudioLeftToolbar.vue'
import StudioChatSidebar from '@/components/studio/StudioChatSidebar.vue'
import RevisionHistoryPopup from '@/components/studio/RevisionHistoryPopup.vue'
import MetaEditorPopover from '@/components/studio/MetaEditorPopover.vue'
import api from '@/services/api'

const route = useRoute(), router = useRouter(), toast = useToast()
const adapter = getAdapter('cover-letter')
const documentId = ref(route.params.id as string), documentTitle = ref('Untitled Cover Letter'), content = ref('')
const loadedDoc = ref<CoverLetterDocument | null>(null), dirty = ref(false), isSaving = ref(false), focusMode = ref(false), showHistory = ref(false), showMeta = ref(false)
const pdfUrl = ref<string | null>(null)
const compileError = ref<string | null>(null)
const awaitingCompile = ref(false)
const selectedProvider = ref<string | undefined>(undefined)
const chatSessions = useChatSessions('studio-cover-letter', () => documentId.value)

const chat = useAgenticChat(
  () => adapter.getChatUrl!(documentId.value),
  {
    onDocumentUpdated: (newContent) => {
      content.value = newContent
      dirty.value = false
    },
    onCompiled: async (url) => {
      // The /pdf route requires a Bearer token, which a plain <embed src> can't
      // send — fetch it through axios (which attaches auth) and hand the editor
      // a same-origin blob: URL instead.
      try {
        const response = await api.get(url, { responseType: 'blob' })
        revokePdfUrl()
        pdfUrl.value = toPdfObjectUrl(response.data)
        compileError.value = null
      } catch (error: any) {
        compileError.value = error.response?.data?.message || 'Failed to load compiled PDF'
      } finally {
        awaitingCompile.value = false
      }
    },
    onCompileError: (message) => {
      compileError.value = message
      awaitingCompile.value = false
    },
    onTurnComplete: async (history) => { await chatSessions.save(history) },
  },
  () => selectedProvider.value
)

async function selectChatSession(id: string) {
  const session = await chatSessions.open(id)
  chat.loadHistory(session.chatHistory || [])
}

async function newChatSession() {
  await chatSessions.create()
  chat.reset()
}

async function loadChatSessions(fallbackHistory: CoverLetterDocument['chatHistory']) {
  const sessions = await chatSessions.refresh()
  if (sessions.length) {
    await selectChatSession(sessions[0].id)
    return
  }
  const session = await chatSessions.create()
  if (fallbackHistory.length) {
    chat.loadHistory(fallbackHistory)
    await chatSessions.save(fallbackHistory)
  } else {
    chatSessions.activeSessionId.value = session.id
    chat.reset()
  }
}

const compiling = computed(() => chat.streaming.value || awaitingCompile.value)

watch(chat.streaming, (isStreaming, wasStreaming) => {
  if (wasStreaming && !isStreaming) {
    awaitingCompile.value = true
  }
})

function onContentInput(value: string) { content.value = value; dirty.value = true }

function revokePdfUrl() {
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
}

function toPdfObjectUrl(data: Blob): string {
  return URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
}

async function openDocument(id: string) {
  try {
    const doc = await adapter.loadDocument(id) as CoverLetterDocument
    loadedDoc.value = doc
    documentId.value = doc.id
    documentTitle.value = doc.title
    content.value = doc.content
    dirty.value = false
    revokePdfUrl()
    pdfUrl.value = null
    compileError.value = null
    if (doc.pdfPath) {
      try {
        const response = await api.get(`/goapply/cover-letters/${doc.id}/pdf`, { responseType: 'blob' })
        pdfUrl.value = toPdfObjectUrl(response.data)
      } catch {
        // No compiled PDF yet, or it failed to load — leave preview empty rather than blocking the page.
      }
    }
    await loadChatSessions(doc.chatHistory || [])
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load cover letter')
    goBack()
  }
}

async function saveAndCompile() {
  if (!documentId.value || !adapter.compileDocument) return
  isSaving.value = true
  try {
    await adapter.saveDocument(documentId.value, { content: content.value }, 'manual')
    dirty.value = false
    awaitingCompile.value = true
    const result = await adapter.compileDocument(documentId.value)
    awaitingCompile.value = false
    if ('error' in result) {
      compileError.value = result.error
    } else {
      revokePdfUrl()
      pdfUrl.value = result.previewUrl
      compileError.value = null
    }
  } finally {
    isSaving.value = false
  }
}

useAutosave(content, dirty, async value => { await adapter.saveDocument(documentId.value, { content: value }, 'autosave') })

function downloadPdf() {
  if (!pdfUrl.value) return
  const link = document.createElement('a')
  link.href = pdfUrl.value
  link.download = `${documentTitle.value || 'cover-letter'}.pdf`
  link.click()
}

function onRevisionRestored(value: string) { content.value = value; dirty.value = false }
function goBack() { router.push({ name: 'goapply-letters' }) }
function confirmDiscardChanges() { return !dirty.value || window.confirm('You have unsaved changes. Leave without saving?') }
onBeforeRouteLeave(confirmDiscardChanges)
onBeforeRouteUpdate((to, from) => to.params.id === from.params.id || confirmDiscardChanges())
function handleBeforeUnload(event: BeforeUnloadEvent) { if (dirty.value) { event.preventDefault(); event.returnValue = '' } }
watch(() => route.params.id, id => { if (typeof id === 'string' && id !== documentId.value) openDocument(id) })
onMounted(() => { openDocument(documentId.value); window.addEventListener('beforeunload', handleBeforeUnload) })
onBeforeUnmount(() => { revokePdfUrl(); window.removeEventListener('beforeunload', handleBeforeUnload) })
</script>
