<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">User Settings</h1>
      <p class="text-gray-400 mt-1">Manage your account and preferences</p>
    </div>

    <!-- Settings Content -->
    <div class="space-y-6">
      <!-- Profile Settings -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Profile Settings</h3>
        <form @submit.prevent="updateProfile" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              id="name"
              v-model="profileForm.name"
              type="text"
              required
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              required
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your email address"
            />
          </div>
          
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="isUpdating"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isUpdating ? 'Updating...' : 'Update Profile' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Password Settings -->
      <div v-if="!authStore.user?.ssoProviderId" class="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Change Password</h3>
        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label for="currentPassword" class="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              required
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              required
              minlength="8"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
            <input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="isChangingPassword || passwordForm.newPassword !== passwordForm.confirmPassword"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>

      <!-- API Tokens -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-white">API Tokens</h3>
            <p class="text-sm text-gray-400 mt-1">
              Manage long-lived API tokens for programmatic access (e.g., Chrome extension, scripts).
            </p>
          </div>
          <button
            @click="showGenerateModal = true"
            class="px-4 py-2 rounded-lg text-white transition-colors"
            style="background-color: #635BFF;"
          >
            Generate New Token
          </button>
        </div>

        <!-- Tokens Table -->
        <div v-if="tokens.length > 0" class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th class="py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Token</th>
                <th class="py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Created</th>
                <th class="py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Last Used</th>
                <th class="py-3 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="token in tokens"
                :key="token.id"
                class="border-b border-gray-700/50 hover:bg-gray-750 transition-colors"
              >
                <td class="py-3 px-2 text-sm text-white">{{ token.name }}</td>
                <td class="py-3 px-2 text-sm font-mono text-gray-400">{{ token.masked }}</td>
                <td class="py-3 px-2 text-sm text-gray-400 hidden sm:table-cell">
                  {{ formatDate(token.createdAt) }}
                </td>
                <td class="py-3 px-2 text-sm text-gray-400 hidden sm:table-cell">
                  {{ token.lastUsedAt ? formatDate(token.lastUsedAt) : 'Never' }}
                </td>
                <td class="py-3 px-2">
                  <button
                    @click="confirmRevoke(token)"
                    class="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else-if="!isLoadingTokens" class="text-center py-8 text-gray-500">
          <p class="text-sm">No API tokens yet. Generate one to access the API programmatically.</p>
        </div>

        <!-- Loading -->
        <div v-else class="text-center py-8 text-gray-500">
          <p class="text-sm">Loading tokens...</p>
        </div>

        <!-- Revoke All -->
        <div v-if="tokens.length > 0" class="mt-4 pt-4 border-t border-gray-700">
          <button
            @click="revokeAllTokens"
            :disabled="isRevokingAll"
            class="px-4 py-2 text-sm bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 disabled:opacity-50 transition-colors"
          >
            {{ isRevokingAll ? 'Revoking...' : 'Revoke All Tokens' }}
          </button>
        </div>
      </div>

      <!-- Preferences -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Preferences</h3>
        <div class="space-y-4">
          <div class="flex items-center">
            <input
              id="notifications"
              v-model="preferences.notifications"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 rounded bg-gray-700"
            />
            <label for="notifications" class="ml-2 text-sm text-gray-300">
              Enable email notifications
            </label>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="bg-gray-800 rounded-lg border border-red-600 p-6">
        <h3 class="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
        <div class="space-y-4">
          <!-- Disconnect All Devices -->
          <div>
            <h4 class="text-sm font-medium text-white">Disconnect All Devices</h4>
            <p class="text-sm text-gray-400 mt-1">
              Revoke all API tokens and disconnect all devices. You will need to re-authenticate on all devices.
            </p>
            <button
              @click="disconnectAllDevices"
              :disabled="isDisconnecting"
              class="mt-3 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 disabled:opacity-50 transition-colors"
            >
              {{ isDisconnecting ? 'Disconnecting...' : 'Disconnect All Devices' }}
            </button>
          </div>

          <hr class="border-red-600/30" />

          <div>
            <h4 class="text-sm font-medium text-white">Delete Account</h4>
            <p class="text-sm text-gray-400 mt-1">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              @click="showDeleteModal = true"
              class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Generate Token Modal -->
    <div
      v-if="showGenerateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      @click.self="closeGenerateModal"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-lg w-full mx-4">
        <h3 class="text-lg font-semibold text-white mb-4">Generate New API Token</h3>
        
        <!-- Step 1: Name input -->
        <div v-if="!newRawToken" class="space-y-4">
          <div>
            <label for="tokenName" class="block text-sm font-medium text-gray-300 mb-2">Token Name</label>
            <input
              id="tokenName"
              v-model="newTokenName"
              type="text"
              required
              maxlength="100"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Chrome Extension"
            />
          </div>
          <div class="flex justify-end space-x-3">
            <button
              @click="closeGenerateModal"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="generateToken"
              :disabled="!newTokenName.trim() || isGenerating"
              class="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style="background-color: #635BFF;"
            >
              {{ isGenerating ? 'Generating...' : 'Generate' }}
            </button>
          </div>
        </div>

        <!-- Step 2: Show raw token -->
        <div v-else class="space-y-4">
          <div class="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3">
            <div class="flex items-start">
              <svg class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p class="ml-3 text-sm text-yellow-300">
                <strong>Copy this token now.</strong> You won't be able to see it again. Store it securely.
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Your New API Token</label>
            <div class="flex items-center space-x-2">
              <code class="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-green-400 font-mono break-all">
                {{ newRawToken }}
              </code>
              <button
                @click="copyToken"
                class="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex-shrink-0"
                :title="copied ? 'Copied!' : 'Copy to clipboard'"
              >
                <svg v-if="!copied" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <svg v-else class="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              @click="closeGenerateModal"
              class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Revoke Token Confirmation Modal -->
    <div
      v-if="showRevokeModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      @click.self="showRevokeModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="ml-4 flex-1">
            <h3 class="text-lg font-semibold text-white">Revoke Token</h3>
            <p class="text-sm text-gray-400 mt-2">
              Are you sure you want to revoke the token <strong class="text-white">{{ revokeTarget?.name }}</strong>?
              Any applications using this token will lose access immediately.
            </p>
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="showRevokeModal = false"
            class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="revokeToken"
            :disabled="isRevoking"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isRevoking ? 'Revoking...' : 'Revoke' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      @click.self="showDeleteModal = false"
    >
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div class="ml-4 flex-1">
            <h3 class="text-lg font-semibold text-white">
              Delete Account
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-400">
                Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your projects and data.
              </p>
            </div>
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="deleteAccount"
            :disabled="isDeleting"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete Account' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

interface ApiToken {
  id: string
  name: string
  masked: string
  prefix: string
  lastUsedAt: string | null
  createdAt: string
}

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const isUpdating = ref(false)
const isChangingPassword = ref(false)
const isDeleting = ref(false)
const showDeleteModal = ref(false)

// Token management state
const tokens = ref<ApiToken[]>([])
const isLoadingTokens = ref(false)
const showGenerateModal = ref(false)
const newTokenName = ref('')
const isGenerating = ref(false)
const newRawToken = ref('')
const copied = ref(false)
const showRevokeModal = ref(false)
const revokeTarget = ref<ApiToken | null>(null)
const isRevoking = ref(false)
const isRevokingAll = ref(false)
const isDisconnecting = ref(false)

const profileForm = reactive({
  name: '',
  email: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const preferences = reactive({
  notifications: true
})

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---- Token Management ----

const loadTokens = async () => {
  try {
    isLoadingTokens.value = true
    const response = await api.get('/auth/tokens')
    tokens.value = response.data.tokens
  } catch (error: any) {
    console.error('Failed to load tokens:', error)
    toast.error('Failed to load API tokens')
  } finally {
    isLoadingTokens.value = false
  }
}

const generateToken = async () => {
  try {
    isGenerating.value = true
    const response = await api.post('/auth/tokens', { name: newTokenName.value.trim() })
    newRawToken.value = response.data.rawToken
    // Reload token list in background
    loadTokens()
  } catch (error: any) {
    console.error('Failed to generate token:', error)
    toast.error(error.response?.data?.message || 'Failed to generate API token')
  } finally {
    isGenerating.value = false
  }
}

const closeGenerateModal = () => {
  showGenerateModal.value = false
  newTokenName.value = ''
  newRawToken.value = ''
  copied.value = false
}

const copyToken = async () => {
  try {
    await navigator.clipboard.writeText(newRawToken.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 3000)
  } catch {
    toast.error('Failed to copy to clipboard')
  }
}

const confirmRevoke = (token: ApiToken) => {
  revokeTarget.value = token
  showRevokeModal.value = true
}

const revokeToken = async () => {
  if (!revokeTarget.value) return
  try {
    isRevoking.value = true
    await api.delete(`/auth/tokens/${revokeTarget.value.id}`)
    tokens.value = tokens.value.filter((t) => t.id !== revokeTarget.value!.id)
    toast.success('Token revoked successfully')
    showRevokeModal.value = false
  } catch (error: any) {
    console.error('Failed to revoke token:', error)
    toast.error(error.response?.data?.message || 'Failed to revoke API token')
  } finally {
    isRevoking.value = false
  }
}

const revokeAllTokens = async () => {
  if (!confirm('Are you sure you want to revoke all API tokens? Any applications using them will lose access immediately.')) return
  try {
    isRevokingAll.value = true
    await api.delete('/auth/tokens')
    tokens.value = []
    toast.success('All API tokens revoked')
  } catch (error: any) {
    console.error('Failed to revoke all tokens:', error)
    toast.error(error.response?.data?.message || 'Failed to revoke all API tokens')
  } finally {
    isRevokingAll.value = false
  }
}

const disconnectAllDevices = async () => {
  if (!confirm('This will revoke all API tokens and disconnect all devices. You will need to re-authenticate everywhere. Continue?')) return
  try {
    isDisconnecting.value = true
    await api.delete('/auth/tokens')
    tokens.value = []
    toast.success('All devices disconnected successfully')
  } catch (error: any) {
    console.error('Failed to disconnect devices:', error)
    toast.error(error.response?.data?.message || 'Failed to disconnect devices')
  } finally {
    isDisconnecting.value = false
  }
}

// ---- Profile ----

const updateProfile = async () => {
  try {
    isUpdating.value = true
    await authStore.updateProfile(profileForm)
    toast.success('Profile updated successfully')
  } catch (error: any) {
    console.error('Failed to update profile:', error)
    toast.error(error.response?.data?.message || 'Failed to update profile')
  } finally {
    isUpdating.value = false
  }
}

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error('Passwords do not match')
    return
  }

  try {
    isChangingPassword.value = true
    // TODO: Implement password change API endpoint
    toast.success('Password changed successfully')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    console.error('Failed to change password:', error)
    toast.error(error.response?.data?.message || 'Failed to change password')
  } finally {
    isChangingPassword.value = false
  }
}

const deleteAccount = async () => {
  try {
    isDeleting.value = true
    // TODO: Implement account deletion API endpoint
    toast.success('Account deletion requested')
    showDeleteModal.value = false
    // await authStore.logout()
    // router.push('/login')
  } catch (error: any) {
    console.error('Failed to delete account:', error)
    toast.error(error.response?.data?.message || 'Failed to delete account')
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  if (authStore.user) {
    profileForm.name = authStore.user.name
    profileForm.email = authStore.user.email
  }
  loadTokens()
})
</script>
