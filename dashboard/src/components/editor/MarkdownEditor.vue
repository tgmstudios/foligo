<template>
  <div class="markdown-editor">
    <!-- Toolbar -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center space-x-2">
        <button
          @click="togglePreview"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            showPreview ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          {{ showPreview ? 'Edit' : 'Preview' }}
        </button>
        <div class="text-sm text-gray-500">
          {{ wordCount }} words
        </div>
        <div class="text-sm text-gray-500">
          {{ characterCount }} characters
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          @click="insertMarkdown('**', '**')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          @click="insertMarkdown('*', '*')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          @click="insertMarkdown('[', '](url)')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Link (Ctrl+K)"
        >
          🔗
        </button>
        <button
          @click="insertMarkdown('```\n', '\n```')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Code Block"
        >
          &lt;/&gt;
        </button>
        <button
          @click="insertMarkdown('# ', '')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Heading 1"
        >
          H1
        </button>
        <button
          @click="insertMarkdown('## ', '')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Heading 2"
        >
          H2
        </button>
        <button
          @click="insertMarkdown('- ', '')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Bullet List"
        >
          •
        </button>
        <button
          @click="insertMarkdown('1. ', '')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Numbered List"
        >
          1.
        </button>
        <button
          @click="insertMarkdown('> ', '')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Quote"
        >
          "
        </button>
        <button
          @click="insertMarkdown('---\n', '')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Horizontal Rule"
        >
          ─
        </button>
      </div>
    </div>

    <!-- Editor/Preview -->
    <div class="flex h-96">
      <!-- CodeMirror Editor -->
      <div v-if="!showPreview" class="flex-1">
        <div ref="editorContainer" class="w-full h-full"></div>
      </div>

      <!-- Preview -->
      <div v-else class="flex-1 p-4 bg-white overflow-y-auto">
        <div v-if="localContent.trim()" v-html="renderedMarkdown" class="prose prose-sm max-w-none"></div>
        <div v-else class="text-gray-500 italic">No content to preview</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
      <div class="text-xs text-gray-500">
        Use Markdown syntax for formatting • CodeMirror powered
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="handleCancel"
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
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
  emit('save', localContent.value)
}

const handleCancel = () => {
  emit('cancel')
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const insertMarkdown = (before: string, after: string = '') => {
  if (!editor) return

  const selection = editor.state.selection
  const selectedText = editor.state.doc.sliceString(selection.main.from, selection.main.to)
  const newText = before + selectedText + after
  
  editor.dispatch({
    changes: {
      from: selection.main.from,
      to: selection.main.to,
      insert: newText
    },
    selection: {
      anchor: selection.main.from + before.length + selectedText.length
    }
  })

  localContent.value = editor.state.doc.toString()
  emit('update:modelValue', localContent.value)
}

const updateEditorContent = (content: string) => {
  if (!editor) return
  
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: content
    }
  })
  localContent.value = content
}

const initializeCodeMirror = async () => {
  if (!editorContainer.value) return

  try {
    // Dynamic import to avoid build issues
    const { EditorView } = await import('@codemirror/view')
    const { EditorState } = await import('@codemirror/state')
    const { basicSetup } = await import('@codemirror/basic-setup')
    const { markdown } = await import('@codemirror/lang-markdown')

    editor = new EditorView({
      state: EditorState.create({
        doc: localContent.value,
        extensions: [
          basicSetup,
          markdown(),
          EditorView.theme({
            '&': {
              fontSize: '14px',
              fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace"
            },
            '.cm-content': {
              padding: '16px',
              minHeight: '100%'
            },
            '.cm-focused': {
              outline: 'none'
            },
            '.cm-editor': {
              height: '100%'
            },
            '.cm-scroller': {
              fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace"
            }
          }),
          EditorView.updateListener.of((update: any) => {
            if (update.docChanged) {
              localContent.value = update.state.doc.toString()
              emit('update:modelValue', localContent.value)
            }
          }),
          EditorView.domEventHandlers({
            keydown: (event: KeyboardEvent, view: any) => {
              if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                  case 's':
                    event.preventDefault()
                    handleSave()
                    return true
                  case 'b':
                    event.preventDefault()
                    insertMarkdown('**', '**')
                    return true
                  case 'i':
                    event.preventDefault()
                    insertMarkdown('*', '*')
                    return true
                  case 'k':
                    event.preventDefault()
                    insertMarkdown('[', '](url)')
                    return true
                }
              }
              return false
            }
          })
        ]
      }),
      parent: editorContainer.value
    })

  } catch (error) {
    console.error('Failed to initialize CodeMirror:', error)
    fallbackToTextarea()
  }
}

const fallbackToTextarea = () => {
  if (!editorContainer.value) return
  
  editorContainer.value.innerHTML = `
    <textarea 
      class="w-full h-full p-4 border-0 resize-none focus:outline-none font-mono text-sm leading-relaxed bg-gray-50"
      placeholder="${props.placeholder || 'Start writing your markdown content...'}"
    >${localContent.value}</textarea>
  `
  
  const textarea = editorContainer.value.querySelector('textarea') as HTMLTextAreaElement
  if (textarea) {
    textarea.addEventListener('input', (e) => {
      localContent.value = (e.target as HTMLTextAreaElement).value
      emit('update:modelValue', localContent.value)
    })
  }
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  await initializeCodeMirror()
})

onUnmounted(() => {
  if (editor) {
    editor.destroy()
  }
})
</script>

<style scoped>
.markdown-editor {
  @apply border border-gray-300 rounded-lg overflow-hidden;
}

.prose {
  @apply text-gray-900;
}

.prose h1 {
  @apply text-2xl font-bold text-gray-900 mb-4;
}

.prose h2 {
  @apply text-xl font-semibold text-gray-900 mb-3;
}

.prose h3 {
  @apply text-lg font-medium text-gray-900 mb-2;
}

.prose strong {
  @apply font-semibold;
}

.prose em {
  @apply italic;
}

.prose code {
  @apply bg-gray-100 px-1 py-0.5 rounded text-sm font-mono;
}

.prose pre {
  @apply bg-gray-100 p-3 rounded overflow-x-auto;
}

.prose pre code {
  @apply bg-transparent p-0;
}

.prose a {
  @apply text-primary-600 hover:text-primary-700 underline;
}

.prose li {
  @apply list-disc list-inside mb-1;
}

.prose blockquote {
  @apply border-l-4 border-gray-300 pl-4 italic text-gray-600;
}

.prose hr {
  @apply border-gray-300 my-4;
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