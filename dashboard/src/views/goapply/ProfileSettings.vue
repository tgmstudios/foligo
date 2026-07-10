<template>
  <div>
    <div class="card p-6 max-w-2xl">
      <h3 class="text-lg font-semibold text-white mb-6">GoApply Profile</h3>

      <form @submit.prevent="handleSave" class="space-y-5">
        <!-- Name -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <!-- Phone -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Phone</label>
            <input
              v-model="form.phone"
              type="tel"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Location</label>
            <input
              v-model="form.location"
              type="text"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="San Francisco, CA"
            />
          </div>
        </div>

        <!-- LinkedIn -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">LinkedIn URL</label>
          <input
            v-model="form.linkedin"
            type="url"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <!-- GitHub -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">GitHub URL</label>
          <input
            v-model="form.github"
            type="url"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://github.com/..."
          />
        </div>

        <!-- Portfolio -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Portfolio URL</label>
          <input
            v-model="form.portfolio"
            type="url"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://yourportfolio.com"
          />
        </div>

        <!-- Skills -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Skills</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="(skill, idx) in form.skills"
              :key="idx"
              class="inline-flex items-center gap-1 px-3 py-1 bg-primary-600/20 text-primary-300 rounded-full text-xs font-medium"
            >
              {{ skill }}
              <button
                @click="removeSkill(idx)"
                class="text-primary-300 hover:text-white transition-colors"
              >
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="skillInput"
              type="text"
              class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Add a skill..."
              @keydown.enter.prevent="addSkill"
            />
            <button
              type="button"
              @click="addSkill"
              class="px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="store.isSaving"
            class="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {{ store.isSaving ? 'Saving...' : 'Save Profile' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useGoApplyStore, type GoApplyProfile } from '@/stores/goapply'

const store = useGoApplyStore()

const form = reactive<GoApplyProfile>({
  name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  skills: [],
})

const skillInput = ref('')

// Populate form when profile loads
watch(
  () => store.profile,
  (p) => {
    if (p) {
      form.name = p.name || ''
      form.email = p.email || ''
      form.phone = p.phone || ''
      form.location = p.location || ''
      form.linkedin = p.linkedin || ''
      form.github = p.github || ''
      form.portfolio = p.portfolio || ''
      form.skills = [...(p.skills || [])]
    }
  },
  { immediate: true }
)

function addSkill() {
  const s = skillInput.value.trim()
  if (s && !form.skills.includes(s)) {
    form.skills.push(s)
  }
  skillInput.value = ''
}

function removeSkill(idx: number) {
  form.skills.splice(idx, 1)
}

async function handleSave() {
  await store.saveProfile({ ...form })
}
</script>
