import { marked } from 'marked'

// Use the same markdown renderer as the previews
export function renderMarkdown(markdown) {
  if (!markdown) return ''
  
  try {
    // Configure marked options to match the preview renderer
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    })
    
    return marked(markdown)
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return markdown
  }
}
