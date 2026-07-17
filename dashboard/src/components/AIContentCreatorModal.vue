<template>
  <div v-if="isOpen" class="creator-overlay fixed inset-0 z-50 overflow-y-auto" :class="{ 'creator-overlay--complete': creationComplete }">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="creator-backdrop fixed inset-0 bg-black bg-opacity-75 transition-opacity"></div>
      
      <div class="creator-card inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full" :class="{ 'creator-card--complete': creationComplete }">
        <div v-if="creationComplete" class="creation-success" role="status" aria-live="polite">
          <div class="generation-orbit" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="status-line mt-7">
            <Transition name="status-drift" mode="out-in">
              <p :key="loadingMessage" class="text-sm font-medium text-purple-100">{{ loadingMessage }}</p>
            </Transition>
          </div>
          <div class="studio-portal mt-7" aria-hidden="true"><span></span></div>
        </div>
        <div v-else>
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 pt-6 pb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg leading-6 font-medium text-white">
                  {{ mode === 'edit' ? 'AI Content Editor' : 'AI Content Creator' }}
                </h3>
                <p class="text-sm text-purple-100">
                  {{ mode === 'edit' ? 'Edit your content with AI assistance' : 'Let\'s create amazing content together' }}
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="close"
              class="text-white hover:text-purple-200 transition-colors"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Chat Interface -->
        <div class="bg-gray-800 px-6 py-4">
          <div class="mb-4">
            <ChatSessionPicker
              :sessions="chatSessions.sessions.value"
              :active-session-id="chatSessions.activeSessionId.value"
              :loading="chatSessions.loadingSessions.value"
              :disabled="isTyping || isLoading"
              @select="openSavedChat"
              @new="newChat"
            />
          </div>
          <!-- Mode Selection -->
          <div v-if="!modeSelected && isOpen" class="space-y-4">
            <div class="text-center py-6">
              <h4 class="text-lg font-medium text-white mb-4">Choose your interaction mode</h4>
              <p class="text-sm text-gray-400 mb-6">How would you like to interact with the AI assistant?</p>
              
              <div class="grid grid-cols-2 gap-4">
                <button
                  @click="selectMode('text')"
                  class="p-6 border-2 border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-all"
                >
                  <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h5 class="font-medium text-white">Text Mode</h5>
                  <p class="text-sm text-gray-400 mt-1">Type your questions and responses</p>
                </button>
                
                <button
                  @click="selectMode('voice')"
                  class="p-6 border-2 border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-500/10 transition-all"
                >
                  <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <h5 class="font-medium text-white">Voice Mode</h5>
                  <p class="text-sm text-gray-400 mt-1">Speak your questions and responses</p>
                </button>
              </div>
            </div>
          </div>

          <!-- Loading / Streaming generation -->
          <div v-else-if="isLoading" class="py-4">
            <div class="generation-progress" role="status" aria-live="polite">
              <div class="generation-orbit" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="status-line">
                <Transition name="status-drift" mode="out-in">
                  <p :key="loadingMessage" class="text-sm text-gray-300">{{ loadingMessage }}</p>
                </Transition>
              </div>
            </div>
          </div>

          <!-- Chat Messages -->
          <div v-else-if="modeSelected" class="space-y-4 max-h-[600px] overflow-y-auto mb-4">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="[
                'flex items-start space-x-3',
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              ]"
            >
              <div :class="[
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                message.role === 'user' ? 'bg-purple-600' : 'bg-gray-700'
              ]">
                <svg v-if="message.role === 'assistant'" class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <svg v-else class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div :class="[
                'rounded-lg px-4 py-2 max-w-xs sm:max-w-md',
                message.role === 'user' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-white'
              ]">
                <template v-if="message.role === 'assistant'">
                  <details v-if="message.reasoning" class="mb-2 group" :open="isTyping && messages[messages.length - 1]?.id === message.id && !message.content">
                    <summary class="cursor-pointer text-xs text-gray-400 hover:text-gray-300 select-none flex items-center space-x-1">
                      <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Thinking</span>
                    </summary>
                    <p class="mt-1 text-xs text-gray-400 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-600 pl-2">{{ message.reasoning }}</p>
                  </details>

                  <div v-if="message.toolActivity?.length" class="mb-2 space-y-1">
                    <div
                      v-for="(tool, index) in message.toolActivity"
                      :key="`${tool.toolName}-${index}`"
                      class="flex items-center space-x-1.5 text-xs px-2 py-1 rounded-md border"
                      :class="tool.status === 'running' ? 'bg-gray-700/50 border-gray-600 text-gray-300' : tool.status === 'error' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-green-900/20 border-green-800 text-green-300'"
                    >
                      <svg v-if="tool.status === 'running'" class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path v-if="tool.status === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{{ toolLabel(tool.toolName, tool.status) }}</span>
                    </div>
                  </div>
                </template>
                <p v-if="message.content" class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
                <div v-else-if="message.role === 'assistant' && isTyping && messages[messages.length - 1]?.id === message.id && !message.reasoning && !message.toolActivity?.length" class="flex space-x-1.5 py-1">
                  <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Voice Mode ConvAI Widget -->
          <div v-if="selectedInteractionMode === 'voice' && modeSelected && !sessionDone && voiceAgentId" class="mb-4">
            <div class="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-2 border-purple-500/30 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-3">
                <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <h4 class="text-lg font-semibold text-white">Voice Assistant</h4>
              </div>
              <p class="text-sm text-gray-300 mb-4">Speak with our AI assistant to create your content:</p>
              
              <!-- ElevenLabs ConvAI Widget -->
              <elevenlabs-convai
                :agent-id="voiceAgentId"
                :dynamic-variables="voiceVariables"
              ></elevenlabs-convai>
            </div>
          </div>

          <!-- Input (only show in text mode) -->
          <div v-if="selectedInteractionMode === 'text'" class="flex items-end space-x-3">
            <textarea
              ref="messageTextarea"
              v-model="currentMessage"
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.enter.shift.exact="handleShiftEnter"
              @input="adjustTextareaHeight"
              :disabled="!canRespond"
              placeholder="Type your message... (Shift+Enter for new line)"
              rows="1"
              class="flex-1 px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 resize-none overflow-hidden min-h-[44px] max-h-[200px]"
              style="line-height: 1.5;"
            ></textarea>
            <button
              @click="sendMessage"
              :disabled="!canRespond || !currentMessage.trim()"
              class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed h-[44px]"
            >
              Send
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-800 px-6 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            @click="previewSuccessAnimation"
            :disabled="isLoading || isTyping || isPreviewing"
            class="inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Preview the completion animation"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Test animation
          </button>
          <button
            @click="close"
            class="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import api, { API_URL } from '@/services/api'
import ChatSessionPicker from '@/components/chat/ChatSessionPicker.vue'
import { useChatSessions } from '@/composables/useChatSessions'

const props = defineProps<{
  mode: 'create' | 'edit'
  contentType?: 'BLOG' | 'PROJECT' | 'EXPERIENCE' | 'SKILL'
  initialInfo?: any
  currentContent?: string
  projectId?: string
}>()

const inferredContentType = ref<'BLOG' | 'PROJECT' | 'EXPERIENCE' | 'SKILL' | undefined>(props.contentType)

const emit = defineEmits(['close', 'content-generated', 'content-created'])

const isOpen = ref(false)
const isLoading = ref(false)
const isTyping = ref(false)
const loadingMessage = ref('')
type ToolActivity = {
  toolCallId?: string
  toolName: string
  status: 'running' | 'done' | 'error'
  input?: unknown
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  toolActivity?: ToolActivity[]
}

const messages = ref<ChatMessage[]>([])
const currentMessage = ref('')
const chatHistory = ref<Array<{ role: string; content: string }>>([])
const chatSessions = useChatSessions('content-creator', () => props.projectId)
const messageTextarea = ref<HTMLTextAreaElement | null>(null)
const sessionDone = ref(false)
const modeSelected = ref(false)
const selectedInteractionMode = ref<'text' | 'voice'>('text')
const voiceAgentId = ref('')
const creationComplete = ref(false)
const isPreviewing = ref(false)
let previewRun = 0

const canRespond = computed(() => !isTyping.value && !sessionDone.value && modeSelected.value && selectedInteractionMode.value === 'text')

const TOOL_LABELS: Record<string, { done: string; error: string }> = {
  signalContentReadyForGeneration: { done: 'Content brief completed', error: 'Content brief failed' },
  signalEditReadyForGeneration: { done: 'Edit brief completed', error: 'Edit brief failed' },
  fetchExistingPost: { done: 'Existing post fetched', error: 'Post fetch failed' },
}

const toolLabel = (toolName: string, status: 'running' | 'done' | 'error') => {
  const labels = TOOL_LABELS[toolName]
  if (labels && status !== 'running') return labels[status]
  const readableName = toolName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
  if (status === 'running') return `Running ${readableName}…`
  return status === 'error' ? `${readableName} failed` : `${readableName} completed`
}

const streamSession = async (payload: Record<string, unknown>) => {
  const assistantMessage: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role: 'assistant',
    content: '',
    reasoning: '',
    toolActivity: []
  }
  messages.value.push(assistantMessage)
  const message = messages.value[messages.value.length - 1]
  const token = localStorage.getItem('auth_token')
  const response = await fetch(`${API_URL}/ai/session/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  })
  if (!response.ok || !response.body) throw new Error(`Request failed (${response.status})`)

  let sessionResult: any = null
  let buffer = ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() || ''
    for (const frame of frames) {
      const line = frame.split('\n').find(item => item.startsWith('data: '))
      if (!line) continue
      const event = JSON.parse(line.slice(6))
      if (event.type === 'text-delta') message.content += event.text || ''
      else if (event.type === 'reasoning-delta') message.reasoning = (message.reasoning || '') + (event.text || '')
      else if (event.type === 'tool-call') {
        message.toolActivity!.push({ toolCallId: event.toolCallId, toolName: event.toolName, input: event.input, status: 'running' })
      } else if (event.type === 'tool-result' || event.type === 'tool-error') {
        const tool = message.toolActivity!.find(item => item.toolCallId === event.toolCallId)
        if (tool) tool.status = event.type === 'tool-error' ? 'error' : 'done'
      } else if (event.type === 'session-done') sessionResult = event
      else if (event.type === 'error') throw new Error(event.message || 'AI stream failed')
    }
  }
  return sessionResult || { done: false }
}

const voiceVariables = computed(() => {
  const projectId = (window as any).selectedProjectId || ''
  const contentType = props.contentType || 'BLOG'
  return JSON.stringify({
    user_project_id: projectId,
    content_type: contentType
  })
})

async function loadVoiceConfig() {
  try {
    const response = await api.get('/ai/voice-config')
    voiceAgentId.value = response.data.voice?.agentId || ''
  } catch {
    voiceAgentId.value = ''
  }
}

onMounted(loadVoiceConfig)

const open = async () => {
  isOpen.value = true
  await chatSessions.refresh()
  await newChat()
  // Reset textarea height
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.style.height = 'auto'
    }
  })
}

const newChat = async () => {
  await chatSessions.create({ mode: props.mode, contentType: props.contentType })
  modeSelected.value = false
  selectedInteractionMode.value = 'text'
  messages.value = []
  currentMessage.value = ''
  chatHistory.value = []
  sessionDone.value = false
  creationComplete.value = false
}

const openSavedChat = async (id: string) => {
  const session = await chatSessions.open(id)
  chatHistory.value = Array.isArray(session.chatHistory) ? session.chatHistory : []
  messages.value = chatHistory.value.map((message) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role: message.role as 'user' | 'assistant',
    content: message.content,
  }))
  inferredContentType.value = session.metadata?.contentType || props.contentType
  selectedInteractionMode.value = 'text'
  modeSelected.value = true
  sessionDone.value = false
  creationComplete.value = false
}

const persistChat = async () => {
  chatHistory.value = messages.value
    .filter(message => message.content)
    .map(message => ({ role: message.role, content: message.content }))
  try {
    await chatSessions.save(chatHistory.value, { mode: props.mode, contentType: inferredContentType.value || props.contentType })
  } catch (error) {
    console.error('Failed to save chat history:', error)
  }
}

const close = () => {
  previewRun += 1
  isOpen.value = false
  modeSelected.value = false
  messages.value = []
  currentMessage.value = ''
  chatHistory.value = []
  sessionDone.value = false
  creationComplete.value = false
  isPreviewing.value = false
  // Reset textarea height
  if (messageTextarea.value) {
    messageTextarea.value.style.height = 'auto'
  }
}

const previewSuccessAnimation = async () => {
  const run = ++previewRun
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  isPreviewing.value = true
  isLoading.value = false
  loadingMessage.value = 'Loading your latest post…'
  creationComplete.value = true
  generatingText.value = ''

  try {
    if (!props.projectId) throw new Error('Select a project before testing the animation.')
    const response = await api.get(`/projects/${props.projectId}/content`)
    const contentItems = Array.isArray(response.data) ? response.data : []
    const posts = contentItems.filter((item: any) =>
      item.content && (item.contentType === 'BLOG' || item.type === 'BLOG')
    )
    const candidates = posts.length ? posts : contentItems.filter((item: any) => item.content)
    const latestPost = [...candidates].sort((a: any, b: any) =>
      new Date(b.createdAt || b.updatedAt || 0).getTime() -
      new Date(a.createdAt || a.updatedAt || 0).getTime()
    )[0]

    if (!latestPost) throw new Error('Create a post first, then test the animation.')
    const sourceText = latestPost.content as string
    loadingMessage.value = 'Opening the latest post in Editor Studio…'
    if (run !== previewRun) return
    isLoading.value = false
    sessionStorage.setItem(
      `ai-content-handoff:${latestPost.id}`,
      JSON.stringify({ content: sourceText, animate: true, createdAt: Date.now() })
    )

    await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 120 : 850))
    if (run !== previewRun) return
    emit('content-created', { id: latestPost.id, content: sourceText, preview: true })
  } catch (error: any) {
    console.error('Failed to preview the latest post animation:', error)
    creationComplete.value = false
    const message = error.response?.data?.message || error.message || 'Unable to load the latest post.'
    messages.value.push({
      id: `${Date.now()}-preview-error`,
      role: 'assistant',
      content: message,
    })
    modeSelected.value = true
    isLoading.value = false
    generatingText.value = ''
    isPreviewing.value = false
  }
}

const selectMode = async (mode: 'text' | 'voice') => {
  selectedInteractionMode.value = mode
  modeSelected.value = true
  
  if (mode === 'voice') {
    await startVoiceSession()
  } else {
    initializeSession()
  }
}

const initializeSession = async () => {
  if (props.mode === 'edit') {
    // For edit mode, start with existing content info
    isTyping.value = true
    
    try {
      const result = await streamSession({
        mode: 'edit',
        contentType: props.contentType || 'BLOG',
        initialInfo: props.initialInfo,
        chatHistory: [],
        projectId: props.projectId
      })
      
      if (result.done) {
        sessionDone.value = true
        generateFinalContent()
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    } finally {
      await persistChat()
      isTyping.value = false
    }
  } else {
    // For create mode, start with first question
    isTyping.value = true
    
    try {
      const result = await streamSession({
        mode: 'create',
        contentType: props.contentType,
        initialInfo: {},
        chatHistory: [],
        projectId: props.projectId
      })
      
      // Update inferred content type if it was determined
      if (result.contentType) {
        inferredContentType.value = result.contentType
      }

      if (result.done) {
        sessionDone.value = true
        generateFinalContent()
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    } finally {
      await persistChat()
      isTyping.value = false
    }
  }
}

const adjustTextareaHeight = () => {
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.style.height = 'auto'
      const scrollHeight = messageTextarea.value.scrollHeight
      const maxHeight = 200 // max-h-[200px]
      messageTextarea.value.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  })
}

const handleShiftEnter = () => {
  // Allow default behavior (new line) when Shift+Enter is pressed
  adjustTextareaHeight()
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isTyping.value) return
  
  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    content: currentMessage.value.trim()
  }
  
  messages.value.push(userMessage)
  chatHistory.value.push({ role: 'user', content: userMessage.content })
  
  currentMessage.value = ''
  
  // Reset textarea height
  if (messageTextarea.value) {
    messageTextarea.value.style.height = 'auto'
  }
  
  isTyping.value = true
  
  try {
    const result = await streamSession({
      mode: props.mode,
      contentType: inferredContentType.value || props.contentType,
      initialInfo: props.initialInfo || {},
      chatHistory: chatHistory.value,
      projectId: props.projectId
    })
    
    // Update inferred content type if it was determined
    if (result.contentType) {
      inferredContentType.value = result.contentType
    }

    if (result.done) {
      sessionDone.value = true
      await generateFinalContent()
    }
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
    await persistChat()
    isTyping.value = false
  }
}

const startVoiceSession = async () => {
  // Get the project ID from the global store
  const projectId = (window as any).selectedProjectId
  
  if (!projectId) {
    alert('Please select a project first')
    close()
    return
  }
  
  // Store the session info so we can pick up the webhook response
  ;(window as any).activeVoiceSession = {
    projectId,
    contentType: props.contentType || 'BLOG',
    callback: (data: any) => {
      emit('content-generated', data)
      close()
    }
  }
  
  // The voice mode UI will show the phone number - don't close the modal
  // User can close it themselves after calling
}

const generatingText = ref('')

const generateFinalContent = async () => {
  isLoading.value = false
  loadingMessage.value = 'Preparing the model with your conversation…'
  generatingText.value = ''
  creationComplete.value = true
  const studioTransitionStartedAt = Date.now()
  const liveGenerationId = `ai-live-${crypto.randomUUID()}`
  sessionStorage.setItem(`ai-content-live:${liveGenerationId}`, JSON.stringify({ content: '', status: loadingMessage.value }))

  try {
    const finalContentType = inferredContentType.value || props.contentType || 'BLOG'
    const token = localStorage.getItem('auth_token')

    const response = await fetch(`${API_URL}/ai/create/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        mode: props.mode,
        contentType: finalContentType,
        chatHistory: chatHistory.value,
        currentContent: props.currentContent || '',
        changes: '',
        projectId: props.projectId
      })
    })

    if (!response.ok || !response.body) throw new Error(`Request failed (${response.status})`)

    // Enter Studio while the API stream is still active. This component's
    // reader continues after the dashboard layout unmounts and bridges updates
    // through a window event plus sessionStorage for race-free startup.
    const initialTransition = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 500
    const elapsedTransition = Date.now() - studioTransitionStartedAt
    if (elapsedTransition < initialTransition) {
      await new Promise((resolve) => window.setTimeout(resolve, initialTransition - elapsedTransition))
    }
    emit('content-created', { id: liveGenerationId, content: undefined, live: true })

    let contentId: string | null = null
    let cleanedContent = ''
    let reasoningBuffer = ''
    let lastReasoningPaint = 0
    let visibleMarkdown = ''
    let buffer = ''
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split('\n\n')
      buffer = frames.pop() || ''
      for (const frame of frames) {
        const line = frame.split('\n').find(l => l.startsWith('data: '))
        if (!line) continue
        const event = JSON.parse(line.slice(6))
        if (event.type === 'text-delta') {
          generatingText.value += event.text || ''
          visibleMarkdown = generatingText.value.split(/<structured_data>/i)[0]
          const liveDetail = { generationId: liveGenerationId, type: 'content', content: visibleMarkdown }
          sessionStorage.setItem(`ai-content-live:${liveGenerationId}`, JSON.stringify({ content: visibleMarkdown, status: loadingMessage.value }))
          window.dispatchEvent(new CustomEvent('ai-content-live', { detail: liveDetail }))
        } else if (event.type === 'reasoning-delta') {
          reasoningBuffer += event.text || ''
          const now = Date.now()
          if (now - lastReasoningPaint > 600) {
            const normalizedThought = reasoningBuffer.replace(/\s+/g, ' ').trim()
            const sentences = normalizedThought.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []
            const conciseThought = sentences.slice(-2).join(' ').trim().slice(-280)
            if (conciseThought) {
              loadingMessage.value = `Thinking · ${conciseThought}`
              window.dispatchEvent(new CustomEvent('ai-content-live', {
                detail: { generationId: liveGenerationId, type: 'status', status: loadingMessage.value }
              }))
            }
            lastReasoningPaint = now
          }
        } else if (event.type === 'status') {
          loadingMessage.value = event.message
          window.dispatchEvent(new CustomEvent('ai-content-live', {
            detail: { generationId: liveGenerationId, type: 'status', status: event.message }
          }))
        } else if (event.type === 'content-created') {
          contentId = event.id
          cleanedContent = event.content || ''
          loadingMessage.value = 'Opening your finished draft…'
        } else if (event.type === 'error') {
          throw new Error(event.message || 'Stream failed')
        }
      }
    }

    if (contentId) {
      isLoading.value = false
      sessionStorage.removeItem(`ai-content-live:${liveGenerationId}`)
      window.dispatchEvent(new CustomEvent('ai-content-live', {
        detail: { generationId: liveGenerationId, type: 'complete', id: contentId, content: cleanedContent }
      }))
    } else {
      throw new Error('No content ID received from stream')
    }
  } catch (error) {
    console.error('Failed to create content:', error)
    creationComplete.value = false
    isLoading.value = false
    loadingMessage.value = 'Failed to create content. Please try again.'
    sessionStorage.removeItem(`ai-content-live:${liveGenerationId}`)
    window.dispatchEvent(new CustomEvent('ai-content-live', {
      detail: {
        generationId: liveGenerationId,
        type: 'error',
        message: error instanceof Error ? error.message : loadingMessage.value
      }
    }))
  } finally {
    if (!creationComplete.value) {
      isLoading.value = false
      generatingText.value = ''
    }
  }
}


// Expose open and close methods
defineExpose({ open, close })
</script>

<style scoped>
.creator-card { transform-origin: center; }
.creator-backdrop { transition: background-color 700ms ease, backdrop-filter 700ms ease; }
.creator-overlay--complete .creator-backdrop { background-color: rgb(3 7 18 / 0.92); backdrop-filter: blur(12px); }
.creator-card--complete { width: min(30rem, calc(100vw - 2rem)); border-radius: 1.75rem; background: radial-gradient(circle at 50% 15%, rgb(124 58 237 / 0.25), transparent 45%), #111827; animation: card-morph 700ms cubic-bezier(.2,.9,.2,1) both; }
.creation-success { min-height: 28rem; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; text-align: center; }
.generation-progress { min-height: 18rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.75rem; text-align: center; }
.generation-orbit { position: relative; width: 5rem; height: 5rem; border: 1px solid rgb(139 92 246 / .35); border-radius: 9999px; animation: generation-breathe 1.8s ease-in-out infinite; }
.generation-orbit::before { content: ''; position: absolute; inset: .65rem; border-radius: 9999px; background: radial-gradient(circle, rgb(168 85 247 / .55), rgb(59 130 246 / .08) 65%, transparent 70%); filter: blur(2px); }
.generation-orbit span { position: absolute; top: 50%; left: 50%; width: .45rem; height: .45rem; margin: -.225rem; border-radius: 9999px; background: #d8b4fe; box-shadow: 0 0 12px #a855f7; animation: generation-orbit 1.65s linear infinite; }
.generation-orbit span:nth-child(2) { animation-delay: -.55s; }
.generation-orbit span:nth-child(3) { animation-delay: -1.1s; }
.status-line { min-height: 3.5rem; width: min(36rem, 92%); overflow: hidden; display: flex; align-items: center; justify-content: center; line-height: 1.45; }
.status-drift-enter-active, .status-drift-leave-active { transition: opacity 280ms ease, transform 280ms ease; }
.status-drift-enter-from { opacity: 0; transform: translateY(.8rem); }
.status-drift-leave-to { opacity: 0; transform: translateY(-.8rem); }
.success-orbit { position: relative; width: 7rem; height: 7rem; display: grid; place-items: center; }
.success-orbit::before { content: ''; position: absolute; inset: -.65rem; border: 1px solid rgb(168 85 247 / .3); border-radius: 9999px; animation: orbit-pulse 1.4s ease-out infinite; }
.success-check { width: 6rem; height: 6rem; filter: drop-shadow(0 0 20px rgb(139 92 246 / .5)); }
.success-check__circle { stroke: #8b5cf6; stroke-width: 2; stroke-dasharray: 145; stroke-dashoffset: 145; animation: draw-line 550ms 180ms ease-out forwards; }
.success-check__tick { stroke: #fff; stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 42; stroke-dashoffset: 42; animation: draw-line 380ms 620ms ease-out forwards; }
.success-spark { position: absolute; width: .45rem; height: .45rem; border-radius: 9999px; background: #c084fc; box-shadow: 0 0 12px #a855f7; animation: spark 850ms ease-out both; }
.success-spark--one { --x: -4.6rem; --y: -3rem; }
.success-spark--two { --x: 4.8rem; --y: -1.7rem; animation-delay: 100ms; }
.success-spark--three { --x: 3.2rem; --y: 4rem; animation-delay: 180ms; }
.studio-portal { width: 11rem; height: .3rem; overflow: hidden; border-radius: 9999px; background: rgb(55 65 81); }
.studio-portal span { display: block; width: 100%; height: 100%; transform-origin: left; background: linear-gradient(90deg, #7c3aed, #60a5fa, #fff); animation: portal-fill 1.25s 150ms cubic-bezier(.2,.8,.2,1) both; }
@keyframes card-morph { from { opacity: .7; transform: scale(.96); border-radius: .5rem; } to { opacity: 1; transform: scale(1); border-radius: 1.75rem; } }
@keyframes draw-line { to { stroke-dashoffset: 0; } }
@keyframes orbit-pulse { 0% { opacity: 0; transform: scale(.75); } 45% { opacity: 1; } 100% { opacity: 0; transform: scale(1.2); } }
@keyframes spark { from { opacity: 0; transform: translate(0, 0) scale(.2); } 45% { opacity: 1; } to { opacity: 0; transform: translate(var(--x), var(--y)) scale(1); } }
@keyframes portal-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes generation-orbit { from { transform: rotate(0deg) translateX(2.5rem) rotate(0deg); } to { transform: rotate(360deg) translateX(2.5rem) rotate(-360deg); } }
@keyframes generation-breathe { 0%, 100% { transform: scale(.94); opacity: .7; } 50% { transform: scale(1.04); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .creator-card--complete, .success-orbit::before, .success-check__circle, .success-check__tick, .success-spark, .studio-portal span, .generation-orbit, .generation-orbit span { animation-duration: 1ms; animation-delay: 0ms; } .status-drift-enter-active, .status-drift-leave-active { transition-duration: 1ms; } }
</style>
