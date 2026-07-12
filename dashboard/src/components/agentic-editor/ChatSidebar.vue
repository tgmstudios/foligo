<template>
  <div class="chat-sidebar flex-1 flex flex-col min-h-0">
    <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="scrollContainer">
      <div v-if="messages.length === 0" class="text-center py-10 text-gray-400 text-sm px-4">
        {{ emptyStateText }}
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        :class="['flex items-start space-x-2.5', message.role === 'user' ? 'flex-row-reverse space-x-reverse' : '']"
      >
        <div :class="[
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          message.role === 'user' ? 'bg-primary-600' : 'bg-gray-700'
        ]">
          <svg v-if="message.role === 'assistant'" class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <div :class="[
          'rounded-xl px-3.5 py-2.5 shadow-lg min-w-0',
          message.role === 'user' ? 'bg-primary-600 text-white max-w-[85%]' : 'bg-gray-800 text-white border border-gray-700 max-w-[90%] flex-1'
        ]">
          <p v-if="message.role === 'user'" class="text-sm whitespace-pre-wrap leading-relaxed">{{ message.content }}</p>

          <template v-else>
            <!-- Thinking block -->
            <details v-if="message.reasoning" class="mb-2 group" :open="message.streaming && !message.content">
              <summary class="cursor-pointer text-xs text-gray-400 hover:text-gray-300 select-none flex items-center space-x-1">
                <svg class="w-3 h-3 transform transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span>Thinking</span>
              </summary>
              <p class="mt-1 text-xs text-gray-500 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-700 pl-2">{{ message.reasoning }}</p>
            </details>

            <!-- Tool call chips -->
            <div v-if="message.toolActivity && message.toolActivity.length > 0" class="mb-2 space-y-1">
              <div
                v-for="tc in message.toolActivity"
                :key="tc.id"
                class="flex items-center space-x-1.5 text-xs px-2 py-1 rounded-md border"
                :class="toolChipClass(tc.status)"
              >
                <svg v-if="tc.status === 'running'" class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else-if="tc.status === 'error'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ toolLabel(tc) }}</span>
              </div>
            </div>

            <div
              v-if="message.content"
              class="text-sm leading-relaxed markdown-content"
              v-html="renderMarkdown(message.content)"
            ></div>
            <div v-else-if="message.streaming && !message.reasoning && (!message.toolActivity || message.toolActivity.length === 0)" class="flex space-x-1.5 py-1">
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-700 p-3 bg-gray-800/50 flex-shrink-0">
      <div class="flex items-end space-x-2">
        <textarea
          ref="textarea"
          v-model="draft"
          @keydown.enter.exact.prevent="send"
          @keydown.enter.ctrl.exact="newline"
          @keydown.enter.meta.exact="newline"
          :disabled="streaming"
          :placeholder="placeholder"
          rows="1"
          class="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 resize-none overflow-y-auto min-h-[40px] max-h-[160px] text-sm leading-relaxed"
        ></textarea>
        <button
          @click="send"
          :disabled="streaming || !draft.trim()"
          class="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed h-[40px] flex-shrink-0"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { marked } from 'marked'
import type { AgenticChatMessage } from '@/composables/useAgenticChat'

const props = withDefaults(defineProps<{
  messages: AgenticChatMessage[]
  streaming: boolean
  placeholder?: string
  emptyStateText?: string
}>(), {
  placeholder: 'Ask the agent to edit this document…',
  emptyStateText: 'Ask the agent to draft a section, make an edit, or tweak wording — it\'ll edit the document directly.',
})

const emit = defineEmits<{
  (e: 'send', message: string): void
}>()

const draft = ref('')
const textarea = ref<HTMLTextAreaElement>()
const scrollContainer = ref<HTMLDivElement>()

marked.setOptions({ breaks: true, gfm: true })

const renderMarkdown = (content: string) => {
  if (!content?.trim()) return ''
  try {
    return marked(content) as string
  } catch {
    return content
  }
}

const TOOL_LABELS: Record<string, { running: string; done: string; error: string }> = {
  write_resume: { running: 'Writing document…', done: 'Document rewritten', error: 'Write failed' },
  edit_resume_section: { running: 'Editing section…', done: 'Edit applied', error: 'Edit failed' },
  fetch_portfolio_item: { running: 'Fetching portfolio item…', done: 'Portfolio item fetched', error: 'Fetch failed' },
  write_content: { running: 'Writing content…', done: 'Content rewritten', error: 'Write failed' },
  edit_content_section: { running: 'Editing section…', done: 'Edit applied', error: 'Edit failed' },
}

function toolLabel(tc: { toolName: string; status: string }) {
  const labels = TOOL_LABELS[tc.toolName] || { running: `Running ${tc.toolName}…`, done: `${tc.toolName} done`, error: `${tc.toolName} failed` }
  return labels[tc.status as 'running' | 'done' | 'error'] || tc.toolName
}

function toolChipClass(status: string) {
  if (status === 'running') return 'bg-gray-700/50 border-gray-600 text-gray-300'
  if (status === 'error') return 'bg-red-900/30 border-red-700 text-red-300'
  return 'bg-green-900/20 border-green-800 text-green-300'
}

function send() {
  if (!draft.value.trim() || props.streaming) return
  emit('send', draft.value.trim())
  draft.value = ''
  if (textarea.value) textarea.value.style.height = 'auto'
}

function newline(event: KeyboardEvent) {
  event.preventDefault()
  if (!textarea.value) return
  const start = textarea.value.selectionStart
  const end = textarea.value.selectionEnd
  draft.value = draft.value.substring(0, start) + '\n' + draft.value.substring(end)
  nextTick(() => {
    if (textarea.value) textarea.value.selectionStart = textarea.value.selectionEnd = start + 1
  })
}

watch(() => props.messages, () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<style scoped>
.markdown-content :deep(p) { margin-bottom: 0.5em; }
.markdown-content :deep(p:last-child) { margin-bottom: 0; }
.markdown-content :deep(ul), .markdown-content :deep(ol) { margin-bottom: 0.5em; padding-left: 1.25em; }
.markdown-content :deep(code) {
  background-color: #374151;
  color: #93c5fd;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
}
.markdown-content :deep(strong) { color: #fff; font-weight: 600; }
</style>
