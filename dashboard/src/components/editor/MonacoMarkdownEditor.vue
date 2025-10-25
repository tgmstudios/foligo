<template>
  <div class="monaco-markdown-editor">
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
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          @click="insertMarkdown('*', '*')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          @click="insertMarkdown('[', '](url)')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Link"
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
          title="Heading"
        >
          H1
        </button>
        <button
          @click="insertMarkdown('## ', '')"
          class="p-1 text-gray-600 hover:text-gray-800"
          title="Subheading"
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
      </div>
    </div>

    <!-- Editor/Preview -->
    <div class="flex h-96">
      <!-- Monaco Editor -->
      <div v-if="!showPreview" class="flex-1">
        <div ref="monacoContainer" class="w-full h-full"></div>
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
        Use Markdown syntax for formatting • Monaco Editor powered
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('cancel')"
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
import * as monaco from 'monaco-editor'
import loader from '@monaco-editor/loader'
import { marked } from 'marked'

interface Props {
  modelValue: string
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'save', value: string): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Start writing your markdown content...'
})

const emit = defineEmits<Emits>()

const localContent = ref(props.modelValue)
const showPreview = ref(false)
const monacoContainer = ref<HTMLDivElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== localContent.value) {
    editor.setValue(newValue)
    localContent.value = newValue
  }
})

// Word count
const wordCount = computed(() => {
  return localContent.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

// Character count
const characterCount = computed(() => {
  return localContent.value.length
})

// Enhanced markdown rendering with marked library
const renderedMarkdown = computed(() => {
  if (!localContent.value.trim()) return ''
  
  try {
    // Configure marked options
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

const handleInput = () => {
  emit('update:modelValue', localContent.value)
}

const handleSave = () => {
  emit('save', localContent.value)
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const insertMarkdown = (before: string, after: string = '') => {
  if (!editor) return

  const selection = editor.getSelection()
  if (!selection) return

  const selectedText = editor.getModel()?.getValueInRange(selection) || ''
  const newText = before + selectedText + after
  
  editor.executeEdits('insert-markdown', [{
    range: selection,
    text: newText,
    forceMoveMarkers: true
  }])

  // Update local content
  localContent.value = editor.getValue()
  emit('update:modelValue', localContent.value)
}

const initializeMonaco = async () => {
  if (!monacoContainer.value) return

  // Configure Monaco
  loader.config({ 
    'vs/nls': { availableLanguages: { '*': 'en' } },
    paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' }
  })

  const monacoInstance = await loader.init()
  
  // Configure markdown language
  monacoInstance.languages.register({ id: 'markdown' })
  
  // Create editor
  editor = monacoInstance.editor.create(monacoContainer.value, {
    value: localContent.value,
    language: 'markdown',
    theme: 'vs-light',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: true,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'line',
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    cursorSmoothCaretAnimation: true,
    smoothScrolling: true,
    contextmenu: true,
    mouseWheelZoom: true,
    fontSize: 14,
    fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    fontLigatures: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
    wordBasedSuggestions: 'off',
    parameterHints: { enabled: true },
    hover: { enabled: true },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showFunctions: true,
      showConstructors: true,
      showFields: true,
      showVariables: true,
      showClasses: true,
      showStructs: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showIssues: true,
      showUsers: true,
      showWords: true
    }
  })

  // Listen for content changes
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    localContent.value = value
    emit('update:modelValue', value)
  })

  // Add keyboard shortcuts
  editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
    handleSave()
  })

  editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyK, () => {
    insertMarkdown('[', '](url)')
  })

  editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyB, () => {
    insertMarkdown('**', '**')
  })

  editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyI, () => {
    insertMarkdown('*', '*')
  })
}

onMounted(async () => {
  await nextTick()
  await initializeMonaco()
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>

<style scoped>
.monaco-markdown-editor {
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
</style>
