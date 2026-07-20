<template>
  <div v-if="isOpen" class="creator-overlay fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="creator-backdrop fixed inset-0 bg-black bg-opacity-75 transition-opacity"></div>

      <div class="creator-card inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
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
                <h3 class="text-lg leading-6 font-medium text-white">AI Content Creator</h3>
                <p class="text-sm text-purple-100">Full control over your portfolio — find, edit, create, organize, or remove any post</p>
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
              :disabled="chat.streaming.value"
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

          <!-- Chat Messages -->
          <div v-else-if="modeSelected" class="space-y-4 max-h-[600px] overflow-y-auto mb-4">
            <div
              v-for="message in chat.messages.value"
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
                  <details v-if="message.reasoning" class="mb-2 group" :open="chat.streaming.value && chat.messages.value[chat.messages.value.length - 1]?.id === message.id && !message.content">
                    <summary class="cursor-pointer text-xs text-gray-400 hover:text-gray-300 select-none flex items-center space-x-1">
                      <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>Thinking</span>
                    </summary>
                    <p class="mt-1 text-xs text-gray-400 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-600 pl-2">{{ message.reasoning }}</p>
                  </details>

                  <div v-if="message.toolActivity?.length" class="mb-2 space-y-1.5">
                    <template v-for="(tool, index) in message.toolActivity" :key="`${tool.toolName}-${index}`">
                      <div
                        v-if="tool.toolName?.startsWith('propose_delete_') && tool.status === 'done' && tool.output?.deleteEndpoint"
                        class="rounded-md border px-3 py-2 text-xs"
                        :class="tool.output?.resolved === 'deleted' ? 'bg-red-900/20 border-red-800 text-red-300' : tool.output?.resolved === 'cancelled' ? 'bg-gray-700/50 border-gray-600 text-gray-300' : tool.output?.resolved === 'error' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-amber-900/20 border-amber-700 text-amber-200'"
                      >
                        <template v-if="!tool.output.resolved">
                          <p class="mb-2">Delete this {{ tool.output.description || 'item' }}, "{{ tool.output.label }}"? This cannot be undone.</p>
                          <div class="flex gap-2">
                            <button
                              @click="confirmDelete(tool)"
                              :disabled="tool.busy"
                              class="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
                            >{{ tool.busy ? 'Deleting…' : 'Confirm delete' }}</button>
                            <button
                              @click="cancelDelete(tool)"
                              :disabled="tool.busy"
                              class="px-2.5 py-1 rounded border border-gray-500 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            >Cancel</button>
                          </div>
                        </template>
                        <p v-else-if="tool.output.resolved === 'deleted'">Deleted "{{ tool.output.label }}".</p>
                        <p v-else-if="tool.output.resolved === 'cancelled'">Cancelled — "{{ tool.output.label }}" was not deleted.</p>
                        <p v-else>{{ tool.output.errorMessage || 'Something went wrong.' }}</p>
                      </div>
                      <div
                        v-else
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
                    </template>
                  </div>
                </template>
                <div
                  v-if="message.content"
                  class="text-sm leading-relaxed markdown-content"
                  :class="{ 'markdown-content-user': message.role === 'user' }"
                  v-html="renderMarkdown(message.content)"
                ></div>
                <div v-else-if="message.role === 'assistant' && chat.streaming.value && chat.messages.value[chat.messages.value.length - 1]?.id === message.id && !message.reasoning && !message.toolActivity?.length" class="flex space-x-1.5 py-1">
                  <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Voice Mode ConvAI Widget -->
          <div v-if="selectedInteractionMode === 'voice' && modeSelected && voiceAgentId" class="mb-4">
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
        <div class="bg-gray-800 px-6 py-4 flex items-center justify-end gap-3">
          <button
            @click="close"
            class="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import api, { API_URL } from '@/services/api'
import ChatSessionPicker from '@/components/chat/ChatSessionPicker.vue'
import { useChatSessions } from '@/composables/useChatSessions'
import { useAgenticChat, type ToolActivity } from '@/composables/useAgenticChat'
import { renderMarkdown } from '@/lib/markdown'

const props = defineProps<{
  projectId?: string
  currentPage?: { name?: string; params?: Record<string, unknown> }
}>()

const emit = defineEmits<{
  close: []
  navigate: [{ routeName: string; params: Record<string, unknown> }]
  'content-created': [{ id: string }]
  'content-generated': [any]
}>()

const isOpen = ref(false)
const modeSelected = ref(false)
const selectedInteractionMode = ref<'text' | 'voice'>('text')
const voiceAgentId = ref('')
const currentMessage = ref('')
const messageTextarea = ref<HTMLTextAreaElement | null>(null)

const chatSessions = useChatSessions('content-creator', () => props.projectId)

const chat = useAgenticChat(
  () => `${API_URL}/ai/portfolio/chat`,
  { onTurnComplete: async (history) => { await chatSessions.save(history) } },
  () => undefined,
  () => ({ projectId: props.projectId, currentPage: props.currentPage })
)

const canRespond = computed(() => !chat.streaming.value && modeSelected.value && selectedInteractionMode.value === 'text')

const TOOL_LABELS: Record<string, { done: string; error: string }> = {
  list_posts: { done: 'Searched your posts', error: 'Search failed' },
  get_post: { done: 'Loaded post details', error: 'Failed to load post' },
  create_post: { done: 'Post created', error: 'Failed to create post' },
  update_post_fields: { done: 'Post updated', error: 'Update failed' },
  update_post_content: { done: 'Post content updated', error: 'Update failed' },
  add_experience_role: { done: 'Role added', error: 'Failed to add role' },
  update_experience_role: { done: 'Role updated', error: 'Failed to update role' },
  delete_experience_role: { done: 'Role removed', error: 'Failed to remove role' },
  add_skills_to_post: { done: 'Skills added', error: 'Failed to add skills' },
  remove_skill_from_post: { done: 'Skill removed', error: 'Failed to remove skill' },
  add_tags_to_post: { done: 'Tags added', error: 'Failed to add tags' },
  remove_tag_from_post: { done: 'Tag removed', error: 'Failed to remove tag' },
  navigate_to: { done: 'Navigating…', error: 'Navigation failed' },
  // GoApply
  list_resumes: { done: 'Searched your resumes', error: 'Search failed' },
  get_resume: { done: 'Loaded resume', error: 'Failed to load resume' },
  save_resume: { done: 'Resume saved', error: 'Failed to save resume' },
  list_cover_letters: { done: 'Searched your cover letters', error: 'Search failed' },
  get_cover_letter: { done: 'Loaded cover letter', error: 'Failed to load cover letter' },
  save_cover_letter: { done: 'Cover letter saved', error: 'Failed to save cover letter' },
  list_job_applications: { done: 'Searched your job applications', error: 'Search failed' },
  save_job_application: { done: 'Job application saved', error: 'Failed to save job application' },
  get_saved_answers: { done: 'Loaded saved answers', error: 'Failed to load saved answers' },
  save_answers: { done: 'Saved answers updated', error: 'Failed to save answers' },
  get_goapply_profile: { done: 'Loaded GoApply profile', error: 'Failed to load profile' },
  update_goapply_profile: { done: 'Profile updated', error: 'Failed to update profile' },
  save_skills: { done: 'Skills saved', error: 'Failed to save skills' },
}

const toolLabel = (toolName: string, status: 'running' | 'done' | 'error') => {
  const labels = TOOL_LABELS[toolName]
  if (labels && status !== 'running') return labels[status]
  const readableName = toolName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
  if (status === 'running') return `Running ${readableName}…`
  return status === 'error' ? `${readableName} failed` : `${readableName} completed`
}

const voiceVariables = computed(() => JSON.stringify({ user_project_id: props.projectId || '' }))

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
  nextTick(() => {
    if (messageTextarea.value) messageTextarea.value.style.height = 'auto'
  })
}

const newChat = async () => {
  await chatSessions.create()
  modeSelected.value = false
  selectedInteractionMode.value = 'text'
  chat.reset()
  currentMessage.value = ''
}

const openSavedChat = async (id: string) => {
  const session = await chatSessions.open(id)
  chat.loadHistory(session.chatHistory || [])
  selectedInteractionMode.value = 'text'
  modeSelected.value = true
}

const close = () => {
  isOpen.value = false
  modeSelected.value = false
  chat.reset()
  currentMessage.value = ''
  if (messageTextarea.value) messageTextarea.value.style.height = 'auto'
}

const GREETING = "Hi! I'm your Foligo AI Content Creator — I have full control over this portfolio. I can find, edit, or create any post, manage skills, tags, and experience roles, take you anywhere in the dashboard, or delete a post (I'll always confirm with you first). What would you like to do?"

function showGreeting() {
  if (chat.messages.value.length > 0) return
  chat.messages.value.push({ id: `greeting-${Date.now()}`, role: 'assistant', content: GREETING })
}

const selectMode = async (mode: 'text' | 'voice') => {
  selectedInteractionMode.value = mode
  modeSelected.value = true
  if (mode === 'voice') await startVoiceSession()
  else showGreeting()
}

const adjustTextareaHeight = () => {
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.style.height = 'auto'
      const scrollHeight = messageTextarea.value.scrollHeight
      messageTextarea.value.style.height = `${Math.min(scrollHeight, 200)}px`
    }
  })
}

const handleShiftEnter = () => adjustTextareaHeight()

const sendMessage = async () => {
  if (!currentMessage.value.trim() || chat.streaming.value) return
  const text = currentMessage.value.trim()
  currentMessage.value = ''
  if (messageTextarea.value) messageTextarea.value.style.height = 'auto'
  await chat.sendMessage(text)
}

const startVoiceSession = async () => {
  const projectId = props.projectId
  if (!projectId) {
    alert('Please select a project first')
    close()
    return
  }

  // Store the session info so we can pick up the webhook response
  ;(window as any).activeVoiceSession = {
    projectId,
    callback: (data: any) => {
      emit('content-generated', data)
      close()
    }
  }

  // The voice mode UI will show the phone number - don't close the modal
  // User can close it themselves after calling
}

// ── Navigation and delete-confirmation, driven by tool activity from the
// agent's SSE stream. navigate_to and propose_delete_post never mutate
// anything server-side themselves (see portfolio-agent-tools.js) — this is
// the client-side gate that turns their descriptors into real actions.
const handledToolCallIds = new Set<string>()
const pendingNavigation = ref<{ routeName: string; params: Record<string, unknown>; handoffContent?: string } | null>(null)

watch(() => chat.messages.value, (msgs) => {
  const last = msgs[msgs.length - 1]
  if (!last?.toolActivity) return
  for (const activity of last.toolActivity) {
    if (activity.status !== 'done' || handledToolCallIds.has(activity.toolCallId)) continue
    if (activity.toolName === 'navigate_to' && activity.output?.action === 'navigate') {
      handledToolCallIds.add(activity.toolCallId)
      const { routeName, params } = activity.output
      let handoffContent: string | undefined
      if (routeName === 'studio-content') {
        const createActivity = last.toolActivity.find((t) => t.toolName === 'create_post' && t.output?.postId === params?.id)
        handoffContent = createActivity?.input?.content
      }
      pendingNavigation.value = { routeName, params, handoffContent }
    } else if (activity.toolName === 'propose_delete_post') {
      handledToolCallIds.add(activity.toolCallId)
    }
  }
}, { deep: true })

// Wait for the turn to finish streaming before actually navigating away, so
// we don't abort the SSE reader mid-message or unmount while the agent is
// still writing its wrap-up sentence.
watch(() => chat.streaming.value, (streaming) => {
  if (streaming || !pendingNavigation.value) return
  const nav = pendingNavigation.value
  pendingNavigation.value = null
  if (nav.routeName === 'studio-content' && nav.handoffContent !== undefined && nav.params?.id) {
    sessionStorage.setItem(`ai-content-handoff:${nav.params.id}`, JSON.stringify({ content: nav.handoffContent, animate: true, createdAt: Date.now() }))
    emit('content-created', { id: nav.params.id as string })
  } else {
    emit('navigate', { routeName: nav.routeName, params: nav.params })
  }
  close()
})

async function confirmDelete(activity: ToolActivity) {
  const endpoint = activity.output?.deleteEndpoint
  activity.busy = true
  try {
    await api.delete(endpoint)
    activity.output = { ...activity.output, resolved: 'deleted' }
  } catch (error: any) {
    activity.output = { ...activity.output, resolved: 'error', errorMessage: error.response?.data?.message || `Failed to delete this ${activity.output?.description || 'item'}.` }
  } finally {
    activity.busy = false
  }
}

function cancelDelete(activity: ToolActivity) {
  activity.output = { ...activity.output, resolved: 'cancelled' }
}

// Expose open and close methods
defineExpose({ open, close })
</script>

<style scoped>
.creator-card { transform-origin: center; }
.creator-backdrop { transition: background-color 700ms ease, backdrop-filter 700ms ease; }
</style>
