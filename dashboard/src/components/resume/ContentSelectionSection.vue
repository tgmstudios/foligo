<template>
  <div v-if="!showPreview" class="card mb-6">
    <h2 class="text-xl font-semibold text-white mb-4">Step 2: Select Content Items (Optional)</h2>
    <p class="text-sm text-gray-400 mb-4">Select content items to include, or leave empty to let AI generate from scratch based on your job description.</p>
    <div v-if="allContentItems.length === 0" class="text-center py-8 text-gray-400">
      <p>No content items available. AI will generate content from scratch based on your job description.</p>
    </div>
    <div v-else class="space-y-2 max-h-96 overflow-y-auto">
      <label
        v-for="item in allContentItems"
        :key="item.id"
        class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
      >
        <input
          type="checkbox"
          :value="item.id"
          :checked="selectedContentIds.includes(item.id)"
          @change="handleToggle(item.id)"
          class="mt-1 w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
        />
        <div class="flex-1">
          <p class="text-white font-medium">{{ item.title || item.name }}</p>
          <p v-if="item.excerpt || item.description" class="text-sm text-gray-400 mt-1 line-clamp-2">
            {{ item.excerpt || item.description }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            {{ getProjectName(item.projectId) }} • {{ item.contentType }}
          </p>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showPreview: boolean
  allContentItems: any[]
  selectedContentIds: string[]
  getProjectName: (projectId: string) => string
}>()

const emit = defineEmits<{
  'toggle-content': [id: string]
}>()

const handleToggle = (id: string) => {
  emit('toggle-content', id)
}
</script>

<style scoped>
.card {
  @apply bg-gray-800 rounded-lg p-6 border border-gray-700;
}
</style>

