
<template>
  <div class="flex flex-col flex-1 min-h-0">
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
    <ChatSidebar :messages="messages" :streaming="streaming" @send="(msg) => $emit('send', msg)" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChatSidebar from '@/components/agentic-editor/ChatSidebar.vue'
import type { AgenticChatMessage } from '@/composables/useAgenticChat'
import api from '@/services/api'

defineProps<{
  messages: AgenticChatMessage[]
  streaming: boolean
}>()

defineEmits<{
  (e: 'send', message: string): void
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
