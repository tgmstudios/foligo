<template>
  <div class="relative">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-white">Tags</h3>
      <button
        @click="showCreateModal = true"
        class="btn btn-sm btn-primary"
      >
        + Add Tag
      </button>
    </div>

    <!-- Active Tags -->
    <div v-if="selectedTags.length > 0" class="mb-4">
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in selectedTags"
          :key="tag.id"
          class="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white rounded-full text-sm"
        >
          {{ tag.name }}
          <button
            @click="removeTag(tag)"
            class="ml-2 hover:text-gray-200 transition-colors"
            title="Remove tag"
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
        v-model="searchQuery"
        type="text"
        placeholder="Search tags to add..."
        class="input w-full"
        @focus="showSearchResults = true"
        @blur="handleSearchBlur"
      />
    </div>

    <!-- Search Results Dropdown -->
    <div
      v-if="showSearchResults && filteredTags.length > 0"
      class="absolute z-10 mt-1 w-full bg-gray-700 rounded-md shadow-lg border border-gray-600 max-h-64 overflow-y-auto"
    >
      <div class="py-1">
        <div
          v-for="tag in filteredTags"
          :key="tag.id"
          class="flex items-center justify-between px-4 py-2 hover:bg-gray-600 cursor-pointer transition-colors"
          @mousedown.prevent="selectTag(tag)"
        >
          <div class="flex-1">
            <div class="text-white font-medium">{{ tag.name }}</div>
            <div
              v-if="tag.category"
              class="text-xs text-gray-400 mt-0.5"
            >
              {{ tag.category }}
            </div>
          </div>
          <button
            v-if="selectedTags.find(t => t.id === tag.id)"
            class="text-primary-400 text-sm ml-2"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="showSearchResults && filteredTags.length === 0"
      class="absolute z-10 mt-1 w-full bg-gray-700 rounded-md shadow-lg border border-gray-600 p-4"
    >
      <p class="text-gray-400 text-sm text-center">No tags found</p>
    </div>

    <!-- Create Tag Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="showCreateModal = false"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <form @submit.prevent="createTag">
            <div class="bg-gray-800 px-6 pt-6 pb-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-white">Create Tag</h3>
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
                  <label class="label">Tag Name *</label>
                  <input
                    v-model="newTag.name"
                    type="text"
                    required
                    class="input"
                    placeholder="e.g., React, Node.js"
                  />
                </div>
                <div>
                  <label class="label">Category</label>
                  <input
                    v-model="newTag.category"
                    type="text"
                    class="input"
                    placeholder="e.g., Programming Languages"
                  />
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
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import type { ContentTag } from '@/stores/projects'

interface Props {
  modelValue: ContentTag[]
  projectId: string
}

interface Emits {
  (e: 'update:modelValue', tags: ContentTag[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tags = ref<ContentTag[]>([])
const selectedTags = ref<ContentTag[]>(props.modelValue || [])
const searchQuery = ref('')
const showCreateModal = ref(false)
const isCreating = ref(false)
const showSearchResults = ref(false)

const newTag = ref({
  name: '',
  category: ''
})

const filteredTags = computed(() => {
  if (!searchQuery.value) {
    // Show all tags when no search query
    return tags.value
  }
  
  // Filter tags based on search query
  return tags.value.filter(tag =>
      tag.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

const handleSearchBlur = () => {
  // Delay hiding to allow click events to fire
  setTimeout(() => {
    showSearchResults.value = false
  }, 200)
}

const fetchTags = async () => {
  try {
    const response = await api.get('/content-tags')
    tags.value = response.data
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

watch(() => searchQuery.value, () => {
  // Keep search results visible when typing
  if (showSearchResults.value) {
    fetchTags()
  }
})

const createTag = async () => {
  try {
    isCreating.value = true
    const response = await api.post(`/projects/${props.projectId}/content-tags`, newTag.value)
    tags.value.push(response.data)
    newTag.value = { name: '', category: '' }
    showCreateModal.value = false
  } catch (error) {
    console.error('Failed to create tag:', error)
  } finally {
    isCreating.value = false
  }
}

const selectTag = (tag: ContentTag) => {
  if (!selectedTags.value.find(t => t.id === tag.id)) {
    selectedTags.value.push(tag)
    emit('update:modelValue', selectedTags.value)
  }
  searchQuery.value = ''
  showSearchResults.value = false
}

const removeTag = (tag: ContentTag) => {
  selectedTags.value = selectedTags.value.filter(t => t.id !== tag.id)
  emit('update:modelValue', selectedTags.value)
}

const deleteTag = async (tagId: string) => {
  if (!confirm('Are you sure you want to delete this tag?')) return
  
  try {
    await api.delete(`/content-tags/${tagId}`)
    tags.value = tags.value.filter(t => t.id !== tagId)
    selectedTags.value = selectedTags.value.filter(t => t.id !== tagId)
    emit('update:modelValue', selectedTags.value)
  } catch (error) {
    console.error('Failed to delete tag:', error)
  }
}

watch(() => props.modelValue, (newValue) => {
  selectedTags.value = newValue || []
}, { deep: true })

onMounted(() => {
  fetchTags()
  selectedTags.value = props.modelValue || []
})
</script>

