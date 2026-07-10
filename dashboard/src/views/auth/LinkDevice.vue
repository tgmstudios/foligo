<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 font-sans">
    <div class="card p-10 max-w-md w-full text-center">
      <div class="text-2xl font-extrabold text-white mb-6 tracking-tight">Foligo</div>

      <!-- No code -->
      <div v-if="!code" class="flex flex-col items-center gap-3">
        <h2 class="text-lg font-bold text-white m-0">No Device Code</h2>
        <p class="text-sm text-gray-400 m-0 leading-relaxed">Open this page from your GoApply extension to link your device.</p>
      </div>

      <!-- Not logged in -->
      <div v-else-if="!isLoggedIn" class="flex flex-col items-center gap-3">
        <h2 class="text-lg font-bold text-white m-0">Sign In Required</h2>
        <p class="text-sm text-gray-400 m-0 leading-relaxed">You need to be signed into Foligo to link a device.</p>
        <a :href="loginUrl" class="inline-flex items-center justify-center px-4 py-2 mt-2 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5851DB] rounded-lg no-underline transition-colors">Sign In to Foligo</a>
      </div>

      <!-- Linking -->
      <div v-else-if="status === 'linking'" class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-3 border-gray-600 border-t-[#635BFF] rounded-full animate-spin" />
        <h2 class="text-lg font-bold text-white m-0">Linking Device</h2>
        <p class="text-sm text-gray-400 m-0 leading-relaxed">Connecting your GoApply extension to Foligo...</p>
        <code class="text-2xl font-extrabold tracking-[6px] text-[#635BFF] bg-gray-700 rounded-lg px-4 py-2 font-mono">{{ code }}</code>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-white m-0">Connected!</h2>
        <p class="text-sm text-gray-400 m-0 leading-relaxed">Your GoApply extension is now linked to your Foligo account. You can close this tab.</p>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'error'" class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center">
          <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-white m-0">Connection Failed</h2>
        <p class="text-sm text-gray-400 m-0 leading-relaxed">{{ errorMessage }}</p>
        <button @click="retry" class="inline-flex items-center justify-center px-4 py-2 mt-2 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5851DB] rounded-lg border-0 cursor-pointer transition-colors">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const authStore = useAuthStore()
const status = ref<'loading' | 'linking' | 'success' | 'error'>('loading')
const code = ref('')
const errorMessage = ref('')

const isLoggedIn = computed(() => authStore.isAuthenticated)
const loginUrl = computed(() => `/login?redirect=${encodeURIComponent(route.fullPath)}`)

async function submitDeviceCode() {
  status.value = 'linking'

  try {
    await api.post('/auth/device-code/external', {
      deviceCode: code.value
    })

    status.value = 'success'
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || 'Unknown error'
    status.value = 'error'

    if (e?.response?.status === 401) {
      errorMessage.value = 'You are not logged in. Please sign in to Foligo first, then try again.'
    } else {
      errorMessage.value = `Failed to link device: ${msg}`
    }
  }
}

function init() {
  const codeParam = route.query.code as string
  if (!codeParam || codeParam.length < 4) {
    status.value = 'error'
    errorMessage.value = 'No device code found. Please try again from your extension.'
    return
  }
  code.value = codeParam.toUpperCase()

  // Check auth and submit
  if (isLoggedIn.value) {
    submitDeviceCode()
  } else {
    // Wait for auth store to initialize (it loads async)
    const unwatch = setInterval(() => {
      if (authStore.isAuthenticated) {
        clearInterval(unwatch)
        submitDeviceCode()
      }
    }, 500)
    // Stop watching after 10s
    setTimeout(() => clearInterval(unwatch), 10000)
  }

  // Also listen for content script fallback
  window.addEventListener('message', handleContentScriptMessage)
}

function handleContentScriptMessage(event: MessageEvent) {
  if (event.data?.type === 'foligo-device-link') {
    if (event.data.success) {
      status.value = 'success'
    } else {
      status.value = 'error'
      errorMessage.value = event.data.error || 'Failed to link device.'
    }
  }
}

function retry() {
  submitDeviceCode()
}

onMounted(() => init())
onUnmounted(() => window.removeEventListener('message', handleContentScriptMessage))
</script>

<style scoped>
/* Spinner border-width override — Tailwind's border-3 isn't standard, so use custom */
.border-3 {
  border-width: 3px;
}
</style>
