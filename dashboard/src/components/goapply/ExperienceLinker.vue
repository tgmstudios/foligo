<template>
  <div class="relative">
    <!-- Linked entries -->
    <div v-if="modelValue.length > 0" class="mb-3 space-y-2">
      <div
        v-for="item in modelValue"
        :key="item.id"
        class="flex items-start justify-between gap-3 px-3 py-2 bg-gray-700/60 border border-gray-600 rounded-lg"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-white truncate">{{ item.title }}</span>
            <span v-if="item.project?.name" class="shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded">
              {{ item.project.name }}
            </span>
          </div>
          <div v-if="item.roles?.[0]" class="text-xs text-gray-400 mt-0.5">
            {{ item.roles[0].title }} · {{ formatRange(item.roles[0].startDate, item.roles[0].endDate, item.roles[0].isCurrent) }}
          </div>
          <div v-else-if="item.startDate" class="text-xs text-gray-400 mt-0.5">
            {{ formatRange(item.startDate, item.endDate, item.isOngoing) }}
          </div>
        </div>
        <button
          type="button"
          @click="removeItem(item.id)"
          class="shrink-0 text-gray-400 hover:text-white transition-colors"
          title="Unlink"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Search + quick create -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          class="input"
          :placeholder="`Search your portfolio ${category === 'JOB' ? 'jobs' : 'education'}...`"
          @focus="showResults = true"
          @blur="handleBlur"
        />
        <div
          v-if="showResults"
          class="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto"
          @mousedown.prevent
        >
          <div v-if="isSearching" class="p-3 text-sm text-center text-gray-400">Searching...</div>
          <div v-else-if="results.length === 0" class="p-3 text-sm text-center text-gray-400">
            No matches{{ query ? ` for "${query}"` : '' }}
          </div>
          <button
            v-for="result in results"
            :key="result.id"
            type="button"
            class="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors"
            @click="addItem(result)"
          >
            <div class="min-w-0">
              <div class="text-sm text-white truncate">{{ result.title }}</div>
              <div class="text-xs text-gray-400 truncate">{{ result.project?.name }}</div>
            </div>
          </button>
        </div>
      </div>
      <button
        type="button"
        @click="showCreateModal = true"
        class="px-3 py-2 text-sm text-gray-300 transition-colors bg-gray-700 rounded-lg hover:bg-gray-600 whitespace-nowrap"
      >
        + Quick create
      </button>
    </div>

    <ExperienceQuickCreateModal
      :is-open="showCreateModal"
      :category="category"
      @close="showCreateModal = false"
      @created="handleCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Content } from '@/stores/projects'
import { useGoApplyStore, type LinkableExperienceCategory } from '@/stores/goapply'
import ExperienceQuickCreateModal from './ExperienceQuickCreateModal.vue'

const props = defineProps<{
  category: LinkableExperienceCategory
  modelValue: Content[]
}>()

const emit = defineEmits<{
  'update:modelValue': [items: Content[]]
  linked: [item: Content]
}>()

const store = useGoApplyStore()

const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const results = ref<Content[]>([])
const isSearching = ref(false)
const showResults = ref(false)
const showCreateModal = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

function formatRange(start?: string, end?: string, isCurrent?: boolean) {
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
  const startLabel = start ? fmt(start) : ''
  const endLabel = isCurrent ? 'Present' : end ? fmt(end) : ''
  return [startLabel, endLabel].filter(Boolean).join(' – ')
}

async function runSearch() {
  isSearching.value = true
  try {
    const linkedIds = new Set(props.modelValue.map((i) => i.id))
    const found = await store.searchExperience(props.category, query.value)
    results.value = found.filter((r) => !linkedIds.has(r.id))
  } finally {
    isSearching.value = false
  }
}

watch(query, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(runSearch, 250)
})

watch(showResults, (visible) => {
  if (visible) runSearch()
})

function handleBlur() {
  setTimeout(() => {
    showResults.value = false
  }, 150)
}

async function persist(items: Content[]) {
  emit('update:modelValue', items)
  const ids = items.map((i) => i.id)
  if (props.category === 'JOB') {
    await store.linkJobs(ids)
  } else {
    await store.linkEducation(ids)
  }
}

function addItem(item: Content) {
  query.value = ''
  showResults.value = false
  searchInput.value?.blur()
  persist([...props.modelValue, item])
  emit('linked', item)
}

function removeItem(id: string) {
  persist(props.modelValue.filter((i) => i.id !== id))
}

function handleCreated(content: Content) {
  showCreateModal.value = false
  persist([...props.modelValue, content])
  emit('linked', content)
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500;
}
</style>
