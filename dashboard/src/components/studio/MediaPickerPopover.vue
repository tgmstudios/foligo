
<template>
  <div class="absolute left-14 top-24 z-40 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
    <div class="px-3 py-2 border-b border-gray-800">
      <h4 class="text-xs font-semibold text-white">Media library</h4>
      <p class="text-[11px] text-gray-500 mt-0.5">Click an image to copy its URL</p>
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
import api from '@/services/api'

interface MediaItem {
  id: string
  filename: string
  publicUrl: string
  mimeType: string
}

const emit = defineEmits<{
  (e: 'select', media: { id: string; url: string; filename: string }): void
}>()

const toast = useToast()
const items = ref<MediaItem[]>([])
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    const response = await api.get('/media', { params: { mimeType: 'image' } })
    items.value = response.data.media
  } finally {
    isLoading.value = false
  }
})

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
