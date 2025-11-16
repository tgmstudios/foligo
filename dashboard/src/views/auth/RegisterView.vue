<template>
  <div class="min-h-screen flex">
    <!-- Left Side - Register Form -->
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
            Create your account
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start building your portfolio in minutes
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              v-model="form.name"
              name="name"
              type="text"
              autocomplete="name"
              required
              class="appearance-none relative block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email Address
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
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              class="appearance-none relative block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
              placeholder="Create a password"
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 6 characters long
            </p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="appearance-none relative block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
              placeholder="Confirm your password"
            />
          </div>

          <div class="flex items-start">
            <input
              id="terms"
              v-model="form.acceptTerms"
              name="terms"
              type="checkbox"
              required
              class="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label for="terms" class="ml-2 block text-sm text-gray-900 dark:text-white">
              I agree to the
              <a href="#" class="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">Terms of Service</a>
              and
              <a href="#" class="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">Privacy Policy</a>
            </label>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading || !isFormValid"
              class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span v-if="isLoading" class="mr-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ isLoading ? 'Creating account...' : 'Create account' }}
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
            Already have an account?
            <router-link to="/login" class="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
              Sign in
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
            Start Building Your Portfolio Today
          </h3>
          <p class="text-xl text-primary-100 leading-relaxed">
            Join thousands of professionals creating stunning portfolios with AI-powered content generation.
          </p>
        </div>

        <div class="space-y-6 mt-10">
          <!-- Feature 1 -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div>
              <h4 class="text-lg font-semibold mb-1">Instant Content Creation</h4>
              <p class="text-primary-100 text-sm leading-relaxed">
                Describe your project in plain English. Our AI generates professional blog posts, project descriptions, and experience entries instantly.
              </p>
            </div>
          </div>

          <!-- Feature 2 -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div>
              <h4 class="text-lg font-semibold mb-1">Multiple Content Types</h4>
              <p class="text-primary-100 text-sm leading-relaxed">
                Create blogs, showcase projects, and document your work experience. All content types supported with rich markdown editing.
              </p>
            </div>
          </div>

          <!-- Feature 3 -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div>
              <h4 class="text-lg font-semibold mb-1">Rich Media Support</h4>
              <p class="text-primary-100 text-sm leading-relaxed">
                Upload images, create diagrams, and embed interactive content. Your portfolio comes to life with visual storytelling.
              </p>
            </div>
          </div>

          <!-- Feature 4 -->
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div>
              <h4 class="text-lg font-semibold mb-1">Access Anywhere</h4>
              <p class="text-primary-100 text-sm leading-relaxed">
                Manage your portfolio from desktop, tablet, or mobile. Native iOS app available for on-the-go content creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import squiggleLogo from '@/assets/logos/squiggle.svg'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const isLoading = ref(false)
const error = ref('')

const isFormValid = computed(() => {
  return form.name &&
         form.email &&
         form.password &&
         form.password.length >= 6 &&
         form.password === form.confirmPassword &&
         form.acceptTerms
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all fields correctly'
    return
  }

  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await authStore.register({
      name: form.name,
      email: form.email,
      password: form.password
    })

    if (result.success) {
      // Redirect to onboarding after registration
      router.push('/onboarding')
    } else {
      error.value = result.error || 'Registration failed'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>
