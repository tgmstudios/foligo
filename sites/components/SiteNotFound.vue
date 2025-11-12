<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="max-w-md w-full text-center">
      <!-- Error Icon -->
      <div class="mb-8">
        <div class="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
      </div>

      <!-- Error Message -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Site Not Found</h1>
        <p class="text-lg text-gray-600 mb-2">
          The site you're looking for doesn't exist or isn't published yet.
        </p>
        <p class="text-sm text-gray-500 mb-4">
          {{ errorMessage }}
        </p>
        
        <!-- Instructions for creating a site -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h3 class="font-semibold text-blue-900 mb-2">Want to create this site?</h3>
          <ol class="text-sm text-blue-800 space-y-1">
            <li>1. Visit <a href="https://foligo.tech" class="underline">foligo.tech</a></li>
            <li>2. Sign up or log in to your account</li>
            <li>3. Create a new project with subdomain "{{ subdomain }}"</li>
            <li>4. Add content and publish your site</li>
          </ol>
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-4">
        <a 
          href="https://foligo.tech"
          class="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
        >
          Create This Site
        </a>
        
        <button 
          @click="goBack"
          class="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Go Back
        </button>
        
        <div class="text-center">
          <a 
            href="https://foligo.tech" 
            class="text-blue-600 hover:text-blue-800 text-sm"
          >
            Visit Foligo
          </a>
        </div>
      </div>

      <!-- Debug Info (only in development) -->
      <div v-if="isDev" class="mt-8 p-4 bg-gray-100 rounded-lg text-left">
        <h3 class="font-semibold mb-2">Debug Information:</h3>
        <p class="text-sm"><strong>Hostname:</strong> {{ hostname }}</p>
        <p class="text-sm"><strong>Subdomain:</strong> {{ subdomain }}</p>
        <p class="text-sm"><strong>Error:</strong> {{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'

const props = defineProps({
  error: {
    type: Object,
    default: () => ({})
  }
})

const isDev = process.dev || process.env.NODE_ENV === 'development'

const hostname = ref('')
const subdomain = ref('')

const errorMessage = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'This site could not be found.'
  }
  if (props.error?.message) {
    return props.error.message
  }
  return 'An unexpected error occurred.'
})

const goBack = () => {
  if (process.client) {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = 'https://foligo.tech'
    }
  }
}

onMounted(() => {
  if (process.client) {
    hostname.value = window.location.hostname
    const parts = hostname.value.split('.')
    if (parts.length >= 3) {
      subdomain.value = parts[0]
    }
  }
})
</script>
