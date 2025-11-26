<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-white">Template Library</h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div v-if="templates.length === 0" class="text-center py-8 text-gray-400">
        <p>No templates saved. Upload a template and save it to your library.</p>
      </div>
      <div v-else class="grid grid-cols-2 gap-4">
        <div
          v-for="template in templates"
          :key="template.id"
          class="border border-gray-700 rounded-lg p-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
          @click="$emit('select', template)"
        >
          <h3 class="text-white font-semibold mb-1">{{ template.name }}</h3>
          <p v-if="template.description" class="text-sm text-gray-400 mb-2">{{ template.description }}</p>
          <p class="text-xs text-gray-500">{{ template.fileName }}</p>
          <div class="flex justify-end mt-3">
            <button
              @click.stop="$emit('delete', template.id)"
              class="text-red-400 hover:text-red-300 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  templates: any[]
}>()

defineEmits<{
  close: []
  select: [template: any]
  delete: [id: string]
}>()
</script>


