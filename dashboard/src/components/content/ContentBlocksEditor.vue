<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-white">Content Blocks</h3>
      <button
        @click="showCreateModal = true"
        class="btn btn-sm btn-primary"
      >
        + Add Block
      </button>
    </div>

    <!-- Blocks List -->
    <div class="space-y-4">
      <div
        v-for="(block, index) in blocks"
        :key="block.id"
        class="p-4 bg-gray-700 rounded-md"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-3">
            <span class="text-xs text-gray-400">#{{ index + 1 }}</span>
            <span class="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
              {{ block.type }}
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="editBlock(block)"
              class="text-sm text-primary-400 hover:text-primary-300"
            >
              Edit
            </button>
            <button
              @click="deleteBlock(block.id)"
              class="text-sm text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
        <div class="text-sm text-gray-300 mt-2">
          {{ getBlockPreview(block) }}
        </div>
      </div>
      <div v-if="blocks.length === 0" class="text-center text-gray-400 py-8">
        No blocks yet. Add your first block to get started.
      </div>
    </div>

    <!-- Create/Edit Block Modal -->
    <div
      v-if="showCreateModal || editingBlock"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="closeModal"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form @submit.prevent="saveBlock">
            <div class="bg-gray-800 px-6 pt-6 pb-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-white">
                  {{ editingBlock ? 'Edit Block' : 'Create Block' }}
                </h3>
                <button
                  type="button"
                  @click="closeModal"
                  class="text-gray-400 hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="label">Block Type *</label>
                  <select
                    v-model="blockForm.type"
                    required
                    class="input"
                  >
                    <option value="TEXT">Text</option>
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="CODE">Code</option>
                    <option value="LINK">Link</option>
                    <option value="EMBED">Embed</option>
                    <option value="GALLERY">Gallery</option>
                    <option value="QUOTE">Quote</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div>
                  <label class="label">Content *</label>
                  <textarea
                    v-model="blockForm.content"
                    required
                    rows="8"
                    class="input font-mono text-sm"
                    placeholder="Enter block content (JSON for structured types, text for simple types)"
                  ></textarea>
                </div>
                <div>
                  <label class="label">Order</label>
                  <input
                    v-model.number="blockForm.order"
                    type="number"
                    min="0"
                    class="input"
                  />
                </div>
              </div>
            </div>
            
            <div class="bg-gray-800 px-6 py-3 flex justify-end space-x-3">
              <button
                type="button"
                @click="closeModal"
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSaving"
                class="btn btn-primary"
              >
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import type { ContentBlock } from '@/stores/projects'

interface Props {
  contentId: string
  projectId: string
}

const props = defineProps<Props>()

const blocks = ref<ContentBlock[]>([])
const showCreateModal = ref(false)
const editingBlock = ref<ContentBlock | null>(null)
const isSaving = ref(false)

const blockForm = ref({
  type: 'TEXT' as ContentBlock['type'],
  content: '',
  order: 0
})

const fetchBlocks = async () => {
  try {
    const response = await api.get(`/projects/${props.projectId}/content/${props.contentId}/blocks`)
    blocks.value = response.data.sort((a: ContentBlock, b: ContentBlock) => a.order - b.order)
  } catch (error) {
    console.error('Failed to fetch blocks:', error)
  }
}

const editBlock = (block: ContentBlock) => {
  editingBlock.value = block
  blockForm.value = {
    type: block.type,
    content: block.content,
    order: block.order
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingBlock.value = null
  blockForm.value = {
    type: 'TEXT',
    content: '',
    order: blocks.value.length
  }
}

const saveBlock = async () => {
  try {
    isSaving.value = true
    
    if (editingBlock.value) {
      // Update existing block
      await api.put(`/content-blocks/${editingBlock.value.id}`, blockForm.value)
    } else {
      // Create new block
      await api.post(`/projects/${props.projectId}/content/${props.contentId}/blocks`, blockForm.value)
    }
    
    await fetchBlocks()
    closeModal()
  } catch (error) {
    console.error('Failed to save block:', error)
  } finally {
    isSaving.value = false
  }
}

const deleteBlock = async (blockId: string) => {
  if (!confirm('Are you sure you want to delete this block?')) return
  
  try {
    await api.delete(`/content-blocks/${blockId}`)
    blocks.value = blocks.value.filter(b => b.id !== blockId)
  } catch (error) {
    console.error('Failed to delete block:', error)
  }
}

const getBlockPreview = (block: ContentBlock) => {
  if (block.type === 'TEXT' || block.type === 'QUOTE') {
    return block.content.substring(0, 100) + (block.content.length > 100 ? '...' : '')
  } else if (block.type === 'IMAGE' || block.type === 'VIDEO') {
    try {
      const data = JSON.parse(block.content)
      return data.url || data.src || 'Media block'
    } catch {
      return block.content.substring(0, 50)
    }
  } else if (block.type === 'CODE') {
    try {
      const data = JSON.parse(block.content)
      return `Code: ${data.language || 'text'} - ${data.code?.substring(0, 50) || ''}`
    } catch {
      return block.content.substring(0, 50)
    }
  } else {
    return block.content.substring(0, 100)
  }
}

onMounted(() => {
  fetchBlocks()
})
</script>

