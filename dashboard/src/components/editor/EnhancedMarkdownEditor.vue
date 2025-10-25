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
      <!-- Enhanced Textarea Editor -->
      <div v-if="!showPreview" class="flex-1">
        <textarea
          ref="textareaRef"
          v-model="localContent"
          @input="handleInput"
          @keydown="handleKeydown"
          class="w-full h-full p-4 border-0 resize-none focus:outline-none font-mono text-sm leading-relaxed bg-gray-50"
          :placeholder="placeholder"
          spellcheck="false"
        ></textarea>
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
        Use Markdown syntax for formatting • Enhanced Editor
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
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
const textareaRef = ref<HTMLTextAreaElement>()

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  localContent.value = newValue
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
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = localContent.value.substring(start, end)
  
  const newText = before + selectedText + after
  const newContent = localContent.value.substring(0, start) + newText + localContent.value.substring(end)
  
  localContent.value = newContent
  emit('update:modelValue', localContent.value)
  
  // Restore cursor position
  nextTick(() => {
    const newCursorPos = start + before.length + selectedText.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  // Handle keyboard shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        handleSave()
        break
      case 'b':
        event.preventDefault()
        insertMarkdown('**', '**')
        break
      case 'i':
        event.preventDefault()
        insertMarkdown('*', '*')
        break
      case 'k':
        event.preventDefault()
        insertMarkdown('[', '](url)')
        break
    }
  }
  
  // Handle Tab key for indentation
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = textareaRef.value
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    if (event.shiftKey) {
      // Shift+Tab: Remove indentation
      const lines = localContent.value.split('\n')
      const startLine = localContent.value.substring(0, start).split('\n').length - 1
      const endLine = localContent.value.substring(0, end).split('\n').length - 1
      
      for (let i = startLine; i <= endLine; i++) {
        if (lines[i].startsWith('  ')) {
          lines[i] = lines[i].substring(2)
        }
      }
      
      localContent.value = lines.join('\n')
      emit('update:modelValue', localContent.value)
    } else {
      // Tab: Add indentation
      const lines = localContent.value.split('\n')
      const startLine = localContent.value.substring(0, start).split('\n').length - 1
      const endLine = localContent.value.substring(0, end).split('\n').length - 1
      
      for (let i = startLine; i <= endLine; i++) {
        lines[i] = '  ' + lines[i]
      }
      
      localContent.value = lines.join('\n')
      emit('update:modelValue', localContent.value)
    }
  }
}

// Focus textarea when component mounts
onMounted(() => {
  nextTick(() => {
    textareaRef.value?.focus()
  })
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

/* Enhanced textarea styling */
textarea {
  background: linear-gradient(90deg, transparent 0%, transparent 49%, #e5e7eb 50%, #e5e7eb 100%);
  background-size: 2ch 100%;
  background-repeat: repeat-y;
  background-attachment: local;
}

textarea:focus {
  background: linear-gradient(90deg, transparent 0%, transparent 49%, #d1d5db 50%, #d1d5db 100%);
}
</style>
