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
    
    // Process mermaid code blocks before rendering
    // Convert ```mermaid blocks to <div class="mermaid"> blocks
    let processedMarkdown = markdown.replace(
      /```mermaid\n([\s\S]*?)```/g,
      (match, code) => {
        // Clean up the code block
        const cleanedCode = code.trim()
        return `<div class="mermaid">${cleanedCode}</div>`
      }
    )
    
    // Render the markdown
    let html = marked(processedMarkdown)
    
    // Fallback: Post-process HTML to convert any remaining mermaid code blocks to divs
    // This handles edge cases where the regex might not catch all variations
    const mermaidCodeBlockRegex = /<pre><code(?:\s+class="[^"]*language-mermaid[^"]*")[^>]*>([\s\S]*?)<\/code><\/pre>/gi
    html = html.replace(mermaidCodeBlockRegex, (_match, code) => {
      // Decode HTML entities in the code
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
      return `<div class="mermaid">${decodedCode}</div>`
    })
    
    return html
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return markdown
  }
}
