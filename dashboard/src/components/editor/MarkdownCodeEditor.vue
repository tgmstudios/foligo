
<template>
  <div class="markdown-code-editor h-full flex flex-col">
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
      <div class="flex items-center space-x-2 text-xs text-gray-400">
        <span class="w-2 h-2 rounded-full" :class="dirty ? 'bg-amber-400' : 'bg-green-500'"></span>
        <span>{{ dirty ? 'Unsaved changes' : 'Saved' }}</span>
        <span class="text-gray-600">·</span>
        <span>{{ wordCount }} words</span>
      </div>
      <div class="flex items-center space-x-2">
        <slot name="toolbar-extra" />
        <button
          @click="$emit('save', getValue())"
          :disabled="!dirty || saving"
          class="px-3 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
    <div ref="container" class="flex-1 min-h-0"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { monaco, loader } from '@/lib/monaco'
import { uploadMedia, isImage, isVideo } from '@/services/media'
import { useToast } from 'vue-toastification'

interface Props {
  modelValue: string
  saving?: boolean
  projectId?: string
}

const props = withDefaults(defineProps<Props>(), { saving: false })

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save', value: string): void
  (e: 'scroll-position', position: { line: number; lineProgress: number }): void
}>()

const toast = useToast()
const container = ref<HTMLDivElement>()
const dirty = ref(false)
const wordCount = computed(() => props.modelValue.trim().split(/\s+/).filter(Boolean).length)

let editor: monaco.editor.IStandaloneCodeEditor | null = null
let applyingExternalUpdate = false

function getValue(): string {
  return editor?.getValue() ?? props.modelValue
}

/** Replaces the current selection (or inserts at the cursor if nothing is
 *  selected) with `text`. Used directly for one-shot inserts (mermaid
 *  template, media/drawio links, emoji). */
function insertText(text: string) {
  if (!editor) return
  const selection = editor.getSelection()
  if (!selection) return
  editor.executeEdits('insert', [{ range: selection, text, forceMoveMarkers: true }])
  editor.focus()
}

/** Wraps the current selection in `before`/`after` (e.g. **bold**); if
 *  nothing is selected, inserts `before + placeholder + after` and selects
 *  the placeholder so the user can type straight over it. */
function wrapSelection(before: string, after: string, placeholder: string) {
  if (!editor) return
  const model = editor.getModel()
  const selection = editor.getSelection()
  if (!model || !selection) return
  const selected = model.getValueInRange(selection)
  const inner = selected || placeholder
  const startOffset = model.getOffsetAt(selection.getStartPosition())
  editor.executeEdits('wrap', [{ range: selection, text: `${before}${inner}${after}`, forceMoveMarkers: true }])
  const innerStart = model.getPositionAt(startOffset + before.length)
  const innerEnd = model.getPositionAt(startOffset + before.length + inner.length)
  editor.setSelection(monaco.Range.fromPositions(innerStart, innerEnd))
  editor.focus()
}

/** Prefixes the current line (stripping any existing heading/list/quote
 *  marker first) — used for headings, blockquote, and list toggles. */
function setLinePrefix(prefix: string) {
  if (!editor) return
  const model = editor.getModel()
  const selection = editor.getSelection()
  if (!model || !selection) return
  const lineNumber = selection.startLineNumber
  const lineContent = model.getLineContent(lineNumber)
  const stripped = lineContent.replace(/^(#{1,6}\s+|>\s+|[-*]\s+|\d+\.\s+)/, '')
  const range = new monaco.Range(lineNumber, 1, lineNumber, lineContent.length + 1)
  editor.executeEdits('line-prefix', [{ range, text: `${prefix}${stripped}` }])
  editor.focus()
}

function insertTable() {
  insertText('\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n')
}

function insertCodeBlock() {
  wrapSelection('```\n', '\n```', 'code')
}

export interface DiagramAtCursor {
  xml: string
  imageUrl: string
  range: monaco.IRange
}

/** If the cursor/selection is anywhere in an existing draw.io diagram (the
 *  image line or its fenced ```drawio block), returns its decoded XML/URL and
 *  full source range so the caller can edit it instead of inserting another
 *  diagram. */
function getDiagramAtCursor(): DiagramAtCursor | null {
  if (!editor) return null
  const model = editor.getModel()
  const selection = editor.getSelection()
  if (!model || !selection) return null

  const totalLines = model.getLineCount()
  let fenceStart = -1

  for (let ln = 1; ln <= totalLines; ln++) {
    if (model.getLineContent(ln).trim() !== '```drawio') continue

    let fenceEnd = -1
    for (let end = ln + 1; end <= totalLines; end++) {
      if (model.getLineContent(end).trim() === '```') {
        fenceEnd = end
        break
      }
    }
    if (fenceEnd === -1) return null

    // A selection counts when any part of it intersects the draw.io fence.
    if (selection.endLineNumber >= ln && selection.startLineNumber <= fenceEnd) {
      fenceStart = ln
      break
    }
    ln = fenceEnd
  }

  // Preserve the existing behavior when the cursor is on the image preview.
  let imageLine = selection.startLineNumber
  let imageMatch = model.getLineContent(imageLine).match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
  if (fenceStart === -1 && imageMatch) {
    for (let ln = imageLine + 1; ln <= Math.min(imageLine + 4, totalLines); ln++) {
      const text = model.getLineContent(ln).trim()
      if (text === '') continue
      if (text === '```drawio') fenceStart = ln
      break
    }
  }
  if (fenceStart === -1) return null

  let fenceEnd = -1
  for (let ln = fenceStart + 1; ln <= totalLines; ln++) {
    if (model.getLineContent(ln).trim() === '```') { fenceEnd = ln; break }
  }
  if (fenceEnd === -1) return null

  if (!imageMatch) {
    imageLine = fenceStart - 1
    while (imageLine > 0 && model.getLineContent(imageLine).trim() === '') imageLine--
    imageMatch = imageLine > 0
      ? model.getLineContent(imageLine).match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
      : null
  }
  if (!imageMatch) return null

  const encoded = model.getValueInRange(new monaco.Range(fenceStart + 1, 1, fenceEnd, 1)).trim()
  try {
    return {
      xml: decodeURIComponent(escape(atob(encoded))),
      imageUrl: imageMatch[2],
      range: {
        startLineNumber: imageLine,
        startColumn: 1,
        endLineNumber: fenceEnd,
        endColumn: model.getLineMaxColumn(fenceEnd),
      },
    }
  } catch {
    return null
  }
}

/** Replaces a previously-detected diagram block (see getDiagramAtCursor) with
 *  freshly-saved markdown, instead of inserting a second copy at the cursor. */
function replaceDiagramAt(range: monaco.IRange, markdown: string) {
  if (!editor) return
  editor.executeEdits('replace-diagram', [{ range, text: markdown }])
  editor.focus()
}

async function handlePaste(event: ClipboardEvent) {
  // Monaco's text input (native EditContext API in modern browsers, a hidden
  // textarea as fallback) doesn't reliably bubble/capture 'paste' up to an
  // ancestor listener on our own container — so this is registered on
  // `document` instead (see onMounted) and scoped here via hasTextFocus() to
  // only react when this specific editor instance is the one focused.
  if (!editor?.hasTextFocus()) return

  const items = event.clipboardData?.items
  if (!items || !props.projectId) return

  for (const item of Array.from(items)) {
    if (item.kind !== 'file') continue
    const file = item.getAsFile()
    if (!file || !(file.type.startsWith('image/') || file.type.startsWith('video/'))) continue

    event.preventDefault()
    try {
      toast.info('Uploading pasted file…')
      const media = await uploadMedia(file, props.projectId)
      const markdown = isImage(media.mimeType)
        ? `![${media.filename}](${media.publicUrl})`
        : isVideo(media.mimeType)
          ? `<video src="${media.publicUrl}" controls></video>`
          : `[${media.filename}](${media.publicUrl})`
      insertText(markdown)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload pasted file')
    }
    return
  }
}

onMounted(async () => {
  await nextTick()
  if (!container.value) return

  const monacoInstance = await loader.init()

  editor = monacoInstance.editor.create(container.value, {
    value: props.modelValue,
    language: 'markdown',
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

  editor.onDidScrollChange((event) => {
    if (!event.scrollTopChanged || !editor) return
    const visibleRange = editor.getVisibleRanges()[0]
    if (!visibleRange) return
    const line = visibleRange.startLineNumber
    const lineTop = editor.getTopForLineNumber(line)
    const lineHeight = editor.getOption(monacoInstance.editor.EditorOption.lineHeight)
    emit('scroll-position', {
      line,
      lineProgress: Math.max(0, Math.min(1, (event.scrollTop - lineTop) / lineHeight)),
    })
  })

  editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
    emit('save', getValue())
  })

  document.addEventListener('paste', handlePaste as unknown as EventListener, true)
})

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

watch(() => props.saving, (saving) => { if (!saving) dirty.value = false })

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste as unknown as EventListener, true)
  editor?.dispose()
})

defineExpose({
  markClean: () => { dirty.value = false },
  insertText,
  wrapSelection,
  setLinePrefix,
  insertTable,
  insertCodeBlock,
  getDiagramAtCursor,
  replaceDiagramAt,
  focus: () => editor?.focus(),
})
</script>
