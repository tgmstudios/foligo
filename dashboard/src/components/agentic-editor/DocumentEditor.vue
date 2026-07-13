<template>
  <div class="document-editor h-full flex flex-col">
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
      <div class="flex items-center space-x-2 text-xs text-gray-400">
        <span class="w-2 h-2 rounded-full" :class="dirty ? 'bg-amber-400' : 'bg-green-500'"></span>
        <span>{{ dirty ? 'Unsaved changes' : 'Saved' }}</span>
        <span v-if="diagnosticCount > 0" class="text-amber-400 ml-2">
          {{ diagnosticCount }} {{ diagnosticCount === 1 ? 'warning' : 'warnings' }}
        </span>
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
const diagnosticCount = ref(0)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let applyingExternalUpdate = false
let lintTimer: ReturnType<typeof setTimeout> | null = null

const LATEX_LANGUAGE_ID = 'foligo-latex'

function registerLatexLanguage(monacoInstance: typeof monaco) {
  if (monacoInstance.languages.getLanguages().some(l => l.id === LATEX_LANGUAGE_ID)) return

  monacoInstance.languages.register({ id: LATEX_LANGUAGE_ID })
  monacoInstance.languages.setMonarchTokensProvider(LATEX_LANGUAGE_ID, {
    tokenizer: {
      root: [
        [/%%.*$/, 'comment.doc'],
        [/%.*$/, 'comment'],
        [/\\\\[a-zA-Z@]+/, 'keyword'],
        [/\\\\[^a-zA-Z]/, 'keyword'],
        [/\\\$\\$/, { token: 'string', next: '@displaymath' }],
        [/\\\$/, { token: 'string', next: '@inlinemath' }],
        [/[{}]/, 'delimiter.bracket'],
        [/[\\[\\]]/, 'delimiter.square'],
        [/&/, 'operator'],
      ],
      displaymath: [
        [/\\\$\\$/, { token: 'string', next: '@pop' }],
        [/[^$]+/, 'string'],
        [/\$/, 'string'],
      ],
      inlinemath: [
        [/\\\$/, { token: 'string', next: '@pop' }],
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
      { open: '\\begin{', close: '\\end{' },
    ],
  })
}

// ── LaTeX linting ──────────────────────────────────────────────────────────

interface LintMarker {
  line: number
  col: number
  endCol: number
  message: string
  severity: 'warning' | 'error'
}

function lintLatex(source: string): LintMarker[] {
  const markers: LintMarker[] = []
  const lines = source.split('\n')

  // 1. Check for \documentclass — required
  const hasDocClass = /\\documentclass(\[.*?\])?\{/.test(source)
  if (!hasDocClass && source.trim().length > 0) {
    markers.push({
      line: 1, col: 1, endCol: 1,
      message: 'Missing \\documentclass — LaTeX documents must declare a document class (e.g. \\documentclass{article})',
      severity: 'error',
    })
  }

  // 2. Check \begin/\end pairing
  const begins: Array<{ env: string; line: number }> = []
  const beginRegex = /\\begin\{([^}]+)\}/g
  let bm
  while ((bm = beginRegex.exec(source)) !== null) {
    begins.push({ env: bm[1], line: lineCol(source, bm.index).line })
  }

  const endRegex = /\\end\{([^}]+)\}/g
  const ends = new Map<string, number>()
  let em
  while ((em = endRegex.exec(source)) !== null) {
    ends.set(em[1], (ends.get(em[1]) || 0) + 1)
  }

  // Check for \begin without matching \end
  const envCounts = new Map<string, number>()
  for (const b of begins) {
    envCounts.set(b.env, (envCounts.get(b.env) || 0) + 1)
  }
  for (const [env, count] of envCounts) {
    const endCount = ends.get(env) || 0
    if (count > endCount) {
      const firstBegin = begins.find(b => b.env === env)
      markers.push({
        line: firstBegin?.line || 1, col: 1, endCol: 6 + env.length,
        message: `Unclosed \\begin{${env}} — ${count - endCount} missing \\end{${env}}`,
        severity: 'error',
      })
    }
  }

  // 3. Braces check (outside comments)
  const cleanSource = source.replace(/%.*$/gm, '')
  let braceDepth = 0
  let lastOpenLine = 1, lastOpenCol = 1
  for (let i = 0; i < cleanSource.length; i++) {
    if (cleanSource[i] === '{') {
      braceDepth++
      const lc = lineCol(cleanSource, i)
      lastOpenLine = lc.line; lastOpenCol = lc.col
    } else if (cleanSource[i] === '}') {
      braceDepth--
    }
  }
  if (braceDepth > 0) {
    markers.push({
      line: lastOpenLine, col: lastOpenCol, endCol: lastOpenCol,
      message: `Unclosed brace — ${braceDepth} open brace(s) missing closing }`,
      severity: 'error',
    })
  }

  // 4. Unescaped special characters outside math mode (#, & outside math)
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    // Skip comment lines
    if (line.trim().startsWith('%')) continue

    // Check for bare # (must be escaped in text mode)
    const hashIdx = line.indexOf('#')
    if (hashIdx >= 0 && !isInMath(line, hashIdx)) {
      markers.push({
        line: li + 1, col: hashIdx + 1, endCol: hashIdx + 2,
        message: 'Unescaped # — use \\# in text mode. In LaTeX, # is special (macro parameter).',
        severity: 'warning',
      })
    }
  }

  // 5. Multiple \documentclass declarations
  const docClassMatches = source.match(/\\documentclass/g)
  if (docClassMatches && docClassMatches.length > 1) {
    const lc = lineCol(source, source.indexOf('\\documentclass', source.indexOf('\\documentclass') + 1))
    markers.push({
      line: lc.line, col: lc.col, endCol: lc.col + 14,
      message: 'Duplicate \\documentclass — only one document class declaration is allowed',
      severity: 'error',
    })
  }

  // 6. Missing \begin{document}
  if (!/\\begin\{document\}/.test(source) && source.trim().length > 0) {
    markers.push({
      line: Math.min(lines.length, 10), col: 1, endCol: 1,
      message: 'Missing \\begin{document} — content must be inside the document environment',
      severity: 'error',
    })
  }

  // 7. microtype letterspacing with XeTeX — won't compile
  if (/\\usepackage(\[.*?\])?\{microtype\}/.test(source) && /\\textls\{|\\lsstyle|\\SetTracking\{/.test(source)) {
    const mtIdx = source.search(/\\textls\{|\\lsstyle|\\SetTracking\{/);
    const lc = lineCol(source, mtIdx);
    markers.push({
      line: lc.line, col: lc.col, endCol: lc.col + 8,
      message: 'microtype letterspacing (\\textls, \\lsstyle, \\SetTracking) doesn\'t work with XeTeX — remove or switch to LuaLaTeX',
      severity: 'warning',
    })
  }

  return markers
}

function lineCol(source: string, index: number): { line: number; col: number } {
  const before = source.slice(0, index)
  const line = before.split('\n').length
  const lastNewline = before.lastIndexOf('\n')
  const col = index - lastNewline
  return { line, col }
}

function isInMath(line: string, pos: number): boolean {
  let inMath = false
  for (let i = 0; i < pos; i++) {
    if (line[i] === '$' && line[i - 1] !== '\\') inMath = !inMath
  }
  return inMath
}

function runLint(monacoInstance: typeof monaco, model: monaco.editor.ITextModel) {
  const markers = lintLatex(model.getValue())
  diagnosticCount.value = markers.length

  monacoInstance.editor.setModelMarkers(model, 'latex-lint', markers.map(m => ({
    startLineNumber: m.line,
    startColumn: m.col,
    endLineNumber: m.line,
    endColumn: m.endCol + 1,
    message: m.message,
    severity: m.severity === 'error'
      ? monacoInstance.MarkerSeverity.Error
      : monacoInstance.MarkerSeverity.Warning,
    source: 'LaTeX Lint',
  })))
}

// ── Editor setup ───────────────────────────────────────────────────────────

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

  const model = editor.getModel()
  if (model) {
    // Initial lint
    runLint(monacoInstance, model)
    // Lint on changes (debounced)
    editor.onDidChangeModelContent(() => {
      if (lintTimer) clearTimeout(lintTimer)
      lintTimer = setTimeout(() => {
        if (editor) {
          const m = editor.getModel()
          if (m) runLint(monacoInstance, m)
        }
      }, 300)
    })
  }

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
  if (lintTimer) clearTimeout(lintTimer)
  editor?.dispose()
})

// ── Public API ─────────────────────────────────────────────────────────────

function jumpToLine(line: number) {
  if (!editor) return
  editor.revealLineInCenter(line)
  editor.setPosition({ lineNumber: line, column: 1 })
  editor.focus()
}

defineExpose({ markClean: () => { dirty.value = false }, jumpToLine })
</script>

<style scoped>
.document-editor :deep(.monaco-editor) {
  padding-top: 4px;
}
</style>
