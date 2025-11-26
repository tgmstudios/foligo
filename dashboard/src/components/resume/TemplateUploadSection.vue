<template>
  <div class="card mb-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-white">Step 1: Upload Resume Template</h2>
      <button
        @click="$emit('show-placeholder-guide')"
        class="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center space-x-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Placeholder Guide</span>
      </button>
    </div>
    <div v-if="!templateId" class="space-y-4">
      <!-- Load from Library -->
      <div v-if="templates.length > 0">
        <label class="block text-sm font-medium text-gray-300 mb-2">Or load from library:</label>
        <select
          :value="selectedTemplateId"
          @change="$emit('template-selected', ($event.target as HTMLSelectElement).value)"
          class="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select a saved template...</option>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.name }}
          </option>
        </select>
      </div>
      <div
        :class="[
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-gray-600 hover:border-primary-500'
        ]"
        @drop="handleDrop"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave="handleDragLeave"
      >
        <label class="cursor-pointer block">
          <input
            type="file"
            ref="templateInput"
            @change="handleFileChange"
            accept=".docx"
            class="hidden"
          />
          <div class="space-y-2">
            <svg class="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="text-white font-medium">Click to upload or drag and drop DOCX template</p>
            <p class="text-sm text-gray-400">
              Template should contain placeholders like 
              <code class="text-primary-400">&#123;&#123;summary&#125;&#125;</code> 
              and 
              <code class="text-primary-400">&#123;&#123;#projects&#125;&#125;...&#123;&#123;/projects&#125;&#125;</code>
            </p>
          </div>
        </label>
      </div>
    </div>
    <div v-else class="space-y-3">
      <div class="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span class="text-white font-medium">{{ templateName || 'Template uploaded' }}</span>
            <p v-if="templateDescription" class="text-sm text-gray-400">{{ templateDescription }}</p>
          </div>
        </div>
        <div class="flex space-x-2">
          <button
            v-if="!savedTemplateId"
            @click="$emit('show-save-template')"
            class="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
          >
            Save to Library
          </button>
          <button
            @click="$emit('clear-template')"
            class="text-gray-400 hover:text-white transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  templateId: string | null
  templates: any[]
  selectedTemplateId: string | null
  templateName: string | null
  templateDescription: string | null
  savedTemplateId: string | null
  isDragging: boolean
}>()

const emit = defineEmits<{
  'show-placeholder-guide': []
  'template-selected': [id: string]
  'show-save-template': []
  'clear-template': []
  'file-upload': [file: File]
  'drag-state': [isDragging: boolean]
}>()

const templateInput = ref<HTMLInputElement | null>(null)

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  emit('drag-state', true)
}

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  emit('drag-state', true)
}

const handleDragLeave = () => {
  emit('drag-state', false)
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  emit('drag-state', false)
  
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.name.endsWith('.docx')) {
      emit('file-upload', file)
    }
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('file-upload', file)
  }
}
</script>

<style scoped>
.card {
  @apply bg-gray-800 rounded-lg p-6 border border-gray-700;
}
</style>

