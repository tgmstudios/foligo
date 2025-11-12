// Simple markdown renderer for content
export function renderMarkdown(markdown) {
  if (!markdown) return ''
  
  return markdown
    // Headers - with white color for dark mode
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-3 mt-6 text-white">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-4 mt-8 text-white">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6 mt-8 text-white">$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.*)\*/gim, '<em class="italic text-slate-300">$1</em>')
    
    // Links - blue for dark mode
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Code blocks - dark background for dark mode
    .replace(/```([^`]+)```/gim, '<pre class="bg-slate-800 p-4 rounded-lg overflow-x-auto my-4 border border-slate-700"><code class="text-slate-100">$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code class="bg-slate-800 px-2 py-1 rounded text-sm text-blue-300">$1</code>')
    
    // Lists
    .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1 text-slate-200">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1 text-slate-200">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 mb-1 text-slate-200">$2</li>')
    
    // Blockquotes - with slate colors for dark mode
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-slate-600 pl-4 italic my-4 text-slate-300">$1</blockquote>')
    
    // Line breaks and paragraphs
    .replace(/\n\n/gim, '</p><p class="mb-4 text-slate-200">')
    .replace(/\n/gim, '<br>')
    .replace(/^(.*)$/gim, '<p class="mb-4 text-slate-200">$1</p>')
    
    // Clean up empty paragraphs
    .replace(/<p class="mb-4"><\/p>/gim, '')
    .replace(/<p class="mb-4"><br><\/p>/gim, '')
}
