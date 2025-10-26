<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Edit Content</h1>
          <p class="text-gray-600 mt-1">{{ content?.title }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="togglePublishStatus"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              content?.isPublished
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            ]"
          >
            {{ content?.isPublished ? 'Published' : 'Draft' }}
          </button>
          <button
            @click="saveContent"
            :disabled="isSaving"
            class="btn btn-primary"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="content" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Main Content Area -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Content Details -->
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Content Details</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label">Title</label>
              <input
                v-model="editForm.title"
                type="text"
                class="input"
                placeholder="Content title"
              />
            </div>
            
            <div>
              <label class="label">Slug</label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  {{ project?.subdomain }}.foligo.tech/
                </span>
                <input
                  v-model="editForm.slug"
                  type="text"
                  class="flex-1 input rounded-l-none"
                  placeholder="url-slug"
                />
              </div>
            </div>
            
            <div class="md:col-span-2">
              <label class="label">Excerpt</label>
              <textarea
                v-model="editForm.excerpt"
                rows="2"
                class="input"
                placeholder="Brief description"
              ></textarea>
            </div>
          </div>

          <!-- Metadata Fields -->
          <div v-if="content.type === 'PROJECT'" class="mt-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Project Details</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">Technologies</label>
                <input
                  v-model="editForm.metadata.technologies"
                  type="text"
                  class="input"
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
              <div>
                <label class="label">Project URL</label>
                <input
                  v-model="editForm.metadata.projectUrl"
                  type="url"
                  class="input"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          <div v-if="content.type === 'EXPERIENCE'" class="mt-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Experience Details</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">Company</label>
                <input
                  v-model="editForm.metadata.company"
                  type="text"
                  class="input"
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label class="label">Position</label>
                <input
                  v-model="editForm.metadata.position"
                  type="text"
                  class="input"
                  placeholder="Job Title"
                />
              </div>
              <div>
                <label class="label">Start Date</label>
                <input
                  v-model="editForm.metadata.startDate"
                  type="date"
                  class="input"
                />
              </div>
              <div>
                <label class="label">End Date</label>
                <input
                  v-model="editForm.metadata.endDate"
                  type="date"
                  class="input"
                />
              </div>
            </div>
          </div>

          <div v-if="content.type === 'BLOG'" class="mt-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Blog Details</h4>
            <div>
              <label class="label">Tags</label>
              <input
                v-model="editForm.metadata.tags"
                type="text"
                class="input"
                placeholder="technology, programming, web-development"
              />
            </div>
          </div>
        </div>

        <!-- Markdown Editor -->
        <div class="card">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Content</h3>
            <p class="text-sm text-gray-600 mt-1">Write your content in Markdown</p>
          </div>
          
          <MarkdownEditor
            v-model="editForm.content"
            @save="handleMarkdownSave"
            @cancel="goBack"
          />
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="lg:col-span-1">
        <!-- AI Content Assistant -->
        <div class="card p-6 mb-6">
          <div class="text-center mb-4">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">AI Content Assistant</h3>
            <p class="text-sm text-gray-600">Let's create amazing {{ content.type.toLowerCase() }} content together</p>
          </div>

          <!-- AI Chat Interface -->
          <div v-if="aiPhase !== 'start' && !isGeneratingAI" class="space-y-4">
            <!-- Chat Messages -->
            <div class="h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
              <div
                v-for="message in aiMessages"
                :key="message.id"
                :class="[
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                ]"
              >
                <div
                  :class="[
                    'max-w-xs px-3 py-2 rounded-lg text-sm',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  ]"
                >
                  <p>{{ message.content }}</p>
                </div>
              </div>
              
              <!-- Typing Indicator -->
              <div v-if="isAITyping" class="flex justify-start">
                <div class="bg-white text-gray-900 max-w-xs px-3 py-2 rounded-lg border border-gray-200">
                  <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Voice Mode Indicator -->
            <div v-if="aiInteractionMode === 'voice'" class="mb-2">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <svg class="w-8 h-8 text-blue-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <p class="text-xs text-blue-900 font-medium">Voice Mode</p>
                <p class="text-xs text-blue-700">Voice interaction is coming soon. Please use text mode.</p>
              </div>
            </div>

            <!-- Chat Input -->
            <div v-if="aiPhase === 'chat'" class="flex space-x-2">
              <input
                v-if="aiInteractionMode === 'text'"
                v-model="currentAIMessage"
                @keypress.enter="sendAIMessage"
                type="text"
                placeholder="Type your response..."
                class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :disabled="isAITyping"
              />
              <div v-else class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Voice input (coming soon)
              </div>
              <button
                v-if="aiInteractionMode === 'text'"
                @click="sendAIMessage"
                :disabled="!currentAIMessage.trim() || isAITyping"
                class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>

          </div>

          <!-- Generating Content Loader (Replaces Chat) -->
          <div v-if="isGeneratingAI" class="space-y-3">
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 class="text-lg font-medium text-gray-900 mb-2">Generating Your Content</h4>
              <p class="text-sm text-gray-600">This may take a minute...</p>
            </div>
          </div>

          <!-- Mode Selection -->
          <div v-if="aiPhase === 'start' && !aiInteractionMode" class="space-y-4">
            <div class="text-center py-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Choose interaction mode</h4>
              <p class="text-xs text-gray-600 mb-4">How would you like to interact with the AI assistant?</p>
              
              <div class="grid grid-cols-2 gap-3">
                <button
                  @click="selectAIMode('text')"
                  class="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <svg class="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h5 class="text-xs font-medium text-gray-900">Text</h5>
                  <p class="text-xs text-gray-600 mt-1">Type responses</p>
                </button>
                
                <div class="relative p-4 border-2 border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed opacity-60">
                  <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <h5 class="text-xs font-medium text-gray-500">Voice</h5>
                  <p class="text-xs text-gray-500 mt-1">Not supported yet</p>
                  <div class="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 rounded-lg">
                    <p class="text-xs text-gray-600 font-medium px-2 py-1 bg-white rounded shadow border">Editing with voice isn't supported yet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Start Button (hidden after mode selection) -->
          <div v-if="aiPhase === 'start' && aiInteractionMode" class="text-center">
            <button
              @click="startAIAssistant"
              class="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Start AI Assistant</span>
            </button>
          </div>
        </div>

        <!-- Content Stats -->
        <div class="card p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Content Stats</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Words</span>
              <span class="font-medium">{{ wordCount }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Characters</span>
              <span class="font-medium">{{ characterCount }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Status</span>
              <span :class="content.isPublished ? 'text-green-600' : 'text-gray-600'" class="font-medium">
                {{ content.isPublished ? 'Published' : 'Draft' }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Last Updated</span>
              <span class="font-medium">{{ formatDate(content.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-500">Loading content...</div>
    </div>

    <!-- AI Generated Content Modal -->
    <div v-if="generatedAIContent" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="denyAIContent"></div>
        
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
                    AI Generated Content
                  </h3>
                  <p class="text-sm text-blue-100">Review and decide whether to apply this content</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Content Display -->
          <div class="bg-white px-6 py-4">
            <div class="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div class="prose prose-sm max-w-none" v-html="renderedAIContent"></div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              @click="denyAIContent"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Deny
            </button>
            <button
              @click="applyAIContent"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Apply to Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import type { Content, Project } from '@/stores/projects'
import { format } from 'date-fns'
import { marked } from 'marked'
import api, { aiApi } from '@/services/api'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const content = ref<Content | null>(null)
const project = ref<Project | null>(null)
const isSaving = ref(false)

// AI Assistant State
const aiPhase = ref<'start' | 'chat' | 'generated'>('start')
const aiMessages = ref<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([])
const currentAIMessage = ref('')
const generatedAIContent = ref('')
const isGeneratingAI = ref(false)
const isAITyping = ref(false)
const questionCount = ref(0)
const maxQuestions = 4
const aiInteractionMode = ref<'text' | 'voice' | null>(null)

const editForm = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  metadata: {
    technologies: '',
    projectUrl: '',
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    tags: ''
  }
})

// Computed properties
const wordCount = computed(() => {
  if (!editForm.content) return 0
  return editForm.content.trim().split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => {
  return editForm.content?.length || 0
})

const renderedAIContent = computed(() => {
  return marked(generatedAIContent.value || '')
})

const canGenerateContent = computed(() => {
  return questionCount.value >= maxQuestions && aiMessages.value.length > 0
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

// AI Assistant State - using new multi-step approach
const sessionDone = ref(false)

// AI Assistant Methods
const selectAIMode = (mode: 'text' | 'voice') => {
  aiInteractionMode.value = mode
  startAIAssistant()
}
const startAIAssistant = async () => {
  aiPhase.value = 'chat'
  questionCount.value = 0
  sessionDone.value = false
  
  isAITyping.value = true
  
  try {
    const initialInfo = {
      title: editForm.title,
      content: editForm.content,
      excerpt: editForm.excerpt,
      metadata: editForm.metadata
    }
    
    const response = await aiApi.post('/ai/session', {
      mode: 'edit',
      contentType: content.value?.type || 'BLOG',
      initialInfo,
      chatHistory: []
    })
    
    const initialMessage = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: response.data.message
    }
    
    aiMessages.value.push(initialMessage)
    
    if (response.data.done) {
      sessionDone.value = true
    }
  } catch (error) {
    console.error('Failed to start AI assistant:', error)
    const fallbackMessage = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: 'Hi! I\'m here to help you edit your content. What would you like to focus on?'
    }
    aiMessages.value.push(fallbackMessage)
  } finally {
    isAITyping.value = false
  }
}

const generateAIContent = async () => {
  if (!sessionDone.value) return
  
  isGeneratingAI.value = true
  aiPhase.value = 'chat' // Show generating state in chat interface
  
  try {
    const chatHistory = aiMessages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    const response = await aiApi.post('/ai/generate', {
      mode: 'edit',
      contentType: content.value?.type || 'BLOG',
      chatHistory,
      currentContent: editForm.content,
      changes: ''
    })
    
    generatedAIContent.value = response.data.content
    // Modal will show automatically when generatedAIContent has value
  } catch (error) {
    console.error('Content generation error:', error)
  } finally {
    isGeneratingAI.value = false
  }
}

const sendAIMessage = async () => {
  if (!currentAIMessage.value.trim() || isAITyping.value || sessionDone.value) return
  
  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    content: currentAIMessage.value.trim()
  }
  
  aiMessages.value.push(userMessage)
  const messageToSend = currentAIMessage.value.trim()
  currentAIMessage.value = ''
  isAITyping.value = true
  
  try {
    const initialInfo = {
      title: editForm.title,
      content: editForm.content,
      excerpt: editForm.excerpt,
      metadata: editForm.metadata
    }
    
    const chatHistory = aiMessages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    const response = await aiApi.post('/ai/session', {
      mode: 'edit',
      contentType: content.value?.type || 'BLOG',
      initialInfo,
      chatHistory
    })
    
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: response.data.message
    }
    
    aiMessages.value.push(assistantMessage)
    
    // Check if the session is done
    if (response.data.done) {
      sessionDone.value = true
      await generateAIContent()
    }
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: 'Sorry, I encountered an error. Please try again.'
    }
    aiMessages.value.push(errorMessage)
  } finally {
    isAITyping.value = false
  }
}

const applyAIContent = () => {
  editForm.content = generatedAIContent.value
  denyAIContent()
}

const denyAIContent = () => {
  aiPhase.value = 'start'
  // Reset AI state
  aiMessages.value = []
  currentAIMessage.value = ''
  generatedAIContent.value = ''
  questionCount.value = 0
  sessionDone.value = false
  aiInteractionMode.value = null
}

const loadContent = async () => {
  try {
    const contentId = route.params.id as string
    const projectId = route.params.projectId as string
    
    // Load project first
    project.value = await projectStore.fetchProject(projectId)
    
    // Find content in project
    if (project.value?.content) {
      content.value = project.value.content.find(c => c.id === contentId) || null
      
      if (content.value) {
        // Populate form
        editForm.title = content.value.title
        editForm.slug = content.value.slug || ''
        editForm.excerpt = content.value.excerpt || ''
        editForm.content = content.value.content
        editForm.metadata = { ...editForm.metadata, ...content.value.metadata }
      }
    }
  } catch (error) {
    console.error('Failed to load content:', error)
    router.push('/projects')
  }
}

const handleMarkdownSave = async (contentValue: string) => {
  // Update the form content with the value from the editor
  editForm.content = contentValue
  // Then save the content
  await saveContent()
}

const saveContent = async () => {
  if (!content.value) return

  try {
    isSaving.value = true
    
    await projectStore.updateContent(content.value.id, {
      title: editForm.title,
      slug: editForm.slug || undefined,
      excerpt: editForm.excerpt || undefined,
      content: editForm.content,
      metadata: editForm.metadata
    })
    
    // Reload content to get updated data
    await loadContent()
  } catch (error) {
    console.error('Failed to save content:', error)
  } finally {
    isSaving.value = false
  }
}

const togglePublishStatus = async () => {
  if (!content.value) return

  try {
    await projectStore.updateContent(content.value.id, {
      isPublished: !content.value.isPublished
    })
    
    // Reload content to get updated data
    await loadContent()
  } catch (error) {
    console.error('Failed to toggle publish status:', error)
  }
}

const goBack = () => {
  router.push(`/projects/${route.params.projectId}`)
}

onMounted(() => {
  loadContent()
})
</script>