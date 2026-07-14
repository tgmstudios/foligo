<template>
  <div
    class="absolute left-12 top-0 z-50 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden"
    @click.stop
  >
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-white">HackerRank Score</h3>
        <p v-if="documentName" class="text-xs text-gray-400 mt-0.5">{{ documentName }}</p>
      </div>
      <button
        @click="$emit('close')"
        class="text-gray-400 hover:text-white transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-6 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mb-3"></div>
      <p class="text-gray-400 text-sm">Evaluating resume...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-6 text-center">
      <p class="text-red-400 text-sm">{{ error }}</p>
    </div>

    <!-- Results -->
    <div v-else-if="result" class="overflow-y-auto max-h-[70vh]">
      <!-- Overall Score -->
      <div class="px-6 py-5 text-center border-b border-gray-700">
        <div class="text-4xl font-bold mb-1"
          :class="result.total >= 85 ? 'text-green-400' : result.total >= 60 ? 'text-yellow-400' : 'text-red-400'"
        >
          {{ result.total.toFixed(1) }}
        </div>
        <div class="text-xs text-gray-400">/ 120 max</div>
        <div class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          :class="result.total >= 85 ? 'bg-green-900/50 text-green-300' : result.total >= 60 ? 'bg-yellow-900/50 text-yellow-300' : 'bg-red-900/50 text-red-300'"
        >
          {{ result.total >= 85 ? 'Strong candidate' : result.total >= 60 ? 'Average' : 'Needs work' }}
        </div>
      </div>

      <!-- Category Scores -->
      <div class="px-4 py-3 space-y-3">
        <div v-for="cat in categories" :key="cat.key">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-gray-300">{{ cat.label }}</span>
            <span class="text-gray-400">{{ Math.min(cat.data.score, cat.data.max) }}/{{ cat.data.max }}</span>
          </div>
          <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="cat.color"
              :style="{ width: Math.min((cat.data.score / cat.data.max) * 100, 100) + '%' }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{{ cat.data.evidence }}</p>
        </div>
      </div>

      <!-- Bonus & Deductions -->
      <div class="px-4 py-3 border-t border-gray-700 space-y-2">
        <div v-if="result.bonus_points?.total > 0" class="flex justify-between text-xs">
          <span class="text-green-400">Bonus</span>
          <span class="text-green-400">+{{ result.bonus_points.total }}</span>
        </div>
        <p v-if="result.bonus_points?.breakdown" class="text-xs text-gray-500">{{ result.bonus_points.breakdown }}</p>
        <div v-if="result.deductions?.total > 0" class="flex justify-between text-xs">
          <span class="text-red-400">Deductions</span>
          <span class="text-red-400">-{{ result.deductions.total }}</span>
        </div>
        <p v-if="result.deductions?.reasons" class="text-xs text-gray-500">{{ result.deductions.reasons }}</p>
      </div>

      <!-- Key Strengths -->
      <div v-if="result.key_strengths?.length" class="px-4 py-3 border-t border-gray-700">
        <h4 class="text-xs font-semibold text-green-400 mb-2">Key Strengths</h4>
        <ul class="space-y-1">
          <li v-for="(s, i) in result.key_strengths" :key="i" class="text-xs text-gray-300 flex gap-1.5">
            <span class="text-green-500 flex-shrink-0 mt-0.5">+</span>
            {{ s }}
          </li>
        </ul>
      </div>

      <!-- Areas for Improvement -->
      <div v-if="result.areas_for_improvement?.length" class="px-4 py-3 border-t border-gray-700">
        <h4 class="text-xs font-semibold text-yellow-400 mb-2">Areas for Improvement</h4>
        <ul class="space-y-1">
          <li v-for="(a, i) in result.areas_for_improvement" :key="i" class="text-xs text-gray-300 flex gap-1.5">
            <span class="text-yellow-500 flex-shrink-0 mt-0.5">!</span>
            {{ a }}
          </li>
        </ul>
      </div>

      <!-- Footer -->
      <div class="px-4 py-2 border-t border-gray-700 flex justify-between items-center">
        <span class="text-xs text-gray-500">Powered by HackerRank rubric</span>
        <button
          @click="run"
          class="text-xs text-primary-400 hover:text-primary-300 transition-colors"
        >
          Re-score
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { aiApi } from '@/services/api'

const props = defineProps<{ documentId: string }>()
defineEmits<{ (e: 'close'): void }>()

interface ScoreResult {
  total: number
  baseScore: number
  scores: Record<string, { score: number; max: number; evidence: string }>
  bonus_points: { total: number; breakdown: string }
  deductions: { total: number; reasons: string }
  key_strengths: string[]
  areas_for_improvement: string[]
  documentName: string
}

const loading = ref(false)
const error = ref('')
const result = ref<ScoreResult | null>(null)
const documentName = ref('')

const categories = computed(() => {
  if (!result.value?.scores) return []
  const catDefs = [
    { key: 'open_source', label: 'Open Source', color: 'bg-blue-500' },
    { key: 'self_projects', label: 'Self Projects', color: 'bg-purple-500' },
    { key: 'production', label: 'Production Exp', color: 'bg-green-500' },
    { key: 'technical_skills', label: 'Technical Skills', color: 'bg-amber-500' },
  ]
  return catDefs.map(c => ({
    ...c,
    data: result.value!.scores[c.key] || { score: 0, max: c.key === 'technical_skills' ? 10 : c.key === 'production' ? 25 : c.key === 'self_projects' ? 30 : 35, evidence: 'Not evaluated' },
  }))
})

async function run() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const { data } = await aiApi.post(`/resume/documents/${props.documentId}/score`)
    result.value = data
    documentName.value = data.documentName || ''
  } catch (e: any) {
    error.value = e.response?.data?.error || e.message || 'Scoring failed'
  } finally {
    loading.value = false
  }
}

onMounted(run)
</script>
