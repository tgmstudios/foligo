<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity"></div>
      
      <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
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

          <!-- Loading -->
          <div v-else-if="isLoading" class="text-center py-8">
            <div class="inline-flex items-center space-x-2">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span class="text-gray-400">{{ loadingMessage }}</span>
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
        <div class="bg-gray-800 px-6 py-4 flex justify-end space-x-3">
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
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import api, { aiApi, API_URL } from '@/services/api'

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
const messageTextarea = ref<HTMLTextAreaElement | null>(null)
const sessionDone = ref(false)
const modeSelected = ref(false)
const selectedInteractionMode = ref<'text' | 'voice'>('text')
const voiceAgentId = ref('')

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

const open = () => {
  isOpen.value = true
  modeSelected.value = false
  selectedInteractionMode.value = 'text'
  messages.value = []
  currentMessage.value = ''
  chatHistory.value = []
  sessionDone.value = false
  // Reset textarea height
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.style.height = 'auto'
    }
  })
}

const close = () => {
  isOpen.value = false
  modeSelected.value = false
  messages.value = []
  currentMessage.value = ''
  chatHistory.value = []
  sessionDone.value = false
  // Reset textarea height
  if (messageTextarea.value) {
    messageTextarea.value.style.height = 'auto'
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

    const assistantMessage = messages.value[messages.value.length - 1]
    chatHistory.value.push({ role: 'assistant', content: assistantMessage.content })
    
    if (result.done) {
      sessionDone.value = true
      await generateFinalContent()
    }
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
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

const generateFinalContent = async () => {
  isLoading.value = true
  loadingMessage.value = 'Generating your content...'
  
  try {
    const finalContentType = inferredContentType.value || props.contentType || 'BLOG'
    
    // Call the new /ai/create endpoint that generates and creates in one step
    const response = await aiApi.post('/ai/create', {
      mode: props.mode,
      contentType: finalContentType,
      chatHistory: chatHistory.value,
      currentContent: props.currentContent || '',
      changes: '',
      projectId: props.projectId
    })
    
    console.log('[AIContentCreatorModal] Content created:', {
      contentId: response.data.id,
      hasContent: !!response.data.content
    })
    
    // Emit the created content with its ID
    emit('content-created', {
      id: response.data.id,
      content: response.data.content
    })
    
    close()
  } catch (error) {
    console.error('Failed to create content:', error)
    loadingMessage.value = 'Failed to create content. Please try again.'
  } finally {
    isLoading.value = false
  }
}


// Expose open and close methods
defineExpose({ open, close })
</script>
