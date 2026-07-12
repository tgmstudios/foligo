
<template>
  <div class="absolute left-14 top-24 z-40 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
    <div class="px-3 py-2 border-b border-gray-800 flex items-center justify-between gap-2">
      <div>
        <h4 class="text-xs font-semibold text-white">Media library</h4>
        <p class="text-[11px] text-gray-500 mt-0.5">Click an image to insert it</p>
      </div>
      <button
        type="button"
        class="shrink-0 px-2.5 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-xs font-medium text-white transition-colors"
        :disabled="isUploading"
        @click="fileInput?.click()"
      >
        {{ isUploading ? `${uploadProgress}%` : 'Add image' }}
      </button>
    </div>
    <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFileSelect" />
    <div class="px-2 pt-2">
      <button
        type="button"
        class="w-full rounded-md border border-dashed px-3 py-3 text-center text-[11px] transition-colors"
        :class="isDragging ? 'border-primary-400 bg-primary-500/10 text-primary-300' : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'"
        @click="fileInput?.click()"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        Drop images here or choose files
      </button>
    </div>
    <div class="max-h-96 overflow-y-auto p-2 grid grid-cols-3 gap-2">
      <div v-if="isLoading" class="col-span-3 text-center py-6 text-gray-400 text-xs">Loading…</div>
      <div v-else-if="items.length === 0" class="col-span-3 text-center py-6 text-gray-500 text-xs">
        No media uploaded yet.
      </div>
      <button
        v-for="item in items"
        :key="item.id"
        @click="select(item)"
        class="aspect-square rounded-md overflow-hidden border border-gray-700 hover:border-primary-500 transition-colors"
        :title="item.filename"
      >
        <img :src="item.publicUrl" :alt="item.filename" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { listMedia, uploadMedia, type Media } from '@/services/media'

type MediaItem = Media

const props = defineProps<{ projectId?: string }>()

const emit = defineEmits<{
  (e: 'select', media: { id: string; url: string; filename: string }): void
}>()

const toast = useToast()
const items = ref<MediaItem[]>([])
const isLoading = ref(false)
const isUploading = ref(false)
const isDragging = ref(false)
const uploadProgress = ref(0)
const fileInput = ref<HTMLInputElement>()

async function loadItems() {
  isLoading.value = true
  try {
    const response = await listMedia({ projectId: props.projectId, mimeType: 'image' })
    items.value = response.media
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to load media')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadItems)

async function uploadFiles(files: File[]) {
  const images = files.filter(file => file.type.startsWith('image/'))
  if (!images.length) {
    toast.error('Please choose an image file')
    return
  }
  isUploading.value = true
  try {
    for (const file of images) {
      uploadProgress.value = 0
      const media = await uploadMedia(file, props.projectId, undefined, progress => { uploadProgress.value = progress })
      items.value.unshift(media)
      toast.success(`Uploaded ${file.name}`)
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to upload image')
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
    if (fileInput.value) fileInput.value.value = ''
  }
}

function onFileSelect(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  void uploadFiles(files)
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  void uploadFiles(Array.from(event.dataTransfer?.files || []))
}

async function select(item: MediaItem) {
  try {
    await navigator.clipboard.writeText(item.publicUrl)
    toast.success('Image URL copied — paste it into your LaTeX source')
  } catch {
    // Clipboard access can be blocked by the browser — the caller still gets the event.
  }
  emit('select', { id: item.id, url: item.publicUrl, filename: item.filename })
}
</script>
