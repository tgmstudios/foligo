<template>
  <div class="markdown-editor">
    <!-- Toolbar -->
    <div class="flex items-center justify-between p-4 border-b border-gray-600 bg-gray-800">
      <div class="flex items-center space-x-2">
        <button
          @click="togglePreview"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            showPreview ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          {{ showPreview ? 'Edit' : 'Preview' }}
        </button>
        <button
          @click="toggleMarkdownMode"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            showMarkdownMode ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
          title="Toggle Markdown Source Mode"
        >
          {{ showMarkdownMode ? 'WYSIWYG' : 'Markdown' }}
        </button>
        <button
          @click="insertMermaidDiagram"
          class="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
          title="Insert Mermaid Diagram"
        >
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Mermaid
          </span>
        </button>
        <button
          @click="openDrawIOEditor"
          class="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
          :title="isOnDiagramLine ? 'Edit Draw.io Diagram' : 'Insert Draw.io Diagram'"
        >
          <span class="flex items-center gap-1">
            <svg v-if="!isOnDiagramLine" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span :class="{ 'text-primary-400': isOnDiagramLine }">
              {{ isOnDiagramLine ? 'Edit' : 'Draw.io' }}
            </span>
          </span>
        </button>
        <button
          @click="openMediaManager"
          class="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
          title="Insert Media"
        >
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Media
          </span>
        </button>
        <div class="text-sm text-gray-400">
          {{ wordCount }} words
        </div>
        <div class="text-sm text-gray-400">
          {{ characterCount }} characters
        </div>
      </div>
    </div>

    <!-- Editor/Preview -->
    <div class="flex h-[600px]">
      <!-- WYSIWYG Editor -->
      <div v-show="!showPreview && !showMarkdownMode" class="flex-1 w-full h-full" ref="editorContainerRef">
        <Wysimark
          ref="wysimarkRef"
          v-model="localContent"
          :height="600"
          class="wysimark-editor"
        />
      </div>

      <!-- Markdown Source Editor -->
      <div v-show="!showPreview && showMarkdownMode" class="flex-1 w-full h-full relative">
        <textarea
          ref="markdownTextareaRef"
          @input="handleMarkdownInput"
          @blur="handleMarkdownBlur"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
          @click="updateCursorPosition"
          @keyup="updateCursorPosition"
          class="w-full h-full p-4 bg-gray-800 text-gray-100 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0"
          :placeholder="placeholder || 'Start writing your markdown content...'"
          spellcheck="false"
        ></textarea>
        
        <!-- Hint when cursor is on a diagram -->
        <transition name="fade">
          <div v-if="isOnDiagramLine" class="absolute bottom-4 right-4 bg-primary-600 text-white px-3 py-2 rounded-md shadow-lg text-sm flex items-center gap-2 pointer-events-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Editable draw.io diagram - Click "Edit" to modify</span>
          </div>
        </transition>
      </div>

      <!-- Preview -->
      <div v-show="showPreview" class="flex-1 p-4 bg-gray-800 overflow-y-auto">
        <div v-if="localContent.trim()" v-html="renderedMarkdown" ref="previewContainerRef" class="prose prose-sm max-w-none"></div>
        <div v-else class="text-gray-400 italic">No content to preview</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between p-4 border-t border-gray-600 bg-gray-800">
      <div class="text-xs text-gray-400">
        WYSIWYG Markdown Editor • Wysimark powered
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="handleCancel"
          class="px-3 py-1 text-sm text-gray-400 hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          :disabled="!localContent.trim()"
          class="px-4 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>

    <!-- Media Manager Modal -->
    <div
      v-if="showMediaManager"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4"
      @click.self="showMediaManager = false"
    >
      <div class="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 class="text-xl font-bold text-white">Media Library</h3>
          <button
            @click="showMediaManager = false"
            class="text-gray-400 hover:text-white"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <MediaManager
            :project-id="projectId"
            :selectable="true"
            @media-inserted="handleMediaInserted"
          />
        </div>
      </div>
    </div>

    <!-- Draw.io Editor Modal -->
    <DrawIOEditor
      :is-open="showDrawIOEditor"
      :project-id="projectId"
      :diagram-xml="currentDiagramXml || undefined"
      :existing-image-url="editingDiagramUrl || undefined"
      @close="showDrawIOEditor = false"
      @diagram-saved="handleDiagramSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { marked } from 'marked'
import mermaid from 'mermaid'
import Wysimark from '@wysimark/vue'
import MediaManager from '@/components/media/MediaManager.vue'
import DrawIOEditor from '@/components/editor/DrawIOEditor.vue'
import { uploadMedia, isImage, isVideo, type Media } from '@/services/media'
import { useToast } from 'vue-toastification'

const toast = useToast()

// Props definition
const props = defineProps<{
  modelValue: string
  placeholder?: string
  projectId?: string
}>()

// Emits definition
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'save': [value: string]
  'cancel': []
}>()

// Reactive state
const localContent = ref(props.modelValue)
const showPreview = ref(false)
const showMarkdownMode = ref(false)
const showMediaManager = ref(false)
const showDrawIOEditor = ref(false)
const currentDiagramXml = ref<string | null>(null)
const editingDiagramUrl = ref<string | null>(null)
const editorContainerRef = ref<HTMLElement>()
const previewContainerRef = ref<HTMLElement>()
const markdownTextareaRef = ref<HTMLTextAreaElement>()
const wysimarkRef = ref<any>(null)
const savedCursorPosition = ref<{ start: number; end: number } | null>(null)
const currentCursorPosition = ref(0)

// Track if we're updating from internal changes to avoid cursor jumps
let isInternalUpdate = false
let isTyping = false

// Check if cursor is on a diagram line (for showing edit vs insert)
const isOnDiagramLine = computed(() => {
  if (!showMarkdownMode.value || !markdownTextareaRef.value) {
    return false
  }
  
  const textarea = markdownTextareaRef.value
  const cursorPos = currentCursorPosition.value
  const textBefore = textarea.value.substring(0, cursorPos)
  const lines = textBefore.split('\n')
  const currentLine = lines[lines.length - 1]
  
  // Check if current line is an image
  if (currentLine.match(/^!\[.*\]\(.*\)$/)) {
    // Check if there's a drawio code block after (with optional blank line)
    const textAfter = textarea.value.substring(cursorPos)
    if (textAfter.match(/^\s*\n\s*\n?\s*```drawio\s*\n[^`]+\n```/)) return true
  }
  
  return false
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  // Don't update if user is currently typing in markdown mode
  if (isTyping && showMarkdownMode.value) {
    return
  }
  
  if (newValue !== localContent.value) {
    // Fix markdown syntax on external changes (e.g., from database/API)
    const fixedValue = fixMarkdownSyntax(newValue)
    
    // Only update if we're not in markdown mode with an active textarea
    // to avoid cursor jumps
    if (!showMarkdownMode.value || !markdownTextareaRef.value) {
      isInternalUpdate = true
      localContent.value = fixedValue
      
      // Emit fixed value if it was corrected
      if (fixedValue !== newValue) {
        console.log('Fixed markdown syntax on external content load')
        nextTick(() => {
          emit('update:modelValue', fixedValue)
        })
      }
      
      nextTick(() => {
        isInternalUpdate = false
      })
    } else {
      // In markdown mode, preserve cursor position when updating
      const textarea = markdownTextareaRef.value
      if (!textarea) return
      
      const cursorPos = textarea.selectionStart
      const scrollPos = textarea.scrollTop
      
      isInternalUpdate = true
      localContent.value = fixedValue
      
      // Emit fixed value if it was corrected
      if (fixedValue !== newValue) {
        console.log('Fixed markdown syntax on external content load (markdown mode)')
        nextTick(() => {
          emit('update:modelValue', fixedValue)
        })
      }
      
      nextTick(() => {
        // Restore cursor position and scroll
        if (textarea && textarea === markdownTextareaRef.value) {
          const newCursorPos = Math.min(cursorPos, fixedValue.length)
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          textarea.scrollTop = scrollPos
        }
        isInternalUpdate = false
      })
    }
  }
})

// Watch for local content changes and emit updates
// Skip this watch when in markdown mode to avoid cursor jumps
watch(localContent, (newValue) => {
  // Don't trigger watch effects when user is typing in markdown mode
  // The handleMarkdownInput function handles updates directly
  if (showMarkdownMode.value) {
    return
  }
  
  if (!isInternalUpdate) {
    emit('update:modelValue', newValue)
  }
  // Re-render mermaid diagrams when content changes and preview is visible
  if (showPreview.value && !isInternalUpdate) {
    nextTick(() => {
      // Remove processed flags to allow re-rendering (but keep error flags)
      if (previewContainerRef.value) {
        const mermaidElements = previewContainerRef.value.querySelectorAll('.mermaid[data-processed]:not([data-error])')
        mermaidElements.forEach((el) => {
          el.removeAttribute('data-processed')
        })
      }
      renderMermaidDiagrams()
    })
  }
})

// Computed properties
const wordCount = computed(() => {
  return localContent.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => {
  return localContent.value.length
})

// Configure marked to handle mermaid code blocks
// Set marked options first
marked.setOptions({
  breaks: true,
  gfm: true
})

// Configure marked renderer using the extensions API
marked.use({
  extensions: [{
    name: 'mermaid',
    level: 'block',
    start(src: string) {
      return src.match(/^```mermaid/)?.index
    },
    tokenizer(src: string) {
      const match = src.match(/^```mermaid\n([\s\S]*?)\n```/)
      if (match) {
        return {
          type: 'mermaid',
          raw: match[0],
          text: match[1].trim()
        }
      }
      return undefined
    },
    renderer(token: any) {
      return `<div class="mermaid">${token.text}</div>\n`
    }
  }]
})

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#3b82f6',
    primaryTextColor: '#f3f4f6',
    primaryBorderColor: '#60a5fa',
    lineColor: '#9ca3af',
    secondaryColor: '#1f2937',
    tertiaryColor: '#111827',
    background: '#1f2937',
    mainBkgColor: '#1f2937',
    secondBkgColor: '#111827',
    textColor: '#f3f4f6',
    border1: '#374151',
    border2: '#4b5563',
    arrowheadColor: '#60a5fa',
    clusterBkg: '#111827',
    clusterBorder: '#374151',
    defaultLinkColor: '#60a5fa',
    titleColor: '#ffffff',
    edgeLabelBackground: '#1f2937',
    actorBorder: '#374151',
    actorBkg: '#1f2937',
    actorTextColor: '#f3f4f6',
    actorLineColor: '#9ca3af',
    signalColor: '#f3f4f6',
    signalTextColor: '#f3f4f6',
    labelBoxBkgColor: '#111827',
    labelBoxBorderColor: '#374151',
    labelTextColor: '#f3f4f6',
    loopTextColor: '#f3f4f6',
    noteBorderColor: '#374151',
    noteBkgColor: '#111827',
    noteTextColor: '#f3f4f6',
    activationBorderColor: '#60a5fa',
    activationBkgColor: '#1e40af',
    sequenceNumberColor: '#ffffff',
    sectionBkgColor: '#111827',
    altBkgColor: '#1f2937',
    sectionBkgColor2: '#111827',
    excludeBkgColor: '#374151',
    taskBorderColor: '#374151',
    taskBkgColor: '#1f2937',
    taskTextLightColor: '#f3f4f6',
    taskTextColor: '#f3f4f6',
    taskTextDarkColor: '#ffffff',
    taskTextOutsideColor: '#9ca3af',
    taskTextClickableColor: '#60a5fa',
    activeTaskBorderColor: '#60a5fa',
    activeTaskBkgColor: '#1e40af',
    gridColor: '#374151',
    doneTaskBkgColor: '#065f46',
    doneTaskBorderColor: '#10b981',
    critBorderColor: '#ef4444',
    critBkgColor: '#7f1d1d'
  }
})

const renderedMarkdown = computed(() => {
  if (!localContent.value.trim()) return ''
  
  try {
    // Use marked() to convert markdown to HTML
    // The mermaid extension will handle ```mermaid blocks
    let html = marked(localContent.value) as string
    
    // Ensure we got a string
    if (typeof html !== 'string') {
      console.error('marked returned non-string:', typeof html)
      return `<pre>Error: marked returned ${typeof html}</pre>`
    }
    
    // Fallback: Post-process HTML to convert any remaining mermaid code blocks to divs
    // This handles edge cases where the extension might not catch all variations
    const mermaidCodeBlockRegex = /<pre><code(?:\s+class="[^"]*language-mermaid[^"]*")[^>]*>([\s\S]*?)<\/code><\/pre>/gi
    html = html.replace(mermaidCodeBlockRegex, (_match, code) => {
      // Decode HTML entities in the code
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
      return `<div class="mermaid">${decodedCode}</div>`
    })
    
    return html
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return `<pre>Error rendering markdown: ${error instanceof Error ? error.message : String(error)}</pre>`
  }
})

// MutationObserver to detect when Vue updates the DOM via v-html
let mutationObserver: MutationObserver | null = null

// Watch for when renderedMarkdown changes and ensure mermaid is rendered
// This handles the case where Vue's v-html replaces the DOM
watch([renderedMarkdown, showPreview], () => {
  if (showPreview.value && previewContainerRef.value) {
    // Wait for Vue to update the DOM via v-html
    nextTick(() => {
      setTimeout(() => {
        // Remove processed flags to allow re-rendering (but keep error flags)
        if (previewContainerRef.value) {
          const mermaidElements = previewContainerRef.value.querySelectorAll('.mermaid:not([data-error])')
          mermaidElements.forEach((el) => {
            el.removeAttribute('data-processed')
          })
        }
        renderMermaidDiagrams()
      }, 100)
    })
  }
}, { flush: 'post' })

// Setup MutationObserver to watch for DOM changes in preview container
watch([previewContainerRef, showPreview], ([container, isPreview]) => {
  // Clean up existing observer
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
  
  // Setup new observer if preview is visible and container exists
  if (isPreview && container) {
    // Check immediately for mermaid elements
    nextTick(() => {
      setTimeout(() => {
        if (previewContainerRef.value) {
          const mermaidElements = previewContainerRef.value.querySelectorAll('.mermaid:not([data-error])')
          if (mermaidElements.length > 0) {
            mermaidElements.forEach((el) => {
              el.removeAttribute('data-processed')
            })
            renderMermaidDiagrams()
          }
        }
      }, 100)
    })
    
    mutationObserver = new MutationObserver((mutations) => {
      // Check if any mutations added nodes (Vue's v-html update)
      const hasAddedNodes = mutations.some(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      )
      
      if (hasAddedNodes) {
        // Debounce to avoid multiple renders
        setTimeout(() => {
          if (previewContainerRef.value) {
            const mermaidElements = previewContainerRef.value.querySelectorAll('.mermaid:not([data-error])')
            
            // Remove processed flags to allow re-rendering (but keep error flags)
            mermaidElements.forEach((el) => {
              el.removeAttribute('data-processed')
            })
            
            if (mermaidElements.length > 0) {
              renderMermaidDiagrams()
            }
          }
        }, 100)
      }
    })
    
    // Observe child list changes (when v-html updates innerHTML)
    mutationObserver.observe(container, {
      childList: true,
      subtree: true
    })
  }
}, { immediate: true })

// Function to render mermaid diagrams
const renderMermaidDiagrams = async () => {
  if (!previewContainerRef.value || !showPreview.value) return
  
  // Wait for DOM to be ready
  await new Promise(resolve => setTimeout(resolve, 50))
  
  const mermaidElements = previewContainerRef.value.querySelectorAll('.mermaid:not([data-processed]):not([data-error])')
  
  if (mermaidElements.length === 0) return
  
  try {
    // Process each mermaid element
    for (const el of Array.from(mermaidElements) as HTMLElement[]) {
      // Skip elements that already have error or rendered content
      if (el.querySelector('svg') || el.querySelector('div[style*="color: #ef4444"]')) {
        el.setAttribute('data-processed', 'true')
        continue
      }
      
      // Get the mermaid code from the element
      // Store original code before any processing
      const code = el.textContent?.trim() || ''
      
      if (!code) {
        console.warn('Empty mermaid code found, skipping')
        el.setAttribute('data-processed', 'true')
        continue
      }
      
      // Skip if the code looks like HTML (error message being re-rendered)
      if (code.includes('<div') || code.includes('Mermaid Error:')) {
        console.warn('Skipping element with error HTML content')
        el.setAttribute('data-error', 'true')
        el.setAttribute('data-processed', 'true')
        continue
      }
      
      // Store the original code in a data attribute for potential retries
      el.setAttribute('data-mermaid-code', code)
      
      // Mark as being processed
      el.setAttribute('data-processed', 'true')
      
      // Generate unique ID for this diagram
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      try {
        // Use mermaid.render() API (v10+)
        if (typeof mermaid.render === 'function') {
          const { svg } = await mermaid.render(id, code)
          el.innerHTML = svg
        } else if (typeof mermaid.run === 'function') {
          // Fallback to mermaid.run() API
          el.id = id
          await mermaid.run({ nodes: [el] })
        } else {
          throw new Error('Mermaid API not available')
        }
      } catch (renderError) {
        console.error('Error rendering mermaid diagram:', renderError)
        // Mark as error to prevent re-rendering
        el.setAttribute('data-error', 'true')
        // Show error message in the element
        el.innerHTML = `<div style="color: #ef4444; padding: 8px; background: #7f1d1d; border-radius: 4px; font-family: monospace; font-size: 12px;">
          <strong>Mermaid Error:</strong> ${renderError instanceof Error ? renderError.message : 'Failed to render diagram'}<br>
          <small>Code: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}</small>
        </div>`
      }
    }
  } catch (error) {
    console.error('Mermaid rendering error:', error)
  }
}

// Helper function to fix markdown syntax issues
// Ensures proper spacing around code blocks and other markdown elements
const fixMarkdownSyntax = (markdown: string): string => {
  // First pass: Fix cases where code blocks are on the same line as other content
  // Look for patterns like "text```" or ")```" where content is directly followed by code fence
  // Use negative lookbehind to avoid matching if there's already a newline
  markdown = markdown.replace(/([^\n])(```(?:\w+)?(?:\n|$))/g, (match, before, codeFence) => {
    // If 'before' is already whitespace (but not newline), don't add extra newlines
    if (before.trim() === '') {
      return match
    }
    // Otherwise, ensure blank line before code fence
    return before + '\n\n' + codeFence
  })
  
  // Split into lines for processing
  let lines = markdown.split('\n')
  let fixed: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = i < lines.length - 1 ? lines[i + 1] : ''
    
    // Check if current line starts a code block
    if (line.trim().startsWith('```')) {
      // Ensure blank line before code block (unless it's the first line or previous is already blank)
      if (fixed.length > 0) {
        const lastLine = fixed[fixed.length - 1]
        // If the last line in fixed isn't blank, add a blank line
        if (lastLine.trim() !== '') {
          fixed.push('') // Add blank line before code block
        }
      }
    }
    
    fixed.push(line)
    
    // Check if current line closes a code block
    if (line.trim() === '```' && i > 0 && !lines[i - 1].trim().startsWith('```')) {
      // This closes a code block
      // Ensure blank line after code block (unless it's the last line or next is already blank)
      if (i < lines.length - 1 && nextLine.trim() !== '') {
        // Next line has content and isn't blank - add blank line
        fixed.push('') // Add blank line after code block
      }
    }
  }
  
  return fixed.join('\n')
}

// Helper function to calculate proper separators for insertion
const calculateSeparators = (before: string, after: string, content: string = ''): { before: string; after: string } => {
  let separatorBefore = ''
  let separatorAfter = ''
  
  // Check if the content being inserted starts with a code block
  const startsWithCodeBlock = content.trimStart().startsWith('```')
  
  if (before.trim()) {
    // There's content before
    // IMPORTANT: If inserting a code block, ALWAYS need blank line before it
    if (startsWithCodeBlock) {
      // Code blocks must have blank line before them
      if (before.endsWith('\n\n')) {
        separatorBefore = '' // Already has blank line
      } else if (before.endsWith('\n')) {
        separatorBefore = '\n' // Add one more newline for blank line
      } else {
        separatorBefore = '\n\n' // Add two newlines
      }
    } else {
      // Normal content - ensure blank line
      if (before.endsWith('\n\n')) {
        separatorBefore = '' // Already has blank line
      } else if (before.endsWith('\n')) {
        separatorBefore = '\n' // Add one more newline for blank line
      } else {
        separatorBefore = '\n\n' // Add two newlines
      }
    }
  }
  
  // Check if the content being inserted ends with a code block
  const endsWithCodeBlock = content.trimEnd().endsWith('```')
  
  if (after.trim()) {
    // There's content after
    // If we just inserted a code block, ensure blank line after it
    if (endsWithCodeBlock) {
      if (after.startsWith('\n\n')) {
        separatorAfter = '' // Already has blank line
      } else if (after.startsWith('\n')) {
        separatorAfter = '\n' // Add one more newline for blank line
      } else {
        separatorAfter = '\n\n' // Add two newlines
      }
    } else {
      // Normal content - ensure blank line
      if (after.startsWith('\n\n')) {
        separatorAfter = '' // Already has blank line
      } else if (after.startsWith('\n')) {
        separatorAfter = '\n' // Add one more newline for blank line
      } else {
        separatorAfter = '\n\n' // Add two newlines
      }
    }
  }
  
  return { before: separatorBefore, after: separatorAfter }
}

// Helper function to convert visual position to markdown position
// This creates a robust mapping by actually rendering the markdown and comparing
const getMarkdownPositionFromVisualText = (visualOffset: number, markdownContent: string, actualVisualText: string): number => {
  // Strategy: Walk through markdown char by char and build what we expect visually
  // Compare with actual visual text to ensure accuracy
  
  let markdownPos = 0
  let visualPos = 0
  let builtVisualText = ''
  
  const i_max = markdownContent.length
  let i = 0
  
  while (i < i_max && visualPos < visualOffset) {
    const char = markdownContent[i]
    const remaining = markdownContent.substring(i)
    
    // Check for heading at start of line
    if (char === '#' && (i === 0 || markdownContent[i-1] === '\n')) {
      const headingMatch = remaining.match(/^(#{1,6})\s+/)
      if (headingMatch) {
        // Skip the ### and space, but the text after is visual
        i += headingMatch[0].length
        markdownPos += headingMatch[0].length
        continue
      }
    }
    
    // Check for HTML entity like &nbsp;
    if (char === '&') {
      const entityMatch = remaining.match(/^&[a-zA-Z0-9#]+;/)
      if (entityMatch) {
        // &nbsp; renders as special char (likely zero-width or space)
        // Let's check what it actually is in the visual text
        const nextVisualChar = actualVisualText[visualPos]
        builtVisualText += nextVisualChar || '﻿' // Assume it's zero-width
        visualPos++
        i += entityMatch[0].length
        markdownPos += entityMatch[0].length
        continue
      }
    }
    
    // Check for checkbox - [ ] or - [x]
    if (remaining.startsWith('- [ ] ') || remaining.startsWith('- [x] ') || remaining.startsWith('- [X] ')) {
      // Skip "- [x] " part (6 chars) - checkbox renders as UI, text comes after
      i += 6
      markdownPos += 6
      continue
    }
    
    // Check for image ![alt](url)
    if (remaining.startsWith('![')) {
      const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^\)]+)\)/)
      if (imageMatch) {
        // Image doesn't contribute to visual text (renders as image element)
        i += imageMatch[0].length
        markdownPos += imageMatch[0].length
        continue
      }
    }
    
    // Check for link [text](url)  
    if (char === '[') {
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^\)]+)\)/)
      if (linkMatch) {
        // Only the link text is visual, skip the [, ](url) part
        const linkText = linkMatch[1]
        builtVisualText += linkText
        visualPos += linkText.length
        i += linkMatch[0].length
        markdownPos += linkMatch[0].length
        continue
      }
    }
    
    // Check for escaped character \x
    if (char === '\\' && i + 1 < i_max) {
      // \x renders as just x
      const escapedChar = markdownContent[i + 1]
      builtVisualText += escapedChar
      visualPos++
      i += 2
      markdownPos += 2
      continue
    }
    
    // Check for bold/italic ** __ * _
    if (char === '*' || char === '_') {
      // Check if it's formatting (not just a character)
      const isDouble = markdownContent[i + 1] === char
      // Simple heuristic: if followed/preceded by alphanumeric, it's formatting
      const prevChar = i > 0 ? markdownContent[i - 1] : ''
      const nextChar = markdownContent[i + 1]
      
      if ((prevChar && !/\s/.test(prevChar)) || (nextChar && !/\s/.test(nextChar))) {
        // Likely formatting marker
        i += isDouble ? 2 : 1
        markdownPos += isDouble ? 2 : 1
        continue
      }
    }
    
    // Check for inline code backticks `
    if (char === '`') {
      // For now, skip backticks (they're formatting)
      // TODO: properly track code spans
      i++
      markdownPos++
      continue
    }
    
    // Check for newlines - these generally don't appear in visual (except as paragraph breaks)
    if (char === '\n') {
      // Wysimark might render this as nothing, space, or paragraph break
      // For safety, we'll just skip double newlines (paragraph breaks)
      if (markdownContent[i + 1] === '\n') {
        i += 2
        markdownPos += 2
        continue
      } else {
        // Single newline - might be a space or nothing
        i++
        markdownPos++
        continue
      }
    }
    
    // Regular character - add to visual
    builtVisualText += char
    visualPos++
    i++
    markdownPos++
  }
  
  console.log(`Visual position ${visualOffset} -> Markdown position ${markdownPos}`)
  console.log(`Built visual text (${builtVisualText.length} chars):`, builtVisualText.substring(0, 50))
  return markdownPos
}

// Helper function to get cursor position from Wysimark editor
const getCursorPositionFromWysimark = (): boolean => {
  try {
    if (!wysimarkRef.value) {
      console.log('No wysimarkRef')
      return false
    }
    
    console.log('wysimarkRef.value:', wysimarkRef.value)
    
    // Try to access the editor instance
    // Wysimark is built on Slate, which might be accessible through $el or other properties
    const component = wysimarkRef.value
    
    // Try to find the Slate editor instance
    if (component.$el) {
      console.log('Found $el')
      // Try to find the contenteditable element
      const editable = component.$el.querySelector('[contenteditable="true"]')
      if (editable) {
        console.log('Found contenteditable element')
        
        // Try to get selection
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          console.log('Has selection')
          const range = selection.getRangeAt(0)
          
          // Calculate the character offset from the start of the contenteditable
          let visualOffset = 0
          const treeWalker = document.createTreeWalker(
            editable,
            NodeFilter.SHOW_TEXT,
            null
          )
          
          let currentNode
          let found = false
          while ((currentNode = treeWalker.nextNode())) {
            if (currentNode === range.startContainer) {
              visualOffset += range.startOffset
              found = true
              break
            }
            visualOffset += currentNode.textContent?.length || 0
          }
          
          if (found) {
            console.log('Visual cursor offset:', visualOffset)
            console.log('Full markdown content:', localContent.value)
            console.log('Markdown length:', localContent.value.length)
            
            // Let's also extract the actual visual text to compare
            let extractedVisualText = ''
            const textWalker = document.createTreeWalker(
              editable,
              NodeFilter.SHOW_TEXT,
              null
            )
            let node
            while ((node = textWalker.nextNode())) {
              extractedVisualText += node.textContent || ''
            }
            console.log('Extracted visual text:', extractedVisualText)
            console.log('Visual text length:', extractedVisualText.length)
            console.log('Cursor is at visual char:', extractedVisualText.substring(Math.max(0, visualOffset - 20), visualOffset) + '|' + extractedVisualText.substring(visualOffset, Math.min(extractedVisualText.length, visualOffset + 20)))
            
            // Convert visual position to markdown position
            const markdownPos = getMarkdownPositionFromVisualText(visualOffset, localContent.value, extractedVisualText)
            console.log('Converted to markdown position:', markdownPos)
            console.log('Markdown at that position:', localContent.value.substring(Math.max(0, markdownPos - 20), markdownPos) + '|' + localContent.value.substring(markdownPos, Math.min(localContent.value.length, markdownPos + 20)))
            
            // Store this offset
            savedCursorPosition.value = { start: markdownPos, end: markdownPos }
            return true
          }
        }
      }
    }
    
    return false
  } catch (error) {
    console.error('Error getting cursor from Wysimark:', error)
    return false
  }
}

// Methods
const handleSave = () => {
  emit('save', localContent.value)
}

const handleCancel = () => {
  emit('cancel')
}

const togglePreview = async () => {
  showPreview.value = !showPreview.value
  if (showPreview.value) {
    // Wait for DOM update and render mermaid diagrams
    await nextTick()
    renderMermaidDiagrams()
  }
}

const handleMarkdownInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  const newValue = target.value
  
  // Set flags to prevent any reactive updates from interfering
  isTyping = true
  isInternalUpdate = true
  
  // Update local content directly without triggering reactive side effects
  localContent.value = newValue
  
  // Emit update to parent
  emit('update:modelValue', newValue)
  
  // Update cursor position
  currentCursorPosition.value = target.selectionStart
  
  // Reset flags after a short delay to allow typing to continue smoothly
  requestAnimationFrame(() => {
    isTyping = false
    isInternalUpdate = false
  })
}

// Update cursor position when user clicks or moves cursor
const updateCursorPosition = () => {
  if (markdownTextareaRef.value) {
    currentCursorPosition.value = markdownTextareaRef.value.selectionStart
  }
}

// Handle textarea blur - fix syntax issues
const handleMarkdownBlur = () => {
  if (!markdownTextareaRef.value) return
  
  const textarea = markdownTextareaRef.value
  const originalValue = textarea.value
  const fixedValue = fixMarkdownSyntax(originalValue)
  
  if (fixedValue !== originalValue) {
    console.log('Fixed markdown syntax on blur')
    const cursorPos = textarea.selectionStart
    textarea.value = fixedValue
    localContent.value = fixedValue
    emit('update:modelValue', fixedValue)
    // Try to restore cursor position
    nextTick(() => {
      if (textarea) {
        textarea.setSelectionRange(Math.min(cursorPos, fixedValue.length), Math.min(cursorPos, fixedValue.length))
      }
    })
  }
}

const handleCompositionStart = () => {
  isTyping = true
}

const handleCompositionEnd = () => {
  isTyping = false
}

const toggleMarkdownMode = () => {
  showMarkdownMode.value = !showMarkdownMode.value
  // If switching to markdown mode, ensure preview is off
  if (showMarkdownMode.value) {
    showPreview.value = false
    // Initialize textarea value and focus when switching to markdown mode
    nextTick(() => {
      if (markdownTextareaRef.value) {
        // Set the value directly to avoid reactivity issues
        if (markdownTextareaRef.value.value !== localContent.value) {
          markdownTextareaRef.value.value = localContent.value
        }
        markdownTextareaRef.value.focus()
      }
    })
  }
}

// Sync textarea value when switching to markdown mode or when content changes externally
watch([showMarkdownMode, () => props.modelValue], ([isMarkdownMode, newValue]) => {
  if (isMarkdownMode && markdownTextareaRef.value && !isTyping) {
    // Fix markdown syntax when switching to markdown mode
    // WYSIWYG editor may have removed blank lines around code blocks
    const fixedValue = fixMarkdownSyntax(newValue)
    
    // Only update if the value is actually different
    if (markdownTextareaRef.value.value !== fixedValue) {
      const cursorPos = markdownTextareaRef.value.selectionStart
      const scrollPos = markdownTextareaRef.value.scrollTop
      
      markdownTextareaRef.value.value = fixedValue
      localContent.value = fixedValue
      
      // If we fixed the syntax, emit the corrected value
      if (fixedValue !== newValue) {
        console.log('Fixed markdown syntax when switching to markdown mode')
        emit('update:modelValue', fixedValue)
      }
      
      // Restore cursor position
      nextTick(() => {
        if (markdownTextareaRef.value) {
          const newCursorPos = Math.min(cursorPos, fixedValue.length)
          markdownTextareaRef.value.setSelectionRange(newCursorPos, newCursorPos)
          markdownTextareaRef.value.scrollTop = scrollPos
        }
      })
    }
  }
})

const insertMermaidDiagram = () => {
  const mermaidTemplate = `\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`
`
  
  // Remember if we were in WYSIWYG mode
  const wasInWysiwygMode = !showMarkdownMode.value
  
  // If in markdown mode, insert at cursor position in textarea
  if (showMarkdownMode.value && markdownTextareaRef.value) {
    const textarea = markdownTextareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = textarea.value.substring(0, start)
    const after = textarea.value.substring(end)
    const separators = calculateSeparators(before, after, mermaidTemplate)
    
    let newValue = before + separators.before + mermaidTemplate + separators.after + after
    
    // Fix markdown syntax before saving
    newValue = fixMarkdownSyntax(newValue)
    
    // Update both textarea and localContent
    textarea.value = newValue
    localContent.value = newValue
    emit('update:modelValue', newValue)
    
    // Set cursor position after inserted content
    nextTick(() => {
      const newPos = start + separators.before.length + mermaidTemplate.length
      textarea.setSelectionRange(newPos, newPos)
      textarea.focus()
    })
  } else {
    // If in WYSIWYG mode, try to get cursor position and switch to markdown mode temporarily
    console.log('Attempting to get cursor position from WYSIWYG for mermaid...')
    const gotPosition = getCursorPositionFromWysimark()
    
    if (!gotPosition || !savedCursorPosition.value) {
      console.log('Could not capture cursor position, using end of content')
      savedCursorPosition.value = {
        start: localContent.value.length,
        end: localContent.value.length
      }
    }
    
    showMarkdownMode.value = true
    showPreview.value = false
    
    nextTick(() => {
      // Wait for textarea to be available and initialized with content
      setTimeout(() => {
        if (markdownTextareaRef.value && savedCursorPosition.value) {
          const textarea = markdownTextareaRef.value
          
          // Ensure textarea has the current content
          if (textarea.value !== localContent.value) {
            textarea.value = localContent.value
          }
          
          // Focus and set cursor to saved position
          textarea.focus()
          const position = Math.min(savedCursorPosition.value.start, textarea.value.length)
          textarea.setSelectionRange(position, position)
          
            // Get cursor position
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            
            const before = textarea.value.substring(0, start)
            const after = textarea.value.substring(end)
            const separators = calculateSeparators(before, after, mermaidTemplate)
            
            let newValue = before + separators.before + mermaidTemplate + separators.after + after
            
            // Fix markdown syntax before saving
            newValue = fixMarkdownSyntax(newValue)
            
            // Update both textarea and localContent
            textarea.value = newValue
            localContent.value = newValue
            emit('update:modelValue', newValue)
            
            // Clear saved cursor position
            savedCursorPosition.value = null
            
            // DON'T switch back to WYSIWYG mode - stay in markdown
            // Code blocks need proper markdown formatting, and WYSIWYG will remove blank lines
            // User can manually switch back if they want
            if (wasInWysiwygMode) {
              toast.info('Switched to Markdown mode for code block insertion')
            }
            
            if (!wasInWysiwygMode) {
              // If we were in markdown mode, keep cursor position
              nextTick(() => {
                const newPos = start + separators.before.length + mermaidTemplate.length
                textarea.setSelectionRange(newPos, newPos)
                textarea.focus()
              })
            }
        }
      }, 50)
    })
  }
}

const openDrawIOEditor = () => {
  if (!props.projectId) {
    toast.error('Project ID is required to create diagrams')
    return
  }

  // Reset diagram state first
  currentDiagramXml.value = null
  editingDiagramUrl.value = null

  // Save cursor position before opening draw.io editor
  if (showMarkdownMode.value && markdownTextareaRef.value) {
    // Already in markdown mode, save current cursor position
    const textarea = markdownTextareaRef.value
    savedCursorPosition.value = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd
    }
    
    // Check if cursor is on or near a diagram image line
    const cursorPos = textarea.selectionStart
    const textBefore = textarea.value.substring(0, cursorPos)
    const textAfter = textarea.value.substring(cursorPos)
    const lines = textBefore.split('\n')
    const currentLine = lines[lines.length - 1]
    
    console.log('Checking for diagram at cursor position')
    console.log('Current line:', currentLine)
    console.log('Text after (first 100 chars):', textAfter.substring(0, 100))
    
    // Check if current line is an image
    const imageMatch = currentLine.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (imageMatch) {
      console.log('Found image on current line:', imageMatch[0])
      
      // Look for drawio code block after the image (with optional blank line)
      const codeBlockMatch = textAfter.match(/^\s*\n\s*\n?\s*```drawio\s*\n([^`]+)\n```/)
      
      if (codeBlockMatch) {
        console.log('Found drawio code block after image')
        try {
          // Get the base64 content (it's in capture group 1)
          const encodedXml = codeBlockMatch[1].trim()
          const decodedXml = decodeURIComponent(escape(atob(encodedXml)))
          currentDiagramXml.value = decodedXml
          editingDiagramUrl.value = imageMatch[2]
          console.log('Successfully loaded diagram XML for editing, URL:', imageMatch[2])
          console.log('XML length:', decodedXml.length)
        } catch (error) {
          console.error('Error decoding diagram XML:', error)
          console.log('Match found:', codeBlockMatch[0])
        }
      } else {
        console.log('No drawio code block found after image')
      }
    } else {
      console.log('Current line is not an image')
    }
  } else {
    // In WYSIWYG mode - try to get cursor position from Wysimark
    const gotPosition = getCursorPositionFromWysimark()
    
    if (!gotPosition || !savedCursorPosition.value) {
      // Fallback: use end of content
      savedCursorPosition.value = {
        start: localContent.value.length,
        end: localContent.value.length
      }
    }
  }
  
  showDrawIOEditor.value = true
}

const handleDiagramSaved = (data: { imageUrl: string; xml: string; isEdit: boolean }) => {
  // Extract filename from URL
  const filename = data.imageUrl.split('/').pop() || 'diagram.png'
  
  // Use the existing insertion logic which will format it properly
  const diagram = {
    publicUrl: data.imageUrl,
    filename: filename,
    diagramXml: data.xml
  }
  
  handleDiagramInsertionLogic(diagram, data.isEdit)
}

const handleDiagramInsertionLogic = (diagram: { publicUrl: string; filename: string; diagramXml?: string }, isEdit: boolean = false) => {
  // Create markdown image syntax with drawio code block
  let markdown = `![${diagram.filename}](${diagram.publicUrl})`
  
  // If we have diagram XML, store it as a drawio code block after the image
  // This allows us to load it again when editing
  if (diagram.diagramXml) {
    // Encode XML as base64 to store in code block
    const encodedXml = btoa(unescape(encodeURIComponent(diagram.diagramXml)))
    // Add blank line before code block for proper markdown formatting
    // Using explicit line breaks to ensure they're preserved
    markdown = markdown + '\n' + '\n' + '```drawio' + '\n' + encodedXml + '\n' + '```'
  }
  
  console.log('Generated markdown for diagram:', JSON.stringify(markdown))

  // Remember if we were in WYSIWYG mode
  const wasInWysiwygMode = !showMarkdownMode.value

  // If we're in WYSIWYG mode, temporarily switch to markdown
  if (!showMarkdownMode.value) {
    showMarkdownMode.value = true
    showPreview.value = false
  }

  // Wait for markdown mode to be ready
  nextTick(() => {
    setTimeout(() => {
      if (markdownTextareaRef.value && savedCursorPosition.value) {
        const textarea = markdownTextareaRef.value
        let start = savedCursorPosition.value.start
        let end = savedCursorPosition.value.end
        
        // Ensure textarea is synced
        if (textarea.value !== localContent.value) {
          textarea.value = localContent.value
        }
        
        // If saved position is out of bounds, use current position
        if (start > textarea.value.length) {
          start = textarea.value.length
        }
        if (end > textarea.value.length) {
          end = textarea.value.length
        }
        
        const before = textarea.value.substring(0, start)
        let after = textarea.value.substring(end)
        
        // If we're replacing an existing diagram, remove its code block too
        if (isEdit && editingDiagramUrl.value) {
          const codeBlockMatch = after.match(/^\s*\n\s*\n?\s*```drawio\s*\n[^`]+\n```/)
          if (codeBlockMatch) {
            after = after.substring(codeBlockMatch[0].length)
          }
        }
        
        const separators = calculateSeparators(before, after, markdown)
        
        let newValue = before + separators.before + markdown + separators.after + after
        
        // Debug logging
        console.log('=== DIAGRAM INSERTION DEBUG ===')
        console.log('Markdown to insert:', JSON.stringify(markdown))
        console.log('Has code block:', markdown.includes('```'))
        console.log('Separator before:', JSON.stringify(separators.before))
        console.log('Separator after:', JSON.stringify(separators.after))
        console.log('Before ends with:', JSON.stringify(before.slice(-10)))
        console.log('After starts with:', JSON.stringify(after.slice(0, 10)))
        console.log('Final value (first 500 chars around insertion):', JSON.stringify(newValue.substring(Math.max(0, start - 100), start + markdown.length + separators.before.length + separators.after.length + 100)))
        
        // Fix any markdown syntax issues
        newValue = fixMarkdownSyntax(newValue)
        console.log('After syntax fix:', JSON.stringify(newValue.substring(Math.max(0, start - 100), start + markdown.length + separators.before.length + separators.after.length + 200)))
        
        // Update both textarea and localContent
        textarea.value = newValue
        localContent.value = newValue
        emit('update:modelValue', newValue)
        
        // Clear saved cursor position and diagram state
        savedCursorPosition.value = null
        currentDiagramXml.value = null
        editingDiagramUrl.value = null
        
        toast.success(isEdit ? 'Diagram updated successfully' : 'Diagram inserted successfully')
        
        // Stay in markdown mode to preserve the HTML comment
        // If we switch back to WYSIWYG, the comment gets wrapped in code blocks
        if (!wasInWysiwygMode) {
          // If we were in markdown mode, keep cursor position
          nextTick(() => {
            const newPos = start + separators.before.length + markdown.length
            textarea.setSelectionRange(newPos, newPos)
            textarea.focus()
          })
        }
      } else {
        // Fallback: append to end if cursor position not saved
        const separator = localContent.value && !localContent.value.endsWith('\n\n') ? '\n\n' : ''
        localContent.value += separator + markdown
        emit('update:modelValue', localContent.value)
        
        // Clear diagram state
        currentDiagramXml.value = null
        editingDiagramUrl.value = null
        
        toast.success(isEdit ? 'Diagram updated successfully' : 'Diagram inserted successfully')
        
        // Stay in markdown mode to preserve the HTML comment
      }
    }, 50)
  })
}

const openMediaManager = () => {
  // Save cursor position before opening media manager
  if (showMarkdownMode.value && markdownTextareaRef.value) {
    // Already in markdown mode, save current cursor position
    const textarea = markdownTextareaRef.value
    savedCursorPosition.value = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd
    }
    console.log('Saved cursor position (markdown mode):', savedCursorPosition.value)
    showMediaManager.value = true
  } else {
    // In WYSIWYG mode - try to get cursor position from Wysimark
    console.log('Attempting to get cursor position from WYSIWYG...')
    const gotPosition = getCursorPositionFromWysimark()
    
    if (gotPosition && savedCursorPosition.value) {
      console.log('Successfully captured cursor position from WYSIWYG:', savedCursorPosition.value)
    } else {
      console.log('Could not capture cursor position from WYSIWYG, will use end of content')
      // Fallback: use end of content
      savedCursorPosition.value = {
        start: localContent.value.length,
        end: localContent.value.length
      }
    }
    
    // Don't switch modes yet - just open the media manager
    // We'll handle mode switching in handleMediaInserted
    showMediaManager.value = true
  }
}

const handleMediaInserted = (media: Media) => {
  let markdown = ''
  
  if (isImage(media.mimeType)) {
    markdown = `![${media.altText || media.filename}](${media.publicUrl})`
  } else if (isVideo(media.mimeType)) {
    markdown = `<video src="${media.publicUrl}" controls></video>`
  } else {
    markdown = `[${media.filename}](${media.publicUrl})`
  }

  // Close media manager
  showMediaManager.value = false
  
  // Remember if we were in WYSIWYG mode
  const wasInWysiwygMode = !showMarkdownMode.value

  console.log('handleMediaInserted - savedCursorPosition:', savedCursorPosition.value)
  console.log('handleMediaInserted - showMarkdownMode:', showMarkdownMode.value)
  console.log('handleMediaInserted - wasInWysiwygMode:', wasInWysiwygMode)

  // If we're in WYSIWYG mode, temporarily switch to markdown
  if (!showMarkdownMode.value) {
    showMarkdownMode.value = true
    showPreview.value = false
  }

  // Wait for markdown mode to be ready
  nextTick(() => {
    setTimeout(() => {
      if (markdownTextareaRef.value && savedCursorPosition.value) {
        const textarea = markdownTextareaRef.value
        let start = savedCursorPosition.value.start
        let end = savedCursorPosition.value.end
        
        console.log('Inserting at position:', start, 'to', end)
        console.log('Content length:', localContent.value.length)
        
        // Ensure textarea is synced
        if (textarea.value !== localContent.value) {
          textarea.value = localContent.value
        }
        
        // If saved position is out of bounds, use current position
        if (start > textarea.value.length) {
          console.log('Start position out of bounds, adjusting')
          start = textarea.value.length
        }
        if (end > textarea.value.length) {
          console.log('End position out of bounds, adjusting')
          end = textarea.value.length
        }
        
        const before = textarea.value.substring(0, start)
        const after = textarea.value.substring(end)
        const markdown = `![${media.filename}](${media.publicUrl})`
        const separators = calculateSeparators(before, after, markdown)
        
        console.log('Before text length:', before.length, 'After text length:', after.length)
        console.log('Separator before:', JSON.stringify(separators.before), 'after:', JSON.stringify(separators.after))
        
        const newValue = before + separators.before + markdown + separators.after + after
        
        // Update both textarea and localContent
        textarea.value = newValue
        localContent.value = newValue
        emit('update:modelValue', newValue)
        
        // Clear saved cursor position
        savedCursorPosition.value = null
        
        toast.success('Media inserted')
        
        // If we were in WYSIWYG mode, switch back after a short delay
        if (wasInWysiwygMode) {
          setTimeout(() => {
            showMarkdownMode.value = false
            console.log('Switched back to WYSIWYG mode')
          }, 100)
        } else {
          // If we were in markdown mode, keep cursor position
          nextTick(() => {
            const newPos = start + separators.before.length + markdown.length
            console.log('Setting cursor to position:', newPos)
            textarea.setSelectionRange(newPos, newPos)
            textarea.focus()
          })
        }
      } else {
        // Fallback: append to end if cursor position not saved
        console.log('FALLBACK: Appending to end')
        const separator = localContent.value && !localContent.value.endsWith('\n\n') ? '\n\n' : ''
        localContent.value += separator + markdown
        emit('update:modelValue', localContent.value)
        toast.success('Media inserted')
        
        // Switch back to WYSIWYG if needed
        if (wasInWysiwygMode) {
          setTimeout(() => {
            showMarkdownMode.value = false
          }, 100)
        }
      }
    }, 50)
  })
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items || !props.projectId) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    if (item.kind === 'file') {
      event.preventDefault()
      const file = item.getAsFile()
      if (!file) continue

      // Check if it's an image or video
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        try {
          toast.info('Uploading pasted file...')
          const media = await uploadMedia(file, props.projectId)
          
          let markdown = ''
          if (isImage(media.mimeType)) {
            markdown = `![${media.filename}](${media.publicUrl})`
          } else if (isVideo(media.mimeType)) {
            markdown = `<video src="${media.publicUrl}" controls></video>`
          }

          // Insert at cursor position
          const wasInWysiwygMode = !showMarkdownMode.value
          
          if (showMarkdownMode.value && markdownTextareaRef.value) {
            // Already in markdown mode
            const textarea = markdownTextareaRef.value
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const before = textarea.value.substring(0, start)
            const after = textarea.value.substring(end)
            const separators = calculateSeparators(before, after, markdown)
            
            const newValue = before + separators.before + markdown + separators.after + after
            
            textarea.value = newValue
            localContent.value = newValue
            emit('update:modelValue', newValue)
            
            // Set cursor position after inserted content
            nextTick(() => {
              const newPos = start + separators.before.length + markdown.length
              textarea.setSelectionRange(newPos, newPos)
              textarea.focus()
            })
          } else {
            // In WYSIWYG mode - capture cursor position before switching
            console.log('Paste in WYSIWYG mode, capturing cursor...')
            const gotPosition = getCursorPositionFromWysimark()
            
            if (!gotPosition || !savedCursorPosition.value) {
              console.log('Could not capture cursor for paste, using end')
              savedCursorPosition.value = {
                start: localContent.value.length,
                end: localContent.value.length
              }
            }
            
            // Switch to markdown mode temporarily
            showMarkdownMode.value = true
            showPreview.value = false
            
            nextTick(() => {
              setTimeout(() => {
                if (markdownTextareaRef.value && savedCursorPosition.value) {
                  const textarea = markdownTextareaRef.value
                  
                  if (textarea.value !== localContent.value) {
                    textarea.value = localContent.value
                  }
                  
                  const start = Math.min(savedCursorPosition.value.start, textarea.value.length)
                  const end = Math.min(savedCursorPosition.value.end, textarea.value.length)
                  
                  const before = textarea.value.substring(0, start)
                  const after = textarea.value.substring(end)
                  const separators = calculateSeparators(before, after, markdown)
                  
                  const newValue = before + separators.before + markdown + separators.after + after
                  
                  textarea.value = newValue
                  localContent.value = newValue
                  emit('update:modelValue', newValue)
                  
                  savedCursorPosition.value = null
                  
                  // Switch back to WYSIWYG mode
                  setTimeout(() => {
                    showMarkdownMode.value = false
                    console.log('Switched back to WYSIWYG after paste')
                  }, 100)
                } else {
                  // Fallback
                  localContent.value += (localContent.value ? '\n\n' : '') + markdown
                  emit('update:modelValue', localContent.value)
                  
                  if (wasInWysiwygMode) {
                    setTimeout(() => {
                      showMarkdownMode.value = false
                    }, 100)
                  }
                }
              }, 50)
            })
          }
          toast.success('File uploaded and inserted')
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to upload file')
        }
      }
    }
  }
}

// Handle paste events on the editor container
onMounted(() => {
  if (editorContainerRef.value) {
    editorContainerRef.value.addEventListener('paste', handlePaste as unknown as EventListener)
  }
})

onUnmounted(() => {
  // Clean up MutationObserver
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
  if (editorContainerRef.value) {
    editorContainerRef.value.removeEventListener('paste', handlePaste as unknown as EventListener)
  }
})
</script>

<style scoped>
.markdown-editor {
  @apply border border-gray-600 rounded-lg overflow-hidden;
}

:deep(.prose),
.prose {
  color: white !important;
}

:deep(.prose h1),
:deep(.prose h1 *),
.prose h1,
.prose h1 * {
  @apply text-2xl font-bold mb-4;
  color: white !important;
}

:deep(.prose h2),
:deep(.prose h2 *),
.prose h2,
.prose h2 * {
  @apply text-xl font-semibold mb-3;
  color: white !important;
}

:deep(.prose h3),
:deep(.prose h3 *),
.prose h3,
.prose h3 * {
  @apply text-lg font-medium mb-2;
  color: white !important;
}

:deep(.prose h4),
:deep(.prose h4 *),
.prose h4,
.prose h4 * {
  @apply text-base font-medium mb-2;
  color: white !important;
}

:deep(.prose h5),
:deep(.prose h5 *),
.prose h5,
.prose h5 * {
  @apply text-sm font-medium mb-2;
  color: white !important;
}

:deep(.prose h6),
:deep(.prose h6 *),
.prose h6,
.prose h6 * {
  @apply text-sm font-medium mb-2;
  color: white !important;
}

:deep(.prose p),
:deep(.prose p *),
.prose p,
.prose p * {
  @apply mb-4;
  color: white !important;
}

:deep(.prose strong),
:deep(.prose strong *),
.prose strong,
.prose strong * {
  @apply font-bold;
  color: white !important;
}

.prose em {
  @apply italic text-gray-200;
}

.prose strong em,
.prose em strong {
  @apply font-bold italic text-white;
}

.prose code {
  @apply bg-gray-900 px-1.5 py-0.5 rounded text-sm font-mono text-gray-100 border border-gray-700;
}

.prose pre {
  @apply bg-gray-900 p-4 rounded overflow-x-auto border border-gray-700;
}

.prose pre code {
  @apply bg-transparent p-0 border-0 text-gray-100;
}

.prose a {
  @apply text-blue-400 hover:text-blue-300 underline;
}

.prose ul, .prose ol {
  @apply text-white mb-4;
}

.prose li {
  @apply list-disc list-outside ml-6 mb-1 text-white;
}

.prose ul {
  @apply list-disc;
}

.prose ol {
  @apply list-decimal;
}

.prose blockquote {
  @apply border-l-4 border-blue-500 pl-4 italic text-white my-4 bg-gray-900/50 py-2;
}

.prose hr {
  @apply border-gray-600 my-6;
}

.prose table {
  @apply w-full mb-4 border-collapse;
}

.prose th {
  @apply bg-gray-900 border border-gray-700 px-4 py-2 text-left font-semibold text-white;
}

.prose td {
  @apply border border-gray-700 px-4 py-2 text-white;
}

/* Wysimark styling - Dark Mode */
.wysimark-editor {
  width: 100%;
  height: 100%;
  background-color: #1f2937; /* gray-800 */
  color: #f3f4f6; /* gray-100 */
}

/* Wysimark container - target all child elements */
:deep(.wysimark-editor),
:deep(.wysimark-editor > *),
:deep(.wysimark-editor > div) {
  border: none;
  background-color: #1f2937 !important;
  color: #f3f4f6 !important;
}

/* Target any React root div */
:deep(.wysimark-editor > div[data-reactroot]),
:deep(.wysimark-editor > div > div) {
  background-color: #1f2937 !important;
  color: #f3f4f6 !important;
}

/* Wysimark editor content area */
:deep(.wysimark-editor [contenteditable]) {
  background-color: #1f2937 !important;
  color: #f3f4f6 !important;
}

/* Wysimark toolbar */
:deep(.wysimark-editor .wysimark-toolbar),
:deep(.wysimark-editor [class*="toolbar"]) {
  background-color: #111827 !important; /* gray-900 */
  border-bottom: 1px solid #374151 !important; /* gray-700 */
  color: #f3f4f6 !important;
}

/* Wysimark toolbar buttons */
:deep(.wysimark-editor button),
:deep(.wysimark-editor [role="button"]) {
  color: #d1d5db !important; /* gray-300 */
  background-color: transparent !important;
}

:deep(.wysimark-editor button:hover),
:deep(.wysimark-editor [role="button"]:hover) {
  background-color: #374151 !important; /* gray-700 */
  color: #ffffff !important;
}

/* Wysimark dropdown menus */
:deep(.wysimark-editor [class*="menu"]),
:deep(.wysimark-editor [class*="dropdown"]) {
  background-color: #1f2937 !important; /* gray-800 */
  border: 1px solid #374151 !important; /* gray-700 */
  color: #f3f4f6 !important;
}

:deep(.wysimark-editor [class*="menu"] [class*="item"]:hover) {
  background-color: #374151 !important; /* gray-700 */
}

/* Wysimark editor text */
:deep(.wysimark-editor p),
:deep(.wysimark-editor div),
:deep(.wysimark-editor span) {
  color: #f3f4f6 !important;
}

/* Wysimark headings */
:deep(.wysimark-editor h1),
:deep(.wysimark-editor h2),
:deep(.wysimark-editor h3),
:deep(.wysimark-editor h4),
:deep(.wysimark-editor h5),
:deep(.wysimark-editor h6) {
  color: #ffffff !important;
}

/* Wysimark inline code */
:deep(.wysimark-editor code:not(pre code)) {
  background-color: #111827 !important; /* gray-900 */
  color: #60a5fa !important; /* blue-400 */
  border: 1px solid #374151 !important; /* gray-700 */
  padding: 2px 6px !important;
  border-radius: 4px !important;
  font-size: 0.875em !important;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
}

/* Wysimark code blocks - Slate.js structure */
/* Only target actual code blocks, not all elements */
:deep(.wysimark-editor pre) {
  background-color: #111827 !important; /* gray-900 */
  color: #f3f4f6 !important;
  border: 1px solid #374151 !important; /* gray-700 */
  border-radius: 6px !important;
  padding: 16px !important;
  overflow-x: auto !important;
  margin: 16px 0 !important;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
  font-size: 0.875rem !important;
  line-height: 1.6 !important;
}

/* Wysimark code block container (the main div with language selector) */
/* Only target elements that contain the language selector */
:deep(.wysimark-editor [class*="css-12dig9p"]:has([class*="css-106oie4"])) {
  background-color: #111827 !important; /* gray-900 */
  border: 1px solid #374151 !important; /* gray-700 */
  border-radius: 6px !important;
  padding: 12px !important;
  margin: 16px 0 !important;
}

/* Language selector in code blocks */
:deep(.wysimark-editor [class*="css-106oie4"]) {
  background-color: #1f2937 !important; /* gray-800 */
  color: #9ca3af !important; /* gray-400 */
  border-bottom: 1px solid #374151 !important; /* gray-700 */
  padding: 8px 12px !important;
  margin: -12px -12px 12px -12px !important;
  border-radius: 6px 6px 0 0 !important;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}

:deep(.wysimark-editor [class*="css-106oie4"] span) {
  color: #9ca3af !important;
}

:deep(.wysimark-editor [class*="css-106oie4"] svg) {
  color: #9ca3af !important;
  stroke: currentColor !important;
}

/* Code content container - only within code blocks */
:deep(.wysimark-editor [class*="css-12dig9p"] [class*="css-1l75xvp"]) {
  background-color: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* Individual code lines - only within code blocks */
:deep(.wysimark-editor [class*="css-12dig9p"] [class*="css-17qxlmt"]) {
  background-color: transparent !important;
  color: #f3f4f6 !important;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
  font-size: 0.875rem !important;
  line-height: 1.6 !important;
  padding: 2px 0 !important;
  margin: 0 !important;
}

:deep(.wysimark-editor [class*="css-12dig9p"] [class*="css-17qxlmt"][class*="--selected"]) {
  background-color: #1e3a5f !important; /* blue-900 with opacity */
}

/* Code text spans - only within code blocks */
:deep(.wysimark-editor [class*="css-12dig9p"] [class*="css-s9tn3k"]) {
  color: #f3f4f6 !important;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
}

/* Only apply monospace to text within code blocks */
:deep(.wysimark-editor [class*="css-12dig9p"] [data-slate-leaf="true"]) {
  color: #f3f4f6 !important;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
}

:deep(.wysimark-editor [class*="css-12dig9p"] [data-slate-string="true"]) {
  color: #f3f4f6 !important;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace !important;
}

:deep(.wysimark-editor pre code) {
  background-color: transparent !important;
  color: #f3f4f6 !important;
  border: none !important;
  padding: 0 !important;
  font-size: inherit !important;
  font-family: inherit !important;
}

/* Code block syntax highlighting improvements */
:deep(.wysimark-editor pre code .keyword) {
  color: #c792ea !important; /* purple */
}

:deep(.wysimark-editor pre code .string) {
  color: #c3e88d !important; /* green */
}

:deep(.wysimark-editor pre code .comment) {
  color: #546e7a !important; /* gray */
  font-style: italic !important;
}

:deep(.wysimark-editor pre code .number) {
  color: #f78c6c !important; /* orange */
}

:deep(.wysimark-editor pre code .function) {
  color: #82aaff !important; /* blue */
}

/* Wysimark blockquotes */
:deep(.wysimark-editor blockquote) {
  border-left: 4px solid #3b82f6 !important; /* blue-500 */
  background-color: #111827 !important; /* gray-900 */
  color: #f3f4f6 !important;
}

/* Wysimark links */
:deep(.wysimark-editor a) {
  color: #60a5fa !important; /* blue-400 */
}

:deep(.wysimark-editor a:hover) {
  color: #93c5fd !important; /* blue-300 */
}

/* Wysimark lists */
:deep(.wysimark-editor ul),
:deep(.wysimark-editor ol) {
  color: #f3f4f6 !important;
}

/* Wysimark tables */
:deep(.wysimark-editor table) {
  border-color: #374151 !important; /* gray-700 */
}

:deep(.wysimark-editor th) {
  background-color: #111827 !important; /* gray-900 */
  border-color: #374151 !important; /* gray-700 */
  color: #ffffff !important;
}

:deep(.wysimark-editor td) {
  border-color: #374151 !important; /* gray-700 */
  color: #f3f4f6 !important;
}

/* Wysimark selection */
:deep(.wysimark-editor ::selection) {
  background-color: #3b82f6 !important; /* blue-500 */
  color: #ffffff !important;
}

/* Wysimark placeholder */
:deep(.wysimark-editor [data-placeholder]) {
  color: #6b7280 !important; /* gray-500 */
}

/* Wysimark focus states */
:deep(.wysimark-editor:focus),
:deep(.wysimark-editor [contenteditable]:focus) {
  outline: none !important;
}

/* Wysimark scrollbar */
:deep(.wysimark-editor ::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.wysimark-editor ::-webkit-scrollbar-track) {
  background: #111827 !important; /* gray-900 */
}

:deep(.wysimark-editor ::-webkit-scrollbar-thumb) {
  background: #374151 !important; /* gray-700 */
  border-radius: 4px;
}

:deep(.wysimark-editor ::-webkit-scrollbar-thumb:hover) {
  background: #4b5563 !important; /* gray-600 */
}

/* Wysimark input fields and form elements */
:deep(.wysimark-editor input),
:deep(.wysimark-editor textarea),
:deep(.wysimark-editor select) {
  background-color: #111827 !important; /* gray-900 */
  border: 1px solid #374151 !important; /* gray-700 */
  color: #f3f4f6 !important;
}

:deep(.wysimark-editor input:focus),
:deep(.wysimark-editor textarea:focus),
:deep(.wysimark-editor select:focus) {
  border-color: #3b82f6 !important; /* blue-500 */
  outline: none !important;
}

/* Wysimark dialogs and modals */
:deep(.wysimark-editor [role="dialog"]),
:deep(.wysimark-editor [class*="dialog"]),
:deep(.wysimark-editor [class*="modal"]) {
  background-color: #1f2937 !important; /* gray-800 */
  border: 1px solid #374151 !important; /* gray-700 */
  color: #f3f4f6 !important;
}

/* Wysimark popover/tooltip */
:deep(.wysimark-editor [role="tooltip"]),
:deep(.wysimark-editor [class*="popover"]),
:deep(.wysimark-editor [class*="tooltip"]) {
  background-color: #111827 !important; /* gray-900 */
  border: 1px solid #374151 !important; /* gray-700 */
  color: #f3f4f6 !important;
}

/* Wysimark icons and SVGs - Use currentColor for better inheritance */
:deep(.wysimark-editor svg) {
  stroke: currentColor !important;
  color: inherit !important;
  vertical-align: middle !important;
}

/* Icons in buttons should inherit button color */
:deep(.wysimark-editor button svg),
:deep(.wysimark-editor [role="button"] svg) {
  stroke: currentColor !important;
  color: inherit !important;
}

/* Active/hovered button icons */
:deep(.wysimark-editor button:hover svg),
:deep(.wysimark-editor [role="button"]:hover svg),
:deep(.wysimark-editor button[aria-pressed="true"] svg),
:deep(.wysimark-editor [role="button"][aria-pressed="true"] svg),
:deep(.wysimark-editor button[aria-selected="true"] svg),
:deep(.wysimark-editor [role="button"][aria-selected="true"] svg) {
  stroke: currentColor !important;
  color: inherit !important;
}

/* Ensure buttons have proper text color for icons to inherit */
:deep(.wysimark-editor button),
:deep(.wysimark-editor [role="button"]) {
  color: #d1d5db !important; /* gray-300 */
}

:deep(.wysimark-editor button:hover),
:deep(.wysimark-editor [role="button"]:hover),
:deep(.wysimark-editor button[aria-pressed="true"]),
:deep(.wysimark-editor [role="button"][aria-pressed="true"]),
:deep(.wysimark-editor button[aria-selected="true"]),
:deep(.wysimark-editor [role="button"][aria-selected="true"]) {
  color: #ffffff !important;
}

/* Handle icons that might use stroke instead of fill */
:deep(.wysimark-editor svg[stroke]),
:deep(.wysimark-editor svg path[stroke]),
:deep(.wysimark-editor svg line[stroke]),
:deep(.wysimark-editor svg circle[stroke]),
:deep(.wysimark-editor svg rect[stroke]) {
  stroke: currentColor !important;
  fill: none !important;
}

/* Handle icons that use fill - let them use their original fill */

/* Override any white backgrounds */
:deep(.wysimark-editor [style*="background-color: white"]),
:deep(.wysimark-editor [style*="background-color: #fff"]),
:deep(.wysimark-editor [style*="background-color: #ffffff"]) {
  background-color: #1f2937 !important; /* gray-800 */
}

/* Override any light text colors */
:deep(.wysimark-editor [style*="color: black"]),
:deep(.wysimark-editor [style*="color: #000"]),
:deep(.wysimark-editor [style*="color: #000000"]) {
  color: #f3f4f6 !important; /* gray-100 */
}

/* Mermaid diagram styling */
.prose .mermaid {
  @apply my-6 p-4 bg-gray-900 rounded-lg border border-gray-700 overflow-x-auto;
  text-align: center;
}

.prose .mermaid svg {
  max-width: 100%;
  height: auto;
}

/* Ensure mermaid diagrams are visible in dark mode */
.prose .mermaid :deep(svg) {
  background-color: #111827 !important;
}

.prose .mermaid :deep(.node rect),
.prose .mermaid :deep(.node circle),
.prose .mermaid :deep(.node ellipse),
.prose .mermaid :deep(.node polygon) {
  fill: #1f2937 !important;
  stroke: #60a5fa !important;
}

.prose .mermaid :deep(.nodeLabel) {
  color: #f3f4f6 !important;
}

.prose .mermaid :deep(.edgeLabel) {
  background-color: #1f2937 !important;
  color: #f3f4f6 !important;
}

.prose .mermaid :deep(.edgePath .path) {
  stroke: #60a5fa !important;
}

.prose .mermaid :deep(.arrowheadPath) {
  fill: #60a5fa !important;
}

.prose .mermaid :deep(.cluster rect) {
  fill: #111827 !important;
  stroke: #374151 !important;
}

.prose .mermaid :deep(.cluster-label text) {
  fill: #ffffff !important;
}

/* Fade transition for diagram hint */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Hide drawio code blocks in preview - they're just metadata */
.prose pre code.language-drawio {
  display: none;
}

.prose pre:has(code.language-drawio) {
  display: none;
}
</style>