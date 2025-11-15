<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-gray-900 flex flex-col"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900 flex-shrink-0">
      <h3 class="text-xl font-bold text-white">
        {{ isEditMode ? 'Edit Diagram' : 'Create Diagram' }}
      </h3>
      <div class="flex items-center gap-2">
        <button
          @click="saveDiagram"
          :disabled="isSaving || !isReady"
          class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span class="flex items-center gap-2">
            <svg v-if="!isSaving" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSaving ? 'Saving...' : 'Save & Insert' }}
          </span>
        </button>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-white"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Draw.io iframe -->
    <div class="flex-1 relative w-full h-full overflow-hidden">
      <iframe
        v-if="showIframe"
        :key="iframeKey"
        ref="drawioIframeRef"
        :src="drawioUrl"
        class="w-full h-full border-0"
        @load="handleIframeLoad"
      ></iframe>
      
      <!-- Loading overlay -->
      <div v-if="!isReady" class="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10">
        <div class="text-center">
          <svg class="w-8 h-8 mx-auto mb-2 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-gray-400 text-sm">Loading Draw.io editor...</p>
          <p class="text-gray-500 text-xs mt-2">This may take a few seconds</p>
          <button
            @click="reloadIframe"
            class="mt-4 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm"
          >
            Reload Editor
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { uploadMedia } from '@/services/media'
import { useToast } from 'vue-toastification'

const toast = useToast()

const props = defineProps<{
  isOpen: boolean
  projectId?: string
  diagramXml?: string // XML data for editing existing diagram
  existingImageUrl?: string // URL of existing image (for edit mode)
}>()

const emit = defineEmits<{
  'close': []
  'diagram-saved': [data: { imageUrl: string; xml: string; isEdit: boolean }]
}>()

const drawioIframeRef = ref<HTMLIFrameElement>()
const isSaving = ref(false)
const isReady = ref(false)
const showIframe = ref(false)
const iframeKey = ref(0)
const currentDiagramXml = ref<string | null>(props.diagramXml || null)
const isEditMode = computed(() => !!props.diagramXml)

// Draw.io embed URL with proper parameters
const drawioUrl = computed(() => {
  const baseUrl = 'https://embed.diagrams.net/'
  const params = new URLSearchParams({
    embed: '1',
    proto: 'json',
    spin: '1', // Show spinner until init message
    ui: 'kennedy', // Modern UI theme
    dark: '1', // Dark mode to match our theme
    saveAndExit: '0', // Don't auto-save on exit
    noSaveBtn: '1', // Hide default save button
    noExitBtn: '1', // Hide default exit button
    t: Date.now().toString() // Cache-busting parameter
  })
  
  return `${baseUrl}?${params.toString()}`
})

// Handle iframe load
const handleIframeLoad = () => {
  console.log('Draw.io iframe loaded')
  
  // Check if contentWindow is available
  if (!drawioIframeRef.value?.contentWindow) {
    console.error('Iframe contentWindow is null - this should not happen with fresh iframe')
    
    // Force reload by recreating the iframe
    setTimeout(() => {
      if (!isReady.value) {
        console.log('Forcing iframe recreation due to null contentWindow')
        showIframe.value = false
        setTimeout(() => {
          iframeKey.value++
          showIframe.value = true
        }, 100)
      }
    }, 1000)
    return
  }
  
  console.log('ContentWindow available, preparing to send init message')
  
  // Send init message after a short delay to ensure draw.io is ready
  setTimeout(() => {
    sendInitMessage()
  }, 300)
  
  // Set a timeout to mark as ready if we don't get a response
  setTimeout(() => {
    if (!isReady.value) {
      console.warn('No init response after 10 seconds, marking as ready anyway')
      isReady.value = true
    }
  }, 10000)
}

// Send init message to draw.io
const sendInitMessage = () => {
  if (!drawioIframeRef.value?.contentWindow) {
    console.warn('Cannot send init - iframe not ready')
    return
  }
  
  if (isReady.value) {
    console.log('Already initialized, skipping')
    return
  }
  
  const iframe = drawioIframeRef.value.contentWindow
  
  const initMessage: any = {
    action: 'load',
    autosave: 0
  }
  
  // Include XML data if editing existing diagram
  if (currentDiagramXml.value) {
    initMessage.xml = currentDiagramXml.value
    console.log('Initializing with existing diagram XML')
  } else {
    // Start with a blank diagram
    initMessage.xml = getBlankDiagramXml()
    console.log('Initializing with blank diagram')
  }
  
  console.log('Sending init message to draw.io')
  iframe.postMessage(JSON.stringify(initMessage), '*')
}

// Get blank diagram XML
const getBlankDiagramXml = () => {
  return `<mxfile host="embed.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="5.0" version="21.1.0" etag="" type="embed">
  <diagram name="Page-1" id="1">
    <mxGraphModel dx="800" dy="450" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
}

// Handle messages from draw.io
const handleMessage = (event: MessageEvent) => {
  // Only accept messages from draw.io
  const allowedOrigins = ['diagrams.net', 'draw.io']
  const isAllowed = allowedOrigins.some(origin => event.origin.includes(origin))
  
  if (!isAllowed) {
    return
  }
  
  let data: any
  try {
    data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
  } catch {
    return
  }
  
  if (!data || typeof data !== 'object') {
    return
  }
  
  console.log('Draw.io message:', data.event || data.action)
  
  // Handle different message types
  if (data.event === 'init') {
    console.log('Draw.io initialized')
    isReady.value = true
  } else if (data.event === 'load') {
    console.log('Draw.io loaded')
    isReady.value = true
  } else if (data.event === 'autosave') {
    // Update current XML on autosave
    if (data.xml) {
      currentDiagramXml.value = data.xml
      console.log('Diagram autosaved')
    }
  } else if (data.event === 'save') {
    // Handle explicit save
    if (data.xml) {
      currentDiagramXml.value = data.xml
      console.log('Diagram saved')
    }
  } else if (data.event === 'export') {
    // Handle export response
    handleExportResponse(data)
  } else if (data.event === 'exit') {
    // User clicked close - just close the modal
    handleClose()
  }
}

// Save diagram (export PNG + keep XML)
const saveDiagram = async () => {
  if (!drawioIframeRef.value?.contentWindow || !isReady.value) {
    toast.error('Editor is not ready')
    return
  }
  
  if (!props.projectId) {
    toast.error('Project ID is required')
    return
  }
  
  isSaving.value = true
  
  try {
    const iframe = drawioIframeRef.value.contentWindow
    
    // First, request the current XML
    iframe.postMessage(JSON.stringify({ action: 'export', format: 'xmlpng' }), '*')
    
    // Export will be handled in handleExportResponse
  } catch (error) {
    console.error('Error saving diagram:', error)
    toast.error('Failed to save diagram')
    isSaving.value = false
  }
}

// Handle export response
const handleExportResponse = async (data: any) => {
  try {
    if (!data.data) {
      throw new Error('No export data received')
    }
    
    // The data.data contains the PNG with embedded XML
    let imageData = data.data
    
    // Handle base64 data
    if (imageData.startsWith('data:image/png;base64,')) {
      imageData = imageData.substring('data:image/png;base64,'.length)
    }
    
    // Convert base64 to blob
    const byteCharacters = atob(imageData)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/png' })
    
    // Create file
    const filename = `diagram-${Date.now()}.png`
    const file = new File([blob], filename, { type: 'image/png' })
    
    // Upload to server
    toast.info('Uploading diagram...')
    const media = await uploadMedia(file, props.projectId, 'Draw.io diagram')
    
    // Also extract the XML from the data
    let xml = currentDiagramXml.value
    if (data.xml) {
      xml = data.xml
    }
    
    // If no XML, request it
    if (!xml) {
      console.warn('No XML available, requesting from draw.io')
      // Request XML export
      const iframe = drawioIframeRef.value?.contentWindow
      if (iframe) {
        iframe.postMessage(JSON.stringify({ action: 'export', format: 'xml' }), '*')
      }
      // For now, use a placeholder
      xml = getBlankDiagramXml()
    }
    
    toast.success('Diagram saved successfully')
    
    // Emit the saved data
    emit('diagram-saved', {
      imageUrl: media.publicUrl,
      xml: xml || '',
      isEdit: isEditMode.value
    })
    
    // Close modal
    handleClose()
  } catch (error: any) {
    console.error('Error processing export:', error)
    toast.error(error.response?.data?.message || error.message || 'Failed to save diagram')
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  emit('close')
}

// Manual iframe reload function
const reloadIframe = () => {
  console.log('Manual iframe reload requested')
  isReady.value = false
  showIframe.value = false
  
  setTimeout(() => {
    iframeKey.value++
    showIframe.value = true
    console.log('Iframe manually reloaded with key:', iframeKey.value)
  }, 100)
}

// Watch for modal opening
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    console.log('DrawIO editor opened')
    isReady.value = false
    isSaving.value = false
    currentDiagramXml.value = props.diagramXml || null
    
    // Force iframe recreation to prevent caching issues
    showIframe.value = false
    iframeKey.value++
    
    // Wait a tick then show the new iframe
    setTimeout(() => {
      showIframe.value = true
      console.log('Iframe recreated with key:', iframeKey.value)
    }, 50)
  } else {
    console.log('DrawIO editor closed')
    isReady.value = false
    // Hide iframe to clean up resources
    showIframe.value = false
  }
})

// Watch for diagramXml changes
watch(() => props.diagramXml, (newXml) => {
  if (newXml && props.isOpen) {
    currentDiagramXml.value = newXml
  }
})

// Setup message listener
onMounted(() => {
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<style scoped>
iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
