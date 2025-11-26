<template>
  <div v-if="!showPreview" class="card mb-6">
    <h2 class="text-xl font-semibold text-white mb-4">Step 3: Job Description & Settings</h2>
    
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">
        Job Description
      </label>
      <textarea
        :value="jobDescription"
        @input="$emit('update:jobDescription', ($event.target as HTMLTextAreaElement).value)"
        placeholder="Paste the job description here..."
        rows="6"
        class="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
      ></textarea>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">
        Resume Size
      </label>
      <select
        :value="resumeSize"
        @change="$emit('update:resumeSize', ($event.target as HTMLSelectElement).value)"
        class="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <option value="small">Small (Brief descriptions)</option>
        <option value="medium">Medium (Moderate detail)</option>
        <option value="large">Large (Comprehensive detail)</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showPreview: boolean
  jobDescription: string
  resumeSize: 'small' | 'medium' | 'large'
}>()

defineEmits<{
  'update:jobDescription': [value: string]
  'update:resumeSize': [value: string]
}>()
</script>

<style scoped>
.card {
  @apply bg-gray-800 rounded-lg p-6 border border-gray-700;
}
</style>

