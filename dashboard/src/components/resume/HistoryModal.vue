<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-gray-900 border border-gray-700 rounded-lg flex flex-col overflow-hidden w-full max-w-4xl mx-4" style="max-height: calc(100vh - 4rem);">
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">Resume History</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- History List -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 min-h-0">
        <div v-if="history.length === 0" class="text-center py-8 text-gray-400">
          <p class="text-sm">No resume history. Generate a resume to see it here.</p>
        </div>
        <div
          v-for="item in history"
          :key="item.id"
          @click="$emit('load', item)"
          class="p-3 rounded-lg cursor-pointer transition-all border"
          :class="[
            'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-600'
          ]"
        >
          <div class="flex items-start justify-between mb-2">
            <h4 class="font-medium text-sm truncate flex-1 text-white">{{ item.name }}</h4>
            <button
              @click.stop="$emit('delete', item.id)"
              class="ml-2 p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
              title="Delete resume"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>{{ item.resumeSize }}</span>
            <span>{{ formatDate(item.createdAt) }}</span>
          </div>
          <p class="text-xs text-gray-500 mb-1 line-clamp-2">{{ item.jobDescription.substring(0, 120) }}{{ item.jobDescription.length > 120 ? '...' : '' }}</p>
          <div v-if="item.template" class="mt-2 text-xs text-gray-500 truncate flex items-center">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ item.template.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  history: any[]
  formatDate: (dateString: string) => string
}>()

defineEmits<{
  close: []
  load: [item: any]
  delete: [id: string]
}>()
</script>

