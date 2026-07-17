<template>
  <div class="flex items-center gap-2 min-w-0">
    <select
      :value="activeSessionId || ''"
      :disabled="disabled || loading"
      class="min-w-0 flex-1 text-xs bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
      aria-label="Saved chats"
      @change="$emit('select', ($event.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>{{ sessions.length ? 'Select a chat' : 'No saved chats' }}</option>
      <option v-for="session in sessions" :key="session.id" :value="session.id">
        {{ session.title }}{{ session.messageCount ? ` (${session.messageCount})` : '' }}
      </option>
    </select>
    <button
      type="button"
      :disabled="disabled"
      class="shrink-0 px-2.5 py-1.5 text-xs rounded-md bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white"
      @click="$emit('new')"
    >
      + New chat
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SavedChatSession } from '@/composables/useChatSessions'

defineProps<{ sessions: SavedChatSession[]; activeSessionId: string | null; loading?: boolean; disabled?: boolean }>()
defineEmits<{ (e: 'select', id: string): void; (e: 'new'): void }>()
</script>
