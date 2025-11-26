<template>
  <div class="media-manager">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-white">Media Library</h2>
      <button
        @click="openUploadDialog"
        class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
      >
        <span class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Upload Media
        </span>
      </button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4 mb-6">
      <select
        v-model="filterType"
        class="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
      >
        <option value="">All Types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        <option value="audio">Audio</option>
        <option value="application">Documents</option>
      </select>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search files..."
        class="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400"
      />
    </div>

    <!-- Drag and Drop Zone -->
    <div
      ref="dropZoneRef"
      :class="[
        'border-2 border-dashed rounded-lg p-12 text-center mb-6 transition-colors',
        isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-gray-600 bg-gray-800/50'
      ]"
      @drop="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @dragenter.prevent="isDragging = true"
    >
      <svg
        class="w-16 h-16 mx-auto mb-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p class="text-gray-300 mb-2">
        Drag and drop files here, or
        <button
          @click="openUploadDialog"
          class="text-primary-400 hover:text-primary-300 underline"
        >
          browse
        </button>
      </p>
      <p class="text-sm text-gray-500">
        Supports images, videos, audio, and documents (max 50MB)
      </p>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploadingFiles.length > 0" class="mb-6 space-y-2">
      <div
        v-for="upload in uploadingFiles"
        :key="upload.id"
        class="bg-gray-800 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-300">{{ upload.filename }}</span>
          <span class="text-sm text-gray-400">{{ upload.progress }}%</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${upload.progress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Media Grid -->
    <div v-if="loading && mediaList.length === 0" class="text-center py-12">
      <div class="text-gray-400">Loading media...</div>
    </div>

    <div v-else-if="filteredMedia.length === 0" class="text-center py-12">
      <div class="text-gray-400">No media files found</div>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      <div
        v-for="item in filteredMedia"
        :key="item.id"
        class="group relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
        @click="selectMedia(item)"
        @dblclick="selectable ? insertMedia(item) : undefined"
      >
        <!-- Image Preview -->
        <div v-if="isImage(item.mimeType)" class="aspect-square bg-gray-900 flex items-center justify-center cursor-pointer" @click.stop="openEditor(item)">
          <img
            :src="item.publicUrl"
            :alt="item.altText || item.filename"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
        </div>

        <!-- Video Preview -->
        <div v-else-if="isVideo(item.mimeType)" class="aspect-square bg-gray-900 flex items-center justify-center">
          <video
            :src="item.publicUrl"
            class="w-full h-full object-cover"
            muted
            @error="handleVideoError"
          ></video>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg class="w-12 h-12 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        <!-- Other File Types -->
        <div v-else class="aspect-square bg-gray-900 flex items-center justify-center">
          <svg class="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <!-- Overlay on Hover -->
        <div
          class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
        >
          <button
            v-if="isImage(item.mimeType)"
            @click.stop="openEditor(item)"
            class="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Edit Image"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            v-if="selectable && !hideInsertButton"
            @click.stop="insertMedia(item)"
            class="p-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            title="Insert"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            v-if="!hideCopyUrl"
            @click.stop="copyUrl(item)"
            class="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title="Copy URL"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            @click.stop="deleteMediaItem(item)"
            class="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Delete"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <!-- File Info -->
        <div class="p-2 bg-gray-800">
          <p class="text-xs text-gray-300 truncate" :title="item.filename">
            {{ item.filename }}
          </p>
          <p class="text-xs text-gray-500">{{ formatFileSize(item.size) }}</p>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="total > limit" class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-400">
        Showing {{ offset + 1 }} - {{ Math.min(offset + limit, total) }} of {{ total }}
      </div>
      <div class="flex gap-2">
        <button
          @click="loadPrevious"
          :disabled="offset === 0"
          class="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          @click="loadNext"
          :disabled="offset + limit >= total"
          class="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*,video/*,audio/*,.pdf,.txt,.json,.md,.html"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Image Editor Modal -->
    <ImageEditor
      v-if="editingMedia"
      :is-open="!!editingMedia"
      :media="editingMedia"
      :project-id="projectId"
      @close="editingMedia = null"
      @saved="handleImageSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
  uploadMedia,
  listMedia,
  deleteMedia,
  isImage,
  isVideo,
  formatFileSize,
  type Media
} from '@/services/media'
import ImageEditor from './ImageEditor.vue'

const props = defineProps<{
  projectId?: string
  selectable?: boolean
  hideInsertButton?: boolean
  hideCopyUrl?: boolean
}>()

const emit = defineEmits<{
  'media-selected': [media: Media]
  'media-inserted': [media: Media]
}>()

const toast = useToast()

// State
const mediaList = ref<Media[]>([])
const loading = ref(false)
const isDragging = ref(false)
const filterType = ref('')
const searchQuery = ref('')
const offset = ref(0)
const limit = ref(48)
const total = ref(0)
const uploadingFiles = ref<Array<{ id: string; filename: string; progress: number }>>([])
const editingMedia = ref<Media | null>(null)

// Refs
const dropZoneRef = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()

// Computed
const filteredMedia = computed(() => {
  let filtered = mediaList.value

  // Filter by type
  if (filterType.value) {
    filtered = filtered.filter(item => {
      if (filterType.value === 'image') return isImage(item.mimeType)
      if (filterType.value === 'video') return isVideo(item.mimeType)
      if (filterType.value === 'audio') return item.mimeType.startsWith('audio/')
      if (filterType.value === 'application') return item.mimeType.startsWith('application/')
      return true
    })
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      item =>
        item.filename.toLowerCase().includes(query) ||
        item.altText?.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Methods
const loadMedia = async () => {
  try {
    loading.value = true
    const response = await listMedia({
      projectId: props.projectId,
      limit: limit.value,
      offset: offset.value
    })
    mediaList.value = response.media
    total.value = response.total
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load media')
  } finally {
    loading.value = false
  }
}

const openUploadDialog = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (event.dataTransfer?.files) {
    handleFiles(Array.from(event.dataTransfer.files))
  }
}

const handleFiles = async (files: File[]) => {
  for (const file of files) {
    const uploadId = Date.now().toString() + Math.random()
    uploadingFiles.value.push({
      id: uploadId,
      filename: file.name,
      progress: 0
    })

    try {
      await uploadMedia(
        file,
        props.projectId,
        undefined,
        (progress) => {
          const upload = uploadingFiles.value.find(u => u.id === uploadId)
          if (upload) {
            upload.progress = progress
          }
        }
      )

      toast.success(`Uploaded ${file.name}`)
      await loadMedia()
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to upload ${file.name}`)
    } finally {
      uploadingFiles.value = uploadingFiles.value.filter(u => u.id !== uploadId)
    }
  }
}

const selectMedia = (media: Media) => {
  if (props.selectable) {
    emit('media-selected', media)
  } else if (isImage(media.mimeType)) {
    // If not selectable, open editor for images
    openEditor(media)
  }
}

const openEditor = (media: Media) => {
  if (isImage(media.mimeType)) {
    editingMedia.value = media
  }
}

const handleImageSaved = (newMedia: Media) => {
  editingMedia.value = null
  loadMedia() // Refresh the media list
}

const insertMedia = (media: Media) => {
  emit('media-inserted', media)
}

const deleteMediaItem = async (media: Media) => {
  if (!confirm(`Are you sure you want to delete "${media.filename}"?`)) {
    return
  }

  try {
    await deleteMedia(media.id)
    toast.success('Media deleted')
    await loadMedia()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to delete media')
  }
}

const loadNext = () => {
  if (offset.value + limit.value < total.value) {
    offset.value += limit.value
    loadMedia()
  }
}

const loadPrevious = () => {
  if (offset.value > 0) {
    offset.value = Math.max(0, offset.value - limit.value)
    loadMedia()
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E'
}

const handleVideoError = () => {
  // Handle video error if needed
}

const copyUrl = async (media: Media) => {
  try {
    await navigator.clipboard.writeText(media.publicUrl)
    toast.success('URL copied to clipboard')
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = media.publicUrl
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      toast.success('URL copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy URL')
    }
    document.body.removeChild(textArea)
  }
}

// Watch for project changes
watch(() => props.projectId, () => {
  offset.value = 0
  loadMedia()
})

// Lifecycle
onMounted(() => {
  loadMedia()
})

// Expose methods
defineExpose({
  loadMedia,
  insertMedia
})
</script>

<style scoped>
.media-manager {
  @apply p-6;
}
</style>

