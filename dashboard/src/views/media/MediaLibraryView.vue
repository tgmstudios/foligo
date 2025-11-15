<template>
  <div class="p-6">
    <MediaManager :project-id="projectId" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MediaManager from '@/components/media/MediaManager.vue'

const route = useRoute()

const projectId = computed(() => route.params.projectId as string | undefined)
</script>

