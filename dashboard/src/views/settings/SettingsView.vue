<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-600 mt-1">Manage your account and preferences</p>
    </div>

    <!-- Settings Content -->
    <div class="space-y-6">
      <!-- Profile Settings -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Profile Settings</h3>
        <form @submit.prevent="updateProfile" class="space-y-4">
          <div>
            <label for="name" class="label">Full Name</label>
            <input
              id="name"
              v-model="profileForm.name"
              type="text"
              required
              class="input"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label for="email" class="label">Email Address</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              required
              class="input"
              placeholder="Enter your email address"
            />
          </div>
          
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="isUpdating"
              class="btn btn-primary"
            >
              {{ isUpdating ? 'Updating...' : 'Update Profile' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Preferences -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
        <div class="space-y-4">
          <div class="flex items-center">
            <input
              id="notifications"
              v-model="preferences.notifications"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="notifications" class="ml-2 text-sm text-gray-700">
              Enable email notifications
            </label>
          </div>
          
          <div class="flex items-center">
            <input
              id="darkMode"
              v-model="preferences.darkMode"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="darkMode" class="ml-2 text-sm text-gray-700">
              Dark mode (coming soon)
            </label>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="card p-6 border-danger-200">
        <h3 class="text-lg font-medium text-danger-900 mb-4">Danger Zone</h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-900">Delete Account</h4>
            <p class="text-sm text-gray-500">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              @click="showDeleteModal = true"
              class="mt-2 btn btn-danger btn-sm"
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
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="showDeleteModal = false"></div>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Delete Account
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your projects and data.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="deleteAccount"
              :disabled="isDeleting"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-danger-600 text-base font-medium text-white hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete Account' }}
            </button>
            <button
              @click="showDeleteModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isUpdating = ref(false)
const isDeleting = ref(false)
const showDeleteModal = ref(false)

const profileForm = reactive({
  name: '',
  email: ''
})

const preferences = reactive({
  notifications: true,
  darkMode: false
})

const updateProfile = async () => {
  try {
    isUpdating.value = true
    await authStore.updateProfile(profileForm)
  } catch (error) {
    console.error('Failed to update profile:', error)
  } finally {
    isUpdating.value = false
  }
}

const deleteAccount = async () => {
  try {
    isDeleting.value = true
    // TODO: Implement account deletion
    console.log('Account deletion not implemented yet')
    showDeleteModal.value = false
  } catch (error) {
    console.error('Failed to delete account:', error)
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
