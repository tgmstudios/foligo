<template>
  <div v-if="siteData" class="min-h-screen bg-slate-900 text-slate-100">
    <!-- Header -->
    <CommonHeader 
      :site-name="siteData?.siteConfig?.siteName || siteData?.project?.name || 'Portfolio'"
      :site-description="siteData?.siteConfig?.siteDescription || ''"
    />

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Title -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-white mb-4">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-xl text-slate-300 max-w-3xl mx-auto">
          {{ subtitle }}
        </p>
      </div>

      <!-- Content List -->
      <slot />

      <!-- Empty State -->
      <div v-if="showEmptyState && !$slots.default" class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
          <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="emptyStateIcon"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">{{ emptyStateTitle }}</h3>
        <p class="text-slate-300 mb-6">{{ emptyStateMessage }}</p>
        <NuxtLink 
          to="/"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </NuxtLink>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-slate-800 border-t border-slate-700 mt-16">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
          <p class="text-slate-400">
            © {{ new Date().getFullYear() }} {{ siteData?.siteConfig?.siteName || siteData?.project?.name }}. 
            Powered by <a href="https://foligo.tech" class="text-blue-400 hover:text-blue-300">Foligo</a>.
          </p>
        </div>
      </div>
    </footer>

  </div>

  <!-- Fallback State (when siteData is null but no error) -->
  <div v-else-if="!pending && !error" class="min-h-screen bg-slate-900 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-white mb-4">{{ fallbackTitle }}</h1>
      <p class="text-slate-300">{{ fallbackMessage }}</p>
      <NuxtLink to="/" class="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Back to Home
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
defineProps({
  siteData: {
    type: Object,
    default: () => null
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  showEmptyState: {
    type: Boolean,
    default: false
  },
  emptyStateTitle: {
    type: String,
    default: ''
  },
  emptyStateMessage: {
    type: String,
    default: ''
  },
  emptyStateIcon: {
    type: String,
    default: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  fallbackTitle: {
    type: String,
    default: 'Content Not Found'
  },
  fallbackMessage: {
    type: String,
    default: 'This content is not available at this time.'
  },
  pending: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  }
})
</script>

