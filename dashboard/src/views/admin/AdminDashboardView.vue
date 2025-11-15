<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-white">Admin Dashboard</h1>
      <p class="text-gray-400 mt-2">Manage users, portfolios, and content across the platform</p>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm">Total Users</p>
            <p class="text-3xl font-bold text-white mt-2">{{ stats.totalUsers || 0 }}</p>
          </div>
          <div class="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm">Total Portfolios</p>
            <p class="text-3xl font-bold text-white mt-2">{{ stats.totalProjects || 0 }}</p>
          </div>
          <div class="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm">Total Content</p>
            <p class="text-3xl font-bold text-white mt-2">{{ stats.totalContent || 0 }}</p>
          </div>
          <div class="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Recent Users -->
      <div class="bg-gray-800 rounded-lg border border-gray-700">
        <div class="p-6 border-b border-gray-700">
          <h2 class="text-xl font-semibold text-white">Recent Users</h2>
        </div>
        <div class="p-6">
          <div v-if="loading" class="text-center py-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <div v-else-if="recentUsers.length === 0" class="text-gray-400 text-center py-4">
            No users yet
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="user in recentUsers"
              :key="user.id"
              class="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
              @click="$router.push(`/admin/users/${user.id}`)"
            >
              <div>
                <p class="text-white font-medium">{{ user.name }}</p>
                <p class="text-gray-400 text-sm">{{ user.email }}</p>
              </div>
              <p class="text-gray-400 text-xs">{{ formatDate(user.createdAt) }}</p>
            </div>
          </div>
          <router-link
            to="/admin/users"
            class="block mt-4 text-center text-primary-400 hover:text-primary-300 text-sm font-medium"
          >
            View all users →
          </router-link>
        </div>
      </div>

      <!-- Recent Projects -->
      <div class="bg-gray-800 rounded-lg border border-gray-700">
        <div class="p-6 border-b border-gray-700">
          <h2 class="text-xl font-semibold text-white">Recent Portfolios</h2>
        </div>
        <div class="p-6">
          <div v-if="loading" class="text-center py-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <div v-else-if="recentProjects.length === 0" class="text-gray-400 text-center py-4">
            No portfolios yet
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="project in recentProjects"
              :key="project.id"
              class="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
              @click="$router.push(`/admin/projects/${project.id}`)"
            >
              <div>
                <p class="text-white font-medium">{{ project.name }}</p>
                <p class="text-gray-400 text-sm">by {{ project.owner.name }}</p>
              </div>
              <p class="text-gray-400 text-xs">{{ formatDate(project.createdAt) }}</p>
            </div>
          </div>
          <router-link
            to="/admin/projects"
            class="block mt-4 text-center text-primary-400 hover:text-primary-300 text-sm font-medium"
          >
            View all portfolios →
          </router-link>
        </div>
      </div>
    </div>

    <!-- Navigation Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <router-link
        to="/admin/users"
        class="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-primary-500 transition-colors cursor-pointer"
      >
        <div class="flex items-center mb-4">
          <div class="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white">User Management</h3>
        </div>
        <p class="text-gray-400 text-sm">Manage user accounts, permissions, and access</p>
      </router-link>

      <router-link
        to="/admin/projects"
        class="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-primary-500 transition-colors cursor-pointer"
      >
        <div class="flex items-center mb-4">
          <div class="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center mr-4">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white">Portfolio Management</h3>
        </div>
        <p class="text-gray-400 text-sm">View and manage all portfolios on the platform</p>
      </router-link>

      <router-link
        to="/admin/content"
        class="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-primary-500 transition-colors cursor-pointer"
      >
        <div class="flex items-center mb-4">
          <div class="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white">Content Management</h3>
        </div>
        <p class="text-gray-400 text-sm">Manage all content across portfolios</p>
      </router-link>

      <router-link
        to="/admin/sso"
        class="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-primary-500 transition-colors cursor-pointer"
      >
        <div class="flex items-center mb-4">
          <div class="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-4">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white">SSO Providers</h3>
        </div>
        <p class="text-gray-400 text-sm">Configure OpenID/OAuth2 SSO providers</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()

const loading = ref(true)
const stats = ref({
  totalUsers: 0,
  totalProjects: 0,
  totalContent: 0
})
const recentUsers = ref<any[]>([])
const recentProjects = ref<any[]>([])

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchStats = async () => {
  try {
    loading.value = true
    const response = await api.get('/admin/stats')
    stats.value = response.data.stats
    recentUsers.value = response.data.recentUsers
    recentProjects.value = response.data.recentProjects
  } catch (error: any) {
    console.error('Failed to fetch admin stats:', error)
    toast.error(error.response?.data?.message || 'Failed to load dashboard statistics')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

