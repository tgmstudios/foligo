<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-bold text-white mb-4">Save Template to Library</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
          <input
            v-model="localName"
            placeholder="e.g., Software Engineer Resume"
            class="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
          <textarea
            v-model="localDescription"
            placeholder="Brief description of this template..."
            rows="3"
            class="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            @click="handleSave"
            :disabled="!localName.trim() || isSaving"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  isSaving: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [name: string, description: string]
}>()

const localName = ref('')
const localDescription = ref('')

watch(() => props.show, (newVal) => {
  if (!newVal) {
    localName.value = ''
    localDescription.value = ''
  }
})

const handleSave = () => {
  if (localName.value.trim()) {
    emit('save', localName.value, localDescription.value)
  }
}
</script>

