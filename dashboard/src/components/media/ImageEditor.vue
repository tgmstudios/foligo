<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="handleClose"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-90 transition-opacity" @click="handleClose"></div>
      
      <div class="inline-block align-bottom bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
        <!-- Header -->
        <div class="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">{{ media?.filename || 'Image Editor' }}</h3>
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

        <!-- Toolbar -->
        <div class="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-2 flex-wrap">
          <div class="flex items-center gap-2 border-r border-gray-700 pr-3">
            <button
              @click="setTool('select')"
              :class="[
                'px-3 py-1.5 rounded text-sm transition-colors',
                currentTool === 'select' ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
              title="Select/Move"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </button>
            <button
              @click="setTool('crop')"
              :class="[
                'px-3 py-1.5 rounded text-sm transition-colors',
                currentTool === 'crop' ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
              title="Crop"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              @click="setTool('rectangle')"
              :class="[
                'px-3 py-1.5 rounded text-sm transition-colors',
                currentTool === 'rectangle' ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
              title="Rectangle"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              </svg>
            </button>
            <button
              @click="setTool('arrow')"
              :class="[
                'px-3 py-1.5 rounded text-sm transition-colors',
                currentTool === 'arrow' ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
              title="Arrow"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              @click="setTool('text')"
              :class="[
                'px-3 py-1.5 rounded text-sm transition-colors',
                currentTool === 'text' ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
              title="Text"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <button
              @click="setTool('brush')"
              :class="[
                'px-3 py-1.5 rounded text-sm transition-colors',
                currentTool === 'brush' ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
              title="Pencil/Brush - Draw freehand"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-2 border-r border-gray-700 pr-3">
            <label class="text-sm text-gray-300">Color:</label>
            <input
              v-model="strokeColor"
              type="color"
              class="w-8 h-8 rounded border border-gray-600 cursor-pointer"
              @change="updateColor"
            />
          </div>

          <div class="flex items-center gap-2 border-r border-gray-700 pr-3">
            <label class="text-sm text-gray-300">Size:</label>
            <input
              v-model.number="strokeWidth"
              type="range"
              min="1"
              max="20"
              class="w-24"
              @input="updateStrokeWidth"
            />
            <span class="text-sm text-gray-300 w-8">{{ strokeWidth }}px</span>
          </div>

          <div class="flex items-center gap-2 ml-auto">
            <button
              @click="undo"
              :disabled="!canUndo"
              class="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              @click="clearCanvas"
              class="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
              title="Clear All"
            >
              Clear
            </button>
            <button
              @click="handleSave"
              :disabled="isSaving"
              class="px-4 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
              title="Save and upload edited image"
            >
              {{ isSaving ? 'Saving...' : 'Save & Upload' }}
            </button>
          </div>
        </div>

        <!-- Canvas Area -->
        <div class="bg-gray-900 p-4 flex justify-center items-center min-h-[600px] max-h-[80vh] overflow-auto">
          <div v-if="!media" class="text-gray-400">Loading image...</div>
          <canvas
            v-else
            ref="canvasRef"
            class="border border-gray-700 shadow-lg max-w-full"
          ></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Canvas, Rect, Line, Polygon, IText, Image as FabricImage, Group, PencilBrush } from 'fabric'
import type { Media } from '@/services/media'
import { uploadMedia } from '@/services/media'
import { useToast } from 'vue-toastification'

const props = defineProps<{
  isOpen: boolean
  media: Media | null
  projectId?: string
}>()

const emit = defineEmits<{
  'close': []
  'saved': [media: Media]
}>()

const toast = useToast()
const route = useRoute()

const canvasRef = ref<HTMLCanvasElement>()
let canvas: Canvas | null = null
const currentTool = ref<'select' | 'crop' | 'rectangle' | 'arrow' | 'text' | 'brush'>('select')
const strokeColor = ref('#ff0000')
const strokeWidth = ref(3)
const isSaving = ref(false)
const canUndo = ref(false)
const history: string[] = []

// Get projectId from props, media, or route
const effectiveProjectId = computed(() => {
  return props.projectId || props.media?.projectId || (route.params.projectId as string | undefined)
})

const setTool = (tool: typeof currentTool.value) => {
  currentTool.value = tool
  if (canvas) {
    // Set cursor first
    canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair'
    
    // Enable/disable drawing mode
    if (tool === 'brush') {
      // Disable selection first to avoid conflicts
      canvas.selection = false
      // Disable any active objects
      canvas.discardActiveObject()
      
      // Enable drawing mode first
      canvas.isDrawingMode = true
      
      // Wait a moment for brush to initialize, then configure it
      setTimeout(() => {
        if (canvas) {
          // Ensure drawing mode is still enabled
          canvas.isDrawingMode = true
          
          // Get or create the brush
          let brush = canvas.freeDrawingBrush
          if (!brush) {
            // Create a new PencilBrush if it doesn't exist
            brush = new PencilBrush(canvas)
            canvas.freeDrawingBrush = brush
          }
          
          // Configure brush properties
          if (brush) {
            brush.color = strokeColor.value
            brush.width = strokeWidth.value
          }
          
          canvas.requestRenderAll()
        }
      }, 50)
      
      // Also configure immediately if brush exists
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = strokeColor.value
        canvas.freeDrawingBrush.width = strokeWidth.value
      }
      
      canvas.requestRenderAll()
    } else {
      canvas.isDrawingMode = false
      // Set selection based on tool
      canvas.selection = tool === 'select' || tool === 'crop'
      
      // For crop tool, enable selection
      if (tool === 'crop') {
        canvas.selectionColor = 'rgba(59, 130, 246, 0.3)'
        canvas.selectionBorderColor = '#3b82f6'
        // Remove any existing crop rectangles when switching tools
        const existingCropRects = canvas.getObjects().filter((obj: any) => obj.cropRect)
        existingCropRects.forEach((obj: any) => canvas.remove(obj))
        canvas.discardActiveObject()
        canvas.requestRenderAll()
        toast.info('Click and drag to select the area to crop')
      } else {
        // Remove crop rectangles when switching away from crop tool
        const existingCropRects = canvas.getObjects().filter((obj: any) => obj.cropRect)
        existingCropRects.forEach((obj: any) => canvas.remove(obj))
        canvas.requestRenderAll()
      }
    }
  }
}

const updateColor = () => {
  if (canvas) {
    // If brush tool is active, ensure drawing mode is enabled and brush exists
    if (currentTool.value === 'brush') {
      canvas.isDrawingMode = true
      let brush = canvas.freeDrawingBrush
      if (!brush) {
        brush = new PencilBrush(canvas)
        canvas.freeDrawingBrush = brush
      }
      if (brush) {
        brush.color = strokeColor.value
        brush.width = strokeWidth.value
      }
    } else if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = strokeColor.value
      canvas.freeDrawingBrush.width = strokeWidth.value
    }
  }
}

const updateStrokeWidth = () => {
  if (canvas) {
    // If brush tool is active, ensure drawing mode is enabled and brush exists
    if (currentTool.value === 'brush') {
      canvas.isDrawingMode = true
      let brush = canvas.freeDrawingBrush
      if (!brush) {
        brush = new PencilBrush(canvas)
        canvas.freeDrawingBrush = brush
      }
      if (brush) {
        brush.width = strokeWidth.value
      }
    } else if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = strokeWidth.value
    }
  }
}

const saveState = () => {
  if (canvas) {
    const state = JSON.stringify(canvas.toJSON())
    history.push(state)
    // Keep only last 50 states to prevent memory issues
    if (history.length > 50) {
      history.shift()
    }
    canUndo.value = history.length > 1 // Can undo if we have more than just the initial state
  }
}

const undo = () => {
  if (history.length > 1 && canvas) {
    // Get the previous state before removing current
    const previousState = history[history.length - 2]
    // Remove current state
    history.pop()
    // Load previous state (keep at least the initial state)
    if (previousState) {
      try {
        // Preserve background image before loading
        const bgImage = canvas.backgroundImage
        
        // Load state and ensure proper rendering
        canvas.loadFromJSON(previousState, () => {
          if (canvas) {
            // Restore background image if it was lost
            if (!canvas.backgroundImage && bgImage) {
              canvas.backgroundImage = bgImage
            }
            // Force multiple renders to ensure visibility
            canvas.renderAll()
            requestAnimationFrame(() => {
              if (canvas) {
                canvas.renderAll()
                canvas.requestRenderAll()
              }
            })
          }
        }, { 
          // Preserve existing objects during load to prevent flash
          preserveObjectStacking: true 
        }).catch((error) => {
          console.error('Error loading state:', error)
          toast.error('Failed to undo')
        })
      } catch (error) {
        console.error('Error parsing state:', error)
        toast.error('Failed to undo')
      }
    }
    canUndo.value = history.length > 1
  }
}

const clearCanvas = () => {
  if (canvas && confirm('Clear all annotations?')) {
    const bgImage = canvas.backgroundImage
    canvas.clear()
    // Restore background image - in Fabric.js v6, backgroundImage is a direct property
    if (bgImage) {
      canvas.backgroundImage = bgImage
      canvas.requestRenderAll()
    }
    history.length = 0
    canUndo.value = false
    saveState()
  }
}

const initializeCanvas = async () => {
  if (!canvasRef.value || !props.media) return

  await nextTick()

  canvas = new Canvas(canvasRef.value, {
    backgroundColor: '#1f2937'
  })

  // Load image
  FabricImage.fromURL(props.media.publicUrl, {
    crossOrigin: 'anonymous'
  }).then((img) => {
    if (!canvas) return

    // Scale image to fit viewport (max 1200px width, max 800px height)
    const maxWidth = 1200
    const maxHeight = 800
    let scale = 1
    
    if (img.width! > maxWidth) {
      scale = maxWidth / img.width!
    }
    if (img.height! * scale > maxHeight) {
      scale = maxHeight / img.height!
    }

    // Set canvas size based on scaled image
    const canvasWidth = Math.round(img.width! * scale)
    const canvasHeight = Math.round(img.height! * scale)
    
    // Set canvas dimensions
    canvas.setDimensions({
      width: canvasWidth,
      height: canvasHeight
    })
    
    // Scale the image to fit the canvas
    img.scale(scale)
    
    // Set as background image - Fabric.js v6 API (direct property assignment)
    canvas.backgroundImage = img
    canvas.requestRenderAll()
    saveState()
  }).catch((error) => {
    console.error('Error loading image:', error)
    toast.error('Failed to load image')
  })

  // Set up drawing brush (enable drawing mode temporarily to initialize brush)
  canvas.isDrawingMode = true // Enable to initialize brush
  // Force brush initialization by accessing it
  let brush = canvas.freeDrawingBrush
  if (!brush) {
    // Create a new PencilBrush if it doesn't exist
    brush = new PencilBrush(canvas)
    canvas.freeDrawingBrush = brush
  }
  if (brush) {
    brush.color = strokeColor.value
    brush.width = strokeWidth.value
  }
  canvas.isDrawingMode = false // Disable until brush tool is selected

  // Handle object creation based on tool
  canvas.on('mouse:down', (opt) => {
    // Don't interfere with brush drawing
    if (currentTool.value === 'brush') {
      return
    }
    
    if (currentTool.value === 'crop') {
      // Create crop selection rectangle
      saveState()
      const pointer = canvas!.getPointer(opt.e)
      const startX = pointer.x
      const startY = pointer.y
      
      // Remove any existing crop rectangle
      const existingObjects = canvas!.getObjects().filter((obj: any) => obj.cropRect)
      existingObjects.forEach((obj: any) => canvas!.remove(obj))
      
      const cropRect = new Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        stroke: '#3b82f6',
        strokeWidth: 2,
        fill: 'rgba(59, 130, 246, 0.1)',
        strokeDashArray: [5, 5],
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        cropRect: true // Mark as crop rectangle
      })
      canvas!.add(cropRect)
      canvas!.setActiveObject(cropRect)

      let isDown = true
      const handleMove = (e: any) => {
        if (!isDown) return
        const pointer = canvas!.getPointer(e.e)
        const newLeft = Math.min(startX, pointer.x)
        const newTop = Math.min(startY, pointer.y)
        const newWidth = Math.abs(pointer.x - startX)
        const newHeight = Math.abs(pointer.y - startY)
        
        cropRect.set({
          left: newLeft,
          top: newTop,
          width: newWidth,
          height: newHeight
        })
        canvas!.requestRenderAll()
      }

      const handleUp = () => {
        isDown = false
        canvas!.off('mouse:move', handleMove)
        canvas!.off('mouse:up', handleUp)
        saveState()
      }

      canvas!.on('mouse:move', handleMove)
      canvas!.on('mouse:up', handleUp)
    } else if (currentTool.value === 'rectangle') {
      saveState()
      const pointer = canvas!.getPointer(opt.e)
      const startX = pointer.x
      const startY = pointer.y
      
      const rect = new Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
        fill: 'transparent'
      })
      canvas!.add(rect)

      let isDown = true
      const handleMove = (e: any) => {
        if (!isDown) return
        const pointer = canvas!.getPointer(e.e)
        const newLeft = Math.min(startX, pointer.x)
        const newTop = Math.min(startY, pointer.y)
        const newWidth = Math.abs(pointer.x - startX)
        const newHeight = Math.abs(pointer.y - startY)
        
        rect.set({
          left: newLeft,
          top: newTop,
          width: newWidth,
          height: newHeight
        })
        canvas!.requestRenderAll()
      }

      const handleUp = () => {
        isDown = false
        canvas!.off('mouse:move', handleMove)
        canvas!.off('mouse:up', handleUp)
        saveState()
      }

      canvas!.on('mouse:move', handleMove)
      canvas!.on('mouse:up', handleUp)
    } else if (currentTool.value === 'arrow') {
      saveState()
      const pointer = canvas!.getPointer(opt.e)
      const startX = pointer.x
      const startY = pointer.y

      const line = new Line([startX, startY, startX, startY], {
        stroke: strokeColor.value,
        strokeWidth: strokeWidth.value,
        fill: '',
        strokeLineCap: 'round',
        strokeLineJoin: 'round'
      })
      canvas!.add(line)

      let isDown = true
      const handleMove = (e: any) => {
        if (!isDown) return
        const pointer = canvas!.getPointer(e.e)
        line.set({
          x2: pointer.x,
          y2: pointer.y
        })
        canvas!.requestRenderAll()
      }

      const handleUp = () => {
        isDown = false
        // Add arrowhead
        const angle = Math.atan2(line.y2! - line.y1!, line.x2! - line.x1!)
        const arrowLength = 15
        const arrowAngle = Math.PI / 6

        const arrow = new Polygon([
          { x: line.x2!, y: line.y2! },
          {
            x: line.x2! - arrowLength * Math.cos(angle - arrowAngle),
            y: line.y2! - arrowLength * Math.sin(angle - arrowAngle)
          },
          {
            x: line.x2! - arrowLength * Math.cos(angle + arrowAngle),
            y: line.y2! - arrowLength * Math.sin(angle + arrowAngle)
          }
        ], {
          fill: strokeColor.value,
          stroke: strokeColor.value,
          strokeWidth: 1
        })

        const group = new Group([line, arrow], {
          left: Math.min(line.x1!, line.x2!),
          top: Math.min(line.y1!, line.y2!)
        })
        canvas!.remove(line)
        canvas!.add(group)
        canvas!.off('mouse:move', handleMove)
        canvas!.off('mouse:up', handleUp)
        saveState()
      }

      canvas!.on('mouse:move', handleMove)
      canvas!.on('mouse:up', handleUp)
    } else if (currentTool.value === 'text') {
      saveState()
      const pointer = canvas!.getPointer(opt.e)
      const text = new IText('Double click to edit', {
        left: pointer.x,
        top: pointer.y,
        fill: strokeColor.value,
        fontSize: 20,
        fontFamily: 'Arial'
      })
      canvas!.add(text)
      text.enterEditing()
      saveState()
    }
  })

  // Save state on path creation (brush)
  canvas.on('path:created', () => {
    saveState()
  })
}

const handleSave = async () => {
  if (!canvas || !props.media) {
    toast.error('Canvas or media not available')
    return
  }

  // Use projectId from props, media, or route
  const projectId = effectiveProjectId.value
  if (!projectId) {
    toast.error('Project ID is required to save. Please open this image from a project context.')
    return
  }

  isSaving.value = true
  try {
    // If crop tool is active and there's a selection, crop the image
    if (currentTool.value === 'crop') {
      // Find the crop rectangle (marked with cropRect property)
      const cropRectObj = canvas.getObjects().find((obj: any) => obj.cropRect) as Rect | undefined
      const activeObject = cropRectObj || canvas.getActiveObject()
      
      if (!activeObject || !(activeObject instanceof Rect)) {
        toast.error('Please select an area to crop first. Click and drag to create a crop selection.')
        isSaving.value = false
        return
      }
      
      // Get crop coordinates from the rectangle object
      const rect = activeObject as Rect
      const rectLeft = rect.left || 0
      const rectTop = rect.top || 0
      const rectWidth = Math.abs(rect.width || 0)
      const rectHeight = Math.abs(rect.height || 0)
      
      // Get the background image to calculate original dimensions
      const bgImage = canvas.backgroundImage as FabricImage
      if (!bgImage) {
        toast.error('No image to crop')
        isSaving.value = false
        return
      }
      
      // Get the original image URL and load it
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = props.media.publicUrl
      })
      
      // Get canvas dimensions
      const canvasWidth = canvas.getWidth()
      const canvasHeight = canvas.getHeight()
      
      // The background image fills the canvas (we set canvas size to match scaled image)
      // So the scale factor is simply: originalImageSize / canvasSize
      const scaleX = img.width / canvasWidth
      const scaleY = img.height / canvasHeight
      
      // Convert crop rectangle coordinates from canvas space to original image space
      // The crop rectangle is already in canvas coordinates (0,0 is top-left of canvas)
      const cropLeft = Math.max(0, Math.min(img.width, rectLeft * scaleX))
      const cropTop = Math.max(0, Math.min(img.height, rectTop * scaleY))
      const cropWidth = Math.max(1, Math.min(img.width - cropLeft, rectWidth * scaleX))
      const cropHeight = Math.max(1, Math.min(img.height - cropTop, rectHeight * scaleY))
      
      // Create a temporary canvas for cropping
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = cropWidth
      tempCanvas.height = cropHeight
      const ctx = tempCanvas.getContext('2d')
      
      if (!ctx) {
        toast.error('Failed to create crop canvas')
        isSaving.value = false
        return
      }
      
      // Draw the cropped portion
      ctx.drawImage(
        img,
        cropLeft, cropTop, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      )
      
      // Convert to blob and upload
      tempCanvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to create cropped image')
          isSaving.value = false
          return
        }
        
        try {
          const file = new File([blob], props.media.filename.replace(/\.[^/.]+$/, '_cropped.png'), {
            type: 'image/png'
          })
          const newMedia = await uploadMedia(file, projectId, props.media.altText || undefined)
          toast.success('Image cropped and saved successfully')
          emit('saved', newMedia)
          handleClose()
        } catch (error: any) {
          console.error('Crop save error:', error)
          toast.error(error.response?.data?.message || error.message || 'Failed to save cropped image')
          isSaving.value = false
        }
      }, 'image/png')
      return
    }
    
    // Export canvas to blob (full image with annotations)
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    })

    // Convert data URL to blob
    const response = await fetch(dataURL)
    const blob = await response.blob()

    // Create file from blob
    const file = new File([blob], props.media.filename.replace(/\.[^/.]+$/, '_edited.png'), {
      type: 'image/png'
    })

    // Upload as new media
    const newMedia = await uploadMedia(file, props.projectId, props.media.altText || undefined)
    
    toast.success('Image saved successfully')
    emit('saved', newMedia)
    handleClose()
  } catch (error: any) {
    console.error('Save error:', error)
    toast.error(error.response?.data?.message || error.message || 'Failed to save image')
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  if (canvas) {
    canvas.dispose()
    canvas = null
  }
  history.length = 0
  canUndo.value = false
  emit('close')
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.media) {
    nextTick(() => {
      initializeCanvas()
    })
  } else if (!isOpen && canvas) {
    handleClose()
  }
})

onMounted(() => {
  if (props.isOpen && props.media) {
    initializeCanvas()
  }
})
</script>

<style scoped>
canvas {
  cursor: crosshair;
}
</style>

