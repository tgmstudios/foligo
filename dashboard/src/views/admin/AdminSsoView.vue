<template>
  <div class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white">SSO Providers</h1>
        <p class="text-gray-400 mt-2">Manage OpenID/OAuth2 SSO providers for user authentication</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        + Add Provider
      </button>
    </div>

    <!-- Providers List -->
    <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        <p class="text-gray-400 mt-4">Loading providers...</p>
      </div>

      <div v-else-if="providers.length === 0" class="text-center py-12">
        <p class="text-gray-400 mb-4">No SSO providers configured</p>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Add Your First Provider
        </button>
      </div>

      <div v-else class="divide-y divide-gray-700">
        <div
          v-for="provider in providers"
          :key="provider.id"
          class="p-6 hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <div
                  v-if="provider.icon"
                  class="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                  :style="{ backgroundColor: provider.buttonColor || '#3B82F6' }"
                >
                  {{ provider.icon }}
                </div>
                <div
                  v-else
                  class="h-12 w-12 bg-gray-600 rounded-lg flex items-center justify-center"
                >
                  <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <h3 class="text-lg font-semibold text-white">{{ provider.name }}</h3>
                  <span
                    v-if="provider.enabled"
                    class="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded"
                  >
                    Enabled
                  </span>
                  <span
                    v-else
                    class="px-2 py-1 text-xs font-medium bg-gray-600 text-white rounded"
                  >
                    Disabled
                  </span>
                </div>
                <p class="text-sm text-gray-400 mt-1">Provider ID: {{ provider.providerId }}</p>
                <p class="text-sm text-gray-400">Issuer: {{ provider.issuer }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="editProvider(provider)"
                class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Edit
              </button>
              <button
                @click="deleteProvider(provider)"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal || editingProvider"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      @click.self="closeModal"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-white">
            {{ editingProvider ? 'Edit Provider' : 'Add SSO Provider' }}
          </h2>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-white"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="saveProvider" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Display Name *</label>
              <input
                v-model="formData.name"
                type="text"
                required
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Google"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Provider ID *</label>
              <input
                v-model="formData.providerId"
                type="text"
                required
                :disabled="!!editingProvider"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                placeholder="e.g., google"
                pattern="[a-z0-9-]+"
              />
              <p class="text-xs text-gray-400 mt-1">Lowercase, alphanumeric, hyphens only</p>
            </div>
          </div>

          <!-- Redirect URI Info -->
          <div v-if="formData.providerId || editingProvider?.providerId" class="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <label class="block text-sm font-medium text-blue-300 mb-2">Redirect URI</label>
            <div class="flex items-center gap-2">
              <input
                :value="redirectUri"
                type="text"
                readonly
                class="flex-1 px-4 py-2 bg-gray-800 border border-blue-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                @click="copyRedirectUri"
                class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                title="Copy to clipboard"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p class="text-xs text-blue-400 mt-2">
              Add this redirect URI to your OAuth application settings in your SSO provider
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Client ID *</label>
            <input
              v-model="formData.clientId"
              type="text"
              required
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Client Secret *</label>
            <input
              v-model="formData.clientSecret"
              type="password"
              required
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <!-- OpenID Discovery -->
          <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-medium text-gray-300">OpenID Discovery (Optional)</label>
              <button
                type="button"
                @click="discoverOpenIdConfig"
                :disabled="discovering || !formData.issuer"
                class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ discovering ? 'Discovering...' : 'Auto-discover Endpoints' }}
              </button>
            </div>
            <input
              v-model="formData.issuer"
              type="url"
              required
              class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://auth.tgm.one/application/o/foligo/"
              @blur="normalizeIssuerUrl"
            />
            <p class="text-xs text-gray-400 mt-2">
              Enter the issuer URL (base URL of your OpenID provider). Click "Auto-discover Endpoints" to automatically fetch configuration from <code class="bg-gray-800 px-1 rounded">/.well-known/openid-configuration</code>
            </p>
            <p v-if="discoveryError" class="text-xs text-red-400 mt-2">{{ discoveryError }}</p>
            <p v-if="discoverySuccess" class="text-xs text-green-400 mt-2">✓ Endpoints discovered and filled automatically</p>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Authorization Endpoint *</label>
              <input
                v-model="formData.authorizationEndpoint"
                type="url"
                required
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Token Endpoint *</label>
              <input
                v-model="formData.tokenEndpoint"
                type="url"
                required
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">UserInfo Endpoint *</label>
              <input
                v-model="formData.userInfoEndpoint"
                type="url"
                required
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Scopes</label>
            <input
              v-model="formData.scopes"
              type="text"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="openid profile email"
            />
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Icon (emoji/text)</label>
              <input
                v-model="formData.icon"
                type="text"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="🔐"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Button Color</label>
              <input
                v-model="formData.buttonColor"
                type="color"
                class="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Button Text</label>
              <input
                v-model="formData.buttonText"
                type="text"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Sign in with..."
              />
            </div>
          </div>

          <div class="flex items-center">
            <input
              v-model="formData.enabled"
              type="checkbox"
              id="enabled"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 rounded"
            />
            <label for="enabled" class="ml-2 text-sm text-gray-300">Enabled</label>
          </div>

          <div class="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : (editingProvider ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const discovering = ref(false)
const discoveryError = ref('')
const discoverySuccess = ref(false)
const providers = ref<any[]>([])
const showCreateModal = ref(false)
const editingProvider = ref<any>(null)

const formData = ref({
  name: '',
  providerId: '',
  clientId: '',
  clientSecret: '',
  issuer: '',
  authorizationEndpoint: '',
  tokenEndpoint: '',
  userInfoEndpoint: '',
  scopes: 'openid profile email',
  icon: '',
  buttonColor: '#3B82F6',
  buttonText: '',
  enabled: true
})

const fetchProviders = async () => {
  try {
    loading.value = true
    const response = await api.get('/admin/sso/providers')
    providers.value = response.data
  } catch (error: any) {
    console.error('Failed to fetch providers:', error)
    toast.error(error.response?.data?.message || 'Failed to load SSO providers')
  } finally {
    loading.value = false
  }
}

const editProvider = async (provider: any) => {
  try {
    const response = await api.get(`/admin/sso/providers/${provider.id}`)
    editingProvider.value = response.data
    formData.value = {
      name: response.data.name,
      providerId: response.data.providerId,
      clientId: response.data.clientId,
      clientSecret: response.data.clientSecret || '',
      issuer: response.data.issuer,
      authorizationEndpoint: response.data.authorizationEndpoint,
      tokenEndpoint: response.data.tokenEndpoint,
      userInfoEndpoint: response.data.userInfoEndpoint,
      scopes: response.data.scopes || 'openid profile email',
      icon: response.data.icon || '',
      buttonColor: response.data.buttonColor || '#3B82F6',
      buttonText: response.data.buttonText || '',
      enabled: response.data.enabled
    }
    showCreateModal.value = true
  } catch (error: any) {
    console.error('Failed to fetch provider:', error)
    toast.error(error.response?.data?.message || 'Failed to load provider details')
  }
}

const saveProvider = async () => {
  try {
    saving.value = true
    if (editingProvider.value) {
      await api.put(`/admin/sso/providers/${editingProvider.value.id}`, formData.value)
      toast.success('Provider updated successfully')
    } else {
      await api.post('/admin/sso/providers', formData.value)
      toast.success('Provider created successfully')
    }
    closeModal()
    fetchProviders()
  } catch (error: any) {
    console.error('Failed to save provider:', error)
    toast.error(error.response?.data?.message || 'Failed to save provider')
  } finally {
    saving.value = false
  }
}

const deleteProvider = async (provider: any) => {
  if (!confirm(`Are you sure you want to delete "${provider.name}"? This action cannot be undone.`)) {
    return
  }

  try {
    await api.delete(`/admin/sso/providers/${provider.id}`)
    toast.success('Provider deleted successfully')
    fetchProviders()
  } catch (error: any) {
    console.error('Failed to delete provider:', error)
    toast.error(error.response?.data?.message || 'Failed to delete provider')
  }
}

const normalizeIssuerUrl = () => {
  if (formData.value.issuer && !formData.value.issuer.endsWith('/')) {
    formData.value.issuer = formData.value.issuer + '/'
  }
}

const redirectUri = computed(() => {
  const providerId = formData.value.providerId || editingProvider.value?.providerId
  if (!providerId) return ''
  
  // Get the API base URL
  const apiUrl = import.meta.env.VITE_API_URL || '/api'
  
  // If it's a relative URL, construct from current origin
  if (apiUrl.startsWith('/')) {
    return `${window.location.origin}${apiUrl}/auth/sso/callback/${providerId}`
  }
  
  // If it's an absolute URL, use it directly
  return `${apiUrl}/auth/sso/callback/${providerId}`
})

const copyRedirectUri = async () => {
  try {
    await navigator.clipboard.writeText(redirectUri.value)
    toast.success('Redirect URI copied to clipboard')
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = redirectUri.value
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      toast.success('Redirect URI copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy redirect URI')
    }
    document.body.removeChild(textArea)
  }
}

const discoverOpenIdConfig = async () => {
  if (!formData.value.issuer) {
    discoveryError.value = 'Please enter an issuer URL first'
    return
  }

  try {
    discovering.value = true
    discoveryError.value = ''
    discoverySuccess.value = false

    // Call backend discovery endpoint to avoid CORS issues
    const response = await api.post('/admin/sso/discover', {
      issuer: formData.value.issuer
    })

    const config = response.data

    // Auto-fill the form
    formData.value.issuer = config.issuer
    formData.value.authorizationEndpoint = config.authorizationEndpoint
    formData.value.tokenEndpoint = config.tokenEndpoint
    formData.value.userInfoEndpoint = config.userInfoEndpoint

    // Set scopes if available
    if (config.scopes) {
      formData.value.scopes = config.scopes
    }

    discoverySuccess.value = true
    toast.success('OpenID configuration discovered successfully')
  } catch (error: any) {
    console.error('OpenID discovery error:', error)
    discoveryError.value = error.response?.data?.message || error.message || 'Failed to discover OpenID configuration'
    discoverySuccess.value = false
    toast.error(discoveryError.value)
  } finally {
    discovering.value = false
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingProvider.value = null
  discoveryError.value = ''
  discoverySuccess.value = false
  formData.value = {
    name: '',
    providerId: '',
    clientId: '',
    clientSecret: '',
    issuer: '',
    authorizationEndpoint: '',
    tokenEndpoint: '',
    userInfoEndpoint: '',
    scopes: 'openid profile email',
    icon: '',
    buttonColor: '#3B82F6',
    buttonText: '',
    enabled: true
  }
}

onMounted(() => {
  fetchProviders()
})
</script>

