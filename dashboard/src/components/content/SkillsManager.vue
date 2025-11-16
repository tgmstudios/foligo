<template>
  <div class="relative">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-white">Skills</h3>
      <button
        @click="handleAddSkillClick"
        class="btn btn-sm btn-primary"
      >
        + Add Skill
      </button>
    </div>

    <!-- Active Skills -->
    <div v-if="selectedSkills.length > 0" class="mb-4">
      <div class="flex flex-wrap gap-2">
        <span
          v-for="skill in selectedSkills"
          :key="skill.id"
          class="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white rounded-full text-sm"
        >
          {{ skill.name }}
          <button
            @click="removeSkill(skill)"
            class="ml-2 hover:text-gray-200 transition-colors"
            title="Remove skill"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="mb-4">
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        type="text"
        placeholder="Search skills to add..."
        class="input w-full"
        @focus="handleSearchFocus"
        @blur="handleSearchBlur"
      />
    </div>

    <!-- Search Results Dropdown -->
    <Teleport to="body">
      <div
        v-if="showSearchResults"
        class="fixed z-[70] bg-gray-700 rounded-md shadow-lg border border-gray-600 max-h-64 overflow-y-auto"
        :style="dropdownStyle"
        @click.stop
        @mousedown.stop
      >
        <div v-if="filteredSkills.length > 0" class="py-1">
          <div
            v-for="skill in filteredSkills"
            :key="skill.id"
            class="flex items-center justify-between px-4 py-2 hover:bg-gray-600 cursor-pointer transition-colors"
            @mousedown.prevent="selectSkill(skill)"
          >
            <div class="flex-1">
              <div class="text-white font-medium">{{ skill.name }}</div>
              <div
                v-if="skill.category"
                class="text-xs text-gray-400 mt-0.5"
              >
                {{ skill.category }}
              </div>
            </div>
            <button
              v-if="selectedSkills.find(s => s.id === skill.id)"
              class="text-primary-400 text-sm ml-2"
            >
              ✓
            </button>
          </div>
        </div>
        <div v-else-if="skills.length === 0" class="p-4">
          <p class="text-gray-400 text-sm text-center">Loading skills...</p>
        </div>
        <div v-else class="p-4">
          <p class="text-gray-400 text-sm text-center">No skills found</p>
        </div>
      </div>
    </Teleport>

    <!-- Create Skill Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-[60] overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0" @click.self="showCreateModal = false">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity pointer-events-none"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full" @click.stop>
          <form @submit.prevent="createSkill">
            <div class="bg-gray-800 px-6 pt-6 pb-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-white">Create Skill</h3>
                <button
                  type="button"
                  @click="showCreateModal = false"
                  class="text-gray-400 hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="label">Skill Name *</label>
                  <input
                    v-model="newSkill.name"
                    type="text"
                    required
                    class="input"
                    placeholder="e.g., Node.js, React"
                  />
                </div>
                <div>
                  <label class="label">Category</label>
                  <input
                    v-model="newSkill.category"
                    type="text"
                    class="input"
                    placeholder="e.g., Programming Languages, Frameworks, Tools"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    <option value="Programming Languages">Programming Languages</option>
                    <option value="Frameworks">Frameworks</option>
                    <option value="Libraries">Libraries</option>
                    <option value="Tools">Tools</option>
                    <option value="Databases">Databases</option>
                    <option value="Cloud Services">Cloud Services</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Design">Design</option>
                    <option value="Other">Other</option>
                  </datalist>
                  <p class="text-xs text-gray-400 mt-1">
                    Optional: Categorize the skill (e.g., "Programming Languages")
                  </p>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-800 px-6 py-3 flex justify-end space-x-3">
              <button
                type="button"
                @click="showCreateModal = false"
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isCreating"
                class="btn btn-primary"
              >
                {{ isCreating ? 'Creating...' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import api from '@/services/api'
import type { Skill } from '@/stores/projects'

interface Props {
  modelValue: Skill[]
  projectId: string
}

interface Emits {
  (e: 'update:modelValue', skills: Skill[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const skills = ref<Skill[]>([])
const selectedSkills = ref<Skill[]>(props.modelValue || [])
const searchQuery = ref('')
const showCreateModal = ref(false)
const isCreating = ref(false)
const showSearchResults = ref(false)
const searchInputRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({ top: '0px', left: '0px', width: '300px' })

const newSkill = ref({
  name: '',
  category: ''
})

const filteredSkills = computed(() => {
  if (!searchQuery.value) {
    // Show all skills when no search query
    return skills.value
  }
  
  // Filter skills based on search query
  return skills.value.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const updateDropdownPosition = () => {
  if (!searchInputRef.value || !showSearchResults.value) return
  
  nextTick(() => {
    if (!searchInputRef.value) return
    const rect = searchInputRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      minWidth: '200px'
    }
  })
}

const handleSearchFocus = async () => {
  // Ensure skills are loaded when focusing on search
  if (skills.value.length === 0) {
    await fetchSkills()
  }
  showSearchResults.value = true
  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    updateDropdownPosition()
  }, 10)
}

const handleSearchBlur = (event: FocusEvent) => {
  // Check if the focus is moving to the dropdown
  const relatedTarget = event.relatedTarget as HTMLElement
  if (relatedTarget && relatedTarget.closest('[class*="bg-gray-700"]')) {
    return // Don't hide if focus is moving to dropdown
  }
  
  // Delay hiding to allow click events to fire
  setTimeout(() => {
    showSearchResults.value = false
  }, 200)
}

// Update position on scroll/resize
const handleScroll = () => {
  if (showSearchResults.value) {
    updateDropdownPosition()
  }
}

const fetchSkills = async () => {
  try {
    const response = await api.get('/skills')
    skills.value = response.data
  } catch (error) {
    console.error('Failed to fetch skills:', error)
  }
}

watch(() => searchQuery.value, async () => {
  // Keep search results visible when typing
  if (showSearchResults.value) {
    // Ensure skills are loaded
    if (skills.value.length === 0) {
      await fetchSkills()
    }
    updateDropdownPosition()
  }
})

watch(() => showSearchResults.value, async (isVisible) => {
  if (isVisible) {
    // Ensure skills are loaded when dropdown becomes visible
    if (skills.value.length === 0) {
      await fetchSkills()
    }
    updateDropdownPosition()
  }
})

const createSkill = async () => {
  try {
    isCreating.value = true
    const response = await api.post(`/projects/${props.projectId}/skills`, newSkill.value)
    const newSkillData = response.data
    skills.value.push(newSkillData)
    
    // Automatically add the newly created skill to the selection
    if (!selectedSkills.value.find(s => s.id === newSkillData.id)) {
      selectedSkills.value.push(newSkillData)
      emit('update:modelValue', selectedSkills.value)
    }
    
    newSkill.value = { name: '', category: '' }
    showCreateModal.value = false
  } catch (error) {
    console.error('Failed to create skill:', error)
  } finally {
    isCreating.value = false
  }
}

const handleAddSkillClick = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  showCreateModal.value = true
}

const selectSkill = (skill: Skill) => {
  if (!selectedSkills.value.find(s => s.id === skill.id)) {
    selectedSkills.value.push(skill)
    emit('update:modelValue', selectedSkills.value)
  }
  searchQuery.value = ''
  showSearchResults.value = false
}

const removeSkill = (skill: Skill) => {
  selectedSkills.value = selectedSkills.value.filter(s => s.id !== skill.id)
  emit('update:modelValue', selectedSkills.value)
}

watch(() => props.modelValue, (newValue) => {
  selectedSkills.value = newValue || []
}, { deep: true })

onMounted(() => {
  fetchSkills()
  selectedSkills.value = props.modelValue || []
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', updateDropdownPosition)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>


