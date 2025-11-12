import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
  hasCompletedOnboarding?: boolean
  isAdmin?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export const useAuthStore = defineStore('auth', () => {
  const toast = useToast()
  
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userInitials = computed(() => {
    if (!user.value) return ''
    return user.value.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  })

  // Actions
  async function login(credentials: LoginCredentials) {
    try {
      isLoading.value = true
      const response = await api.post('/auth/login', credentials)
      
      const { user: userData, token: authToken } = response.data
      
      // Store token and user data
      token.value = authToken
      user.value = userData
      localStorage.setItem('auth_token', authToken)
      
      // Set default axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
      
      toast.success(`Welcome back, ${userData.name}!`)
      return { success: true }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterData) {
    try {
      isLoading.value = true
      const response = await api.post('/auth/register', data)
      
      const { user: userData, token: authToken } = response.data
      
      // Store token and user data
      token.value = authToken
      user.value = userData
      localStorage.setItem('auth_token', authToken)
      
      // Set default axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
      
      toast.success(`Welcome to Foligo, ${userData.name}!`)
      return { success: true }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      // Clear local state
      user.value = null
      token.value = null
      localStorage.removeItem('auth_token')
      
      // Clear axios header
      delete api.defaults.headers.common['Authorization']
      
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  async function fetchUserProfile() {
    try {
      const response = await api.get('/auth/me')
      user.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      throw error
    }
  }

  async function updateProfile(data: Partial<User>) {
    try {
      isLoading.value = true
      const response = await api.put('/users/me', data)
      user.value = response.data
      toast.success('Profile updated successfully')
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function initializeAuth() {
    if (token.value) {
      try {
        // Set axios header
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        
        // Fetch user profile to verify token is still valid
        await fetchUserProfile()
        console.log('Auth initialized successfully')
      } catch (error) {
        // Token is invalid, clear it
        console.error('Invalid token, clearing auth state:', error)
        logout()
      }
    } else {
      console.log('No token found, user not authenticated')
    }
  }

  async function completeOnboarding() {
    try {
      await updateProfile({ hasCompletedOnboarding: true })
      toast.success('Onboarding completed! Welcome to Foligo!')
    } catch (error) {
      toast.error('Failed to complete onboarding')
      throw error
    }
  }

  async function checkAuthStatus() {
    if (!token.value) {
      return false
    }
    
    try {
      // Verify token is still valid by fetching user profile
      await fetchUserProfile()
      return true
    } catch (error) {
      console.error('Token validation failed:', error)
      logout()
      return false
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    
    // Getters
    isAuthenticated,
    userInitials,
    
    // Actions
    login,
    register,
    logout,
    fetchUserProfile,
    updateProfile,
    initializeAuth,
    completeOnboarding,
    checkAuthStatus
  }
})
