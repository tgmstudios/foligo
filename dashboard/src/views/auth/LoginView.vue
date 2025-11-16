<template>
  <div class="min-h-screen flex">
    <!-- Left Side - Login Form -->
    <div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <div class="mb-8">
          <div class="flex items-center space-x-3 mb-6">
            <div class="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <img :src="squiggleLogo" alt="Foligo" class="h-8 w-8 p-1.5" />
            </div>
            <span class="text-2xl font-bold text-gray-900 dark:text-white">Foligo</span>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        <!-- SSO Providers -->
        <div v-if="ssoProviders.length > 0" class="mb-6 space-y-3">
          <div
            v-for="provider in ssoProviders"
            :key="provider.id"
          >
            <button
              @click="handleSsoLogin(provider)"
              type="button"
              class="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              :style="provider.buttonColor ? { borderColor: provider.buttonColor, color: provider.buttonColor } : {}"
            >
              <span v-if="provider.icon" class="mr-2 text-lg">{{ provider.icon }}</span>
              {{ provider.buttonText || `Sign in with ${provider.name}` }}
            </button>
          </div>
          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with email</span>
            </div>
          </div>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none relative block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <a href="#" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none relative block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
              placeholder="Enter your password"
            />
          </div>

          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="form.rememberMe"
              name="remember-me"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-white">
              Remember me for 30 days
            </label>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span v-if="isLoading" class="mr-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ isLoading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>

          <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800 dark:text-red-200">
                  {{ error }}
                </p>
              </div>
            </div>
          </div>

          <p class="text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <router-link to="/register" class="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
              Sign up
            </router-link>
          </p>
        </form>
      </div>
    </div>

    <!-- Right Side - Feature Showcase -->
    <div class="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 xl:px-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>
      
      <div class="relative z-10 max-w-lg mx-auto text-white">
        <div class="mb-8">
          <h3 class="text-4xl font-bold mb-4">
            Your AI-Powered Portfolio Platform
          </h3>
          <p class="text-xl text-primary-100 leading-relaxed">
            Create stunning portfolio content in minutes, not hours. Powered by AI to help you showcase your best work.
          </p>
        </div>

        <div class="space-y-6 mt-10">
          <!-- Feature 1 -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <h4 class="text-lg font-semibold mb-1">AI-Powered Content Generation</h4>
              <p class="text-primary-100 text-sm leading-relaxed">
                Transform your ideas into polished portfolio content using natural language. Just describe what you want, and our AI does the rest.
              </p>
            </div>
          </div>

          <!-- Feature 2 -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
            <div>
              <h4 class="text-lg font-semibold mb-1">Voice-to-Content Creation</h4>
              <p class="text-primary-100 text-sm leading-relaxed">
                Speak naturally about your projects and experiences. Our voice assistant converts your conversations into professional content.
              </p>
            </div>
          </div>

          <!-- Feature 3 -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div>
              <h4 class="text-lg font-semibold mb-1">Multi-Project Management</h4>
              <p class="text-primary-100 text-sm leading-relaxed">
                Organize blogs, projects, and experiences all in one place. Manage multiple portfolios with an intuitive dashboard.
              </p>
            </div>
          </div>

          <!-- Feature 4 -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
            </div>
            <div>
              <h4 class="text-lg font-semibold mb-1">Custom Subdomains & Publishing</h4>
              <p class="text-primary-100 text-sm leading-relaxed">
                Publish your portfolio with a custom subdomain. Go from idea to live site in minutes with automatic deployment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import squiggleLogo from '@/assets/logos/squiggle.svg'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const isLoading = ref(false)
const error = ref('')
const ssoProviders = ref<any[]>([])

const fetchSsoProviders = async () => {
  try {
    const response = await api.get('/auth/sso/providers')
    ssoProviders.value = response.data
  } catch (error) {
    console.error('Failed to fetch SSO providers:', error)
  }
}

const handleSsoLogin = (provider: any) => {
  const redirectUrl = route.query.redirect as string || '/'
  window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/sso/login/${provider.providerId}?redirect=${encodeURIComponent(redirectUrl)}`
}

const handleSubmit = async () => {
  if (!form.email || !form.password) {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await authStore.login({
      email: form.email,
      password: form.password
    })

    if (result.success) {
      // Always redirect to dashboard (onboarding disabled)
      router.push('/')
    } else {
      error.value = result.error || 'Login failed'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

// Check for error in query params
onMounted(() => {
  fetchSsoProviders()
  
  if (route.query.error) {
    error.value = route.query.error as string
  }
})
</script>
