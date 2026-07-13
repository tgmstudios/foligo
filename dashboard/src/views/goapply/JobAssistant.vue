<template>
  <div class="w-full h-[calc(100dvh-16rem)] min-h-[32rem] overflow-hidden">
    <div class="w-full h-full grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
      <aside class="hidden lg:flex card min-h-0 flex-col overflow-hidden">
        <div class="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-white">Job Assistant</p>
            <p class="text-xs text-gray-400">Application workspaces</p>
          </div>
          <button @click="newSession" class="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white" title="New workspace">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-2">
          <p v-if="!sessions.length" class="text-xs text-gray-500 text-center py-8">No job workspaces yet.</p>
          <button
            v-for="session in sessions" :key="session.id" @click="openSession(session.id)"
            class="w-full text-left rounded-lg border p-3 transition-colors"
            :class="session.id === sessionId ? 'bg-primary-500/10 border-primary-500/60' : 'bg-gray-800/60 border-gray-700 hover:border-gray-600'"
          >
            <p class="text-sm font-medium text-white truncate">{{ session.job?.position || session.title }}</p>
            <p class="text-xs text-gray-400 truncate">{{ session.job?.company }}</p>
            <div class="mt-2 flex justify-between text-[11px] text-gray-500">
              <span>{{ session.messageCount }} messages</span><span>{{ relativeDate(session.updatedAt) }}</span>
            </div>
          </button>
        </div>
      </aside>

      <main class="card min-w-0 min-h-0 overflow-hidden flex flex-col">
        <template v-if="!sessionId">
          <div class="flex-1 overflow-y-auto p-5 sm:p-8">
            <div class="max-w-3xl mx-auto">
              <div class="mb-8">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20">Connected to GoApply + Foligo</span>
                <h1 class="text-2xl sm:text-3xl font-bold text-white mt-4">Start with a job, not a file</h1>
                <p class="text-gray-400 mt-2">The assistant uses the job’s linked resume and cover letter, then pulls profile, portfolio, and saved-answer details when needed.</p>
              </div>

              <label class="block text-sm font-medium text-gray-300 mb-2">Job application</label>
              <select v-model="selectedJobId" @change="applyJobDefaults" class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:outline-none">
                <option value="">Select a tracked job…</option>
                <option v-for="job in jobs" :key="job.id" :value="job.id">{{ job.position }} · {{ job.company }}</option>
              </select>
              <div v-if="selectedJob" class="mt-3 rounded-xl bg-gray-800/60 border border-gray-700 p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-white font-medium">{{ selectedJob.position }}</span>
                  <span class="text-gray-500">at</span><span class="text-gray-300">{{ selectedJob.company }}</span>
                  <span class="ml-auto text-xs capitalize px-2 py-1 rounded bg-gray-700 text-gray-300">{{ selectedJob.status }}</span>
                </div>
                <p v-if="selectedJob.notes" class="mt-2 text-sm text-gray-400 line-clamp-3">{{ selectedJob.notes }}</p>
              </div>

              <div class="mt-7 grid sm:grid-cols-2 gap-4">
                <AttachmentPicker title="Resumes" empty-text="No resumes yet" :items="resumeOptions" v-model="selectedResumeIds" />
                <AttachmentPicker title="Cover letters" empty-text="No cover letters yet" :items="coverLetterOptions" v-model="selectedCoverLetterIds" />
              </div>
              <p class="text-xs text-gray-500 mt-3">Linked documents are selected automatically. Add or remove optional context for this workspace—the assistant can still discover other Foligo information with tools.</p>

              <button @click="createSession" :disabled="!selectedJobId || creating" class="mt-8 w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {{ creating ? 'Creating workspace…' : 'Open assistant workspace' }}
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <header class="px-4 py-3 border-b border-gray-700 flex items-center gap-3 flex-shrink-0">
            <button @click="newSession" class="lg:hidden p-2 text-gray-400 hover:text-white"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button>
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-white truncate">{{ activeSession?.job?.position || activeSession?.title }}</h2>
              <p class="text-xs text-gray-400 truncate">{{ activeSession?.job?.company }} · {{ attachmentSummary }}</p>
            </div>
            <button @click="deleteCurrent" class="ml-auto p-2 text-gray-500 hover:text-red-400" title="Delete workspace"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" /></svg></button>
          </header>
          <details v-if="activeSession?.contextSummary" class="flex-shrink-0 border-b border-gray-700 bg-gray-900/30 group">
            <summary class="px-4 py-2 cursor-pointer select-none text-xs text-gray-400 hover:text-gray-200 flex items-center gap-2">
              <span class="transition-transform group-open:rotate-90">›</span>
              <span>Foligo context</span>
              <span class="text-gray-600">{{ contextObjectCount }} objects available</span>
            </summary>
            <div class="max-h-64 overflow-y-auto px-4 pb-4 grid md:grid-cols-2 gap-4 text-xs">
              <section v-for="section in contextSections" :key="section.title">
                <h3 class="font-semibold uppercase tracking-wide text-[10px] text-gray-500 mb-2">{{ section.title }}</h3>
                <div class="space-y-3">
                  <div v-for="group in section.groups" :key="group.group">
                    <p class="text-gray-300 font-medium">{{ group.group }} <span class="text-gray-600">({{ group.items.length }})</span></p>
                    <ul v-if="group.items.length" class="mt-1 space-y-1 pl-3 border-l border-gray-700">
                      <li v-for="item in group.items" :key="item.id" class="text-gray-400">
                        <span class="text-gray-200">{{ item.label }}</span>
                        <span class="block text-[10px] text-gray-600">{{ item.detail }}</span>
                      </li>
                    </ul>
                    <p v-else class="mt-1 text-gray-600">None</p>
                  </div>
                </div>
              </section>
            </div>
          </details>
          <StudioChatSidebar
            v-model="selectedProvider" :messages="chat.messages.value" :streaming="chat.streaming.value"
            placeholder="Ask about this application, tailor materials, or prepare for next steps…"
            empty-state-text="This workspace is grounded in your selected job and attachments. Ask for a fit analysis, resume feedback, a cover-letter plan, interview prep, or help with an application question."
            allow-attachments
            @send="sendMessage"
          />
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api, { API_URL } from '@/services/api'
import StudioChatSidebar from '@/components/studio/StudioChatSidebar.vue'
import { useAgenticChat } from '@/composables/useAgenticChat'
import type { GoApplyJob, CoverLetter } from '@/stores/goapply'

type Option = { id: string; label: string; linked: boolean }
type ContextItem = { id: string; label: string; detail: string }
type ContextGroup = { group: string; items: ContextItem[] }
type ContextSummary = { loaded: ContextGroup[]; discoverable: ContextGroup[] }
type Session = { id: string; title: string; jobId: string; chatHistory: Array<{ role: string; content: string }>; attachedResumeIds: string[]; attachedCoverLetterIds: string[]; messageCount?: number; updatedAt: string; job?: { id: string; company: string; position: string }; contextSummary?: ContextSummary }
type Resume = { id: string; name: string; linkedJobId?: string | null }

const AttachmentPicker = defineComponent({
  props: { title: { type: String, required: true }, emptyText: { type: String, required: true }, items: { type: Array as () => Option[], required: true }, modelValue: { type: Array as () => string[], required: true } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const toggle = (id: string) => emit('update:modelValue', props.modelValue.includes(id) ? props.modelValue.filter((v) => v !== id) : [...props.modelValue, id])
    return () => h('section', { class: 'rounded-xl border border-gray-700 bg-gray-800/40 p-4' }, [
      h('h3', { class: 'text-sm font-medium text-white mb-3' }, props.title),
      props.items.length ? h('div', { class: 'space-y-2 max-h-44 overflow-y-auto' }, props.items.map((item) => h('label', { class: 'flex items-start gap-2.5 cursor-pointer rounded-lg p-2 hover:bg-gray-700/40' }, [
        h('input', { type: 'checkbox', checked: props.modelValue.includes(item.id), onChange: () => toggle(item.id), class: 'mt-0.5 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500' }),
        h('span', { class: 'min-w-0' }, [h('span', { class: 'block text-sm text-gray-200 truncate' }, item.label), item.linked ? h('span', { class: 'text-[11px] text-primary-400' }, 'Linked to this job') : null]),
      ]))) : h('p', { class: 'text-sm text-gray-500' }, props.emptyText),
    ])
  },
})

const route = useRoute(); const router = useRouter(); const toast = useToast()
const jobs = ref<GoApplyJob[]>([]); const resumes = ref<Resume[]>([]); const coverLetters = ref<CoverLetter[]>([]); const sessions = ref<Session[]>([])
const selectedJobId = ref(''); const selectedResumeIds = ref<string[]>([]); const selectedCoverLetterIds = ref<string[]>([])
const activeSession = ref<Session | null>(null); const creating = ref(false); const selectedProvider = ref<string | undefined>()
const sessionId = computed(() => (route.params.sessionId as string) || '')
const selectedJob = computed(() => jobs.value.find((job) => job.id === selectedJobId.value))
const resumeOptions = computed<Option[]>(() => resumes.value.map((r) => ({ id: r.id, label: r.name, linked: r.linkedJobId === selectedJobId.value })))
const coverLetterOptions = computed<Option[]>(() => coverLetters.value.map((c) => ({ id: c.id, label: c.title, linked: c.jobId === selectedJobId.value })))
const attachmentSummary = computed(() => `${activeSession.value?.attachedResumeIds?.length || 0} resume(s), ${activeSession.value?.attachedCoverLetterIds?.length || 0} cover letter(s)`)
const contextSections = computed(() => [
  { title: 'Loaded into this workspace', groups: activeSession.value?.contextSummary?.loaded || [] },
  { title: 'Discoverable by the assistant', groups: activeSession.value?.contextSummary?.discoverable || [] },
])
const contextObjectCount = computed(() => contextSections.value.reduce((total, section) => total + section.groups.reduce((count, group) => count + group.items.length, 0), 0))

const chat = useAgenticChat(() => `${API_URL}/goapply/assistant/sessions/${sessionId.value}/chat`, {}, () => selectedProvider.value)

function applyJobDefaults() {
  selectedResumeIds.value = resumes.value.filter((r) => r.linkedJobId === selectedJobId.value).map((r) => r.id)
  selectedCoverLetterIds.value = coverLetters.value.filter((c) => c.jobId === selectedJobId.value).map((c) => c.id)
}
async function loadData() {
  const [jobRes, resumeRes, letterRes, sessionRes] = await Promise.all([api.get('/goapply/jobs'), api.get('/resume/documents'), api.get('/goapply/cover-letters'), api.get('/goapply/assistant/sessions')])
  jobs.value = jobRes.data; resumes.value = resumeRes.data; coverLetters.value = Array.isArray(letterRes.data) ? letterRes.data : letterRes.data.letters || []; sessions.value = sessionRes.data
}
async function createSession() {
  creating.value = true
  try {
    const { data } = await api.post('/goapply/assistant/sessions', { jobId: selectedJobId.value, resumeIds: selectedResumeIds.value, coverLetterIds: selectedCoverLetterIds.value })
    await loadData(); await router.push({ name: 'goapply-assistant-session', params: { sessionId: data.id } }); await openSession(data.id, false)
  } catch (error: any) { toast.error(error.response?.data?.message || 'Could not create assistant workspace') } finally { creating.value = false }
}
async function openSession(id: string, navigate = true) {
  try {
    const { data } = await api.get(`/goapply/assistant/sessions/${id}`); activeSession.value = data; chat.loadHistory(data.chatHistory || [])
    if (navigate && sessionId.value !== id) await router.push({ name: 'goapply-assistant-session', params: { sessionId: id } })
  } catch (error: any) { toast.error(error.response?.data?.message || 'Could not open assistant workspace'); newSession() }
}
function newSession() { activeSession.value = null; chat.reset(); selectedJobId.value = ''; selectedResumeIds.value = []; selectedCoverLetterIds.value = []; router.push({ name: 'goapply-assistant' }) }
async function sendMessage(message: string, files: File[]) { await chat.sendMessage(message, files); await loadData() }
async function deleteCurrent() {
  if (!sessionId.value || !confirm('Delete this assistant workspace?')) return
  await api.delete(`/goapply/assistant/sessions/${sessionId.value}`); toast.success('Workspace deleted'); newSession(); await loadData()
}
function relativeDate(value: string) { const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000); return minutes < 1 ? 'now' : minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${Math.floor(minutes / 60)}h` : `${Math.floor(minutes / 1440)}d` }

onMounted(async () => { try { await loadData(); if (sessionId.value) await openSession(sessionId.value, false) } catch { toast.error('Could not load Job Assistant') } })
</script>
