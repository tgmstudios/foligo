
<template>
  <StudioShell :focus-mode="focusMode">
    <template #header="{ sideBySide, previewOpen, togglePreview }">
      <StudioHeader
        :title="documentTitle"
        :dirty="dirty"
        :saving="isSaving"
        :focus-mode="focusMode"
        :show-history="adapter.supportsRevisions"
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
        ref="editorRef"
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
        :compile-log="compileLog"
        @recompile="saveAndCompile"
        @jump-to-line="(line: number) => editorRef?.jumpToLine?.(line)"
      />
    </template>

    <template #chat>
      <div class="flex flex-col flex-1 min-h-0">
        <div class="border-b border-gray-800 flex-shrink-0">
          <button
            @click="showJobDescription = !showJobDescription"
            class="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
          >
            <span class="text-xs text-gray-400">Job Description {{ jobDescription ? '' : '(none set)' }}</span>
            <svg
              class="w-3.5 h-3.5 text-gray-400 transform transition-transform"
              :class="{ 'rotate-180': showJobDescription }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="showJobDescription" class="px-3 pb-3">
            <textarea
              v-model="jobDescription"
              @blur="persistJobDescription"
              placeholder="Paste the target job description here so the agent can tailor the resume…"
              rows="4"
              class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-xs leading-relaxed"
            ></textarea>
          </div>
        </div>

        <StudioChatSidebar
          v-model="selectedProvider"
          :messages="chat.messages.value"
          :streaming="chat.streaming.value"
          :queue="chat.queue.value"
          :sessions="chatSessions.sessions.value"
          :active-session-id="chatSessions.activeSessionId.value"
          :sessions-loading="chatSessions.loadingSessions.value"
          allow-attachments
          placeholder="Ask the agent to edit your resume…"
          empty-state-text="Ask the agent to draft a section, tailor the resume to a job description, or tweak wording — it'll edit the document directly."
          @send="chat.sendMessage"
          @stop="chat.stop"
          @interrupt-send="chat.sendNow"
          @remove-queued="chat.removeFromQueue"
          @select-session="selectChatSession"
          @new-session="newChatSession"
        />
      </div>
    </template>

    <template #left-toolbar>
      <StudioLeftToolbar
        :adapter="adapter"
        :document-id="documentId"
        @switch-document="(id) => router.push({ name: 'studio-resume', params: { id } })"
      />
    </template>
  </StudioShell>

  <RevisionHistoryPopup
    v-if="adapter.supportsRevisions"
    :is-open="showHistory"
    :adapter="adapter"
    :document-id="documentId"
    :current-content="content"
    @close="showHistory = false"
    @restored="onRevisionRestored"
  />

  <MetaEditorPopover
    v-if="loadedDoc"
    :is-open="showMeta"
    :adapter="adapter"
    :document-id="documentId"
    :initial-values="adapter.getMetaValues(loadedDoc)"
    @close="showMeta = false"
    @saved="openDocument(documentId)"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useToast } from 'vue-toastification'
import '@/studio/adapters'
import { getAdapter } from '@/studio/registry'
import StudioShell from '@/components/studio/StudioShell.vue'
import StudioHeader from '@/components/studio/StudioHeader.vue'
import RevisionHistoryPopup from '@/components/studio/RevisionHistoryPopup.vue'
import MetaEditorPopover from '@/components/studio/MetaEditorPopover.vue'
import StudioChatSidebar from '@/components/studio/StudioChatSidebar.vue'
import StudioLeftToolbar from '@/components/studio/StudioLeftToolbar.vue'
import { useAgenticChat } from '@/composables/useAgenticChat'
import { useChatSessions } from '@/composables/useChatSessions'
import { useAutosave } from '@/composables/useAutosave'
import type { ResumeDocument } from '@/composables/useResumeDocuments'
import api from '@/services/api'
import { useGoApplyStore } from '@/stores/goapply'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const goApplyStore = useGoApplyStore()

// Studio currently only ever hosts the resume adapter — swap this for a
// route-meta-driven lookup once a second content type registers itself.
const adapter = getAdapter('resume')

const documentId = ref<string>(route.params.id as string)
const documentTitle = ref('Untitled Resume')
const content = ref('')
const jobDescription = ref('')
const showJobDescription = ref(false)
const pdfUrl = ref<string | null>(null)
const compileError = ref<string | null>(null)
const compileLog = ref<string | null>(null)
const editorRef = ref<any>(null)
const awaitingCompile = ref(false)
const isSaving = ref(false)
const dirty = ref(false)
const focusMode = ref(false)
const showHistory = ref(false)
const showMeta = ref(false)
const loadedDoc = ref<ResumeDocument | null>(null)
const selectedProvider = ref<string | undefined>(undefined)
const chatSessions = useChatSessions('studio-resume', () => documentId.value)

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
        compileLog.value = null
      } catch (error: any) {
        const data = error.response?.data
        if (data instanceof Blob) {
          try {
            const text = await data.text()
            const parsed = JSON.parse(text)
            compileError.value = parsed.errors?.length
              ? JSON.stringify(parsed.errors)
              : parsed.message || 'Failed to load compiled PDF'
            compileLog.value = parsed.log || null
          } catch {
            compileError.value = 'Failed to load compiled PDF'
          }
        } else {
          compileError.value = data?.message || 'Failed to load compiled PDF'
          compileLog.value = data?.log || null
        }
      } finally {
        awaitingCompile.value = false
      }
    },
    onCompileError: (message) => {
      compileError.value = message
      compileLog.value = null
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

async function loadChatSessions(fallbackHistory: ResumeDocument['chatHistory']) {
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

function onContentInput(value: string) {
  content.value = value
  dirty.value = true
}

function revokePdfUrl() {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
  }
}

function toPdfObjectUrl(data: Blob): string {
  return URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
}

async function openDocument(id: string) {
  try {
    const doc = await adapter.loadDocument(id)
    loadedDoc.value = doc
    documentId.value = doc.id
    documentTitle.value = doc.name
    content.value = doc.content
    jobDescription.value = doc.jobDescription || ''
    dirty.value = false
    revokePdfUrl()
    pdfUrl.value = null
    compileError.value = null
    if (doc.pdfPath) {
      try {
        const response = await api.get(`/resume/documents/${doc.id}/pdf`, { responseType: 'blob' })
        pdfUrl.value = toPdfObjectUrl(response.data)
      } catch {
        // No compiled PDF yet, or it failed to load — leave preview empty rather than blocking the page.
      }
    }
    await loadChatSessions(doc.chatHistory || [])
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load resume')
    goBack()
  }
}

async function persistJobDescription() {
  if (!documentId.value) return
  await adapter.saveDocument(documentId.value, { jobDescription: jobDescription.value }, 'manual')
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
      compileLog.value = (result as any).log || null
      // If structured errors came through, embed them for the PreviewPane
      if ((result as any).errors?.length) {
        try {
          compileError.value = JSON.stringify((result as any).errors)
        } catch { /* keep raw error */ }
      }
    } else {
      revokePdfUrl()
      pdfUrl.value = result.previewUrl
      compileError.value = null
    }
  } finally {
    isSaving.value = false
  }
}

useAutosave(content, dirty, async (value) => {
  await adapter.saveDocument(documentId.value, { content: value }, 'autosave')
})

async function downloadPdf() {
  if (!pdfUrl.value) return
  // Studio can be deep-linked to directly, bypassing the GoApply layout that
  // normally loads the profile — fetch it on demand if it isn't cached yet.
  const profile = goApplyStore.profile || (await goApplyStore.fetchProfile())
  const fullName = [profile?.firstName, profile?.lastName].map((v) => String(v || '').trim()).filter(Boolean).join(' ')
    || String(profile?.name || '').trim()
  const filename = `${fullName ? `${fullName} Resume` : 'Resume'}.pdf`
    .replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()
  const link = document.createElement('a')
  link.href = pdfUrl.value
  link.download = filename
  link.click()
}

function goBack() {
  router.push({ name: 'goapply-resume' })
}

function onRevisionRestored(restoredContent: string) {
  content.value = restoredContent
  dirty.value = false
}

function confirmDiscardChanges(): boolean {
  if (!dirty.value) return true
  return window.confirm('You have unsaved changes. Leave without saving?')
}

// Covers the Back button and any other full navigation away from the Studio route.
onBeforeRouteLeave(() => confirmDiscardChanges())

// Covers switching to a different document via the left toolbar's flyout — same
// route component, just a new :id param, so onBeforeRouteLeave alone wouldn't fire.
onBeforeRouteUpdate((to, from) => {
  if (to.params.id !== from.params.id) return confirmDiscardChanges()
})

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

watch(() => route.params.id, (id) => {
  if (typeof id === 'string' && id !== documentId.value) {
    openDocument(id)
  }
})

onMounted(async () => {
  await openDocument(documentId.value)
  const initialPrompt = typeof route.query.initialPrompt === 'string' ? route.query.initialPrompt : ''
  const initialProvider = typeof route.query.provider === 'string' ? route.query.provider : ''
  if (initialPrompt) {
    router.replace({ query: {} })
    if (initialProvider) selectedProvider.value = initialProvider
    chat.sendMessage(initialPrompt)
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  revokePdfUrl()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
