<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <p class="text-sm font-semibold text-primary-500">404</p>
      <h1 class="mt-2 text-2xl font-bold text-white">Page not found</h1>
      <p class="mt-2 text-sm text-gray-400">
        We couldn't find <code class="text-gray-300 break-all">{{ route.path }}</code>.
        It may have moved or never existed.
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <router-link to="/" class="btn btn-primary">Go to dashboard</router-link>
        <router-link to="/portfolios" class="btn btn-outline">View portfolios</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>
