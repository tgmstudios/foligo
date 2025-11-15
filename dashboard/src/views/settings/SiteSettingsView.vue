<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Site-wide Settings</h1>
      <p class="text-gray-400 mt-1">Configure platform-wide settings and preferences</p>
    </div>

    <!-- Settings Content -->
    <div class="space-y-6">
      <!-- General Settings -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4">General Settings</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
            <input
              v-model="siteSettings.siteName"
              type="text"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Foligo"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
            <textarea
              v-model="siteSettings.siteDescription"
              rows="3"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Platform description"
            ></textarea>
          </div>
          
          <div class="flex justify-end">
            <button
              @click="saveSiteSettings"
              :disabled="isSaving"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSaving ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Security Settings</h3>
        <div class="space-y-4">
          <div class="flex items-center">
            <input
              id="requireEmailVerification"
              v-model="siteSettings.requireEmailVerification"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 rounded bg-gray-700"
            />
            <label for="requireEmailVerification" class="ml-2 text-sm text-gray-300">
              Require email verification for new users
            </label>
          </div>
          
          <div class="flex items-center">
            <input
              id="allowRegistration"
              v-model="siteSettings.allowRegistration"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 rounded bg-gray-700"
            />
            <label for="allowRegistration" class="ml-2 text-sm text-gray-300">
              Allow new user registration
            </label>
          </div>
          
          <div class="flex justify-end">
            <button
              @click="saveSiteSettings"
              :disabled="isSaving"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSaving ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Maintenance Mode -->
      <div class="bg-gray-800 rounded-lg border border-yellow-600 p-6">
        <h3 class="text-lg font-semibold text-yellow-400 mb-4">Maintenance Mode</h3>
        <div class="space-y-4">
          <div class="flex items-center">
            <input
              id="maintenanceMode"
              v-model="siteSettings.maintenanceMode"
              type="checkbox"
              class="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-600 rounded bg-gray-700"
            />
            <label for="maintenanceMode" class="ml-2 text-sm text-gray-300">
              Enable maintenance mode (site will be unavailable to non-admin users)
            </label>
          </div>
          
          <div v-if="siteSettings.maintenanceMode">
            <label class="block text-sm font-medium text-gray-300 mb-2">Maintenance Message</label>
            <textarea
              v-model="siteSettings.maintenanceMessage"
              rows="3"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="We're currently performing maintenance. Please check back soon."
            ></textarea>
          </div>
          
          <div class="flex justify-end">
            <button
              @click="saveSiteSettings"
              :disabled="isSaving"
              class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSaving ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()

const isSaving = ref(false)

const siteSettings = reactive({
  siteName: '',
  siteDescription: '',
  requireEmailVerification: false,
  allowRegistration: true,
  maintenanceMode: false,
  maintenanceMessage: ''
})

const fetchSiteSettings = async () => {
  try {
    // TODO: Implement API endpoint to fetch site settings
    // const response = await api.get('/admin/settings')
    // Object.assign(siteSettings, response.data)
  } catch (error) {
    console.error('Failed to fetch site settings:', error)
  }
}

const saveSiteSettings = async () => {
  try {
    isSaving.value = true
    // TODO: Implement API endpoint to save site settings
    // await api.put('/admin/settings', siteSettings)
    toast.success('Site settings saved successfully')
  } catch (error: any) {
    console.error('Failed to save site settings:', error)
    toast.error(error.response?.data?.message || 'Failed to save site settings')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchSiteSettings()
})
</script>

