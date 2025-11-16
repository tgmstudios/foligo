<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Edit Content</h1>
        </div>
        <div class="flex items-center space-x-3">
          <select
            v-model="editForm.status"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium border min-w-[140px] transition-colors',
              getStatusDropdownClass(editForm.status)
            ]"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="HIDDEN">Hidden</option>
          </select>
          <button
            @click="showRevisionTimeline = true"
            class="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 border border-gray-600 flex items-center space-x-2"
            title="View revision history"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Revision History</span>
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
          <h3 class="text-lg font-medium text-white mb-4">Content Details</h3>
          
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
                <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-400 text-sm">
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

          <!-- Project-specific Fields -->
          <div v-if="content.type === 'PROJECT'" class="mt-6 space-y-6">
            
            <!-- Dates -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="label">Start Date</label>
                <input
                  v-model="editForm.startDate"
                  type="date"
                  class="input"
                />
              </div>
              <div>
                <label class="label">End Date</label>
                <input
                  v-model="editForm.endDate"
                  type="date"
                  class="input"
                  :disabled="editForm.isOngoing"
                />
              </div>
              <div class="flex items-end">
                <label class="flex items-center space-x-2">
                  <input
                    v-model="editForm.isOngoing"
                    type="checkbox"
                    class="rounded"
                  />
                  <span class="text-sm text-gray-300">Ongoing</span>
                </label>
              </div>
            </div>

            <!-- Featured Image -->
            <div>
              <label class="label">Featured Image URL</label>
              <input
                v-model="editForm.featuredImage"
                type="url"
                class="input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <!-- Project Links -->
            <div>
              <label class="label">Project Links</label>
              <div class="space-y-2">
                <input
                  v-model="editForm.projectLinks.github"
                  type="url"
                  class="input"
                  placeholder="GitHub URL"
                />
                <input
                  v-model="editForm.projectLinks.devpost"
                  type="url"
                  class="input"
                  placeholder="Devpost URL"
                />
                <div v-for="(link, index) in editForm.projectLinks.other" :key="index" class="flex gap-2">
                  <input
                    v-model="editForm.projectLinks.other[index]"
                    type="url"
                    class="input flex-1"
                    placeholder="Other link URL"
                  />
                  <button
                    @click="editForm.projectLinks.other.splice(index, 1)"
                    type="button"
                    class="btn btn-sm btn-secondary"
                  >
                    Remove
                  </button>
                </div>
                <button
                  @click="editForm.projectLinks.other.push('')"
                  type="button"
                  class="btn btn-sm btn-secondary"
                >
                  + Add Link
                </button>
              </div>
            </div>

            <!-- Contributors -->
            <div>
              <label class="label">Contributors</label>
              <div class="space-y-2">
                <div v-for="(contributor, index) in editForm.contributors" :key="index" class="flex gap-2">
                  <input
                    v-model="editForm.contributors[index]"
                    type="text"
                    class="input flex-1"
                    placeholder="Contributor name or ID"
                  />
                  <button
                    @click="editForm.contributors.splice(index, 1)"
                    type="button"
                    class="btn btn-sm btn-secondary"
                  >
                    Remove
                  </button>
                </div>
                <button
                  @click="editForm.contributors.push('')"
                  type="button"
                  class="btn btn-sm btn-secondary"
                >
                  + Add Contributor
                </button>
              </div>
            </div>

            <!-- Skills -->
            <div>
              <SkillsManager
                v-model="editForm.linkedSkills"
                :project-id="content.projectId"
              />
            </div>
          </div>

          <!-- Experience-specific Fields -->
          <div v-if="content.type === 'EXPERIENCE'" class="mt-6 space-y-6">
            
            <!-- Category -->
            <div>
              <label class="label">Category *</label>
              <select
                v-model="editForm.experienceCategory"
                class="input"
                required
              >
                <option value="JOB">Job Experience</option>
                <option value="EDUCATION">Education</option>
                <option value="CERTIFICATION">Certification/License</option>
              </select>
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="label">Start Date</label>
                <input
                  v-model="editForm.startDate"
                  type="date"
                  class="input"
                />
              </div>
              <div>
                <label class="label">End Date</label>
                <input
                  v-model="editForm.endDate"
                  type="date"
                  class="input"
                  :disabled="editForm.isOngoing"
                />
              </div>
              <div class="flex items-end">
                <label class="flex items-center space-x-2">
                  <input
                    v-model="editForm.isOngoing"
                    type="checkbox"
                    class="rounded"
                  />
                  <span class="text-sm text-gray-300">Ongoing</span>
                </label>
              </div>
            </div>

            <!-- Location -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">Location</label>
                <input
                  v-model="editForm.location"
                  type="text"
                  class="input"
                  placeholder="City, State/Country"
                />
              </div>
              <div>
                <label class="label">Location Type</label>
                <select
                  v-model="editForm.locationType"
                  class="input"
                >
                  <option value="">Select type</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        <!-- Experience Roles -->
        <div v-if="content.type === 'EXPERIENCE'" class="card">
          <ExperienceRolesEditor
            :content-id="content.id"
            :project-id="content.projectId"
          />
        </div>

        <!-- Markdown Editor -->
        <div class="card">
          <div class="p-6 border-b border-gray-600">
            <h3 class="text-lg font-medium text-white">Content</h3>
            <p class="text-sm text-gray-400 mt-1">Write your content in Markdown</p>
          </div>
          
          <MarkdownEditor
            v-model="editForm.content"
            :project-id="content.projectId"
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
            <h3 class="text-lg font-medium text-white">AI Content Assistant</h3>
            <p class="text-sm text-gray-400">Let's create amazing {{ content.type.toLowerCase() }} content together</p>
          </div>

          <!-- AI Chat Interface -->
          <div v-if="aiPhase !== 'start' && !isGeneratingAI" class="space-y-4">
            <!-- Chat Messages -->
            <div class="h-64 overflow-y-auto border border-gray-600 rounded-lg p-3 space-y-3 bg-gray-800">
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
                      : 'bg-gray-800 text-white border border-gray-600'
                  ]"
                >
                  <p>{{ message.content }}</p>
                </div>
              </div>
              
              <!-- Typing Indicator -->
              <div v-if="isAITyping" class="flex justify-start">
                <div class="bg-gray-800 text-white max-w-xs px-3 py-2 rounded-lg border border-gray-600">
                  <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Input -->
            <div v-if="aiPhase === 'chat'" class="flex space-x-2">
              <input
                v-model="currentAIMessage"
                @keypress.enter="sendAIMessage"
                type="text"
                placeholder="Type your response..."
                class="flex-1 px-3 py-2 text-sm border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :disabled="isAITyping"
              />
              <button
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
              <h4 class="text-lg font-medium text-white mb-2">Generating Your Content</h4>
              <p class="text-sm text-gray-400">This may take a minute...</p>
            </div>
          </div>

          <!-- Start Button -->
          <div v-if="aiPhase === 'start'" class="text-center">
            <button
              @click="selectAIMode('text')"
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
        <div class="card p-6 mb-6">
          <h3 class="text-lg font-medium text-white mb-4">Content Stats</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Words</span>
              <span class="font-medium text-white">{{ wordCount }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Characters</span>
              <span class="font-medium text-white">{{ characterCount }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Last Updated</span>
              <span class="font-medium text-white">{{ formatDate(content.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="card p-6 mb-6">
          <TagManager
            v-model="editForm.tags"
            :project-id="content.projectId"
          />
        </div>

        <!-- Content Blocks (for advanced post types) -->
        <!-- <div v-if="content.type === 'PROJECT' || content.type === 'BLOG'" class="card p-6 mb-6">
          <ContentBlocksEditor
            :content-id="content.id"
            :project-id="content.projectId"
          />
        </div> -->

        <!-- Content Links -->
        <div class="card p-6 mb-6">
          <ContentLinksManager
            :source-id="content.id"
            source-type="content"
            :project-id="content.projectId"
          />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400">Loading content...</div>
    </div>

    <!-- AI Generated Content Modal -->
    <div v-if="generatedAIContent" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="denyAIContent"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-6 pb-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
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
          <div class="bg-gray-800 px-6 py-4">
            <div class="border border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-900">
              <div class="prose prose-sm max-w-none ai-content-preview" v-html="renderedAIContent"></div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="bg-gray-800 px-6 py-4 flex justify-end space-x-3">
            <button
              @click="denyAIContent"
              class="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-800"
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

    <!-- Revision Timeline Modal -->
    <RevisionTimeline
      :is-open="showRevisionTimeline"
      :content-id="content?.id || ''"
      :project-id="content?.projectId || ''"
      :content="content"
      @close="showRevisionTimeline = false"
      @revision-restored="loadContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import TagManager from '@/components/content/TagManager.vue'
import SkillsManager from '@/components/content/SkillsManager.vue'
import ContentBlocksEditor from '@/components/content/ContentBlocksEditor.vue'
import ExperienceRolesEditor from '@/components/content/ExperienceRolesEditor.vue'
import ContentLinksManager from '@/components/content/ContentLinksManager.vue'
import RevisionTimeline from '@/components/content/RevisionTimeline.vue'
import type { Content, Project, ContentTag, Skill } from '@/stores/projects'
import { format } from 'date-fns'
import { marked } from 'marked'
import api, { aiApi } from '@/services/api'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const content = ref<Content | null>(null)
const project = ref<Project | null>(null)
const isSaving = ref(false)
const showRevisionTimeline = ref(false)

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
  // Project-specific fields
  startDate: '',
  endDate: '',
  isOngoing: false,
  featuredImage: '',
  projectLinks: {
    github: '',
    devpost: '',
    other: [] as string[]
  },
  contributors: [] as string[],
  linkedSkills: [] as Skill[],
  // Experience-specific fields
  experienceCategory: '' as 'JOB' | 'EDUCATION' | 'CERTIFICATION' | '',
  location: '',
  locationType: '' as 'REMOTE' | 'HYBRID' | 'ONSITE' | '',
  // Tags
  tags: [] as ContentTag[],
  // Status
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'REVISION',
  // Legacy metadata (deprecated - kept for backward compatibility)
  metadata: {}
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

const getStatusClass = (status?: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'text-amber-400 bg-amber-400/20',
    PUBLISHED: 'text-green-400 bg-green-400/20',
    HIDDEN: 'text-yellow-400 bg-yellow-400/20',
    REVISION: 'text-blue-400 bg-blue-400/20'
  }
  return classes[status || 'DRAFT'] || classes.DRAFT
}

const getStatusDropdownClass = (status: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'bg-amber-500/20 text-amber-300 border-amber-600/50 hover:bg-amber-500/30',
    PUBLISHED: 'bg-green-500/20 text-green-300 border-green-600/50 hover:bg-green-500/30',
    HIDDEN: 'bg-yellow-500/20 text-yellow-300 border-yellow-600/50 hover:bg-yellow-500/30',
    REVISION: 'bg-blue-500/20 text-blue-300 border-blue-600/50 hover:bg-blue-500/30'
  }
  return classes[status || 'DRAFT'] || classes.DRAFT
}

// AI Assistant State
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
  if (!currentAIMessage.value.trim() || isAITyping.value) return
  
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
    
    // Fetch full content with all relationships
    const response = await api.get(`/content/${contentId}`)
    content.value = response.data
    
    if (content.value) {
      // Populate form
      editForm.title = content.value.title
      editForm.slug = content.value.slug || ''
      editForm.excerpt = content.value.excerpt || ''
      editForm.content = content.value.content
      
      // Project-specific fields
      if (content.value.startDate) {
        editForm.startDate = content.value.startDate.split('T')[0]
      }
      if (content.value.endDate) {
        editForm.endDate = content.value.endDate.split('T')[0]
      }
      editForm.isOngoing = content.value.isOngoing || false
      editForm.featuredImage = content.value.featuredImage || ''
      editForm.projectLinks = content.value.projectLinks || { github: '', devpost: '', other: [] }
      editForm.contributors = content.value.contributors || []
      editForm.linkedSkills = content.value.linkedSkills || []
      
      // Experience-specific fields
      editForm.experienceCategory = content.value.experienceCategory || ''
      editForm.location = content.value.location || ''
      editForm.locationType = content.value.locationType || ''
      
      // Tags
      editForm.tags = content.value.tags || []
      
      // Status
      editForm.status = content.value.status || 'DRAFT'
      
      // Legacy metadata (deprecated - kept for backward compatibility)
      editForm.metadata = content.value.metadata || {}
    }
  } catch (error) {
    console.error('Failed to load content:', error)
    router.push('/portfolios')
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
    
    const updateData: any = {
      title: editForm.title,
      slug: editForm.slug || undefined,
      excerpt: editForm.excerpt || undefined,
      content: editForm.content,
      metadata: editForm.metadata,
      status: editForm.status
    }
    
    // Add project-specific fields
    if (content.value.type === 'PROJECT') {
      if (editForm.startDate) updateData.startDate = editForm.startDate
      if (editForm.endDate) updateData.endDate = editForm.endDate
      updateData.isOngoing = editForm.isOngoing
      if (editForm.featuredImage) updateData.featuredImage = editForm.featuredImage
      updateData.projectLinks = editForm.projectLinks
      updateData.contributors = editForm.contributors.filter(c => c.trim())
    }
    
    // Add experience-specific fields
    if (content.value.type === 'EXPERIENCE') {
      if (editForm.experienceCategory) updateData.experienceCategory = editForm.experienceCategory
      if (editForm.location) updateData.location = editForm.location
      if (editForm.locationType) updateData.locationType = editForm.locationType
      if (editForm.startDate) updateData.startDate = editForm.startDate
      if (editForm.endDate) updateData.endDate = editForm.endDate
      updateData.isOngoing = editForm.isOngoing
    }
    
    await projectStore.updateContent(content.value.id, updateData)
    
    // Update tags separately
    if (editForm.tags && editForm.tags.length > 0) {
      await api.post(`/projects/${content.value.projectId}/content/${content.value.id}/tags`, {
        tagIds: editForm.tags.map(t => t.id)
      })
    }
    
    // Update skills separately (for projects)
    if (content.value.type === 'PROJECT' && editForm.linkedSkills && editForm.linkedSkills.length > 0) {
      await api.post(`/projects/${content.value.projectId}/content/${content.value.id}/skills`, {
        skillIds: editForm.linkedSkills.map(s => s.id)
      })
    }
    
    // Reload content to get updated data
    await loadContent()
  } catch (error) {
    console.error('Failed to save content:', error)
  } finally {
    isSaving.value = false
  }
}

// Status is now managed through the status dropdown in the header

const goBack = () => {
  router.push(`/portfolios/${route.params.projectId}`)
}

onMounted(() => {
  loadContent()
})
</script>

<style scoped>
.ai-content-preview {
  @apply text-white;
}

:deep(.ai-content-preview) {
  color: white !important;
}

:deep(.ai-content-preview h1),
:deep(.ai-content-preview h1 *),
.ai-content-preview h1,
.ai-content-preview h1 * {
  @apply text-2xl font-bold mb-4;
  color: white !important;
}

:deep(.ai-content-preview h2),
:deep(.ai-content-preview h2 *),
.ai-content-preview h2,
.ai-content-preview h2 * {
  @apply text-xl font-semibold mb-3;
  color: white !important;
}

:deep(.ai-content-preview h3),
:deep(.ai-content-preview h3 *),
.ai-content-preview h3,
.ai-content-preview h3 * {
  @apply text-lg font-medium mb-2;
  color: white !important;
}

:deep(.ai-content-preview h4),
:deep(.ai-content-preview h4 *),
.ai-content-preview h4,
.ai-content-preview h4 * {
  @apply text-base font-medium mb-2;
  color: white !important;
}

:deep(.ai-content-preview h5),
:deep(.ai-content-preview h5 *),
.ai-content-preview h5,
.ai-content-preview h5 * {
  @apply text-sm font-medium mb-2;
  color: white !important;
}

:deep(.ai-content-preview h6),
:deep(.ai-content-preview h6 *),
.ai-content-preview h6,
.ai-content-preview h6 * {
  @apply text-sm font-medium mb-2;
  color: white !important;
}

:deep(.ai-content-preview p),
:deep(.ai-content-preview p *),
.ai-content-preview p,
.ai-content-preview p * {
  @apply mb-4;
  color: white !important;
}

:deep(.ai-content-preview strong),
:deep(.ai-content-preview strong *),
.ai-content-preview strong,
.ai-content-preview strong * {
  @apply font-bold;
  color: white !important;
}

.ai-content-preview em {
  @apply italic text-gray-200;
}

.ai-content-preview strong em,
.ai-content-preview em strong {
  @apply font-bold italic text-white;
}

.ai-content-preview code {
  @apply bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-100 border border-gray-700;
}

.ai-content-preview pre {
  @apply bg-gray-800 p-4 rounded overflow-x-auto border border-gray-700;
}

.ai-content-preview pre code {
  @apply bg-transparent p-0 border-0 text-gray-100;
}

.ai-content-preview a {
  @apply text-blue-400 hover:text-blue-300 underline;
}

.ai-content-preview ul, .ai-content-preview ol {
  @apply text-white mb-4 list-disc list-outside ml-6;
}

.ai-content-preview ol {
  @apply list-decimal;
}

.ai-content-preview li {
  @apply mb-1 text-white;
}

.ai-content-preview blockquote {
  @apply border-l-4 border-blue-500 pl-4 italic text-white my-4 bg-gray-900/50 py-2;
}

.ai-content-preview hr {
  @apply border-gray-600 my-6;
}

.ai-content-preview table {
  @apply w-full mb-4 border-collapse;
}

.ai-content-preview th {
  @apply bg-gray-800 border border-gray-700 px-4 py-2 text-left font-semibold text-white;
}

.ai-content-preview td {
  @apply border border-gray-700 px-4 py-2 text-white;
}

/* Status dropdown - only color code the select button, not the options */
select[class*="getStatusDropdownClass"] option,
select option {
  background-color: #1f2937;
  color: #ffffff;
}
</style>