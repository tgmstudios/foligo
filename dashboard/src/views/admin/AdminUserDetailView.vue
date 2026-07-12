<template>
  <div class="p-6 max-w-7xl mx-auto">
    <button class="text-primary-400 hover:text-primary-300 mb-6" @click="router.push('/admin/users')">← Back to users</button>
    <div v-if="loading" class="text-center py-20 text-gray-400">Loading user…</div>
    <div v-else-if="!user" class="bg-gray-800 border border-gray-700 rounded-lg p-10 text-center">
      <h1 class="text-xl font-semibold text-white">User not found</h1>
      <p class="text-gray-400 mt-2">This account may have been removed.</p>
    </div>
    <template v-else>
      <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-white">{{ user.name }}</h1>
            <span v-if="user.isAdmin" class="px-2 py-1 text-xs bg-red-600 text-white rounded">Admin</span>
            <span v-if="!user.hasCompletedOnboarding" class="px-2 py-1 text-xs bg-yellow-600 text-white rounded">Onboarding pending</span>
          </div>
          <p class="text-gray-400 mt-2">{{ user.email }}</p>
        </div>
        <button class="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg" @click="editing = !editing">
          {{ editing ? 'Cancel' : 'Edit user' }}
        </button>
      </div>

      <form v-if="editing" class="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6 grid gap-4 md:grid-cols-2" @submit.prevent="saveUser">
        <label class="text-sm text-gray-300">Name<input v-model="form.name" required class="mt-2 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" /></label>
        <label class="text-sm text-gray-300">Email<input v-model="form.email" required type="email" class="mt-2 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" /></label>
        <label class="flex items-center gap-2 text-sm text-gray-300"><input v-model="form.isAdmin" type="checkbox" /> Administrator</label>
        <label class="flex items-center gap-2 text-sm text-gray-300"><input v-model="form.hasCompletedOnboarding" type="checkbox" /> Onboarding complete</label>
        <div class="md:col-span-2"><button :disabled="saving" class="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">{{ saving ? 'Saving…' : 'Save changes' }}</button></div>
      </form>

      <div class="grid gap-4 sm:grid-cols-3 mb-8">
        <div v-for="stat in stats" :key="stat.label" class="bg-gray-800 border border-gray-700 rounded-lg p-5"><p class="text-2xl font-bold text-white">{{ stat.value }}</p><p class="text-sm text-gray-400 mt-1">{{ stat.label }}</p></div>
      </div>

      <section class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mb-6">
        <div class="px-6 py-4 border-b border-gray-700"><h2 class="text-lg font-semibold text-white">Owned portfolios</h2></div>
        <p v-if="!user.projectsOwned.length" class="p-6 text-gray-400">No owned portfolios.</p>
        <button v-for="project in user.projectsOwned" :key="project.id" class="w-full px-6 py-4 flex items-center justify-between text-left border-b border-gray-700 last:border-0 hover:bg-gray-700" @click="router.push(`/admin/projects/${project.id}`)">
          <span><span class="block text-white font-medium">{{ project.name }}</span><span class="text-sm text-gray-400">{{ project._count.content }} items · {{ project._count.members }} members</span></span>
          <span :class="project.isPublished ? 'text-green-400' : 'text-gray-400'">{{ project.isPublished ? 'Published' : 'Draft' }} →</span>
        </button>
      </section>

      <section class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700"><h2 class="text-lg font-semibold text-white">Portfolio memberships</h2></div>
        <p v-if="!user.projectAccess.length" class="p-6 text-gray-400">No portfolio memberships.</p>
        <button v-for="access in user.projectAccess" :key="access.id" class="w-full px-6 py-4 flex items-center justify-between text-left border-b border-gray-700 last:border-0 hover:bg-gray-700" @click="router.push(`/admin/projects/${access.project.id}`)">
          <span class="text-white">{{ access.project.name }}</span><span class="text-sm text-gray-400">{{ access.role }} →</span>
        </button>
      </section>
      <p class="text-xs text-gray-500 mt-6">Joined {{ formatDate(user.createdAt) }} · Last updated {{ formatDate(user.updatedAt) }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const route = useRoute(); const router = useRouter(); const toast = useToast()
const loading = ref(true); const saving = ref(false); const editing = ref(false); const user = ref<any>(null)
const form = reactive({ name: '', email: '', isAdmin: false, hasCompletedOnboarding: false })
const stats = computed(() => user.value ? [
  { label: 'Owned portfolios', value: user.value._count.projectsOwned },
  { label: 'Memberships', value: user.value._count.projectAccess },
  { label: 'Media files', value: user.value._count.media }
] : [])
const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })
const load = async () => { try { const { data } = await api.get(`/admin/users/${route.params.id}`); user.value = data; Object.assign(form, { name: data.name, email: data.email, isAdmin: data.isAdmin, hasCompletedOnboarding: data.hasCompletedOnboarding }) } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to load user') } finally { loading.value = false } }
const saveUser = async () => { try { saving.value = true; const { data } = await api.put(`/admin/users/${route.params.id}`, form); user.value = { ...user.value, ...data }; editing.value = false; toast.success('User updated') } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update user') } finally { saving.value = false } }
onMounted(load)
</script>
