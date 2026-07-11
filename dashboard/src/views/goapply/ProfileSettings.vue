<template>
  <div>
    <div class="card p-6 max-w-2xl">
      <h3 class="text-lg font-semibold text-white mb-1">GoApply Profile</h3>
      <p class="text-xs text-gray-400 mb-6">
        These fields are what the GoApply extension autofills on job applications.
        The more you fill in, the fewer fields you'll need to touch by hand.
      </p>

      <form @submit.prevent="handleSave" class="space-y-8">
        <!-- Core identity (kept flat — used everywhere) -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <input v-model="form.name" type="text" class="input" placeholder="John Doe" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input v-model="form.email" type="email" class="input" placeholder="john@example.com" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Phone</label>
            <input v-model="form.phone" type="tel" class="input" placeholder="(555) 123-4567" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Location</label>
            <input v-model="form.location" type="text" class="input" placeholder="San Francisco, CA" />
          </div>
        </div>

        <!-- Generated sections -->
        <div v-for="section in sections" :key="section.title">
          <h4 class="text-sm font-semibold text-gray-200 mb-3 pb-1 border-b border-gray-700">
            {{ section.title }}
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="f in section.fields" :key="f.key">
              <label class="block text-sm font-medium text-gray-300 mb-1">{{ f.label }}</label>
              <input
                v-model="(form as any)[f.key]"
                :type="f.type || 'text'"
                class="input"
                :placeholder="f.placeholder || ''"
              />
            </div>
          </div>
        </div>

        <!-- EEO / voluntary disclosures -->
        <div>
          <h4 class="text-sm font-semibold text-gray-200 mb-1 pb-1 border-b border-gray-700">
            EEO Disclosures <span class="text-gray-500 font-normal">(optional, voluntary)</span>
          </h4>
          <p class="text-xs text-gray-500 mb-3">
            Some applications ask these for equal-opportunity reporting. Leave blank to answer
            "Prefer not to say" by default.
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="f in eeoTextFields" :key="f.key">
              <label class="block text-sm font-medium text-gray-300 mb-1">{{ f.label }}</label>
              <input v-model="(form as any)[f.key]" type="text" class="input" placeholder="Prefer not to say" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Currently Employed</label>
              <select v-model="currentlyWorkingModel" class="input">
                <option value="">Prefer not to say</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Over 18</label>
              <select v-model="over18Model" class="input">
                <option value="">Prefer not to say</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Over 21</label>
              <select v-model="over21Model" class="input">
                <option value="">Prefer not to say</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Driver's License</label>
              <select v-model="hasDriversLicenseModel" class="input">
                <option value="">Prefer not to say</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Links (existing three + new taxonomy) -->
        <div>
          <h4 class="text-sm font-semibold text-gray-200 mb-3 pb-1 border-b border-gray-700">
            Core Links
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">LinkedIn URL</label>
              <input v-model="form.linkedin" type="url" class="input" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">GitHub URL</label>
              <input v-model="form.github" type="url" class="input" placeholder="https://github.com/..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Portfolio URL</label>
              <input v-model="form.portfolio" type="url" class="input" placeholder="https://yourportfolio.com" />
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div>
          <h4 class="text-sm font-semibold text-gray-200 mb-3 pb-1 border-b border-gray-700">Skills</h4>
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
              class="flex-1 input"
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
import { reactive, computed, watch, ref } from 'vue'
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

// Field groups mirror the extension's autofill field taxonomy (Personal Info,
// Location, Education, Experience, Work Authorization, Social & Links, Other)
// so every field GoApply can fill on a job application has somewhere to live.
interface FieldDef {
  key: keyof GoApplyProfile
  label: string
  type?: string
  placeholder?: string
}

const sections: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Personal Information',
    fields: [
      { key: 'firstName', label: 'First Name', placeholder: 'John' },
      { key: 'lastName', label: 'Last Name', placeholder: 'Doe' },
      { key: 'middleName', label: 'Middle Name' },
      { key: 'preferredName', label: 'Preferred Name' },
      { key: 'username', label: 'Username' },
      { key: 'phoneType', label: 'Phone Type', placeholder: 'Mobile' },
      { key: 'phoneCountry', label: 'Phone Country', placeholder: 'US' },
      { key: 'birthday', label: 'Birthday', type: 'date' },
      { key: 'pronouns', label: 'Pronouns', placeholder: 'she/her' },
    ],
  },
  {
    title: 'Location Details',
    fields: [
      { key: 'address', label: 'Address' },
      { key: 'address2', label: 'Address Line 2' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State / Province' },
      { key: 'country', label: 'Country / Region' },
      { key: 'postalCode', label: 'Postal Code' },
    ],
  },
  {
    title: 'Education',
    fields: [
      { key: 'highestDegree', label: 'Highest Degree', placeholder: "Bachelor's" },
      { key: 'school', label: 'School' },
      { key: 'discipline', label: 'Field of Study' },
      { key: 'gpa', label: 'GPA' },
    ],
  },
  {
    title: 'Experience',
    fields: [
      { key: 'currentCompany', label: 'Current Company' },
      { key: 'currentTitle', label: 'Current Title' },
      { key: 'yearsExperience', label: 'Years of Experience' },
    ],
  },
  {
    title: 'Work Authorization',
    fields: [
      { key: 'workAuthUS', label: 'Authorized to Work in the US', placeholder: 'Yes' },
      { key: 'workAuth', label: 'Work Authorization (Other Country)' },
      { key: 'sponsorshipRequired', label: 'Require Sponsorship', placeholder: 'No' },
    ],
  },
  {
    title: 'Social & Links',
    fields: [
      { key: 'twitter', label: 'Twitter / X URL', type: 'url' },
      { key: 'behance', label: 'Behance URL', type: 'url' },
      { key: 'dribbble', label: 'Dribbble URL', type: 'url' },
      { key: 'website', label: 'Personal Website', type: 'url' },
    ],
  },
  {
    title: 'Other',
    fields: [
      { key: 'desiredSalary', label: 'Desired Salary' },
      { key: 'referredBy', label: 'Referred By' },
      { key: 'source', label: 'How did you hear about us?' },
    ],
  },
]

const eeoTextFields: FieldDef[] = [
  { key: 'gender', label: 'Gender' },
  { key: 'ethnicity', label: 'Ethnicity' },
  { key: 'hispanicLatino', label: 'Hispanic / Latino' },
  { key: 'veteranStatus', label: 'Veteran Status' },
  { key: 'disabilityStatus', label: 'Disability Status' },
  { key: 'lgbtStatus', label: 'LGBT+' },
]

// Tri-state (yes/no/unset) selects backed by Boolean|undefined fields
function boolSelectModel(key: 'currentlyWorking' | 'over18' | 'over21' | 'hasDriversLicense') {
  return computed<string>({
    get: () => (form[key] === true ? 'yes' : form[key] === false ? 'no' : ''),
    set: (v: string) => {
      form[key] = v === 'yes' ? true : v === 'no' ? false : undefined
    },
  })
}
const currentlyWorkingModel = boolSelectModel('currentlyWorking')
const over18Model = boolSelectModel('over18')
const over21Model = boolSelectModel('over21')
const hasDriversLicenseModel = boolSelectModel('hasDriversLicense')

// Populate form when profile loads
watch(
  () => store.profile,
  (p) => {
    if (!p) return
    Object.assign(form, p)
    form.skills = [...(p.skills || [])]
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

<style scoped>
.input {
  @apply w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500;
}
</style>
