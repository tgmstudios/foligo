<template>
  <div class="p-6 h-[calc(100vh-3rem)]">
    <AgenticEditorLayout>
      <template #editor="{ sideBySide, previewOpen, togglePreview }">
        <DocumentEditor
          v-model="content"
          :saving="isSaving"
          @save="saveAndCompile"
        >
          <template #toolbar-extra>
            <button
              v-if="!sideBySide"
              @click="togglePreview"
              class="px-3 py-1 text-xs bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              {{ previewOpen ? 'Show editor' : 'Show preview' }}
            </button>
          </template>
        </DocumentEditor>
      </template>

      <template #preview="{ sideBySide, togglePreview }">
        <PreviewPane
          :pdf-url="pdfUrl"
          :compiling="compiling"
          :compile-error="compileError"
          :closable="!sideBySide"
          @recompile="saveAndCompile"
          @close="togglePreview"
        />
      </template>

      <template #history>
        <HistoryPanel
          :documents="documents"
          :active-id="documentId"
          :loading="isLoadingHistory"
          @select="handleSelectHistory"
          @delete="handleDeleteHistory"
          @new="handleNewDocument"
        />
      </template>

      <template #chat>
        <div class="flex flex-col flex-1 min-h-0">
          <div class="border-b border-gray-700 flex-shrink-0">
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

          <ChatSidebar
            :messages="chat.messages.value"
            :streaming="chat.streaming.value"
            @send="chat.sendMessage"
          />
        </div>
      </template>
    </AgenticEditorLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import AgenticEditorLayout from '@/components/agentic-editor/AgenticEditorLayout.vue'
import DocumentEditor from '@/components/agentic-editor/DocumentEditor.vue'
import PreviewPane from '@/components/agentic-editor/PreviewPane.vue'
import HistoryPanel from '@/components/agentic-editor/HistoryPanel.vue'
import ChatSidebar from '@/components/agentic-editor/ChatSidebar.vue'
import { useAgenticChat, API_URL } from '@/composables/useAgenticChat'
import { useResumeDocuments } from '@/composables/useResumeDocuments'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const {
  documents,
  isLoading: isLoadingHistory,
  isSaving,
  fetchDocuments,
  createDocument,
  loadDocument,
  updateDocument,
  deleteDocument,
  compileDocument,
} = useResumeDocuments()

const documentId = ref<string | null>(null)
const content = ref('')
const jobDescription = ref('')
const showJobDescription = ref(false)
const pdfUrl = ref<string | null>(null)
const compileError = ref<string | null>(null)
const awaitingCompile = ref(false)

const chat = useAgenticChat(
  () => `${API_URL}/resume/documents/${documentId.value}/chat`,
  {
    onDocumentUpdated: (newContent) => {
      content.value = newContent
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
  }
)

const compiling = computed(() => chat.streaming.value || awaitingCompile.value)

watch(chat.streaming, (isStreaming, wasStreaming) => {
  if (wasStreaming && !isStreaming) {
    awaitingCompile.value = true
  }
})

function revokePdfUrl() {
  // pdfUrl is always a blob: URL we created (see onCompiled/openDocument/saveAndCompile)
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
  }
}

// Construct the Blob's type explicitly rather than trusting it to be inferred
// correctly from the response's Content-Type — an <embed>/<iframe> shown a blob
// that isn't typed exactly "application/pdf" will offer a download instead of
// rendering inline (this is what caused compiling to "download" the PDF).
function toPdfObjectUrl(data: Blob): string {
  return URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
}

async function openDocument(id: string) {
  try {
    const doc = await loadDocument(id)
    documentId.value = doc.id
    content.value = doc.content
    jobDescription.value = doc.jobDescription || ''
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
    chat.loadHistory(doc.chatHistory || [])
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load resume')
    router.replace({ name: 'goapply-resume' })
  }
}

async function handleNewDocument() {
  const doc = await createDocument()
  router.push({ name: 'goapply-resume-doc', params: { id: doc.id } })
}

async function handleSelectHistory(id: string) {
  if (id === documentId.value) return
  router.push({ name: 'goapply-resume-doc', params: { id } })
}

async function handleDeleteHistory(id: string) {
  if (!confirm('Delete this resume? This cannot be undone.')) return
  await deleteDocument(id)
  if (id === documentId.value) {
    await handleNewDocument()
  }
}

async function persistJobDescription() {
  if (!documentId.value) return
  await updateDocument(documentId.value, { jobDescription: jobDescription.value })
}

async function saveAndCompile() {
  if (!documentId.value) return
  await updateDocument(documentId.value, { content: content.value })
  awaitingCompile.value = true
  const result = await compileDocument(documentId.value)
  awaitingCompile.value = false
  if ('error' in result) {
    compileError.value = result.error
  } else {
    revokePdfUrl()
    pdfUrl.value = result.pdfUrl
    compileError.value = null
  }
}

watch(() => route.params.id, (id) => {
  if (typeof id === 'string' && id !== documentId.value) {
    openDocument(id)
  }
})

onMounted(async () => {
  await fetchDocuments()
  const idFromRoute = route.params.id as string | undefined
  if (idFromRoute) {
    await openDocument(idFromRoute)
  } else {
    await handleNewDocument()
  }
})

onBeforeUnmount(() => {
  revokePdfUrl()
})
</script>
