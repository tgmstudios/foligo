import { ref } from 'vue'
import api from '@/services/api'

export interface SavedChatSession {
  id: string
  title: string
  chatHistory: Array<{ role: string; content: string }>
  metadata?: Record<string, any>
  messageCount?: number
  updatedAt: string
}

export type ChatSessionScope =
  | 'studio-content'
  | 'studio-resume'
  | 'studio-cover-letter'
  | 'content-creator'

export function useChatSessions(scope: ChatSessionScope, getContextId: () => string | undefined) {
  const sessions = ref<SavedChatSession[]>([])
  const activeSessionId = ref<string | null>(null)
  const loadingSessions = ref(false)

  async function refresh() {
    loadingSessions.value = true
    try {
      const { data } = await api.get('/ai/chat-sessions', { params: { scope, contextId: getContextId() } })
      sessions.value = data
      return sessions.value
    } finally {
      loadingSessions.value = false
    }
  }

  async function create(metadata?: Record<string, any>) {
    const { data } = await api.post('/ai/chat-sessions', { scope, contextId: getContextId(), metadata })
    activeSessionId.value = data.id
    sessions.value.unshift(data)
    return data as SavedChatSession
  }

  async function open(id: string) {
    const { data } = await api.get(`/ai/chat-sessions/${id}`)
    activeSessionId.value = data.id
    return data as SavedChatSession
  }

  async function save(chatHistory: Array<{ role: string; content: string }>, metadata?: Record<string, any>) {
    if (!activeSessionId.value) await create(metadata)
    const { data } = await api.put(`/ai/chat-sessions/${activeSessionId.value}`, { chatHistory, metadata })
    const index = sessions.value.findIndex((session) => session.id === data.id)
    if (index >= 0) sessions.value.splice(index, 1)
    sessions.value.unshift(data)
    return data as SavedChatSession
  }

  return { sessions, activeSessionId, loadingSessions, refresh, create, open, save }
}
