<template>
  <div class="document-editor h-full flex flex-col">
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
      <div class="flex items-center space-x-2 text-xs text-gray-400">
        <span class="w-2 h-2 rounded-full" :class="dirty ? 'bg-amber-400' : 'bg-green-500'"></span>
        <span>{{ dirty ? 'Unsaved changes' : 'Saved' }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <slot name="toolbar-extra" />
        <button
          @click="$emit('save')"
          :disabled="!dirty || saving"
          class="px-3 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ saving ? 'Saving…' : 'Save & Compile' }}
        </button>
      </div>
    </div>
    <div ref="container" class="flex-1 min-h-0"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { monaco, loader } from '@/lib/monaco'

interface Props {
  modelValue: string
  saving?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  saving: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
}>()

const container = ref<HTMLDivElement>()
const dirty = ref(false)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let applyingExternalUpdate = false

const LATEX_LANGUAGE_ID = 'foligo-latex'

function registerLatexLanguage(monacoInstance: typeof monaco) {
  if (monacoInstance.languages.getLanguages().some(l => l.id === LATEX_LANGUAGE_ID)) return

  monacoInstance.languages.register({ id: LATEX_LANGUAGE_ID })
  monacoInstance.languages.setMonarchTokensProvider(LATEX_LANGUAGE_ID, {
    tokenizer: {
      root: [
        [/%.*$/, 'comment'],
        [/\\[a-zA-Z]+/, 'keyword'],
        [/\\[^a-zA-Z]/, 'keyword'],
        [/\$\$/, { token: 'string', next: '@displaymath' }],
        [/\$/, { token: 'string', next: '@inlinemath' }],
        [/[{}]/, 'delimiter.bracket'],
        [/[\[\]]/, 'delimiter.square'],
        [/&/, 'operator'],
      ],
      displaymath: [
        [/\$\$/, { token: 'string', next: '@pop' }],
        [/[^$]+/, 'string'],
      ],
      inlinemath: [
        [/\$/, { token: 'string', next: '@pop' }],
        [/[^$]+/, 'string'],
      ],
    },
  })
  monacoInstance.languages.setLanguageConfiguration(LATEX_LANGUAGE_ID, {
    comments: { lineComment: '%' },
    brackets: [['{', '}'], ['[', ']']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '$', close: '$' },
    ],
  })
}

onMounted(async () => {
  await nextTick()
  if (!container.value) return

  const monacoInstance = await loader.init()
  registerLatexLanguage(monacoInstance)

  editor = monacoInstance.editor.create(container.value, {
    value: props.modelValue,
    language: LATEX_LANGUAGE_ID,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    fontSize: 13,
    fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    lineNumbers: 'on',
    renderLineHighlight: 'line',
  })

  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    if (applyingExternalUpdate) return
    dirty.value = true
    emit('update:modelValue', value)
  })

  editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
    emit('save')
  })
})

// External updates (loading a doc, or the agent applying a tool-call edit) should
// replace the editor's content without re-triggering the dirty flag.
watch(() => props.modelValue, (newValue) => {
  if (!editor) return
  if (newValue === editor.getValue()) return
  applyingExternalUpdate = true
  const position = editor.getPosition()
  editor.setValue(newValue)
  if (position) editor.setPosition(position)
  applyingExternalUpdate = false
  dirty.value = false
})

watch(() => props.saving, (saving) => {
  if (!saving) dirty.value = false
})

onUnmounted(() => {
  editor?.dispose()
})

defineExpose({ markClean: () => { dirty.value = false } })
</script>

<style scoped>
.document-editor :deep(.monaco-editor) {
  padding-top: 4px;
}
</style>
