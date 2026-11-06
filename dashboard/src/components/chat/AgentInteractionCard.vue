<template>
  <form class="my-3 space-y-3 rounded-lg border border-purple-500/40 bg-gray-900 p-3 text-sm" @submit.prevent="submit">
    <p class="font-medium text-white">{{ interaction.question }}</p>
    <fieldset :disabled="disabled || !!interaction.answer" class="space-y-2">
      <legend class="sr-only">{{ interaction.multiple ? 'Choose any that apply' : 'Choose one' }}</legend>
      <label v-for="option in interaction.options || []" :key="option" class="flex items-start gap-2 text-gray-200">
        <input v-model="choices" :type="interaction.multiple ? 'checkbox' : 'radio'" :name="interaction.id" :value="option" class="mt-1" />
        {{ option }}
      </label>
      <label class="block text-gray-300">Other / add details
        <textarea v-model="other" rows="2" class="mt-1 w-full rounded border border-gray-600 bg-gray-800 p-2 text-white" />
      </label>
      <label v-if="interaction.kind === 'screenshots'" class="block text-gray-300">Upload screenshots (PNG, JPEG, WebP; up to 5, 10 MB each)
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple class="mt-2 block w-full text-xs" @change="selectFiles" />
      </label>
      <p v-if="error" role="alert" class="text-red-300">{{ error }}</p>
      <div class="flex gap-3">
        <button type="submit" :disabled="!canSubmit" class="rounded bg-purple-600 px-3 py-2 text-white disabled:opacity-40">Send answer</button>
        <button type="button" class="text-gray-300" @click="answer('Skip for now')">Skip for now</button>
      </div>
    </fieldset>
    <p v-if="interaction.answer" class="text-xs text-gray-400">Answered: {{ interaction.answer }}</p>
  </form>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AgentInteraction } from '@/composables/useAgenticChat'
const props = defineProps<{ interaction: AgentInteraction; disabled: boolean }>()
const emit = defineEmits<{ (e: 'answer', text: string, files: File[]): void }>()
const choices = ref<string | string[]>(props.interaction.multiple ? [] : '')
const other = ref('')
const files = ref<File[]>([])
const error = ref('')
const canSubmit = computed(() => !error.value && (choices.value.length || other.value.trim() || files.value.length))
function selectFiles(event: Event) {
  files.value = Array.from((event.target as HTMLInputElement).files || [])
  error.value = files.value.length > 5 || files.value.some(f => f.size > 10 * 1024 * 1024) ? 'Choose up to 5 screenshots, each no larger than 10 MB.' : ''
}
function answer(text: string, attachments: File[] = []) {
  if (props.disabled || props.interaction.answer) return
  props.interaction.answer = text
  emit('answer', `${props.interaction.question}\n${text}`, attachments)
}
function submit() {
  if (!canSubmit.value) return
  const selected = Array.isArray(choices.value) ? choices.value.join(', ') : choices.value
  answer([selected, other.value.trim(), files.value.length ? `Attached: ${files.value.map(f => f.name).join(', ')}` : ''].filter(Boolean).join('\n'), files.value)
}
</script>
