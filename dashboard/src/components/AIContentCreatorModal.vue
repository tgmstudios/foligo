<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="close"></div>
      
      <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
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
          <div v-else-if="modeSelected" class="space-y-4 max-h-96 overflow-y-auto mb-4">
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
                <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
              </div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="flex items-center space-x-3 mb-4">
            <div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div class="rounded-lg px-4 py-2 bg-gray-700">
              <p class="text-sm text-gray-300">AI is typing...</p>
            </div>
          </div>

          <!-- Voice Mode ConvAI Widget -->
          <div v-if="selectedInteractionMode === 'voice' && modeSelected && !sessionDone" class="mb-4">
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
                agent-id="agent_1301k8emq0nzfwmbyta7254adhpv"
                :dynamic-variables="voiceVariables"
              ></elevenlabs-convai>
            </div>
          </div>

          <!-- Input (only show in text mode) -->
          <div v-if="selectedInteractionMode === 'text'" class="flex items-center space-x-3">
            <input
              v-model="currentMessage"
              @keyup.enter="sendMessage"
              :disabled="!canRespond"
              type="text"
              placeholder="Type your message..."
              class="flex-1 px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              @click="sendMessage"
              :disabled="!canRespond || !currentMessage.trim()"
              class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
import { ref, computed } from 'vue'
import api, { aiApi } from '@/services/api'

const props = defineProps<{
  mode: 'create' | 'edit'
  contentType?: 'BLOG' | 'PROJECT' | 'EXPERIENCE'
  initialInfo?: any
  currentContent?: string
}>()

const emit = defineEmits(['close', 'content-generated'])

const isOpen = ref(false)
const isLoading = ref(false)
const isTyping = ref(false)
const loadingMessage = ref('')
const messages = ref<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([])
const currentMessage = ref('')
const chatHistory = ref<Array<{ role: string; content: string }>>([])
const sessionDone = ref(false)
const modeSelected = ref(false)
const selectedInteractionMode = ref<'text' | 'voice'>('text')

const canRespond = computed(() => !isTyping.value && !sessionDone.value && modeSelected.value && selectedInteractionMode.value === 'text')

const voiceVariables = computed(() => {
  const projectId = (window as any).selectedProjectId || ''
  const contentType = props.contentType || 'BLOG'
  return JSON.stringify({
    user_project_id: projectId,
    content_type: contentType
  })
})

const open = () => {
  isOpen.value = true
  modeSelected.value = false
  selectedInteractionMode.value = 'text'
  messages.value = []
  currentMessage.value = ''
  chatHistory.value = []
  sessionDone.value = false
}

const close = () => {
  isOpen.value = false
  modeSelected.value = false
  messages.value = []
  currentMessage.value = ''
  chatHistory.value = []
  sessionDone.value = false
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
    loadingMessage.value = 'Preparing your content...'
    isLoading.value = true
    
    try {
      const response = await aiApi.post('/ai/session', {
        mode: 'edit',
        contentType: props.contentType || 'BLOG',
        initialInfo: props.initialInfo,
        chatHistory: []
      })
      
      messages.value.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.message
      })
      
      if (response.data.done) {
        sessionDone.value = true
        generateFinalContent()
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    } finally {
      isLoading.value = false
    }
  } else {
    // For create mode, start with first question
    loadingMessage.value = 'Starting conversation...'
    isLoading.value = true
    
    try {
      const response = await aiApi.post('/ai/session', {
        mode: 'create',
        contentType: props.contentType || 'BLOG',
        initialInfo: {},
        chatHistory: []
      })
      
      messages.value.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: response.data.message
      })
      
      if (response.data.done) {
        sessionDone.value = true
        generateFinalContent()
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    } finally {
      isLoading.value = false
    }
  }
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
  
  const messageToSend = currentMessage.value.trim()
  currentMessage.value = ''
  isTyping.value = true
  
  try {
    const response = await aiApi.post('/ai/session', {
      mode: props.mode,
      contentType: props.contentType || 'BLOG',
      initialInfo: props.initialInfo || {},
      chatHistory: chatHistory.value
    })
    
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: response.data.message
    }
    
    messages.value.push(assistantMessage)
    chatHistory.value.push({ role: 'assistant', content: response.data.message })
    
    if (response.data.done) {
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
    const response = await aiApi.post('/ai/generate', {
      mode: props.mode,
      contentType: props.contentType || 'BLOG',
      chatHistory: chatHistory.value,
      currentContent: props.currentContent || '',
      changes: ''
    })
    
    emit('content-generated', {
      content: response.data.content,
      title: response.data.title,
      metadata: response.data.metadata
    })
    
    close()
  } catch (error) {
    console.error('Failed to generate content:', error)
  } finally {
    isLoading.value = false
  }
}


// Expose open and close methods
defineExpose({ open, close })
</script>
