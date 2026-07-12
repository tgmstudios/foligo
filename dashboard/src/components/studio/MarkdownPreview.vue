
<template>
  <div class="h-full flex flex-col bg-gray-900">
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
      <span class="text-xs text-gray-400">Preview</span>
      <div class="flex items-center gap-3">
      <button
        type="button"
        class="flex items-center gap-1.5 text-xs transition-colors"
        :class="lockedScroll ? 'text-primary-300' : 'text-gray-500 hover:text-gray-300'"
        :aria-pressed="lockedScroll"
        title="Keep the preview aligned with the editor"
        @click="toggleLockedScroll"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11V7a4 4 0 00-8 0v4m0 0h8m-8 0a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2v-6a2 2 0 00-2-2m4 0h4m0 0V7m0 4a2 2 0 012 2v6a2 2 0 01-2 2h-4" />
        </svg>
        {{ lockedScroll ? 'Scroll locked' : 'Lock scroll' }}
      </button>
      <span v-if="stale" class="flex items-center space-x-1.5 text-xs text-amber-400">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Showing last valid preview</span>
      </span>
      </div>
    </div>
    <div ref="scrollContainer" class="flex-1 min-h-0 overflow-y-auto" @load.capture="syncScroll">
      <div
        v-if="displayedHtml"
        v-html="displayedHtml"
        class="prose prose-invert prose-sm max-w-none p-4"
      ></div>
      <div v-else class="p-6 text-gray-500 italic text-sm">Nothing to preview yet.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { marked } from 'marked'
import mermaid from 'mermaid'
import { configureMarkedForMermaid } from '@/lib/markdownMermaid'

configureMarkedForMermaid()

const props = defineProps<{
  content: string
  editorScrollPosition?: { line: number; lineProgress: number }
}>()

const displayedHtml = ref('')
const stale = ref(false)
const scrollContainer = ref<HTMLElement>()
const lockedScroll = ref(localStorage.getItem('studio-preview-scroll-lock') !== 'false')

// Guards against out-of-order async renders: mermaid.render() is async, so a
// fast run of keystrokes can resolve out of order. Only the most recently
// started render is allowed to update the DOM.
let renderToken = 0

async function tryRender(source: string) {
  const myToken = ++renderToken

  if (!source.trim()) {
    displayedHtml.value = ''
    stale.value = false
    return
  }

  let html: string
  try {
    const tokens = marked.lexer(source)
    let sourceOffset = 0
    const rendered: string[] = []
    for (const token of tokens) {
      if (!token.raw || token.type === 'space') continue
      // Draw.io fences store the editable diagram source alongside the
      // rendered image. They are editor metadata, not visible page content.
      if (token.type === 'code' && token.lang?.trim().toLowerCase() === 'drawio') continue
      const tokenOffset = source.indexOf(token.raw, sourceOffset)
      const line = source.slice(0, Math.max(0, tokenOffset)).split('\n').length
      sourceOffset = Math.max(sourceOffset, tokenOffset + token.raw.length)
      const tokenBatch = [token] as typeof tokens
      tokenBatch.links = tokens.links
      const tokenHtml = marked.parser(tokenBatch)
      rendered.push(`<div data-source-line="${line}">${tokenHtml}</div>`)
    }
    html = rendered.join('')
  } catch {
    // Broken markdown mid-edit — pause on the last good render rather than
    // showing an error or a half-rendered page.
    if (myToken === renderToken) stale.value = displayedHtml.value !== ''
    return
  }

  // Render mermaid diagrams into a detached scratch container first, so a
  // broken diagram can't leave the visible preview half-updated.
  const scratch = document.createElement('div')
  scratch.innerHTML = html
  const mermaidEls = Array.from(scratch.querySelectorAll('.mermaid')) as HTMLElement[]

  try {
    for (const el of mermaidEls) {
      const code = el.textContent?.trim() || ''
      if (!code) continue
      const id = `mermaid-preview-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const { svg } = await mermaid.render(id, code)
      el.innerHTML = svg
    }
  } catch {
    if (myToken === renderToken) stale.value = true
    return
  }

  if (myToken !== renderToken) return // superseded by a newer render
  displayedHtml.value = scratch.innerHTML
  stale.value = false
  await nextTick()
  syncScroll()
}

watch(() => props.content, (value) => tryRender(value), { immediate: true })
watch(() => props.editorScrollPosition, () => syncScroll(), { deep: true })

function toggleLockedScroll() {
  lockedScroll.value = !lockedScroll.value
  localStorage.setItem('studio-preview-scroll-lock', String(lockedScroll.value))
  syncScroll()
}

function syncScroll() {
  if (!lockedScroll.value || !scrollContainer.value || !props.editorScrollPosition) return
  const anchors = Array.from(scrollContainer.value.querySelectorAll<HTMLElement>('[data-source-line]'))
  if (!anchors.length) return
  const sourcePosition = props.editorScrollPosition.line + props.editorScrollPosition.lineProgress
  let before = anchors[0]
  let after: HTMLElement | undefined
  for (const anchor of anchors) {
    const line = Number(anchor.dataset.sourceLine)
    if (line <= sourcePosition) before = anchor
    else { after = anchor; break }
  }
  const beforeLine = Number(before.dataset.sourceLine)
  let target = before.offsetTop
  if (after) {
    const afterLine = Number(after.dataset.sourceLine)
    const progress = Math.max(0, Math.min(1, (sourcePosition - beforeLine) / Math.max(1, afterLine - beforeLine)))
    target += (after.offsetTop - before.offsetTop) * progress
  } else {
    const remainingLines = Math.max(1, props.content.split('\n').length - beforeLine + 1)
    const progress = Math.max(0, Math.min(1, (sourcePosition - beforeLine) / remainingLines))
    target += before.offsetHeight * progress
  }
  scrollContainer.value.scrollTop = Math.max(0, target - 16)
}
</script>

<style scoped>
:deep(.prose) {
  color: white !important;
}
:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4) {
  color: white !important;
}
/* Inline `code` only — scoped off so it doesn't also apply inside <pre>
   blocks, which previously left fenced code looking like a flat highlighted
   selection instead of a distinct block. */
:deep(.prose :not(pre) > code) {
  background-color: #374151;
  color: #93c5fd;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  font-weight: 500;
}
/* Tailwind Typography adds literal backtick content around inline code by
   default — drop it now that we have real background/padding styling. */
:deep(.prose :not(pre) > code)::before,
:deep(.prose :not(pre) > code)::after {
  content: '';
}

:deep(.prose pre) {
  background-color: #0d1117;
  border: 1px solid #30363d;
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}
:deep(.prose pre code) {
  background-color: transparent;
  color: #e2e8f0;
  padding: 0;
  border-radius: 0;
  font-size: 0.85em;
  line-height: 1.65;
  font-weight: 400;
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
:deep(.prose a) {
  color: #60a5fa;
}
:deep(.prose table) {
  color: #e5e7eb;
}
:deep(.prose img) {
  border-radius: 0.375rem;
}
</style>
