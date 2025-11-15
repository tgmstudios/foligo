<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <div v-if="loading" class="space-y-4">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p class="text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
      <div v-else-if="error" class="space-y-4">
        <div class="text-red-600 dark:text-red-400">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        <router-link
          to="/login"
          class="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const token = route.query.token as string
    const redirect = (route.query.redirect as string) || '/'

    if (!token) {
      error.value = 'No authentication token received'
      loading.value = false
      return
    }

    // Store token
    localStorage.setItem('auth_token', token)
    authStore.token = token

    // Fetch user profile
    await authStore.fetchUserProfile()

    // Redirect to intended page or dashboard
    router.push(redirect)
  } catch (err: any) {
    console.error('Auth callback error:', err)
    error.value = err.message || 'Authentication failed'
    loading.value = false
  }
})
</script>

