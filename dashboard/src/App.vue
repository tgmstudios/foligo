<template>
  <div id="app" class="relative isolate min-h-screen">
    <AuroraBackground />
    <router-view />
    <CommandPalette :sources="searchSources" />
  </div>
</template>

<script setup lang="ts">
// Auth is initialized by the router guard (beforeEach)
// — no need to duplicate here
import AuroraBackground from '@/components/shared/AuroraBackground.vue'
import CommandPalette from '@/components/shared/CommandPalette.vue'
import { useCommandPaletteShortcut } from '@/composables/useCommandPaletteShortcut'
import { useDashboardSearchSources } from '@/composables/useDashboardSearchSources'

const searchSources = useDashboardSearchSources()
useCommandPaletteShortcut()
</script>
