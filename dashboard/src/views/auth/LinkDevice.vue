<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
      <!-- Logo -->
      <img src="/logo.svg" alt="Foligo" class="h-10 mx-auto mb-6" />

      <!-- Loading -->
      <div v-if="status === 'linking'" class="space-y-4">
        <div class="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        <h2 class="text-lg font-semibold text-gray-900">Linking Device</h2>
        <p class="text-sm text-gray-500">Connecting your GoApply extension...</p>
        <code class="block text-2xl font-mono tracking-widest text-indigo-600 bg-indigo-50 rounded-lg px-4 py-2">{{ code }}</code>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="space-y-4">
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-900">Connected!</h2>
        <p class="text-sm text-gray-500">Your GoApply extension is now linked to your Foligo account. You can close this tab.</p>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'error'" class="space-y-4">
        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-900">Connection Failed</h2>
        <p class="text-sm text-gray-500">{{ errorMessage }}</p>
        <button @click="retry" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          Try Again
        </button>
      </div>

      <!-- No code -->
      <div v-else class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">No Device Code</h2>
        <p class="text-sm text-gray-500">Please open this page from your GoApply extension.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const status = ref<'loading' | 'linking' | 'success' | 'error'>('loading')
const code = ref('')
const errorMessage = ref('')

async function linkDevice() {
  const codeParam = route.query.code as string
  if (!codeParam || codeParam.length !== 6) {
    status.value = 'error'
    errorMessage.value = 'Invalid device code. Please try again from your extension.'
    return
  }

  code.value = codeParam.toUpperCase()
  status.value = 'linking'

  try {
    const { data } = await api.post('/auth/device-code/external', {
      deviceCode: code.value
    })
    if (data.success) {
      status.value = 'success'
    }
  } catch (err: any) {
    status.value = 'error'
    if (err.response?.status === 401) {
      errorMessage.value = 'You are not logged in. Please log in to Foligo first, then try again.'
    } else {
      errorMessage.value = err.response?.data?.message || 'Something went wrong. Please try again.'
    }
  }
}

function retry() {
  status.value = 'loading'
  linkDevice()
}

onMounted(() => {
  linkDevice()
})
</script>
