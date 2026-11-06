<template>
  <div class="p-6 max-w-7xl mx-auto">
    <button class="text-primary-400 hover:text-primary-300 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded" @click="router.push('/admin/users')">← Back to users</button>
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
        <button class="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900" @click="editing = !editing">
          {{ editing ? 'Cancel' : 'Edit user' }}
        </button>
      </div>

      <form v-if="editing" class="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6 grid gap-4 md:grid-cols-2" @submit.prevent="saveUser">
        <label class="text-sm text-gray-300">Name<input v-model="form.name" required class="mt-2 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400" /></label>
        <label class="text-sm text-gray-300">Email<input v-model="form.email" required type="email" class="mt-2 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400" /></label>
        <label class="flex items-center gap-2 text-sm text-gray-300"><input v-model="form.isAdmin" type="checkbox" /> Administrator</label>
        <label class="flex items-center gap-2 text-sm text-gray-300"><input v-model="form.hasCompletedOnboarding" type="checkbox" /> Onboarding complete</label>
        <div class="md:col-span-2"><button :disabled="saving" class="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">{{ saving ? 'Saving…' : 'Save changes' }}</button></div>
      </form>

      <div class="grid gap-4 sm:grid-cols-3 mb-8">
        <div v-for="stat in stats" :key="stat.label" class="bg-gray-800 border border-gray-700 rounded-lg p-5"><p class="text-2xl font-bold text-white">{{ stat.value }}</p><p class="text-sm text-gray-400 mt-1">{{ stat.label }}</p></div>
      </div>

      <AdminAiUsage :key="user.id" :user-id="user.id" />

      <section class="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <form @submit.prevent="saveModelAccess">
          <fieldset :disabled="savingModelAccess" class="min-w-0">
            <legend class="text-lg font-semibold text-white">AI model access</legend>
            <p class="text-sm text-gray-400 mt-1">Choose the models this user can use for quick and long generation tasks.</p>

            <p v-if="modelAccessError" class="mt-4 text-sm text-red-400" role="alert">{{ modelAccessError }}</p>
            <p v-else-if="!modelCatalog.length" class="mt-4 text-sm text-gray-400">No AI models are configured yet. Add models in AI Providers before granting access.</p>

            <div v-else class="grid gap-5 mt-5 md:grid-cols-2">
              <section v-for="group in modelGroups" :key="group.type" class="rounded-lg border border-gray-700 overflow-hidden" :aria-labelledby="`${group.type.toLowerCase()}-models-heading`">
                <h3 :id="`${group.type.toLowerCase()}-models-heading`" class="px-4 py-3 text-sm font-semibold text-white bg-gray-900">{{ group.label }}</h3>
                <p v-if="!group.models.length" class="p-4 text-sm text-gray-400">No {{ group.label.toLowerCase() }} models are configured.</p>
                <div v-else class="divide-y divide-gray-700">
                  <div v-for="model in group.models" :key="model.id" class="p-4" :class="isUnavailable(model) && !isSelected(model.id) ? 'opacity-60' : ''">
                    <div class="flex items-start gap-3">
                      <input
                        :id="`ai-model-${model.id}`"
                        v-model="selectedModelIds"
                        type="checkbox"
                        :value="model.id"
                        :disabled="isUnavailable(model) && !isSelected(model.id)"
                        :aria-describedby="`ai-model-${model.id}-metadata`"
                        class="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-900 text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-400"
                      />
                      <label :for="`ai-model-${model.id}`" class="min-w-0 cursor-pointer">
                        <span class="block text-sm font-medium text-white">{{ model.name }}</span>
                        <span :id="`ai-model-${model.id}-metadata`" class="block mt-1 text-xs text-gray-400">{{ model.providerType }} · {{ model.slug }}</span>
                        <span v-if="isUnavailable(model)" class="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300">{{ unavailableLabel(model) }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div v-if="modelCatalog.length" class="mt-5 flex flex-wrap items-center gap-3">
              <button type="submit" :disabled="savingModelAccess" :aria-busy="savingModelAccess" class="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800">
                {{ savingModelAccess ? 'Saving model access…' : 'Save model access' }}
              </button>
              <span class="text-sm text-gray-400" aria-live="polite">{{ savingModelAccess ? 'Saving selected model access.' : '' }}</span>
            </div>
          </fieldset>
        </form>
      </section>

      <section class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mb-6">
        <div class="px-6 py-4 border-b border-gray-700"><h2 class="text-lg font-semibold text-white">Owned portfolios</h2></div>
        <p v-if="!user.projectsOwned.length" class="p-6 text-gray-400">No owned portfolios.</p>
        <button v-for="project in user.projectsOwned" :key="project.id" class="w-full px-6 py-4 flex items-center justify-between text-left border-b border-gray-700 last:border-0 hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400" @click="router.push(`/admin/projects/${project.id}`)">
          <span><span class="block text-white font-medium">{{ project.name }}</span><span class="text-sm text-gray-400">{{ project._count.content }} items · {{ project._count.members }} members</span></span>
          <span :class="project.isPublished ? 'text-green-400' : 'text-gray-400'">{{ project.isPublished ? 'Published' : 'Draft' }} →</span>
        </button>
      </section>

      <section class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-700"><h2 class="text-lg font-semibold text-white">Portfolio memberships</h2></div>
        <p v-if="!user.projectAccess.length" class="p-6 text-gray-400">No portfolio memberships.</p>
        <button v-for="access in user.projectAccess" :key="access.id" class="w-full px-6 py-4 flex items-center justify-between text-left border-b border-gray-700 last:border-0 hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400" @click="router.push(`/admin/projects/${access.project.id}`)">
          <span class="text-white">{{ access.project.name }}</span><span class="text-sm text-gray-400">{{ access.role }} →</span>
        </button>
      </section>
      <p class="text-xs text-gray-500 mt-6">Joined {{ formatDate(user.createdAt) }} · Last updated {{ formatDate(user.updatedAt) }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import AdminAiUsage from '@/components/AdminAiUsage.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

type ModelType = 'QUICK' | 'LONG'

interface AiModel {
  id: string
  slug: string
  name: string
  providerType: string
  modelType: ModelType
  enabled: boolean
  providerDisabled?: boolean
}

interface AiModelGrant {
  id: string
  aiModelId: string
  createdAt: string
  aiModel: AiModel
}

interface AdminUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  hasCompletedOnboarding: boolean
  createdAt: string
  updatedAt: string
  projectsOwned: any[]
  projectAccess: any[]
  aiModelGrants: AiModelGrant[]
  _count: { projectsOwned: number; projectAccess: number; media: number }
}

const route = useRoute(); const router = useRouter(); const toast = useToast()
const loading = ref(true); const saving = ref(false); const editing = ref(false); const user = ref<AdminUser | null>(null)
const modelCatalog = ref<AiModel[]>([]); const selectedModelIds = ref<string[]>([]); const savingModelAccess = ref(false); const modelAccessError = ref('')
const form = reactive({ name: '', email: '', isAdmin: false, hasCompletedOnboarding: false })
const modelTypes: { type: ModelType; label: string }[] = [{ type: 'QUICK', label: 'Quick models' }, { type: 'LONG', label: 'Long models' }]
const stats = computed(() => user.value ? [
  { label: 'Owned portfolios', value: user.value._count.projectsOwned },
  { label: 'Memberships', value: user.value._count.projectAccess },
  { label: 'Media files', value: user.value._count.media }
] : [])
const modelsIncludingMissingGrants = computed(() => {
  const catalogIds = new Set(modelCatalog.value.map(model => model.id))
  const missingGrantedModels = (user.value?.aiModelGrants || [])
    .filter(grant => !catalogIds.has(grant.aiModelId))
    .map(grant => ({ ...grant.aiModel, providerDisabled: false }))
  return [...modelCatalog.value, ...missingGrantedModels]
})
const modelGroups = computed(() => modelTypes.map(group => ({
  ...group,
  models: modelsIncludingMissingGrants.value.filter(model => model.modelType === group.type)
})))
const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })
const isSelected = (modelId: string) => selectedModelIds.value.includes(modelId)
const isUnavailable = (model: AiModel) => !model.enabled || !!model.providerDisabled
const unavailableLabel = (model: AiModel) => {
  if (!model.enabled && model.providerDisabled) return 'Model and provider disabled'
  return model.providerDisabled ? 'Provider disabled' : 'Model disabled'
}
const synchronizeSelectedModelIds = () => {
  selectedModelIds.value = (user.value?.aiModelGrants || []).map(grant => grant.aiModelId)
}
const errorMessage = (error: any, fallback: string) => error.response?.data?.message || error.response?.data?.error || error.message || fallback
const load = async () => {
  loading.value = true
  modelAccessError.value = ''
  try {
    const [userResult, catalogResult] = await Promise.allSettled([
      api.get(`/admin/users/${route.params.id}`),
      api.get('/admin/users/ai-model-catalog')
    ])
    if (userResult.status === 'rejected') throw userResult.reason

    const userData = userResult.value.data as AdminUser
    user.value = userData
    Object.assign(form, {
      name: userData.name,
      email: userData.email,
      isAdmin: userData.isAdmin,
      hasCompletedOnboarding: userData.hasCompletedOnboarding
    })
    synchronizeSelectedModelIds()

    if (catalogResult.status === 'fulfilled') {
      modelCatalog.value = catalogResult.value.data.models || []
    } else {
      modelCatalog.value = []
      modelAccessError.value = errorMessage(catalogResult.reason, 'Failed to load AI model catalog')
      toast.error(modelAccessError.value)
    }
  } catch (error: any) {
    toast.error(errorMessage(error, 'Failed to load user'))
  } finally {
    loading.value = false
  }
}
const saveUser = async () => { try { saving.value = true; const { data } = await api.put(`/admin/users/${route.params.id}`, form); user.value = user.value ? { ...user.value, ...data } : data; editing.value = false; toast.success('User updated') } catch (error: any) { toast.error(errorMessage(error, 'Failed to update user')) } finally { saving.value = false } }
const saveModelAccess = async () => {
  modelAccessError.value = ''
  try {
    savingModelAccess.value = true
    const { data } = await api.put(`/admin/users/${route.params.id}/ai-model-grants`, { modelIds: selectedModelIds.value })
    if (user.value) user.value.aiModelGrants = data.aiModelGrants || []
    synchronizeSelectedModelIds()
    toast.success('Model access saved')
    await load()
  } catch (error: any) {
    modelAccessError.value = errorMessage(error, 'Failed to save model access')
    toast.error(modelAccessError.value)
  } finally {
    savingModelAccess.value = false
  }
}
onMounted(load)
</script>
