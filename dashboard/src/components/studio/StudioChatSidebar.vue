
<template>
  <div class="flex flex-col flex-1 min-h-0">
    <div v-if="sessions" class="px-3 py-2 border-b border-gray-800 flex-shrink-0">
      <ChatSessionPicker
        :sessions="sessions"
        :active-session-id="activeSessionId || null"
        :loading="sessionsLoading"
        :disabled="streaming"
        @select="$emit('select-session', $event)"
        @new="$emit('new-session')"
      />
    </div>
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-800 flex-shrink-0">
      <span class="text-xs text-gray-400">Assistant</span>
      <select
        v-model="selected"
        class="text-xs bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option :value="undefined">Default</option>
        <option v-for="p in configuredProviders" :key="p.type" :value="p.type">{{ p.displayName }}</option>
      </select>
    </div>
    <ChatSidebar
      :messages="messages"
      :streaming="streaming"
      :queue="queue"
      :placeholder="placeholder"
      :empty-state-text="emptyStateText"
      :allow-attachments="allowAttachments"
      @send="(msg, files) => $emit('send', msg, files)"
      @stop="$emit('stop')"
      @interrupt-send="(id) => $emit('interrupt-send', id)"
      @remove-queued="(id) => $emit('remove-queued', id)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChatSidebar from '@/components/agentic-editor/ChatSidebar.vue'
import type { AgenticChatMessage, QueuedChatMessage } from '@/composables/useAgenticChat'
import api from '@/services/api'
import ChatSessionPicker from '@/components/chat/ChatSessionPicker.vue'
import type { SavedChatSession } from '@/composables/useChatSessions'

defineProps<{
  messages: AgenticChatMessage[]
  streaming: boolean
  queue?: QueuedChatMessage[]
  placeholder?: string
  emptyStateText?: string
  allowAttachments?: boolean
  sessions?: SavedChatSession[]
  activeSessionId?: string | null
  sessionsLoading?: boolean
}>()

defineEmits<{
  (e: 'send', message: string, files: File[]): void
  (e: 'stop'): void
  (e: 'interrupt-send', id: string): void
  (e: 'remove-queued', id: string): void
  (e: 'select-session', id: string): void
  (e: 'new-session'): void
}>()

interface AiProvider {
  type: string
  displayName: string
  configured: boolean
}

const selected = defineModel<string | undefined>()
const configuredProviders = ref<AiProvider[]>([])

onMounted(async () => {
  try {
    const response = await api.get('/ai/providers')
    configuredProviders.value = response.data.providers.filter((p: AiProvider) => p.configured)
  } catch {
    // Provider list is a nicety, not required for chat to function — fail silently.
  }
})
</script>
