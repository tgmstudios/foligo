<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <router-view />
    <CommandPalette :sources="searchSources" />
  </div>
</template>

<script setup lang="ts">
// Auth is initialized by the router guard (beforeEach)
// — no need to duplicate here
import CommandPalette from '@/components/shared/CommandPalette.vue'
import { useCommandPaletteShortcut } from '@/composables/useCommandPaletteShortcut'
import { useDashboardSearchSources } from '@/composables/useDashboardSearchSources'

const searchSources = useDashboardSearchSources()
useCommandPaletteShortcut()
</script>
