<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">Foligo Sites Debug</h1>
      
      <!-- Test API Connection -->
      <div class="bg-white p-6 rounded-lg shadow mb-6">
        <h2 class="text-xl font-semibold mb-4">API Test</h2>
        <button 
          @click="testApi" 
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          :disabled="testing"
        >
          {{ testing ? 'Testing...' : 'Test API Connection' }}
        </button>
        
        <div v-if="apiResult" class="mt-4 p-4 bg-gray-50 rounded">
          <h3 class="font-semibold">API Result:</h3>
          <pre class="text-sm mt-2">{{ JSON.stringify(apiResult, null, 2) }}</pre>
        </div>
        
        <div v-if="apiError" class="mt-4 p-4 bg-red-50 rounded">
          <h3 class="font-semibold text-red-800">API Error:</h3>
          <p class="text-red-600">{{ apiError }}</p>
        </div>
      </div>

      <!-- Environment Info -->
      <div class="bg-white p-6 rounded-lg shadow mb-6">
        <h2 class="text-xl font-semibold mb-4">Environment Info</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <strong>Hostname:</strong> {{ hostname }}
          </div>
          <div>
            <strong>Subdomain:</strong> {{ subdomain }}
          </div>
          <div>
            <strong>API Base URL:</strong> {{ apiBaseUrl }}
          </div>
          <div>
            <strong>Environment:</strong> {{ environment }}
          </div>
        </div>
      </div>

      <!-- Manual Subdomain Test -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Manual Subdomain Test</h2>
        <div class="flex gap-4">
          <input 
            v-model="testSubdomain" 
            placeholder="Enter subdomain (e.g., 'test')"
            class="flex-1 px-3 py-2 border rounded"
          />
          <button 
            @click="testSubdomainApi" 
            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            :disabled="testingSubdomain"
          >
            {{ testingSubdomain ? 'Testing...' : 'Test Subdomain' }}
          </button>
        </div>
        
        <div v-if="subdomainResult" class="mt-4 p-4 bg-gray-50 rounded">
          <h3 class="font-semibold">Subdomain Result:</h3>
          <pre class="text-sm mt-2">{{ JSON.stringify(subdomainResult, null, 2) }}</pre>
        </div>
        
        <div v-if="subdomainError" class="mt-4 p-4 bg-red-50 rounded">
          <h3 class="font-semibold text-red-800">Subdomain Error:</h3>
          <p class="text-red-600">{{ subdomainError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { siteApi } from '~/utils/siteApi'

const config = useRuntimeConfig()

// Debug variables
const hostname = ref('')
const subdomain = ref('')
const apiBaseUrl = ref(config.public.apiBaseUrl)
const environment = ref(process.env.NODE_ENV || 'development')

// API test variables
const testing = ref(false)
const apiResult = ref(null)
const apiError = ref(null)

// Subdomain test variables
const testSubdomain = ref('')
const testingSubdomain = ref(false)
const subdomainResult = ref(null)
const subdomainError = ref(null)

const testApi = async () => {
  testing.value = true
  apiError.value = null
  apiResult.value = null
  
  try {
    const response = await fetch(`${apiBaseUrl.value}/health`)
    const data = await response.json()
    apiResult.value = data
  } catch (error) {
    apiError.value = error.message
  } finally {
    testing.value = false
  }
}

const testSubdomainApi = async () => {
  if (!testSubdomain.value) return
  
  testingSubdomain.value = true
  subdomainError.value = null
  subdomainResult.value = null
  
  try {
    const response = await fetch(`${apiBaseUrl.value}/api/site/${testSubdomain.value}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    subdomainResult.value = data
  } catch (error) {
    subdomainError.value = error.message
  } finally {
    testingSubdomain.value = false
  }
}

onMounted(() => {
  if (process.client) {
    hostname.value = window.location.hostname
    subdomain.value = siteApi.extractSubdomain(window.location.hostname)
  }
})
</script>
