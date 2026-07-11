<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">GoApply · Job Tracker</h1>
      <p class="text-gray-400 mt-1">Track your job applications from saved to accepted</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-700 mb-6">
      <nav class="-mb-px flex space-x-6">
        <router-link
          v-for="tab in tabs"
          :key="tab.route"
          :to="tab.route"
          class="whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors"
          :class="
            isActive(tab.route)
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
          "
        >
          {{ tab.label }}
        </router-link>
      </nav>
    </div>

    <!-- Child route view -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGoApplyStore } from '@/stores/goapply'

const route = useRoute()
const store = useGoApplyStore()

const tabs = [
  { label: 'Kanban', route: '/goapply/kanban' },
  { label: 'Job List', route: '/goapply/jobs' },
  { label: 'Job Assistant', route: '/goapply/assistant' },
  { label: 'Resume Generator', route: '/goapply/resume' },
  { label: 'Saved Answers', route: '/goapply/saved-answers' },
  { label: 'Cover Letters', route: '/goapply/cover-letters' },
  { label: 'Profile', route: '/goapply/profile' },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}

onMounted(async () => {
  await store.init()
})
</script>
