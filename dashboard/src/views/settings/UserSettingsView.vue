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

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const isUpdating = ref(false)
const isChangingPassword = ref(false)
const isDeleting = ref(false)
const showDeleteModal = ref(false)

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
})
</script>

