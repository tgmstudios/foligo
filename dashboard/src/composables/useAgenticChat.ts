import { ref } from 'vue'
import { API_URL } from '@/services/api'

export interface ToolActivity {
  id: string
  toolCallId: string
  toolName: string
  input?: any
  output?: any
  status: 'running' | 'done' | 'error'
  error?: string
}

export interface AgenticChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  toolActivity?: ToolActivity[]
  streaming?: boolean
}

export interface AgenticChatCallbacks {
  onDocumentUpdated?: (content: string) => void
  onCompiled?: (pdfUrl: string) => void
  onCompileError?: (message: string, log?: string) => void
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Drives a streaming SSE conversation against an agentic chat endpoint
 * (POST {chatUrl} -> text/event-stream of { type, ... } JSON events, one per line
 * prefixed "data: "). Generic over the endpoint so it can be reused by any
 * agentic-editor instance, not just the resume editor.
 */
export function useAgenticChat(
  getChatUrl: () => string,
  callbacks: AgenticChatCallbacks = {},
  getProvider: () => string | undefined = () => undefined
) {
  const messages = ref<AgenticChatMessage[]>([])
  const streaming = ref(false)

  function handleEvent(event: any, assistantMsg: AgenticChatMessage) {
    switch (event.type) {
      case 'text-delta':
        assistantMsg.content += event.text
        break
      case 'reasoning-delta':
        assistantMsg.reasoning = (assistantMsg.reasoning || '') + event.text
        break
      case 'tool-call':
        assistantMsg.toolActivity!.push({
          id: uid(),
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          input: event.input,
          status: 'running',
        })
        break
      case 'tool-result': {
        const activity = assistantMsg.toolActivity!.find(t => t.toolCallId === event.toolCallId)
        if (activity) {
          activity.status = 'done'
          activity.output = event.output
        }
        break
      }
      case 'tool-error': {
        const activity = assistantMsg.toolActivity!.find(t => t.toolCallId === event.toolCallId)
        if (activity) {
          activity.status = 'error'
          activity.error = event.error
        }
        break
      }
      case 'document-updated':
        callbacks.onDocumentUpdated?.(event.content)
        break
      case 'compiled':
        callbacks.onCompiled?.(event.pdfUrl)
        break
      case 'compile-error':
        callbacks.onCompileError?.(event.message, event.log)
        break
      case 'error':
        if (!assistantMsg.content) assistantMsg.content = `Sorry, something went wrong: ${event.message}`
        break
      default:
        break
    }
  }

  async function sendMessage(userText: string) {
    if (streaming.value || !userText.trim()) return

    // Captured before this turn's messages are pushed — some backends (e.g.
    // Content, which has no server-side chat storage like ResumeDocument
    // does) rely on the client resending prior turns each request.
    const history = messages.value
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }))

    const userMsg: AgenticChatMessage = { id: uid(), role: 'user', content: userText }
    const assistantMsg: AgenticChatMessage = {
      id: uid(),
      role: 'assistant',
      content: '',
      reasoning: '',
      toolActivity: [],
      streaming: true,
    }
    messages.value.push(userMsg, assistantMsg)
    // Re-read the pushed message back out of the reactive array. `messages` is
    // a ref<Array>, so Vue wraps its contents in a reactive proxy lazily on
    // access — mutating the plain `assistantMsg` object we created above
    // wouldn't go through that proxy at all, so none of the incremental
    // text-delta/reasoning-delta writes below would ever trigger a re-render
    // (the whole response would only appear once `streaming` flips at the end).
    const reactiveMsg = messages.value[messages.value.length - 1]
    streaming.value = true

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(getChatUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userText, provider: getProvider(), history }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Request failed (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() || ''

        for (const chunk of chunks) {
          const line = chunk.split('\n').find(l => l.startsWith('data: '))
          if (!line) continue
          try {
            const payload = JSON.parse(line.slice('data: '.length))
            handleEvent(payload, reactiveMsg)
          } catch {
            // Ignore malformed SSE frames rather than aborting the whole stream
          }
        }
      }
    } catch (error: any) {
      if (!reactiveMsg.content) {
        reactiveMsg.content = `Sorry, something went wrong: ${error.message || 'connection lost'}`
      }
    } finally {
      reactiveMsg.streaming = false
      streaming.value = false
    }
  }

  function reset() {
    messages.value = []
  }

  function loadHistory(history: Array<{ role: string; content: string }>) {
    messages.value = history.map(m => ({
      id: uid(),
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  }

  return { messages, streaming, sendMessage, reset, loadHistory }
}

export { API_URL }
