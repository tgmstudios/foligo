import { marked } from 'marked'

// Configure marked options first
marked.setOptions({
  breaks: true,
  gfm: true
})

// Configure marked renderer using the extensions API (same as MarkdownEditor.vue)
marked.use({
  extensions: [{
    name: 'mermaid',
    level: 'block',
    start(src) {
      return src.match(/^```mermaid/)?.index
    },
    tokenizer(src) {
      const match = src.match(/^```mermaid\n([\s\S]*?)\n```/)
      if (match) {
        return {
          type: 'mermaid',
          raw: match[0],
          text: match[1].trim()
        }
      }
      return undefined
    },
    renderer(token) {
      return `<div class="mermaid">${token.text}</div>\n`
    }
  }]
})

// Use the same markdown renderer as the dashboard MarkdownEditor
export function renderMarkdown(markdown) {
  if (!markdown) return ''
  
  try {
    // Use marked() to convert markdown to HTML
    // The mermaid extension will handle ```mermaid blocks
    let html = marked(markdown)
    
    // Ensure we got a string
    if (typeof html !== 'string') {
      console.error('marked returned non-string:', typeof html)
      return `<pre>Error: marked returned ${typeof html}</pre>`
    }
    
    // Fallback: Post-process HTML to convert any remaining mermaid code blocks to divs
    // This handles edge cases where the extension might not catch all variations
    const mermaidCodeBlockRegex = /<pre><code(?:\s+class="[^"]*language-mermaid[^"]*")[^>]*>([\s\S]*?)<\/code><\/pre>/gi
    html = html.replace(mermaidCodeBlockRegex, (_match, code) => {
      // Decode HTML entities in the code
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
      return `<div class="mermaid">${decodedCode}</div>`
    })
    
    return html
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return `<pre>Error rendering markdown: ${error instanceof Error ? error.message : String(error)}</pre>`
  }
}
