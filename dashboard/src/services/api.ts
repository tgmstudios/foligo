import axios from 'axios'
import { useToast } from 'vue-toastification'

const toast = useToast()

// Get API URL from window.ENV (runtime config) or environment variable, fallback to /api for relative URLs
const API_URL = (typeof window !== 'undefined' && window.ENV?.VITE_API_URL) || import.meta.env.VITE_API_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Create axios instance for AI operations with longer timeout
const aiApi = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutes for AI content generation
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
const addAuthToken = (config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

api.interceptors.request.use(addAuthToken, (error) => {
  return Promise.reject(error)
})

// Apply same interceptor to AI API
aiApi.interceptors.request.use(addAuthToken, (error) => {
  return Promise.reject(error)
})

// Response interceptor
const handleResponseError = (error) => {
  // Handle common errors
  if (error.response?.status === 401) {
    // Unauthorized - clear auth and redirect to login
    console.log('401 Unauthorized - clearing auth state')
    localStorage.removeItem('auth_token')
    // Use router to redirect instead of window.location
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  } else if (error.response?.status === 403) {
    toast.error('Access denied')
  } else if (error.response?.status === 500) {
    toast.error('Server error. Please try again later.')
  } else if (error.response?.status === 0) {
    // Network error - API might be down
    toast.error('Unable to connect to server. Please check your connection.')
  }
  
  return Promise.reject(error)
}

api.interceptors.response.use(
  (response) => response,
  handleResponseError
)

// Apply same interceptor to AI API
aiApi.interceptors.response.use(
  (response) => response,
  handleResponseError
)

export { aiApi }
export default api
