<template>
  <div class="relative">
    <input
      v-model="query"
      type="search"
      autocomplete="off"
      class="input"
      placeholder="Start typing a street address..."
      @blur="hideResults"
    />
    <div v-if="showResults && (loading || suggestions.length)" class="results" @mousedown.prevent>
      <div v-if="loading" class="px-3 py-2 text-xs text-gray-400">Finding addresses…</div>
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        type="button"
        class="block w-full px-3 py-2 text-left text-sm text-gray-100 hover:bg-gray-600"
        @click="selectSuggestion(suggestion)"
      >
        {{ suggestion.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface AddressSuggestion {
  id: string
  label: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  selected: [value: AddressSuggestion]
}>()

const query = ref(props.modelValue || '')
const suggestions = ref<AddressSuggestion[]>([])
const loading = ref(false)
const showResults = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined

watch(() => props.modelValue, value => {
  if ((value || '') !== query.value) query.value = value || ''
})

watch(query, value => {
  emit('update:modelValue', value)
  clearTimeout(timer)
  controller?.abort()
  if (value.trim().length < 3) {
    suggestions.value = []
    loading.value = false
    return
  }
  timer = setTimeout(() => search(value), 350)
})

async function search(value: string) {
  controller = new AbortController()
  loading.value = true
  showResults.value = true
  try {
    const params = new URLSearchParams({ q: value, limit: '5', lang: 'en' })
    const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: controller.signal })
    if (!response.ok) throw new Error('Address search failed')
    const data = await response.json()
    suggestions.value = (data.features || []).map((feature: any) => {
      const p = feature.properties || {}
      const street = [p.housenumber, p.street || p.name].filter(Boolean).join(' ')
      const city = p.city || p.town || p.village || p.locality || ''
      const label = [street, city, p.state, p.postcode, p.country].filter(Boolean).join(', ')
      return {
        id: `${p.osm_type || ''}-${p.osm_id || label}`,
        label,
        address: street,
        city,
        state: p.state || '',
        postalCode: p.postcode || '',
        country: p.country || '',
      }
    }).filter((item: AddressSuggestion) => item.label)
  } catch (error) {
    if ((error as Error).name !== 'AbortError') suggestions.value = []
  } finally {
    loading.value = false
  }
}

function selectSuggestion(suggestion: AddressSuggestion) {
  query.value = suggestion.address || suggestion.label
  showResults.value = false
  suggestions.value = []
  emit('selected', suggestion)
}

function hideResults() { setTimeout(() => { showResults.value = false }, 150) }
</script>

<style scoped>
.input { @apply w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500; }
.results { @apply absolute z-30 w-full mt-1 overflow-y-auto bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-64; }
</style>
