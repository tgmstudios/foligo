<template>
  <div class="p-6 max-w-7xl mx-auto">
    <button class="text-primary-400 hover:text-primary-300 mb-6" @click="router.push('/admin/projects')">← Back to portfolios</button>
    <div v-if="loading" class="text-center py-20 text-gray-400">Loading portfolio…</div>
    <div v-else-if="!project" class="bg-gray-800 border border-gray-700 rounded-lg p-10 text-center text-white">Portfolio not found</div>
    <template v-else>
      <div class="flex flex-wrap justify-between gap-4 mb-8">
        <div><div class="flex items-center gap-3"><h1 class="text-3xl font-bold text-white">{{ project.name }}</h1><span :class="project.isPublished ? 'bg-green-600' : 'bg-gray-600'" class="px-2 py-1 text-xs text-white rounded">{{ project.isPublished ? 'Published' : 'Draft' }}</span></div><p class="text-gray-400 mt-2">{{ project.description || 'No description provided.' }}</p></div>
        <button class="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg self-start" @click="editing = !editing">{{ editing ? 'Cancel' : 'Edit portfolio' }}</button>
      </div>
      <form v-if="editing" class="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6 grid gap-4 md:grid-cols-2" @submit.prevent="saveProject">
        <label class="text-sm text-gray-300">Name<input v-model="form.name" required class="mt-2 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" /></label>
        <label class="text-sm text-gray-300">Subdomain<input v-model="form.subdomain" class="mt-2 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" /></label>
        <label class="text-sm text-gray-300 md:col-span-2">Description<textarea v-model="form.description" rows="3" class="mt-2 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"></textarea></label>
        <label class="flex items-center gap-2 text-sm text-gray-300"><input v-model="form.isPublished" type="checkbox" /> Published</label>
        <div class="md:col-span-2"><button :disabled="saving" class="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">{{ saving ? 'Saving…' : 'Save changes' }}</button></div>
      </form>
      <div class="grid gap-4 sm:grid-cols-3 mb-6"><div class="bg-gray-800 border border-gray-700 rounded-lg p-5"><p class="text-2xl font-bold text-white">{{ project._count.content }}</p><p class="text-sm text-gray-400">Content items</p></div><div class="bg-gray-800 border border-gray-700 rounded-lg p-5"><p class="text-2xl font-bold text-white">{{ project._count.members }}</p><p class="text-sm text-gray-400">Members</p></div><div class="bg-gray-800 border border-gray-700 rounded-lg p-5"><p class="text-2xl font-bold text-white">{{ project._count.media }}</p><p class="text-sm text-gray-400">Media files</p></div></div>
      <div class="grid gap-6 lg:grid-cols-3">
        <section class="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"><div class="px-6 py-4 border-b border-gray-700"><h2 class="text-lg font-semibold text-white">Content</h2></div><p v-if="!project.content.length" class="p-6 text-gray-400">No content in this portfolio.</p><button v-for="item in project.content" :key="item.id" class="w-full p-5 flex justify-between gap-4 text-left border-b border-gray-700 last:border-0 hover:bg-gray-700" @click="router.push(`/admin/content/${item.id}`)"><span><span class="block text-white font-medium">{{ item.title || 'Untitled' }}</span><span class="text-sm text-gray-400">{{ item.contentType }} · Updated {{ formatDate(item.updatedAt) }}</span></span><span class="text-sm text-gray-400">{{ item.status }} →</span></button></section>
        <div class="space-y-6"><section class="bg-gray-800 border border-gray-700 rounded-lg p-6"><h2 class="text-lg font-semibold text-white mb-4">Owner</h2><button class="text-left hover:text-primary-300" @click="router.push(`/admin/users/${project.owner.id}`)"><span class="block text-white">{{ project.owner.name }}</span><span class="text-sm text-gray-400">{{ project.owner.email }}</span></button></section><section class="bg-gray-800 border border-gray-700 rounded-lg p-6"><h2 class="text-lg font-semibold text-white mb-4">Members</h2><p v-if="!project.members.length" class="text-gray-400">No additional members.</p><button v-for="member in project.members" :key="member.id" class="block w-full text-left py-2" @click="router.push(`/admin/users/${member.user.id}`)"><span class="text-white">{{ member.user.name }}</span><span class="float-right text-xs text-gray-400">{{ member.role }}</span><span class="block text-xs text-gray-500">{{ member.user.email }}</span></button></section></div>
      </div>
      <p v-if="project.subdomain" class="text-sm text-gray-500 mt-6">Site: {{ project.subdomain }}.foligo.tech</p>
    </template>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'; import { useRoute, useRouter } from 'vue-router'; import { useToast } from 'vue-toastification'; import api from '@/services/api'
const route = useRoute(); const router = useRouter(); const toast = useToast(); const loading = ref(true); const saving = ref(false); const editing = ref(false); const project = ref<any>(null); const form = reactive({ name: '', description: '', subdomain: '', isPublished: false })
const formatDate = (v: string) => new Date(v).toLocaleDateString(undefined, { dateStyle: 'medium' })
const load = async () => { try { const { data } = await api.get(`/admin/projects/${route.params.id}`); project.value = data; Object.assign(form, { name: data.name, description: data.description || '', subdomain: data.subdomain || '', isPublished: data.isPublished }) } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to load portfolio') } finally { loading.value = false } }
const saveProject = async () => { try { saving.value = true; const { data } = await api.put(`/admin/projects/${route.params.id}`, form); project.value = { ...project.value, ...data }; editing.value = false; toast.success('Portfolio updated') } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update portfolio') } finally { saving.value = false } }
onMounted(load)
</script>
