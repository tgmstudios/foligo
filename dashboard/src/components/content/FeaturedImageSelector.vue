<template>
  <div class="featured-image-selector">
    <label class="label mb-2">Featured Image</label>
    
    <!-- Current Image Preview -->
    <div v-if="modelValue" class="mb-4">
      <div class="relative inline-block">
        <img
          :src="modelValue"
          alt="Featured image preview"
          class="max-w-full h-48 object-cover rounded-lg border border-gray-600"
          @error="handleImageError"
        />
        <button
          @click="clearImage"
          class="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          title="Remove featured image"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Select from Library Button -->
    <div class="flex gap-2">
      <button
        @click="showMediaLibrary = true"
        type="button"
        class="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Select from Library</span>
      </button>
    </div>

    <!-- URL Input (fallback) -->
    <div class="mt-4">
      <label class="text-sm text-gray-400 mb-1 block">Or enter image URL</label>
      <input
        :value="modelValue"
        @input="updateValue($event.target.value)"
        type="url"
        class="input"
        placeholder="https://example.com/image.jpg"
      />
    </div>

    <!-- Media Library Modal -->
    <div
      v-if="showMediaLibrary"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="showMediaLibrary = false"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="showMediaLibrary = false"></div>
        
        <div class="relative inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <!-- Header -->
          <div class="px-6 pt-6 pb-4 border-b border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-white">Select Featured Image</h3>
              <button
                @click="showMediaLibrary = false"
                class="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Media Library Content -->
          <div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <MediaManager
              :project-id="projectId"
              :selectable="true"
              @media-selected="handleMediaSelected"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { isImage, type Media } from '@/services/media'
import MediaManager from '@/components/media/MediaManager.vue'

const props = defineProps<{
  modelValue: string
  projectId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const toast = useToast()
const showMediaLibrary = ref(false)

const updateValue = (value: string) => {
  emit('update:modelValue', value)
}

const handleMediaSelected = (media: Media) => {
  if (isImage(media.mimeType)) {
    updateValue(media.publicUrl)
    showMediaLibrary.value = false
    toast.success('Featured image selected')
  } else {
    toast.error('Please select an image file')
  }
}

const clearImage = () => {
  updateValue('')
  toast.info('Featured image removed')
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23333" width="400" height="200"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="18"%3EImage not found%3C/text%3E%3C/svg%3E'
}
</script>

<style scoped>
.featured-image-selector {
  @apply w-full;
}
</style>

