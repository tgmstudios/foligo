<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-white">Skills</h3>
      <button
        @click="showCreateModal = true"
        class="btn btn-sm btn-primary"
      >
        + Add Skill
      </button>
    </div>

    <!-- Search and Filter -->
    <div class="mb-4 space-y-2">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search skills..."
        class="input w-full"
      />
      <select
        v-model="selectedTagId"
        class="input"
        @change="fetchSkills"
      >
        <option value="">All Categories</option>
        <option
          v-for="tag in tags"
          :key="tag.id"
          :value="tag.id"
        >
          {{ tag.name }} {{ tag.category ? `(${tag.category})` : '' }}
        </option>
      </select>
    </div>

    <!-- Skills List -->
    <div class="space-y-2">
      <div
        v-for="skill in filteredSkills"
        :key="skill.id"
        class="flex items-center justify-between p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
      >
        <div class="flex items-center space-x-3">
          <span class="text-white font-medium">{{ skill.name }}</span>
          <span
            v-if="skill.tag"
            class="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded"
          >
            {{ skill.tag.name }}
            <span v-if="skill.tag.category"> - {{ skill.tag.category }}</span>
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="selectSkill(skill)"
            class="text-sm text-primary-400 hover:text-primary-300"
          >
            Select
          </button>
          <button
            @click="deleteSkill(skill.id)"
            class="text-sm text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>
      <div v-if="filteredSkills.length === 0" class="text-center text-gray-400 py-8">
        No skills found
      </div>
    </div>

    <!-- Selected Skills -->
    <div v-if="selectedSkills.length > 0" class="mt-4 pt-4 border-t border-gray-600">
      <h4 class="text-sm font-medium text-gray-300 mb-2">Selected Skills</h4>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="skill in selectedSkills"
          :key="skill.id"
          class="inline-flex items-center px-3 py-1 bg-primary-600 text-white rounded-full text-sm"
        >
          {{ skill.name }}
          <button
            @click="removeSkill(skill)"
            class="ml-2 hover:text-gray-200"
          >
            ×
          </button>
        </span>
      </div>
    </div>

    <!-- Create Skill Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="showCreateModal = false"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
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
                  <label class="label">Category Tag *</label>
                  <select
                    v-model="newSkill.tagId"
                    required
                    class="input"
                  >
                    <option value="">Select a category tag</option>
                    <option
                      v-for="tag in tags"
                      :key="tag.id"
                      :value="tag.id"
                    >
                      {{ tag.name }} {{ tag.category ? `(${tag.category})` : '' }}
                    </option>
                  </select>
                  <p class="text-xs text-gray-400 mt-1">
                    Create a category tag first if needed
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
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import type { Skill, ContentTag } from '@/stores/projects'

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
const tags = ref<ContentTag[]>([])
const selectedSkills = ref<Skill[]>(props.modelValue || [])
const searchQuery = ref('')
const selectedTagId = ref('')
const showCreateModal = ref(false)
const isCreating = ref(false)

const newSkill = ref({
  name: '',
  tagId: ''
})

const filteredSkills = computed(() => {
  let filtered = skills.value
  
  if (searchQuery.value) {
    filtered = filtered.filter(skill =>
      skill.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  if (selectedTagId.value) {
    filtered = filtered.filter(skill => skill.tagId === selectedTagId.value)
  }
  
  return filtered
})

const fetchTags = async () => {
  try {
    const response = await api.get('/content-tags')
    tags.value = response.data
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

const fetchSkills = async () => {
  try {
    const params: any = {}
    if (selectedTagId.value) params.tagId = selectedTagId.value
    if (searchQuery.value) params.search = searchQuery.value
    
    const response = await api.get('/skills', { params })
    skills.value = response.data
  } catch (error) {
    console.error('Failed to fetch skills:', error)
  }
}

const createSkill = async () => {
  try {
    isCreating.value = true
    const response = await api.post(`/projects/${props.projectId}/skills`, newSkill.value)
    skills.value.push(response.data)
    newSkill.value = { name: '', tagId: '' }
    showCreateModal.value = false
  } catch (error) {
    console.error('Failed to create skill:', error)
  } finally {
    isCreating.value = false
  }
}

const selectSkill = (skill: Skill) => {
  if (!selectedSkills.value.find(s => s.id === skill.id)) {
    selectedSkills.value.push(skill)
    emit('update:modelValue', selectedSkills.value)
  }
}

const removeSkill = (skill: Skill) => {
  selectedSkills.value = selectedSkills.value.filter(s => s.id !== skill.id)
  emit('update:modelValue', selectedSkills.value)
}

const deleteSkill = async (skillId: string) => {
  if (!confirm('Are you sure you want to delete this skill?')) return
  
  try {
    await api.delete(`/skills/${skillId}`)
    skills.value = skills.value.filter(s => s.id !== skillId)
    selectedSkills.value = selectedSkills.value.filter(s => s.id !== skillId)
    emit('update:modelValue', selectedSkills.value)
  } catch (error) {
    console.error('Failed to delete skill:', error)
  }
}

onMounted(() => {
  fetchTags()
  fetchSkills()
})
</script>


