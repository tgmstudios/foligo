
<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="close"
  >
    <div class="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="close"></div>

      <div class="inline-block align-middle bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md sm:w-full">
        <div class="px-6 pt-6 pb-4 border-b border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">Edit details</h3>
          <button @click="close" class="text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-5 space-y-4">
          <div v-for="field in adapter.metaFields" :key="field.key">
            <label class="block text-xs font-medium text-gray-400 mb-1.5">{{ field.label }}</label>
            <input
              v-if="field.type === 'text'"
              v-model="values[field.key]"
              type="text"
              class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <textarea
              v-else-if="field.type === 'textarea'"
              v-model="values[field.key]"
              rows="3"
              class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
            ></textarea>
            <select
              v-else-if="field.type === 'select' || field.type === 'linked-entity'"
              v-model="values[field.key]"
              class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option :value="null">None</option>
              <option v-for="opt in fieldOptions[field.key] || field.options || []" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
          <button
            @click="close"
            class="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="save"
            :disabled="saving"
            class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import type { EditorStudioAdapter } from '@/studio/types'

const props = defineProps<{
  isOpen: boolean
  adapter: EditorStudioAdapter
  documentId: string
  initialValues: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const toast = useToast()
const values = ref<Record<string, any>>({ ...props.initialValues })
const saving = ref(false)
const fieldOptions = ref<Record<string, Array<{ value: string; label: string }>>>({})

watch(() => props.isOpen, async (open) => {
  if (!open) return
  values.value = { ...props.initialValues }
  if (!props.adapter.getFieldOptions) return
  for (const field of props.adapter.metaFields) {
    if (field.type !== 'select' && field.type !== 'linked-entity') continue
    fieldOptions.value[field.key] = await props.adapter.getFieldOptions(field.key)
  }
}, { immediate: true })

function close() {
  emit('close')
}

async function save() {
  saving.value = true
  try {
    await props.adapter.saveMeta(props.documentId, values.value)
    toast.success('Details updated')
    emit('saved')
    close()
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to save details')
  } finally {
    saving.value = false
  }
}
</script>
