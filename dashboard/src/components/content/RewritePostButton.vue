<template>
  <button type="button" :disabled="disabled || !source.trim()" title="Rewrite with AI" aria-label="Rewrite with AI" class="p-2 rounded-lg text-primary-200 border border-primary-500/40 bg-primary-500/10 hover:bg-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed" @click="open"><SparklesIcon class="h-5 w-5" /></button>
  <Teleport to="body">
    <dialog ref="dialog" aria-labelledby="rewrite-title" class="w-[min(72rem,95vw)] max-h-[90vh] p-0 rounded-xl border border-gray-600 bg-gray-900 text-white backdrop:bg-black/75" @close="cleanup" @cancel="cleanup">
      <div class="p-5 sm:p-6 space-y-5">
        <div class="flex items-start justify-between gap-4">
          <div><h2 id="rewrite-title" class="text-xl font-semibold">Rewrite this post</h2><p class="text-sm text-gray-400 mt-1">Review and edit the suggestion before applying it. Applying replaces the editor text; use Save when you’re ready to keep it.</p></div>
          <button type="button" aria-label="Close rewrite" class="px-2 py-1 rounded hover:bg-gray-700" @click="dialog?.close()">✕</button>
        </div>
        <p class="text-sm text-gray-400"><span v-if="profileLoading">Checking your writing profile…</span><span v-else-if="profileError">Couldn’t check your writing profile. The rewrite will still try to load your saved preferences.</span><span v-else-if="hasProfile">Your saved writing profile will guide the rewrite.</span><span v-else>You have no saved writing profile. You can still rewrite, or <RouterLink :to="{ name: 'settings' }" class="text-primary-300 underline">build your writing profile in Settings</RouterLink>.</span></p>
        <div class="grid md:grid-cols-2 gap-4">
          <div><label for="rewrite-goal" class="block text-sm text-gray-300 mb-2">What would you like to change?</label><select id="rewrite-goal" v-model="goal" :disabled="busy" class="w-full rounded-lg bg-gray-800 border-gray-600 text-white"><option value="voice">Match my writing voice</option><option value="clarity">Improve clarity and flow</option><option value="concise">Make it concise</option><option value="engaging">Make it more engaging</option><option value="polish">Light copyedit</option></select></div>
          <div><label for="rewrite-instructions" class="block text-sm text-gray-300 mb-2">Extra direction (optional)</label><textarea id="rewrite-instructions" v-model="instructions" :disabled="busy" rows="2" maxlength="1000" class="w-full rounded-lg bg-gray-800 border-gray-600 text-white" placeholder="For example: keep the opening, use shorter paragraphs." /><p class="text-xs text-gray-500 mt-1">{{ instructions.length }}/1,000</p></div>
        </div>
        <div class="flex flex-wrap items-center gap-3"><button type="button" :disabled="busy || !canGenerate" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50" @click="generate">{{ busy ? 'Rewriting…' : result ? 'Generate another rewrite' : 'Generate rewrite' }}</button><button v-if="busy" type="button" class="text-sm text-gray-300 underline" @click="cancelRequest">Stop</button><p class="text-xs text-gray-400">Uses your current editor text, including unsaved edits. Nothing is published by this action.</p></div>
        <p v-if="!canGenerate" class="text-sm text-amber-300" role="status">Rewrite supports posts up to 60,000 characters. Shorten the content before trying again.</p>
        <p v-if="error" class="text-sm text-red-300" role="alert">{{ error }}</p>
        <p v-if="stale && result" class="text-sm text-amber-300" role="alert">The editor text changed after this rewrite started. Generate a new rewrite to include your latest changes before applying.</p>
        <p v-if="settingsChanged && result" class="text-sm text-amber-300" role="status">Your rewrite direction changed. Generate another rewrite to use the new direction.</p>
        <template v-if="result">
          <div class="grid lg:grid-cols-2 gap-4">
            <div><label for="rewrite-original" class="block text-sm text-gray-300 mb-2">Original · {{ wordCount(original) }} words</label><textarea id="rewrite-original" :value="original" readonly rows="14" class="w-full rounded-lg border-gray-700 bg-gray-800 text-gray-300 text-sm font-mono" /></div>
            <div><label for="rewrite-result" class="block text-sm text-gray-300 mb-2">Suggested rewrite · {{ wordCount(result) }} words · editable</label><textarea id="rewrite-result" v-model="result" :disabled="busy" maxlength="60000" rows="14" class="w-full rounded-lg border-gray-600 bg-gray-800 text-white text-sm font-mono" /></div>
          </div>
          <details class="text-sm"><summary class="cursor-pointer text-gray-300">Show changes (removed text struck through, additions underlined)</summary><pre class="mt-3 p-4 rounded-lg bg-gray-950 whitespace-pre-wrap break-words max-h-80 overflow-auto"><template v-for="(part, index) in changes" :key="index"><del v-if="part.removed" class="bg-red-950 text-red-200">{{ part.value }}</del><ins v-else-if="part.added" class="bg-green-950 text-green-200">{{ part.value }}</ins><span v-else class="text-gray-400">{{ part.value }}</span></template></pre></details>
          <p class="text-xs text-gray-400">Check facts, links, formatting, and code. AI may make mistakes. Your title, metadata, and publication status are unchanged.</p>
        </template>
        <div class="flex flex-wrap justify-end gap-3 border-t border-gray-700 pt-4">
          <button type="button" class="px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg" @click="dialog?.close()">Discard and close</button>
          <button v-if="result" type="button" :disabled="disabled || busy || stale || settingsChanged || !result.trim() || result === original" class="px-4 py-2 bg-primary-600 rounded-lg disabled:opacity-50" @click="apply">Apply to editor</button>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { diffLines } from 'diff'
import { SparklesIcon } from '@heroicons/vue/24/outline'
import api, { aiApi } from '@/services/api'
const props = defineProps<{ postId: string; source: string; provider?: string; disabled?: boolean }>()
const emit = defineEmits<{ (e: 'apply', content: string): void }>()
const dialog = ref<HTMLDialogElement>()
const goal = ref('voice'), instructions = ref(''), busy = ref(false), result = ref(''), original = ref(''), error = ref('')
const generatedPostId = ref(''), generatedSettings = ref('')
const profileLoading = ref(false), hasProfile = ref(false), profileError = ref(false)
let controller: AbortController | null = null
const stale = computed(() => props.source !== original.value || props.postId !== generatedPostId.value)
const settings = computed(() => JSON.stringify([goal.value, instructions.value, props.provider]))
const settingsChanged = computed(() => settings.value !== generatedSettings.value)
const canGenerate = computed(() => props.source.trim().length > 0 && props.source.length <= 60000)
const changes = computed(() => diffLines(original.value, result.value))
const wordCount = (text: string) => text.trim() ? text.trim().split(/\s+/u).length : 0
async function open() {
  result.value = error.value = ''; profileLoading.value = true; profileError.value = false
  dialog.value?.showModal()
  try { hasProfile.value = !!(await api.get('/users/me/writing-style')).data.writingStyle }
  catch { profileError.value = true }
  finally { profileLoading.value = false }
}
function cancelRequest() { controller?.abort(); controller = null; busy.value = false }
function cleanup() { cancelRequest(); result.value = ''; error.value = '' }
async function generate() {
  if (!canGenerate.value || busy.value) return
  busy.value = true; error.value = ''; result.value = ''
  original.value = props.source; generatedPostId.value = props.postId; generatedSettings.value = settings.value
  const requestController = new AbortController(); controller = requestController
  try {
    const { data } = await aiApi.post(`/ai/posts/${props.postId}/rewrite`, { content: original.value, goal: goal.value, instructions: instructions.value, provider: props.provider }, { signal: requestController.signal })
    if (!requestController.signal.aborted) result.value = data.content
  } catch (err: any) {
    if (!requestController.signal.aborted) error.value = err.response?.data?.message || 'Couldn’t rewrite this post. Your editor text is unchanged. Please try again.'
  } finally { if (controller === requestController) { controller = null; busy.value = false } }
}
function apply() {
  if (props.disabled || busy.value || stale.value || settingsChanged.value || !result.value.trim()) return
  emit('apply', result.value)
  dialog.value?.close()
}
watch(() => props.postId, () => dialog.value?.close())
onBeforeUnmount(cleanup)
</script>
