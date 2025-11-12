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
        <div class="text-sm text-gray-400">
          {{ wordCount }} words
        </div>
        <div class="text-sm text-gray-400">
          {{ characterCount }} characters
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          @click="insertMarkdown('**', '**')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          @click="insertMarkdown('*', '*')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          @click="insertMarkdown('[', '](url)')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Link (Ctrl+K)"
        >
          🔗
        </button>
        <button
          @click="insertMarkdown('```\n', '\n```')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Code Block"
        >
          &lt;/&gt;
        </button>
        <button
          @click="insertMarkdown('# ', '')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Heading 1"
        >
          H1
        </button>
        <button
          @click="insertMarkdown('## ', '')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Heading 2"
        >
          H2
        </button>
        <button
          @click="insertMarkdown('- ', '')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Bullet List"
        >
          •
        </button>
        <button
          @click="insertMarkdown('1. ', '')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Numbered List"
        >
          1.
        </button>
        <button
          @click="insertMarkdown('> ', '')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Quote"
        >
          "
        </button>
        <button
          @click="insertMarkdown('---\n', '')"
          class="p-1 text-gray-400 hover:text-gray-200"
          title="Horizontal Rule"
        >
          ─
        </button>
      </div>
    </div>

    <!-- Editor/Preview -->
    <div class="flex h-96">
      <!-- Editor -->
      <div v-show="!showPreview" class="flex-1">
        <div ref="editorContainer" class="w-full h-full"></div>
      </div>

      <!-- Preview -->
      <div v-show="showPreview" class="flex-1 p-4 bg-gray-800 overflow-y-auto">
        <div v-if="localContent.trim()" v-html="renderedMarkdown" class="prose prose-sm max-w-none"></div>
        <div v-else class="text-gray-400 italic">No content to preview</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between p-4 border-t border-gray-600 bg-gray-800">
      <div class="text-xs text-gray-400">
        Use Markdown syntax for formatting • Monaco Editor powered
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { marked } from 'marked'

// Props definition
const props = defineProps<{
  modelValue: string
  placeholder?: string
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
const editorContainer = ref<HTMLDivElement>()
let editor: any = null

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== localContent.value) {
    updateEditorContent(newValue)
  }
})

// Watch for preview mode changes to handle editor layout
watch(showPreview, async (newValue) => {
  if (!newValue && editor && editor.layout) {
    await nextTick()
    editor.layout()
  }
})

// Computed properties
const wordCount = computed(() => {
  return localContent.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => {
  return localContent.value.length
})

const renderedMarkdown = computed(() => {
  if (!localContent.value.trim()) return ''
  
  try {
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    })
    
    return marked(localContent.value)
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return localContent.value
  }
})

// Methods
const handleInput = () => {
  emit('update:modelValue', localContent.value)
}

const handleSave = () => {
  // Ensure we have the latest content from the editor
  if (editor && editor.getValue) {
    localContent.value = editor.getValue()
  } else {
    // Fallback to textarea
    const textarea = editorContainer.value?.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      localContent.value = textarea.value
    }
  }
  
  emit('save', localContent.value)
}

const handleCancel = () => {
  emit('cancel')
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
  
  // If switching back to edit mode, trigger Monaco to resize
  if (!showPreview.value && editor && editor.layout) {
    nextTick(() => {
      editor.layout()
    })
  }
}

const insertMarkdown = (before: string, after: string = '') => {
  if (!editor) return

  // Check if we're using Monaco Editor or textarea fallback
  if (editor.getValue) {
    // Monaco Editor
    const selection = editor.getSelection()
    const selectedText = editor.getModel()?.getValueInRange(selection) || ''
    const newText = before + selectedText + after
    
    editor.executeEdits('insert-markdown', [{
      range: selection,
      text: newText,
      forceMoveMarkers: true
    }])

    // Move cursor to end of inserted text
    const newPosition = {
      lineNumber: selection.startLineNumber,
      column: selection.startColumn + before.length + selectedText.length
    }
    editor.setPosition(newPosition)
    editor.focus()

    localContent.value = editor.getValue()
    emit('update:modelValue', localContent.value)
  } else {
    // Textarea fallback
    const textarea = editorContainer.value?.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      insertMarkdownTextarea(textarea, before, after)
    }
  }
}

const updateEditorContent = (content: string) => {
  if (!editor) return
  
  if (editor.setValue) {
    // Monaco Editor
    editor.setValue(content)
  } else {
    // Textarea fallback
    const textarea = editorContainer.value?.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      textarea.value = content
    }
  }
  localContent.value = content
}

const initializeCodeMirror = async () => {
  if (!editorContainer.value || editor) return

  try {
    // Use Monaco Editor loader for proper initialization
    const { default: loader } = await import('@monaco-editor/loader')
    
    // Initialize Monaco
    const monaco = await loader.init()
    
    editor = monaco.editor.create(editorContainer.value, {
      value: localContent.value,
      language: 'markdown',
      theme: 'vs-dark',
      fontSize: 14,
      fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      lineNumbers: 'off',
      folding: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
      padding: { top: 16, bottom: 16, left: 16, right: 16 }
    })

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      localContent.value = editor.getValue()
      emit('update:modelValue', localContent.value)
    })

    // Handle keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      insertMarkdown('**', '**')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      insertMarkdown('*', '*')
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      insertMarkdown('[', '](url)')
    })

  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error)
    fallbackToTextarea()
  }
}

const fallbackToTextarea = () => {
  if (!editorContainer.value) return
  
  editorContainer.value.innerHTML = `
    <textarea 
      class="w-full h-full p-4 border-0 resize-none focus:outline-none font-mono text-sm leading-relaxed bg-gray-900 text-gray-100 placeholder-gray-500"
      placeholder="${props.placeholder || 'Start writing your markdown content...'}"
    >${localContent.value}</textarea>
  `
  
  const textarea = editorContainer.value.querySelector('textarea') as HTMLTextAreaElement
  if (textarea) {
    textarea.addEventListener('input', (e) => {
      localContent.value = (e.target as HTMLTextAreaElement).value
      emit('update:modelValue', localContent.value)
    })

    // Add keyboard shortcuts for textarea
    textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'b':
            e.preventDefault()
            insertMarkdownTextarea(textarea, '**', '**')
            break
          case 'i':
            e.preventDefault()
            insertMarkdownTextarea(textarea, '*', '*')
            break
          case 'k':
            e.preventDefault()
            insertMarkdownTextarea(textarea, '[', '](url)')
            break
        }
      }
    })
  }
}

const insertMarkdownTextarea = (textarea: HTMLTextAreaElement, before: string, after: string = '') => {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = textarea.value.substring(start, end)
  const newText = before + selectedText + after
  
  textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end)
  
  // Set cursor position
  const newCursorPos = start + before.length + selectedText.length
  textarea.setSelectionRange(newCursorPos, newCursorPos)
  textarea.focus()
  
  localContent.value = textarea.value
  emit('update:modelValue', localContent.value)
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initializeCodeMirror()
})

onUnmounted(() => {
  if (editor) {
    if (editor.dispose) {
      // Monaco Editor
      editor.dispose()
    }
    // Textarea doesn't need cleanup
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

/* CodeMirror styling */
:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-content) {
  padding: 16px;
  min-height: 100%;
}

:deep(.cm-focused) {
  outline: none;
}

:deep(.cm-scroller) {
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>