<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="closeModal"></div>
      
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-6 pb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg leading-6 font-medium text-white">
                  AI Content Assistant
                </h3>
                <p class="text-sm text-blue-100">
                  Let's create amazing {{ contentType.toLowerCase() }} content together
                </p>
              </div>
            </div>
            <button
              type="button"
              @click="closeModal"
              class="text-white hover:text-blue-200 transition-colors"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Chat Interface -->
        <div class="bg-white px-6 py-4">
          <!-- Initial Questions Phase -->
          <div v-if="phase === 'questions'" class="space-y-4">
            <div class="text-center py-4">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 class="text-lg font-medium text-gray-900 mb-2">Let's get to know your content better</h4>
              <p class="text-gray-600">I'll ask a few questions to help create the perfect {{ contentType.toLowerCase() }} for you.</p>
            </div>

            <!-- Questions List -->
            <div v-if="questions.length > 0" class="space-y-3">
              <div
                v-for="(question, index) in questions"
                :key="index"
                class="p-4 bg-gray-50 rounded-lg"
              >
                <div class="flex items-start space-x-3">
                  <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-white text-sm font-medium">{{ index + 1 }}</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-gray-900 font-medium mb-2">{{ question }}</p>
                    <textarea
                      v-model="answers[index]"
                      :placeholder="`Your answer for question ${index + 1}...`"
                      rows="2"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading Questions -->
            <div v-else-if="loadingQuestions" class="text-center py-8">
              <div class="inline-flex items-center space-x-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span class="text-gray-600">Generating questions...</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4">
              <button
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                @click="generateContent"
                :disabled="!canGenerateContent || isGenerating"
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span v-if="isGenerating" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                <span>{{ isGenerating ? 'Generating...' : 'Generate Content' }}</span>
              </button>
            </div>
          </div>

          <!-- Chat Phase -->
          <div v-else-if="phase === 'chat'" class="space-y-4">
            <!-- Chat Messages -->
            <div class="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-4">
              <div
                v-for="message in messages"
                :key="message.id"
                :class="[
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                ]"
              >
                <div
                  :class="[
                    'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  ]"
                >
                  <p class="text-sm">{{ message.content }}</p>
                </div>
              </div>
              
              <!-- Typing Indicator -->
              <div v-if="isTyping" class="flex justify-start">
                <div class="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Input -->
            <div class="flex space-x-3">
              <input
                v-model="currentMessage"
                @keypress.enter="sendMessage"
                type="text"
                placeholder="Ask me anything about your content..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :disabled="isTyping"
              />
              <button
                @click="sendMessage"
                :disabled="!currentMessage.trim() || isTyping"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>

            <!-- Chat Actions -->
            <div class="flex justify-between items-center pt-4">
              <button
                @click="phase = 'questions'"
                class="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Questions</span>
              </button>
              
              <div class="flex space-x-3">
                <button
                  @click="generateContent"
                  :disabled="isGenerating"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span v-if="isGenerating" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  <span>{{ isGenerating ? 'Generating...' : 'Generate Content' }}</span>
                </button>
                <button
                  @click="closeModal"
                  class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- Generated Content Phase -->
          <div v-else-if="phase === 'generated'" class="space-y-4">
            <div class="text-center py-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 class="text-lg font-medium text-gray-900 mb-2">Content Generated Successfully!</h4>
              <p class="text-gray-600">Review the generated content below and make any adjustments before publishing.</p>
            </div>

            <!-- Generated Content Preview -->
            <div class="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div class="prose prose-sm max-w-none" v-html="renderedContent"></div>
            </div>

            <!-- Content Actions -->
            <div class="flex justify-end space-x-3 pt-4">
              <button
                @click="phase = 'chat'"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refine with AI
              </button>
              <button
                @click="publishContent"
                :disabled="isPublishing"
                class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span v-if="isPublishing" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                <span>{{ isPublishing ? 'Publishing...' : 'Publish Content' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { marked } from 'marked'
import api from '@/services/api'

interface Props {
  isOpen: boolean
  contentType: 'BLOG' | 'PROJECT' | 'EXPERIENCE'
  initialInfo?: any
  projectId?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'content-generated', content: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const phase = ref<'questions' | 'chat' | 'generated'>('questions')
const questions = ref<string[]>([])
const answers = ref<string[]>([])
const messages = ref<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([])
const currentMessage = ref('')
const generatedContent = ref('')
const loadingQuestions = ref(false)
const isGenerating = ref(false)
const isTyping = ref(false)
const isPublishing = ref(false)

// Computed
const canGenerateContent = computed(() => {
  return questions.value.length > 0 && answers.value.some(answer => answer.trim().length > 0)
})

const renderedContent = computed(() => {
  return marked(generatedContent.value || '')
})

// Methods
const closeModal = () => {
  emit('close')
}

const loadInitialQuestions = async () => {
  if (questions.value.length > 0) return
  
  loadingQuestions.value = true
  try {
    const response = await api.post('/ai/clarifying-questions', {
      contentType: props.contentType,
      initialInfo: props.initialInfo || {}
    })
    
    questions.value = response.data.questions
    answers.value = new Array(questions.value.length).fill('')
  } catch (error) {
    console.error('Failed to load questions:', error)
    // Fallback questions
    questions.value = [
      `What is the main topic or focus of your ${props.contentType.toLowerCase()}?`,
      `Who is your target audience?`,
      `What key points or features should be highlighted?`,
      `What tone or style would you prefer?`,
      `Any specific requirements or constraints?`
    ]
    answers.value = new Array(questions.value.length).fill('')
  } finally {
    loadingQuestions.value = false
  }
}

const startChat = () => {
  phase.value = 'chat'
  
  // Initialize chat with context
  const contextMessage = `I'm creating a ${props.contentType.toLowerCase()} and I've answered some questions. Here are my answers: ${answers.value.map((answer, index) => `${index + 1}. ${questions.value[index]}: ${answer}`).join('\n')}. Let's discuss this further and refine the content.`
  
  messages.value = [
    {
      id: '1',
      role: 'user',
      content: contextMessage
    }
  ]
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isTyping.value) return
  
  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    content: currentMessage.value.trim()
  }
  
  messages.value.push(userMessage)
  const messageToSend = currentMessage.value.trim()
  currentMessage.value = ''
  isTyping.value = true
  
  try {
    const response = await api.post('/ai/chat', {
      messages: messages.value.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })
    
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: response.data.response
    }
    
    messages.value.push(assistantMessage)
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: 'Sorry, I encountered an error. Please try again.'
    }
    messages.value.push(errorMessage)
  } finally {
    isTyping.value = false
  }
}

const generateContent = async () => {
  isGenerating.value = true
  
  try {
    // Collect all information
    const topic = answers.value[0] || props.initialInfo?.title || 'Untitled'
    const details = {
      ...props.initialInfo,
      answers: answers.value,
      questions: questions.value,
      chatHistory: messages.value
    }
    
    const response = await api.post('/ai/generate-content', {
      contentType: props.contentType,
      topic,
      details
    })
    
    generatedContent.value = response.data.content
    phase.value = 'generated'
  } catch (error) {
    console.error('Content generation error:', error)
    // Handle error - maybe show error message
  } finally {
    isGenerating.value = false
  }
}

const publishContent = async () => {
  if (!props.projectId) {
    // Just emit the generated content
    emit('content-generated', {
      content: generatedContent.value,
      contentType: props.contentType,
      metadata: {
        aiGenerated: true,
        generatedAt: new Date().toISOString()
      }
    })
    closeModal()
    return
  }
  
  isPublishing.value = true
  
  try {
    const topic = answers.value[0] || props.initialInfo?.title || 'Untitled'
    const details = {
      ...props.initialInfo,
      answers: answers.value,
      questions: questions.value,
      chatHistory: messages.value
    }
    
    const response = await api.post(`/projects/${props.projectId}/content/ai-generate`, {
      contentType: props.contentType,
      topic,
      details,
      metadata: {
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        questions: questions.value,
        answers: answers.value
      },
      isPublished: true
    })
    
    emit('content-generated', response.data)
    closeModal()
  } catch (error) {
    console.error('Publishing error:', error)
    // Handle error
  } finally {
    isPublishing.value = false
  }
}

// Watch for modal opening
watch(() => props.isOpen, (isOpen) => {
  console.log('GeminiChatbot: isOpen changed to', isOpen)
  if (isOpen) {
    phase.value = 'questions'
    questions.value = []
    answers.value = []
    messages.value = []
    currentMessage.value = ''
    generatedContent.value = ''
    loadInitialQuestions()
  }
})
</script>
