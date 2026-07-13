<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60" @click="$emit('close')"></div>

    <!-- Modal -->
    <div class="relative bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-white">
          {{ job ? 'Edit Job' : 'Add Job' }}
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Company -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Company *</label>
          <input
            v-model="form.company"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Google"
          />
        </div>

        <!-- Position -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Position *</label>
          <input
            v-model="form.position"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Senior Frontend Developer"
          />
        </div>

        <!-- URL -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Job Posting URL</label>
          <input
            v-model="form.url"
            type="url"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://..."
          />
        </div>

        <!-- Referred By -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Referred By</label>
          <input
            v-model="form.referredBy"
            type="text"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., John Smith"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <input
            v-model="form.category"
            type="text"
            list="goapply-job-categories"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., Summer Internship 2026"
          />
          <datalist id="goapply-job-categories">
            <option v-for="category in categorySuggestions" :key="category" :value="category" />
          </datalist>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Tags</label>
          <div class="relative">
            <div class="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-gray-600 bg-gray-700 px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary-500">
              <span v-for="tag in selectedTags" :key="tag" class="inline-flex items-center gap-1 rounded-full bg-primary-900/60 px-2 py-1 text-xs text-primary-200">
                {{ tag }}
                <button type="button" class="text-primary-400 hover:text-white" :aria-label="`Remove ${tag}`" @click="removeTag(tag)">×</button>
              </span>
              <input
                v-model="tagInput"
                type="text"
                autocomplete="off"
                class="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-0"
                placeholder="Add a tag..."
                @focus="showTagSuggestions = true"
                @blur="hideTagSuggestions"
                @keydown.enter.prevent="addTag()"
                @keydown.tab="addTag()"
                @keydown.comma.prevent="addTag()"
                @keydown.backspace="removeLastTag"
              />
            </div>
            <div v-if="showTagSuggestions && filteredTagSuggestions.length" class="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-600 bg-gray-700 py-1 shadow-xl" @mousedown.prevent>
              <button
                v-for="tag in filteredTagSuggestions"
                :key="tag"
                type="button"
                class="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-600"
                @click="addTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-500">Choose an existing tag or press Enter/comma to create one.</p>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select
            v-model="form.status"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option v-for="s in JOB_STATUSES" :key="s" :value="s">
              {{ STATUS_LABELS[s] }}
            </option>
          </select>
        </div>

        <!-- Applied At -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Applied Date</label>
          <input
            v-model="form.appliedAt"
            type="date"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Notes (Markdown supported)</label>
          <textarea
            v-model="form.notes"
            rows="6"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Any notes about this job..."
          ></textarea>
          <button type="button" @click="showPreview = !showPreview" class="text-xs text-primary-400 mt-1 hover:underline">
            {{ showPreview ? 'Edit' : 'Preview' }}
          </button>
          <div v-if="showPreview && form.notes" class="mt-2 p-3 bg-gray-750 rounded border border-gray-600 text-sm text-gray-300 markdown-body" v-html="renderMarkdown(form.notes)"></div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="store.isSaving"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {{ store.isSaving ? 'Saving...' : job ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useGoApplyStore, JOB_STATUSES, STATUS_LABELS, type GoApplyJob, type JobFormData } from '@/stores/goapply'
import { marked } from 'marked'

const props = defineProps<{
  job: GoApplyJob | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const store = useGoApplyStore()
const showPreview = ref(false)
const selectedTags = ref([...(props.job?.tags || [])])
const tagInput = ref('')
const showTagSuggestions = ref(false)
const categorySuggestions = computed(() => [...new Set(store.jobs.map(job => job.category).filter((value): value is string => Boolean(value)))].sort())
const tagSuggestions = computed(() => [...new Set(store.jobs.flatMap(job => job.tags))].sort((a, b) => a.localeCompare(b)))
const filteredTagSuggestions = computed(() => {
  const query = tagInput.value.trim().toLowerCase()
  const selected = new Set(selectedTags.value.map(tag => tag.toLowerCase()))
  return tagSuggestions.value
    .filter(tag => !selected.has(tag.toLowerCase()) && (!query || tag.toLowerCase().includes(query)))
    .slice(0, 8)
})

const form = reactive<JobFormData>({
  company: props.job?.company || '',
  position: props.job?.position || '',
  url: props.job?.url || '',
  notes: props.job?.notes || '',
  category: props.job?.category || '',
  tags: props.job?.tags || [],
  status: props.job?.status || 'saved',
  referredBy: props.job?.referredBy || '',
  sortOrder: props.job?.sortOrder ?? 0,
  appliedAt: props.job?.appliedAt
    ? new Date(props.job.appliedAt).toISOString().split('T')[0]
    : '',
})

async function handleSubmit() {
  try {
    addTag()
    const payload = {
      ...form,
      tags: selectedTags.value,
    }
    if (props.job) {
      await store.updateJob(props.job.id, payload)
    } else {
      await store.createJob(payload)
    }
    emit('saved')
  } catch {
    // Error already handled by store
  }
}

function addTag(value = tagInput.value) {
  const tag = value.trim().replace(/,$/, '').trim()
  if (tag && !selectedTags.value.some(item => item.toLowerCase() === tag.toLowerCase())) {
    selectedTags.value.push(tag)
  }
  tagInput.value = ''
  showTagSuggestions.value = true
}

function removeTag(tag: string) {
  selectedTags.value = selectedTags.value.filter(item => item !== tag)
}

function removeLastTag() {
  if (!tagInput.value) selectedTags.value.pop()
}

function hideTagSuggestions() {
  window.setTimeout(() => { showTagSuggestions.value = false }, 100)
}

function renderMarkdown(text: string) {
  return marked.parse(text, { breaks: true })
}
</script>

<style scoped>
.markdown-body p { margin-bottom: 0.25rem; }
.markdown-body ul { list-style-type: disc; padding-left: 1rem; }
.markdown-body ol { list-style-type: decimal; padding-left: 1rem; }
.markdown-body code { background: rgba(255,255,255,0.1); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.8em; }
.markdown-body pre { background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; overflow-x: auto; }
.markdown-body a { color: #818cf8; text-decoration: underline; }
.markdown-body strong { font-weight: 600; }
.markdown-body blockquote { border-left: 2px solid #4b5563; padding-left: 0.75rem; color: #9ca3af; }
</style>
