import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

/**
 * Render Markdown (AI chat responses, generated content, etc.) to HTML for
 * v-html. Falls back to the raw string if parsing throws.
 */
export function renderMarkdown(content: string): string {
  if (!content?.trim()) return ''
  try {
    return marked(content) as string
  } catch {
    return content
  }
}
