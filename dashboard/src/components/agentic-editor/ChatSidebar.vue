<template>
  <div class="chat-sidebar flex-1 flex flex-col min-h-0 min-w-0 overflow-x-hidden">
    <div
      ref="scrollContainer"
      class="flex-1 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain p-4 space-y-4"
      @scroll="updateFollowState"
    >
      <div v-if="messages.length === 0" class="text-center py-10 text-gray-400 text-sm px-4">
        {{ emptyStateText }}
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        :class="['flex w-full min-w-0 items-start space-x-2.5', message.role === 'user' ? 'flex-row-reverse space-x-reverse' : '']"
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
          <template v-if="message.role === 'user'">
            <div
              class="text-sm leading-relaxed markdown-content markdown-content-user"
              v-html="renderMarkdown(message.content)"
            ></div>
            <div v-if="message.attachments?.length" class="mt-2 flex flex-wrap gap-1.5">
              <span v-for="file in message.attachments" :key="file.name" class="inline-flex max-w-full items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/90">
                <span aria-hidden="true">📎</span><span class="truncate">{{ file.name }}</span>
              </span>
            </div>
          </template>

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
            <div v-if="message.toolActivity && message.toolActivity.length > 0" class="mb-2 space-y-2">
              <section v-for="group in groupedToolActivity(message.toolActivity)" :key="group.label">
                <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{{ group.label }}</p>
                <div class="space-y-1">
                  <div v-for="tc in group.items" :key="tc.id" class="flex items-center space-x-1.5 text-xs px-2 py-1 rounded-md border" :class="toolChipClass(tc.status)">
                    <svg v-if="tc.status === 'running'" class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <svg v-else-if="tc.status === 'error'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                    <span>{{ toolLabel(tc) }}</span>
                  </div>
                </div>
              </section>
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
      <div v-if="pendingFiles.length" class="mb-2 flex flex-wrap gap-2">
        <span v-for="(file, index) in pendingFiles" :key="`${file.name}-${index}`" class="inline-flex max-w-full items-center gap-1.5 rounded-md border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-200">
          <span class="max-w-48 truncate">{{ file.name }}</span>
          <button type="button" class="text-gray-400 hover:text-white" :aria-label="`Remove ${file.name}`" @click="removeFile(index)">×</button>
        </span>
      </div>
      <div class="flex items-end space-x-2">
        <input ref="fileInput" type="file" multiple class="hidden" accept=".pdf,.docx,.txt,.md,.csv,.json,.html,.htm,.xml,.rtf" @change="selectFiles" />
        <button v-if="allowAttachments" type="button" :disabled="streaming || pendingFiles.length >= 5" class="h-[40px] flex-shrink-0 rounded-lg border border-gray-600 px-3 text-gray-300 hover:bg-gray-700 disabled:opacity-50" title="Attach files" @click="fileInput?.click()">📎</button>
        <textarea
          ref="textarea"
          v-model="draft"
          @keydown.enter.exact.prevent="send"
          @keydown.enter.ctrl.exact="newline"
          @keydown.enter.meta.exact="newline"
          :disabled="streaming"
          :placeholder="placeholder"
          rows="1"
          class="chat-textarea flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 resize-none overflow-y-auto min-h-[40px] max-h-[160px] text-sm leading-relaxed"
        ></textarea>
        <button
          v-if="streaming"
          @click="$emit('stop')"
          title="Stop generating"
          class="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 h-[40px] flex-shrink-0"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1.5" />
          </svg>
        </button>
        <button
          v-else
          @click="send"
          :disabled="!draft.trim() && !pendingFiles.length"
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
import type { AgenticChatMessage, ToolActivity } from '@/composables/useAgenticChat'

const props = withDefaults(defineProps<{
  messages: AgenticChatMessage[]
  streaming: boolean
  placeholder?: string
  emptyStateText?: string
  allowAttachments?: boolean
}>(), {
  placeholder: 'Ask the agent to edit this document…',
  emptyStateText: 'Ask the agent to draft a section, make an edit, or tweak wording — it\'ll edit the document directly.',
})

const emit = defineEmits<{
  (e: 'send', message: string, files: File[]): void
  (e: 'stop'): void
}>()

const draft = ref('')
const pendingFiles = ref<File[]>([])
const fileInput = ref<HTMLInputElement>()
const textarea = ref<HTMLTextAreaElement>()
const scrollContainer = ref<HTMLDivElement>()
const shouldFollowChat = ref(true)

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
  get_resume: { running: 'Reading resume…', done: 'Resume loaded', error: 'Resume unavailable' },
  get_cover_letter: { running: 'Reading cover letter…', done: 'Cover letter loaded', error: 'Cover letter unavailable' },
  get_goapply_profile: { running: 'Checking GoApply profile…', done: 'Profile loaded', error: 'Profile unavailable' },
  get_saved_answers: { running: 'Searching saved answers…', done: 'Saved answers loaded', error: 'Search failed' },
  get_portfolio_item: { running: 'Reading Foligo item…', done: 'Foligo item loaded', error: 'Item unavailable' },
  save_resume: { running: 'Saving resume…', done: 'Resume saved', error: 'Resume save failed' },
  save_cover_letter: { running: 'Saving cover letter…', done: 'Cover letter saved', error: 'Cover letter save failed' },
  save_answers: { running: 'Saving reusable answers…', done: 'Saved answers updated', error: 'Answer save failed' },
  update_goapply_profile: { running: 'Updating GoApply profile…', done: 'GoApply profile updated', error: 'Profile update failed' },
  save_skills: { running: 'Saving Foligo skills…', done: 'Foligo skills saved', error: 'Skill save failed' },
  create_portfolio_items: { running: 'Creating Foligo items…', done: 'Foligo items created', error: 'Item creation failed' },
  write_content: { running: 'Writing content…', done: 'Content rewritten', error: 'Write failed' },
  edit_content_section: { running: 'Editing section…', done: 'Edit applied', error: 'Edit failed' },
}

function parsedOutput(output: unknown): any {
  if (typeof output !== 'string') return output
  try { return JSON.parse(output) } catch { return null }
}

function objectLabel(tc: ToolActivity) {
  const result = parsedOutput(tc.output)
  if (!result || tc.status !== 'done') return ''
  if (result.objectType === 'resume') return result.object?.name || 'Resume'
  if (result.objectType === 'coverLetter') return result.object?.title || 'Cover letter'
  if (result.objectType === 'portfolioItem') return result.object?.title || `${result.objects?.length || 0} portfolio item${result.objects?.length === 1 ? '' : 's'}`
  if (result.objectType === 'skill') return `${result.objects?.length || 0} skill${result.objects?.length === 1 ? '' : 's'} in ${result.project?.name || 'Foligo'}`
  if (result.objectType === 'profile') {
    if (result.action === 'updated') return `${result.object?.fields?.length || 0} profile fields`
    const jobs = result.object?.linkedJobs?.length || 0
    const education = result.object?.linkedEducation?.length || 0
    const skills = result.object?.linkedSkills?.length || 0
    return `Profile · ${jobs} experience, ${education} education, ${skills} skills`
  }
  if (result.objectType === 'savedAnswer') return `${result.objects?.length || 0} saved answer${result.objects?.length === 1 ? '' : 's'}`
  return ''
}

function toolLabel(tc: ToolActivity) {
  const labels = TOOL_LABELS[tc.toolName] || { running: `Running ${tc.toolName}…`, done: `${tc.toolName} done`, error: `${tc.toolName} failed` }
  const label = labels[tc.status as 'running' | 'done' | 'error'] || tc.toolName
  const object = objectLabel(tc)
  return object ? `${label}: ${object}` : label
}

function groupedToolActivity(activity: ToolActivity[]) {
  const groups = [
    { label: 'Loaded from Foligo', items: activity.filter((item) => item.toolName.startsWith('get_') || item.toolName === 'fetch_portfolio_item') },
    { label: 'Saved to Foligo / GoApply', items: activity.filter((item) => item.toolName.startsWith('save_') || item.toolName.startsWith('create_') || item.toolName === 'update_goapply_profile') },
    { label: 'Document actions', items: activity.filter((item) => !item.toolName.startsWith('get_') && !item.toolName.startsWith('save_') && !item.toolName.startsWith('create_') && item.toolName !== 'fetch_portfolio_item' && item.toolName !== 'update_goapply_profile') },
  ]
  return groups.filter((group) => group.items.length)
}

function toolChipClass(status: string) {
  if (status === 'running') return 'bg-gray-700/50 border-gray-600 text-gray-300'
  if (status === 'error') return 'bg-red-900/30 border-red-700 text-red-300'
  return 'bg-green-900/20 border-green-800 text-green-300'
}

function autoResize() {
  if (!textarea.value) return
  textarea.value.style.height = 'auto'
  textarea.value.style.height = `${textarea.value.scrollHeight}px`
}

watch(draft, () => {
  nextTick(autoResize)
})

function send() {
  if ((!draft.value.trim() && !pendingFiles.value.length) || props.streaming) return
  emit('send', draft.value.trim(), [...pendingFiles.value])
  draft.value = ''
  pendingFiles.value = []
  if (fileInput.value) fileInput.value.value = ''
  if (textarea.value) textarea.value.style.height = 'auto'
}

function selectFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  pendingFiles.value = [...pendingFiles.value, ...files].slice(0, 5)
  input.value = ''
}

function removeFile(index: number) { pendingFiles.value.splice(index, 1) }

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

function updateFollowState() {
  const container = scrollContainer.value
  if (!container) return
  // Stay with a streamed reply only while the reader remains at the bottom.
  // The threshold also treats a just-completed scroll-to-bottom as following.
  shouldFollowChat.value = container.scrollHeight - container.scrollTop - container.clientHeight <= 4
}

watch(() => props.messages, () => {
  if (!shouldFollowChat.value) return
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<style scoped>
.markdown-content :deep(p) { margin-bottom: 0.65em; }
.markdown-content {
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.markdown-content :deep(*) { max-width: 100%; }
.markdown-content :deep(p:last-child) { margin-bottom: 0; }
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin: 1rem 0 0.45rem;
  color: #f9fafb;
  font-weight: 650;
  line-height: 1.3;
}
.markdown-content :deep(h1:first-child),
.markdown-content :deep(h2:first-child),
.markdown-content :deep(h3:first-child),
.markdown-content :deep(h4:first-child) { margin-top: 0; }
.markdown-content :deep(h1) { font-size: 1.25rem; }
.markdown-content :deep(h2) { font-size: 1.1rem; }
.markdown-content :deep(h3) { font-size: 1rem; }
.markdown-content :deep(h4) { font-size: 0.9rem; }
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.35rem 0 0.7rem;
  padding-left: 1.4rem;
}
.markdown-content :deep(ul) { list-style-type: disc; }
.markdown-content :deep(ol) { list-style-type: decimal; }
.markdown-content :deep(ul ul) { list-style-type: circle; }
.markdown-content :deep(ul ul ul) { list-style-type: square; }
.markdown-content :deep(ol ol) { list-style-type: lower-alpha; }
.markdown-content :deep(li) {
  display: list-item;
  margin: 0.2rem 0;
  padding-left: 0.15rem;
}
.markdown-content :deep(li::marker) { color: #93c5fd; font-weight: 600; }
.markdown-content :deep(li > p) { margin: 0.2rem 0; }
.markdown-content :deep(li > ul),
.markdown-content :deep(li > ol) { margin: 0.25rem 0; }
.markdown-content :deep(a) {
  color: #60a5fa;
  text-decoration: underline;
  text-decoration-color: rgb(96 165 250 / 0.55);
  text-underline-offset: 0.15em;
}
.markdown-content :deep(a:hover) { color: #93c5fd; text-decoration-color: currentColor; }
.markdown-content :deep(blockquote) {
  margin: 0.75rem 0;
  border-left: 3px solid #60a5fa;
  border-radius: 0 0.25rem 0.25rem 0;
  background-color: rgb(31 41 55 / 0.55);
  padding: 0.55rem 0.75rem;
  color: #d1d5db;
}
.markdown-content :deep(blockquote > :last-child) { margin-bottom: 0; }
.markdown-content :deep(hr) { margin: 1rem 0; border: 0; border-top: 1px solid #4b5563; }
.markdown-content :deep(:not(pre) > code) {
  background-color: #374151;
  color: #93c5fd;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.markdown-content :deep(pre) {
  margin: 0.75rem 0;
  max-width: 100%;
  overflow-x: hidden;
  border: 1px solid #4b5563;
  border-radius: 0.5rem;
  background-color: #111827;
  padding: 0.75rem 0.875rem;
  color: #d1d5db;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  tab-size: 2;
}
.markdown-content :deep(pre code) {
  display: block;
  min-width: 0;
  white-space: inherit;
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.8rem;
  line-height: 1.55;
}
.markdown-content :deep(pre:first-child) { margin-top: 0; }
.markdown-content :deep(pre:last-child) { margin-bottom: 0; }
.markdown-content-user :deep(pre) {
  border-color: rgb(255 255 255 / 0.25);
  background-color: rgb(17 24 39 / 0.75);
}
.markdown-content :deep(table) {
  display: block;
  width: max-content;
  max-width: 100%;
  margin: 0.75rem 0;
  overflow-x: auto;
  border: 1px solid #4b5563;
  border-radius: 0.5rem;
  border-collapse: separate;
  border-spacing: 0;
  background-color: rgb(17 24 39 / 0.45);
  font-size: 0.8rem;
  line-height: 1.4;
}
.markdown-content :deep(th),
.markdown-content :deep(td) {
  min-width: 7rem;
  padding: 0.55rem 0.7rem;
  border-right: 1px solid #374151;
  border-bottom: 1px solid #374151;
  text-align: left;
  vertical-align: top;
}
.markdown-content :deep(th) {
  background-color: #1f2937;
  color: #f9fafb;
  font-weight: 600;
  white-space: nowrap;
}
.markdown-content :deep(tbody tr:nth-child(even) td) { background-color: rgb(31 41 55 / 0.45); }
.markdown-content :deep(tr:last-child td) { border-bottom: 0; }
.markdown-content :deep(th:last-child),
.markdown-content :deep(td:last-child) { border-right: 0; }
.markdown-content :deep(table:first-child) { margin-top: 0; }
.markdown-content :deep(table:last-child) { margin-bottom: 0; }
.markdown-content :deep(table::-webkit-scrollbar) { height: 0.45rem; }
.markdown-content :deep(table::-webkit-scrollbar-track) { background: #111827; }
.markdown-content :deep(table::-webkit-scrollbar-thumb) { background: #4b5563; border-radius: 9999px; }
.markdown-content-user :deep(table) { border-color: rgb(255 255 255 / 0.3); background-color: rgb(17 24 39 / 0.25); }
.markdown-content-user :deep(th) { background-color: rgb(17 24 39 / 0.45); }
.markdown-content-user :deep(th),
.markdown-content-user :deep(td) { border-color: rgb(255 255 255 / 0.18); }
.markdown-content-user :deep(li::marker) { color: #fff; }
.markdown-content-user :deep(a) { color: #fff; text-decoration-color: rgb(255 255 255 / 0.65); }
.markdown-content-user :deep(blockquote) { border-left-color: rgb(255 255 255 / 0.7); background-color: rgb(17 24 39 / 0.2); color: #fff; }
.markdown-content :deep(strong) { color: #fff; font-weight: 600; }

.chat-textarea {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 transparent;
}
.chat-textarea::-webkit-scrollbar { width: 0.4rem; }
.chat-textarea::-webkit-scrollbar-track { background: transparent; }
.chat-textarea::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 9999px; }
.chat-textarea::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
</style>
