
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
        show-preview-toggle
        :side-by-side="sideBySide"
        :preview-open="previewOpen"
        @back="goBack"
        @save="saveDocument(content)"
        @toggle-focus="focusMode = !focusMode"
        @open-history="showHistory = true"
        @open-meta="showMeta = true"
        @toggle-preview="togglePreview"
      />
    </template>

    <template #editor>
      <div class="relative h-full">
        <Transition name="draft-arrival">
          <div
            v-if="isReceivingContent"
            class="pointer-events-none absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-gray-950/85 px-3 py-1.5 text-xs font-medium text-purple-200 shadow-lg backdrop-blur"
          >
            <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400"></span>
            {{ liveStatus || 'AI draft arriving' }}
          </div>
        </Transition>
        <MarkdownCodeEditor
          ref="editorRef"
          class="h-full"
          :model-value="content"
          :project-id="projectId"
          :saving="isSaving"
          @update:model-value="onContentInput"
          @scroll-position="editorScrollPosition = $event"
          @save="saveDocument"
        />
      </div>
    </template>

    <template #preview>
      <MarkdownPreview :content="content" :editor-scroll-position="editorScrollPosition" />
    </template>

    <template #chat>
      <StudioChatSidebar
        v-model="selectedProvider"
        :messages="chat.messages.value"
        :streaming="chat.streaming.value"
        :queue="chat.queue.value"
        :sessions="chatSessions.sessions.value"
        :active-session-id="chatSessions.activeSessionId.value"
        :sessions-loading="chatSessions.loadingSessions.value"
        placeholder="Ask the agent to edit this content…"
        empty-state-text="Ask the agent to draft a section, restructure the post, or tweak wording — it'll edit the document directly."
        @send="chat.sendMessage"
        @stop="chat.stop"
        @interrupt-send="chat.sendNow"
        @remove-queued="chat.removeFromQueue"
        @select-session="selectChatSession"
        @new-session="newChatSession"
      />
    </template>

    <template #left-toolbar>
      <StudioLeftToolbar
        :adapter="adapter"
        :document-id="documentId"
        :project-id="projectId"
        show-insert-menu
        @switch-document="(id) => router.push({ name: 'studio-content', params: { projectId, id } })"
        @format-h1="editorRef?.setLinePrefix('# ')"
        @format-h2="editorRef?.setLinePrefix('## ')"
        @format-h3="editorRef?.setLinePrefix('### ')"
        @format-bold="editorRef?.wrapSelection('**', '**', 'bold text')"
        @format-italic="editorRef?.wrapSelection('*', '*', 'italic text')"
        @format-link="editorRef?.wrapSelection('[', '](url)', 'link text')"
        @format-ul="editorRef?.setLinePrefix('- ')"
        @format-ol="editorRef?.setLinePrefix('1. ')"
        @format-quote="editorRef?.setLinePrefix('> ')"
        @format-code="editorRef?.wrapSelection('`', '`', 'code')"
        @format-codeblock="editorRef?.insertCodeBlock()"
        @format-table="editorRef?.insertTable()"
        @insert-mermaid="insertMermaidTemplate"
        @open-drawio="openDrawIO"
        @insert-emoji="(emoji) => editorRef?.insertText(emoji)"
      />
    </template>
  </StudioShell>

  <RevisionHistoryPopup
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

  <DrawIOEditor
    :is-open="showDrawIO"
    :project-id="projectId"
    :diagram-xml="editingDiagram?.xml"
    :existing-image-url="editingDiagram?.imageUrl"
    @close="showDrawIO = false"
    @diagram-saved="onDiagramSaved"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useToast } from 'vue-toastification'
import StudioShell from '@/components/studio/StudioShell.vue'
import StudioHeader from '@/components/studio/StudioHeader.vue'
import RevisionHistoryPopup from '@/components/studio/RevisionHistoryPopup.vue'
import MetaEditorPopover from '@/components/studio/MetaEditorPopover.vue'
import StudioChatSidebar from '@/components/studio/StudioChatSidebar.vue'
import StudioLeftToolbar from '@/components/studio/StudioLeftToolbar.vue'
import MarkdownCodeEditor, { type DiagramAtCursor } from '@/components/editor/MarkdownCodeEditor.vue'
import MarkdownPreview from '@/components/studio/MarkdownPreview.vue'
import DrawIOEditor from '@/components/editor/DrawIOEditor.vue'
import { useAgenticChat } from '@/composables/useAgenticChat'
import { useChatSessions } from '@/composables/useChatSessions'
import { createContentAdapter } from '@/studio/adapters/content'
import type { Content } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const projectId = route.params.projectId as string
const adapter = createContentAdapter(projectId)

const documentId = ref<string>(route.params.id as string)
const documentTitle = ref('Untitled')
const content = ref('')
const isSaving = ref(false)
const dirty = ref(false)
const focusMode = ref(false)
const showHistory = ref(false)
const showMeta = ref(false)
const showDrawIO = ref(false)
const loadedDoc = ref<Content | null>(null)
const selectedProvider = ref<string | undefined>(undefined)
const editorRef = ref<InstanceType<typeof MarkdownCodeEditor>>()
const editingDiagram = ref<DiagramAtCursor | null>(null)
const editorScrollPosition = ref({ line: 1, lineProgress: 0 })
const isReceivingContent = ref(false)
const liveStatus = ref('')
let arrivalRun = 0

// The Studio shell's generic media picker (left toolbar) normally just
// copies a URL to the clipboard — for content, we can do better since the
// mounted editor is right here: insert the image/video/file link directly.
adapter.onMediaSelected = (media) => {
  const markdown = media.url.match(/\.(png|jpe?g|gif|webp|svg)(\?|$)/i)
    ? `![${media.filename}](${media.url})`
    : `[${media.filename}](${media.url})`
  editorRef.value?.insertText(markdown)
}

const chatSessions = useChatSessions('studio-content', () => documentId.value)

const chat = useAgenticChat(
  () => adapter.getChatUrl!(documentId.value),
  {
    onDocumentUpdated: (newContent) => {
      content.value = newContent
      dirty.value = false
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

async function loadChatSessions() {
  const sessions = await chatSessions.refresh()
  if (sessions.length) await selectChatSession(sessions[0].id)
  else await newChatSession()
}

function onContentInput(value: string) {
  content.value = value
  dirty.value = true
}

function insertMermaidTemplate() {
  editorRef.value?.insertText(
    '\n```mermaid\ngraph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action 1]\n    B -->|No| D[Action 2]\n    C --> E[End]\n    D --> E\n```\n'
  )
}

function openDrawIO() {
  editingDiagram.value = editorRef.value?.getDiagramAtCursor() ?? null
  showDrawIO.value = true
}

function onDiagramSaved(data: { imageUrl: string; xml: string; isEdit: boolean }) {
  showDrawIO.value = false
  const filename = data.imageUrl.split('/').pop() || 'diagram.png'
  const encodedXml = btoa(unescape(encodeURIComponent(data.xml)))
  const markdown = `![${filename}](${data.imageUrl})\n\n\`\`\`drawio\n${encodedXml}\n\`\`\`\n`
  if (editingDiagram.value) {
    editorRef.value?.replaceDiagramAt(editingDiagram.value.range, markdown)
  } else {
    editorRef.value?.insertText(markdown)
  }
  editingDiagram.value = null
}

async function openDocument(id: string) {
  try {
    const doc = await adapter.loadDocument(id)
    loadedDoc.value = doc
    documentId.value = doc.id
    documentTitle.value = doc.title
    const handoffKey = `ai-content-handoff:${id}`
    const rawHandoff = sessionStorage.getItem(handoffKey)
    sessionStorage.removeItem(handoffKey)
    const handoff = rawHandoff ? JSON.parse(rawHandoff) as { content?: string; animate?: boolean; createdAt?: number } : null
    const freshHandoff = handoff?.animate && Date.now() - (handoff.createdAt || 0) < 60_000

    if (freshHandoff) {
      await revealGeneratedContent(handoff?.content || doc.content)
    } else {
      content.value = doc.content
    }
    dirty.value = false
    await loadChatSessions()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load content')
    goBack()
  }
}

async function revealGeneratedContent(generatedContent: string) {
  const run = ++arrivalRun
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  isReceivingContent.value = true
  content.value = ''
  const chunkSize = reduceMotion ? generatedContent.length : Math.max(3, Math.ceil(generatedContent.length / 90))

  for (let index = 0; index < generatedContent.length; index += chunkSize) {
    if (run !== arrivalRun) return
    content.value = generatedContent.slice(0, index + chunkSize)
    await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 1 : 14))
  }

  content.value = generatedContent
  isReceivingContent.value = false
}

function handleLiveGeneration(event: Event) {
  const detail = (event as CustomEvent).detail
  if (!detail || detail.generationId !== documentId.value) return

  if (detail.type === 'content') {
    content.value = detail.content || ''
    isReceivingContent.value = true
  } else if (detail.type === 'status') {
    liveStatus.value = detail.status || ''
  } else if (detail.type === 'complete') {
    content.value = detail.content || content.value
    isReceivingContent.value = false
    const realId = detail.id as string
    documentId.value = realId
    router.replace({ name: 'studio-content', params: { projectId, id: realId } })
    openDocument(realId)
  } else if (detail.type === 'error') {
    isReceivingContent.value = false
    toast.error(detail.message || 'AI generation failed')
    router.replace({ name: 'portfolio-detail', params: { id: projectId } })
  }
}

function openLiveDocument(id: string) {
  documentTitle.value = 'AI draft'
  isReceivingContent.value = true
  const cached = sessionStorage.getItem(`ai-content-live:${id}`)
  if (cached) {
    const state = JSON.parse(cached)
    content.value = state.content || ''
    liveStatus.value = state.status || ''
  }
}

async function saveDocument(value: string) {
  isSaving.value = true
  try {
    content.value = value
    await adapter.saveDocument(documentId.value, { content: value }, 'manual')
    dirty.value = false
    toast.success('Saved')
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to save content')
  } finally {
    isSaving.value = false
  }
}

function onRevisionRestored(restoredContent: string) {
  content.value = restoredContent
  dirty.value = false
}

function goBack() {
  router.push({
    name: 'content-editor',
    params: { projectId, id: documentId.value },
  })
}

function confirmDiscardChanges(): boolean {
  if (!dirty.value) return true
  return window.confirm('You have unsaved changes. Leave without saving?')
}

onBeforeRouteLeave(() => confirmDiscardChanges())
onBeforeRouteUpdate((to, from) => {
  if (to.params.id !== from.params.id) return confirmDiscardChanges()
})

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

// Refetch if this exact post was changed elsewhere (e.g. the AI Content
// Creator, a different chat entirely) — but don't clobber in-progress local
// edits; just let the user know instead.
function handleDataChanged(event: Event) {
  const detail = (event as CustomEvent).detail as { kind?: string; postId?: string } | undefined
  if (detail?.kind !== 'post' || detail.postId !== documentId.value) return
  if (dirty.value) {
    toast.info('This post was updated elsewhere. Save or discard your changes, then reload to see the latest version.')
    return
  }
  openDocument(documentId.value)
}

onMounted(() => {
  window.addEventListener('ai-content-live', handleLiveGeneration)
  if (documentId.value.startsWith('ai-live-')) openLiveDocument(documentId.value)
  else openDocument(documentId.value)
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('foligo-data-changed', handleDataChanged)
})

onBeforeUnmount(() => {
  arrivalRun += 1
  window.removeEventListener('ai-content-live', handleLiveGeneration)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('foligo-data-changed', handleDataChanged)
})
</script>

<style scoped>
.draft-arrival-enter-active,
.draft-arrival-leave-active { transition: opacity 220ms ease, transform 220ms ease; }
.draft-arrival-enter-from,
.draft-arrival-leave-to { opacity: 0; transform: translateY(-6px) scale(.96); }
</style>
