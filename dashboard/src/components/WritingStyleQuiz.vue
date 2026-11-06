<template>
  <section class="bg-gray-800 rounded-lg border border-gray-700 p-6" aria-labelledby="writing-style-title">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 id="writing-style-title" class="text-lg font-semibold text-white">Your writing voice</h3>
        <p class="text-sm text-gray-400 mt-1 max-w-3xl">Build a writing profile from comparisons, your own words, and a test draft. Help AI sound like you while adapting to what you’re writing.</p>
      </div>
      <span class="text-xs text-primary-300 rounded-full bg-primary-500/10 px-3 py-1">Optional · about 5–8 minutes</span>
    </div>
    <p v-if="loading" class="mt-4 text-gray-400" role="status">Loading your writing profile…</p>
    <p v-else-if="loadError" class="mt-4 text-red-400" role="alert">Couldn’t load your profile. <button class="underline" @click="load">Try again</button></p>
    <template v-else>
      <div v-if="!editing" class="mt-5 space-y-4">
        <template v-if="saved">
          <div class="flex flex-wrap gap-2">
            <span v-for="item in describe(saved)" :key="item.key" class="text-xs px-3 py-1 rounded-full border border-gray-600 text-gray-200">{{ item.label }}</span>
          </div>
          <p class="text-sm text-gray-400">{{ evidence(saved) }} {{ saved.version === 2 ? 'Context-specific tone and your preferences guide future drafts.' : 'You have a basic profile. Expand it with context, finer details, and writing samples.' }}</p>
        </template>
        <p v-else class="text-sm text-gray-300">Six sections: context, voice, composition, finishing touches, writing samples, and review. There are no right answers. Choose “no preference” wherever your style varies.</p>
        <div class="flex flex-wrap gap-3">
          <button class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg" :disabled="saving" @click="start">{{ saved ? 'Edit writing profile' : 'Build my writing profile' }}</button>
          <button v-if="saved" :disabled="saving" class="px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50" @click="save(null)">{{ saving ? 'Removing…' : 'Remove saved profile' }}</button>
        </div>
      </div>
      <form v-else class="mt-6 space-y-6" @submit.prevent="next">
        <div>
          <div class="flex items-center justify-between gap-3 text-sm text-gray-400 mb-2"><span>Step {{ step + 1 }} of {{ sections.length }}</span><span>Your answers are saved only when you finish</span></div>
          <progress class="w-full h-2 accent-primary-500" :value="step + 1" :max="sections.length" aria-label="Writing profile progress" />
          <h4 ref="stepHeading" tabindex="-1" class="mt-4 text-xl font-semibold text-white focus:outline-none">{{ sections[step].title }}</h4>
          <p class="mt-1 text-sm text-gray-400">{{ sections[step].hint }}</p>
        </div>

        <div v-if="step === 0" class="space-y-5">
          <p class="rounded-lg bg-gray-900/60 p-4 text-sm text-gray-300">Your voice can change with your audience. Set any context-specific tone here; the next sections establish your general defaults.</p>
          <div v-for="context in catalog.contexts" :key="context.key">
            <label :for="`context-${context.key}`" class="block text-sm text-gray-200 mb-2">{{ context.label }}</label>
            <select :id="`context-${context.key}`" v-model="draft.contexts[context.key]" class="w-full rounded-lg bg-gray-700 border-gray-600 text-white">
              <option value="inherit">Use my general tone</option>
              <option v-for="option in toneOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
        </div>

        <div v-else-if="step >= 1 && step <= 3" class="space-y-7">
          <fieldset v-for="question in groupQuestions" :key="question.key">
            <legend class="text-white font-medium">{{ question.title }}</legend>
            <p :id="`hint-${question.key}`" class="text-sm text-gray-400 mt-1 mb-3">{{ question.hint }}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label v-for="option in question.options" :key="option.value" class="flex gap-3 p-4 border rounded-lg cursor-pointer transition-colors" :class="draft[question.key] === option.value ? 'border-primary-400 bg-primary-500/10' : 'border-gray-600 hover:border-gray-400'">
                <input v-model="draft[question.key]" type="radio" :name="question.key" :value="option.value" :aria-describedby="`hint-${question.key}`" class="mt-1" />
                <span><span class="block text-white text-sm font-medium">{{ option.label }}</span><span class="block text-sm text-gray-400 mt-1 whitespace-pre-line">{{ option.example }}</span></span>
              </label>
            </div>
          </fieldset>
          <fieldset v-if="step === 3">
            <legend class="font-medium text-white mb-2">Anything you prefer to leave out?</legend>
            <p class="text-sm text-gray-400 mb-3">Optional. Select all that apply; leaving these unchecked adds no exclusions.</p>
            <div class="flex flex-wrap gap-3">
              <label v-for="option in catalog.avoidOptions" :key="option.value" class="flex items-center gap-2 border border-gray-600 rounded-lg p-3 text-sm text-gray-200"><input v-model="draft.avoid" type="checkbox" :value="option.value" />{{ option.label }}</label>
            </div>
          </fieldset>
        </div>

        <div v-else-if="step === 4" class="space-y-5">
          <p class="p-4 bg-gray-900/60 rounded-lg text-sm text-gray-300">Optional: share words you wrote yourself and still like. Samples give the AI examples beyond labels. Use different contexts if helpful; do not include private details, client information, or writing you do not have permission to share. No minimum length is required.</p>
          <div v-if="draft.sample" class="rounded-lg border border-gray-600 p-4">
            <label for="legacy-sample" class="block text-sm text-gray-200 mb-2">Your previously saved sample</label>
            <textarea id="legacy-sample" v-model="draft.sample" rows="3" maxlength="2000" class="w-full rounded-lg bg-gray-700 border-gray-600 text-white" />
            <p class="text-xs text-gray-400 mt-1">{{ draft.sample.length }}/2,000</p>
          </div>
          <div v-for="(sample, index) in draft.samples" :key="index" class="border border-gray-600 rounded-lg p-4 space-y-3">
            <div class="flex justify-between items-center gap-3"><label :for="`sample-${index}`" class="font-medium text-sm text-white">Writing sample {{ index + 1 }}</label><button type="button" class="text-sm text-gray-400 hover:text-white" @click="draft.samples.splice(index, 1)">Remove sample {{ index + 1 }}</button></div>
            <label :for="`sample-context-${index}`" class="block text-sm text-gray-400">Where would you use this voice?</label>
            <select :id="`sample-context-${index}`" v-model="sample.context" class="w-full rounded-lg bg-gray-700 border-gray-600 text-white"><option value="general">General writing</option><option v-for="c in catalog.contexts" :key="c.key" :value="c.key">{{ c.label }}</option></select>
            <textarea :id="`sample-${index}`" v-model="sample.text" rows="5" maxlength="3000" class="w-full rounded-lg bg-gray-700 border-gray-600 text-white" placeholder="Paste a paragraph that sounds like you…" />
            <p class="text-xs text-gray-400">{{ sample.text.length }}/3,000 characters</p>
          </div>
          <button v-if="draft.samples.length < 2" type="button" class="text-sm text-primary-300 hover:text-primary-200" @click="draft.samples.push({ context: 'general', text: '' })">+ Add a writing sample</button>
          <div>
            <label for="voice-exercise" class="block text-sm font-medium text-white">Or try a short writing exercise</label>
            <p id="exercise-hint" class="text-sm text-gray-400 my-2">In your own words, tell a colleague: your team tested a website, found a navigation problem, simplified the navigation, and will prepare for launch next. Keep the facts, but write it how you normally would. This can be a starting point if you have no samples handy.</p>
            <textarea id="voice-exercise" v-model="draft.exercise" aria-describedby="exercise-hint" rows="4" maxlength="1500" class="w-full rounded-lg bg-gray-700 border-gray-600 text-white" />
            <p class="text-xs text-gray-400 mt-1">{{ draft.exercise.length }}/1,500 characters · Optional</p>
          </div>
        </div>

        <div v-else class="space-y-6">
          <div class="rounded-lg border border-gray-600 p-4">
            <div class="flex justify-between gap-3"><h5 class="text-white font-medium">Your style brief</h5><span class="text-xs text-gray-400">{{ evidence(draft) }}</span></div>
            <dl class="grid sm:grid-cols-2 gap-4 mt-4">
              <div v-for="item in describe(draft, true)" :key="item.key"><dt class="text-xs text-gray-400">{{ item.title }}</dt><dd class="text-sm text-gray-200 mt-1">{{ item.label }}</dd></div>
            </dl>
            <div class="border-t border-gray-700 mt-4 pt-4 space-y-2">
              <p v-for="c in catalog.contexts" :key="c.key" class="text-sm text-gray-300">{{ c.label }}: {{ toneOptions.find(o => o.value === draft.contexts[c.key])?.label || 'Use my general tone' }}</p>
              <p class="text-sm text-gray-300">Avoid: {{ catalog.avoidOptions.filter(o => draft.avoid.includes(o.value)).map(o => o.label).join(', ') || 'No additional exclusions' }}</p>
            </div>
            <div class="flex flex-wrap gap-3 mt-4"><button v-for="(section, index) in sections.slice(0, 5)" :key="section.title" type="button" class="text-xs text-primary-300 underline" @click="goTo(index)">Edit {{ section.short }}</button></div>
          </div>
          <div>
            <label for="style-notes" class="block text-sm font-medium text-white">Anything else that makes writing sound like you?</label>
            <p class="text-sm text-gray-400 my-2">Optional: words you avoid, how you open or close, or what a draft should do differently.</p>
            <textarea id="style-notes" v-model="draft.notes" rows="3" maxlength="1000" class="w-full rounded-lg bg-gray-700 border-gray-600 text-white" placeholder="For example: lead with what changed; avoid calling everything exciting." />
            <p class="text-xs text-gray-400 mt-1">{{ draft.notes.length }}/1,000 characters</p>
          </div>
          <div class="rounded-lg border border-primary-500/30 bg-primary-500/5 p-4 space-y-3">
            <h5 class="text-white font-medium">Does it sound like you?</h5>
            <p class="text-sm text-gray-400">Generate a test portfolio update using the profile above, then adjust your answers or notes and try again. This sends your current choices and samples to the AI before you save. Testing is optional.</p>
            <button type="button" :disabled="previewing || saving" class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm disabled:opacity-50" @click="testDraft">{{ previewing ? 'Writing test draft…' : preview ? 'Try another draft' : 'Generate a test draft' }}</button>
            <p v-if="previewError" role="alert" class="text-sm text-red-400">{{ previewError }}</p>
            <div v-if="preview" class="grid md:grid-cols-2 gap-4">
              <div><h6 class="text-xs text-gray-400 uppercase mb-2">Source facts</h6><p class="text-sm text-gray-300">Our team tested a website. We found a navigation problem. We simplified the navigation. The next step is preparing for launch.</p></div>
              <div><h6 class="text-xs text-gray-400 uppercase mb-2">AI test draft</h6><p class="text-sm text-gray-200 whitespace-pre-wrap">{{ preview }}</p></div>
            </div>
            <p v-if="previewStale && preview" class="text-sm text-amber-300" role="status">Your profile changed after this draft. Generate another to test the latest choices.</p>
          </div>
          <p class="text-sm text-gray-400">This is a preference profile, not a personality test or a validated measure of authorship. AI can still miss your voice. Your explicit requests and the required format take priority; review important drafts before using them.</p>
        </div>

        <p class="text-xs text-gray-400">When saved, your choices and writing samples are stored in your account and sent to the AI for personalized writing. You can edit or remove this profile anytime.</p>
        <div class="flex flex-wrap gap-3 border-t border-gray-700 pt-4">
          <button v-if="step > 0" type="button" :disabled="saving || previewing" class="px-4 py-2 text-gray-300" @click="goTo(step - 1)">Back</button>
          <button type="submit" :disabled="saving || previewing" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">{{ saving ? 'Saving…' : step === sections.length - 1 ? 'Save my writing profile' : 'Continue' }}</button>
          <button type="button" :disabled="saving || previewing" class="px-4 py-2 text-gray-400" @click="editing = false">Cancel</button>
        </div>
      </form>
      <details class="mt-5 text-sm text-gray-400">
        <summary class="cursor-pointer hover:text-gray-200">How this process was designed</summary>
        <p class="mt-3">The tone comparisons draw on <a href="https://www.nngroup.com/articles/tone-of-voice-dimensions/" target="_blank" rel="noopener noreferrer" class="text-primary-300 underline">NN/g’s tone dimensions</a>. Concrete examples support <a href="https://www.nngroup.com/articles/recognition-and-recall/" target="_blank" rel="noopener noreferrer" class="text-primary-300 underline">recognition rather than recall</a>. Neutral wording and a no-preference option follow <a href="https://www.pewresearch.org/writing-survey-questions/" target="_blank" rel="noopener noreferrer" class="text-primary-300 underline">questionnaire design guidance</a>. The finer language choices are informed by <a href="https://aclanthology.org/2024.personalize-1.8/" target="_blank" rel="noopener noreferrer" class="text-primary-300 underline">research on linguistic controls for personalized generation</a>.</p>
        <p class="mt-2">The specific questions, context settings, and test-draft workflow are product design choices. This questionnaire has not been scientifically validated; the time estimate is approximate.</p>
      </details>
    </template>
    <p v-if="error" class="mt-3 text-red-400 text-sm" role="alert">{{ error }}</p>
    <p v-if="notice" class="mt-3 text-green-400 text-sm" role="status">{{ notice }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import api, { aiApi } from '@/services/api'

interface Option { value: string; label: string; example: string }
interface Question { key: string; group: string; title: string; hint: string; options: Option[] }
interface Catalog { version: number; questions: Question[]; contexts: { key: string; label: string }[]; avoidOptions: { value: string; label: string }[] }
interface Style {
  [key: string]: any
  version: number; sample: string; samples: { context: string; text: string }[]
  contexts: Record<string, string>; avoid: string[]; notes: string; exercise: string
}
const sections = [
  { title: 'Write for your audience', short: 'contexts', hint: 'Set the contexts where your voice changes.' },
  { title: 'Find your tone of voice', short: 'voice', hint: 'Choose between versions of the same message. No option is better than another.' },
  { title: 'Shape the way you explain', short: 'composition', hint: 'Consider your usual amount of detail, structure, vocabulary, and sentence rhythm.' },
  { title: 'Add your finishing touches', short: 'details', hint: 'Small language choices can make a draft feel more familiar.' },
  { title: 'Show us your own words', short: 'samples', hint: 'Add up to two samples or try a short exercise. You can also continue without either.' },
  { title: 'Review and try your voice', short: 'review', hint: 'Check your brief, try an AI draft if you like, and refine anything that feels off.' },
]
const catalog = ref<Catalog>({ version: 2, questions: [], contexts: [], avoidOptions: [] })
const saved = ref<Style | null>(null)
const empty = (): Style => ({ version: 2, sample: '', samples: [], contexts: {}, avoid: [], notes: '', exercise: '' })
const draft = reactive<Style>(empty())
const loading = ref(true), loadError = ref(false), saving = ref(false), editing = ref(false)
const previewing = ref(false), preview = ref(''), previewError = ref(''), previewSnapshot = ref('')
const step = ref(0), error = ref(''), notice = ref(''), stepHeading = ref<HTMLElement>()
const toneOptions = computed(() => catalog.value.questions.find(q => q.key === 'tone')?.options.filter(o => o.value !== 'unspecified') || [])
const groupQuestions = computed(() => catalog.value.questions.filter(q => q.group === ['', 'voice', 'craft', 'mechanics'][step.value]))
const previewStale = computed(() => JSON.stringify(draft) !== previewSnapshot.value)
function describe(style: Style, includeUnspecified = false) {
  return catalog.value.questions.filter(q => includeUnspecified || style[q.key] && style[q.key] !== 'unspecified').map(q => ({ key: q.key, title: q.title, label: q.options.find(o => o.value === style[q.key])?.label || 'No preference' }))
}
function evidence(style: Style) {
  const choices = catalog.value.questions.filter(q => style[q.key] && style[q.key] !== 'unspecified').length
  const samples = (style.sample?.trim() ? 1 : 0) + (style.samples || []).filter(s => s.text.trim()).length
  return `${choices} stated preferences · ${samples} writing samples${style.exercise?.trim() ? ' · exercise included' : ''}`
}
async function load() {
  loading.value = true; loadError.value = false
  try {
    const { data } = await api.get('/users/me/writing-style')
    if (!data.questionnaire?.questions?.length) throw new Error('Questionnaire unavailable')
    catalog.value = data.questionnaire; saved.value = data.writingStyle
  } catch { loadError.value = true }
  finally { loading.value = false }
}
function start() {
  for (const key of Object.keys(draft)) delete draft[key]
  Object.assign(draft, empty(), Object.fromEntries(catalog.value.questions.map(q => [q.key, 'unspecified'])), saved.value ? JSON.parse(JSON.stringify(saved.value)) : {})
  draft.version = 2
  draft.samples ||= []; draft.avoid ||= []; draft.notes ||= ''; draft.exercise ||= ''
  draft.contexts = Object.fromEntries(catalog.value.contexts.map(c => [c.key, draft.contexts?.[c.key] || 'inherit']))
  error.value = notice.value = preview.value = previewError.value = previewSnapshot.value = ''
  editing.value = true; goTo(0)
}
async function goTo(index: number) { step.value = index; await nextTick(); stepHeading.value?.focus() }
function next() { if (step.value < sections.length - 1) goTo(step.value + 1); else save(JSON.parse(JSON.stringify(draft))) }
async function testDraft() {
  previewing.value = true; previewError.value = ''
  const snapshot = JSON.stringify(draft)
  try {
    const { data } = await aiApi.post('/users/me/writing-style/preview', { writingStyle: JSON.parse(snapshot) })
    preview.value = data.text; previewSnapshot.value = snapshot
  } catch { previewError.value = 'Couldn’t generate a test draft. Try again, or save your profile without a preview.' }
  finally { previewing.value = false }
}
async function save(style: Style | null) {
  saving.value = true; error.value = notice.value = ''
  try {
    saved.value = (await api.put('/users/me/writing-style', { writingStyle: style })).data.writingStyle
    editing.value = false
    notice.value = style ? 'Writing profile saved. Future AI drafts will use your preferences.' : 'Your saved writing profile has been removed.'
  } catch { error.value = 'Couldn’t save your writing profile. Your answers are still here; please try again.' }
  finally { saving.value = false }
}
watch(step, () => { error.value = '' })
onMounted(load)
</script>
