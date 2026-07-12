
<template>
  <TransitionRoot :show="store.isOpen" as="template" @after-leave="query = ''">
    <Dialog as="div" class="relative z-[100]" @close="store.close()">
      <TransitionChild
        as="template"
        enter="ease-out duration-150" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in duration-100" leave-from="opacity-100" leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-75" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
        <TransitionChild
          as="template"
          enter="ease-out duration-150" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
          leave="ease-in duration-100" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95"
        >
          <DialogPanel class="mx-auto max-w-xl transform rounded-lg bg-gray-800 border border-gray-700 shadow-2xl overflow-hidden">
            <div class="flex items-center px-4 border-b border-gray-700">
              <svg class="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref="inputEl"
                v-model="query"
                type="text"
                :placeholder="mode === 'mention' ? 'Reference other content…' : 'Search projects and posts…'"
                class="w-full bg-transparent border-0 py-3.5 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-0 text-sm"
                @keydown.down.prevent="move(1)"
                @keydown.up.prevent="move(-1)"
                @keydown.enter.prevent="selectHighlighted()"
              />
              <kbd class="hidden sm:inline-block text-[10px] text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">Esc</kbd>
            </div>

            <div class="max-h-96 overflow-y-auto py-2">
              <div v-if="query.length < 2" class="px-4 py-8 text-center text-sm text-gray-500">
                Type at least 2 characters to search.
              </div>
              <div v-else-if="isSearching" class="px-4 py-8 text-center text-sm text-gray-500">Searching…</div>
              <div v-else-if="results.length === 0" class="px-4 py-8 text-center text-sm text-gray-500">No results.</div>
              <button
                v-for="(result, i) in results"
                :key="`${result.sourceId}-${result.id}`"
                @click="select(result)"
                @mouseenter="highlighted = i"
                class="w-full text-left px-4 py-2.5 flex items-start space-x-3 transition-colors"
                :class="highlighted === i ? 'bg-gray-700' : 'hover:bg-gray-750'"
              >
                <div class="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-white truncate">{{ result.title }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ result.subtitle }}</p>
                </div>
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useRouter } from 'vue-router'
import { useCommandPaletteStore } from '@/stores/commandPalette'
import { useDebounceFn } from '@vueuse/core'

export interface CommandPaletteResult {
  id: string
  type: string
  title: string
  subtitle: string
  route?: string
}

export interface CommandPaletteSource {
  id: string
  label: string
  search: (query: string) => Promise<CommandPaletteResult[]>
}

const props = withDefaults(defineProps<{
  sources: CommandPaletteSource[]
  mode?: 'palette' | 'mention'
}>(), {
  mode: 'palette',
})

const emit = defineEmits<{
  (e: 'insert', ref: { id: string; type: string; label: string }): void
}>()

const store = useCommandPaletteStore()
const router = useRouter()

const query = ref('')
const isSearching = ref(false)
const results = ref<Array<CommandPaletteResult & { sourceId: string }>>([])
const highlighted = ref(0)
const inputEl = ref<HTMLInputElement>()

const runSearch = useDebounceFn(async (q: string) => {
  if (q.length < 2) {
    results.value = []
    return
  }
  isSearching.value = true
  try {
    const perSource = await Promise.all(
      props.sources.map(async (source) => (await source.search(q)).map((r) => ({ ...r, sourceId: source.id })))
    )
    results.value = perSource.flat().slice(0, 20)
    highlighted.value = 0
  } finally {
    isSearching.value = false
  }
}, 200)

watch(query, (q) => runSearch(q))

watch(() => store.isOpen, (open) => {
  if (open) nextTick(() => inputEl.value?.focus())
})

function move(delta: number) {
  if (results.value.length === 0) return
  highlighted.value = (highlighted.value + delta + results.value.length) % results.value.length
}

function selectHighlighted() {
  const result = results.value[highlighted.value]
  if (result) select(result)
}

function select(result: CommandPaletteResult & { sourceId: string }) {
  if (props.mode === 'mention') {
    emit('insert', { id: result.id, type: result.type, label: result.title })
  } else if (result.route) {
    router.push(result.route)
  }
  store.close()
}
</script>
