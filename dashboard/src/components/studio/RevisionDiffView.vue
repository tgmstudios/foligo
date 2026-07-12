
<template>
  <div class="font-mono text-xs leading-relaxed whitespace-pre-wrap">
    <div
      v-for="(part, i) in parts"
      :key="i"
      :class="{
        'bg-green-900/40 text-green-300': part.added,
        'bg-red-900/40 text-red-300 line-through': part.removed,
        'text-gray-400': !part.added && !part.removed,
      }"
    >{{ part.value }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { diffLines } from 'diff'

const props = defineProps<{
  before: string
  after: string
}>()

const parts = computed(() => diffLines(props.before, props.after))
</script>
