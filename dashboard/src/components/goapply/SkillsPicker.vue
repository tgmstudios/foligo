<template>
  <div class="relative">
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-2 mb-2">
      <span
        v-for="skill in modelValue"
        :key="skill.id"
        class="inline-flex items-center gap-1 px-3 py-1 bg-primary-600/20 text-primary-300 rounded-full text-xs font-medium"
      >
        {{ skill.name }}
        <button type="button" @click="removeSkill(skill.id)" class="text-primary-300 hover:text-white transition-colors">
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
    </div>

    <div class="relative">
      <input
        v-model="query"
        type="text"
        class="input"
        placeholder="Search or add a skill..."
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter.prevent="handleEnter"
      />
      <div
        v-if="showResults"
        class="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto"
        @mousedown.prevent
      >
        <button
          v-for="skill in filteredSkills"
          :key="skill.id"
          type="button"
          class="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors"
          @click="selectSkill(skill)"
        >
          <span class="text-sm text-white">{{ skill.name }}</span>
          <span v-if="skill.category" class="text-xs text-gray-400">{{ skill.category }}</span>
        </button>
        <button
          v-if="query.trim() && !exactMatchExists"
          type="button"
          class="flex items-center w-full gap-1 px-3 py-2 text-sm text-left border-t border-gray-600 text-primary-300 hover:bg-gray-600 transition-colors"
          @click="createAndSelect"
          :disabled="isCreating"
        >
          + {{ isCreating ? 'Creating...' : `Create "${query.trim()}"` }}
        </button>
        <div v-else-if="filteredSkills.length === 0" class="p-3 text-sm text-center text-gray-400">
          Start typing to search or add a skill
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import type { Skill } from '@/stores/projects'
import { useGoApplyStore } from '@/stores/goapply'

const props = defineProps<{
  modelValue: Skill[]
}>()

const emit = defineEmits<{
  'update:modelValue': [skills: Skill[]]
}>()

const store = useGoApplyStore()

const catalog = ref<Skill[]>([])
const query = ref('')
const showResults = ref(false)
const isCreating = ref(false)

const filteredSkills = computed(() => {
  const q = query.value.trim().toLowerCase()
  const selected = new Set(props.modelValue.map((s) => s.id))
  const pool = q ? catalog.value.filter((s) => s.name.toLowerCase().includes(q)) : catalog.value
  return pool.filter((s) => !selected.has(s.id)).slice(0, 20)
})

const exactMatchExists = computed(() => {
  const q = query.value.trim().toLowerCase()
  return (
    catalog.value.some((s) => s.name.toLowerCase() === q) ||
    props.modelValue.some((s) => s.name.toLowerCase() === q)
  )
})

async function fetchCatalog() {
  try {
    const { data } = await api.get('/skills')
    catalog.value = data
  } catch {
    catalog.value = []
  }
}

onMounted(fetchCatalog)

function handleFocus() {
  showResults.value = true
  if (catalog.value.length === 0) fetchCatalog()
}

function handleBlur() {
  setTimeout(() => {
    showResults.value = false
  }, 150)
}

function persist(skills: Skill[]) {
  emit('update:modelValue', skills)
  store.linkSkills(skills.map((s) => s.id))
}

function selectSkill(skill: Skill) {
  persist([...props.modelValue, skill])
  query.value = ''
  showResults.value = false
}

async function createAndSelect() {
  const name = query.value.trim()
  if (!name) return
  try {
    isCreating.value = true
    const skill = await store.createGlobalSkill(name)
    catalog.value.push(skill)
    selectSkill(skill)
  } finally {
    isCreating.value = false
  }
}

function handleEnter() {
  if (filteredSkills.value.length > 0) {
    selectSkill(filteredSkills.value[0])
  } else if (query.value.trim() && !exactMatchExists.value) {
    createAndSelect()
  }
}

function removeSkill(id: string) {
  persist(props.modelValue.filter((s) => s.id !== id))
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500;
}
</style>
