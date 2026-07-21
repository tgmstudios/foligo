<template>
  <div class="max-w-7xl">
    <div class="card p-6 mb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold text-white mb-1">GoApply Profile</h3>
          <p class="text-xs text-gray-400">
            These fields are what the GoApply extension autofills on job applications.
            The more you fill in, the fewer fields you'll need to touch by hand.
          </p>
        </div>
        <button
          type="submit"
          form="goapply-profile-form"
          :disabled="store.isSaving"
          class="shrink-0 px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {{ store.isSaving ? 'Saving...' : 'Save Profile' }}
        </button>
      </div>
    </div>

      <form id="goapply-profile-form" @submit.prevent="handleSave" class="profile-columns">
        <!-- Core identity (kept flat — used everywhere) -->
        <section class="card p-6 profile-card">
          <h4 class="section-title">Core Identity</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <input v-model="form.name" type="text" class="input" placeholder="John Doe" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input v-model="form.email" type="email" class="input" placeholder="john@example.com" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Phone</label>
            <PhoneNumberInput v-model="form.phone" v-model:country="form.phoneCountry" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Location</label>
            <input v-model="form.location" type="text" class="input" placeholder="San Francisco, CA" />
          </div>
        </div>
        </section>

        <!-- Job categories (hiring seasons) — shared with the browser extension's
             track dropdown via the profile's jobCategories field. -->
        <section class="card p-6 profile-card">
          <h4 class="section-title">Job Categories (hiring seasons)</h4>
          <p class="text-xs text-gray-500 mb-3">Group applications by hiring season. These become the category options when tracking a job from the extension.</p>
          <div class="flex flex-wrap gap-2 mb-3">
            <span v-for="cat in (form.jobCategories || [])" :key="cat" class="inline-flex items-center gap-1 rounded-full bg-primary-900/60 px-2 py-1 text-xs text-primary-200">
              {{ cat }}
              <button type="button" class="text-primary-400 hover:text-white" :aria-label="`Remove ${cat}`" @click="removeCategory(cat)">×</button>
            </span>
            <span v-if="!(form.jobCategories || []).length" class="text-xs text-gray-500">No categories yet.</span>
          </div>
          <div class="flex gap-2">
            <input v-model="categoryInput" type="text" class="input" placeholder="e.g. Summer 2026 Internships" @keydown.enter.prevent="addCategory" />
            <button type="button" class="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 whitespace-nowrap" @click="addCategory">Add</button>
          </div>
          <p class="mt-2 text-xs text-gray-500">Remember to Save to apply category changes.</p>
        </section>

        <!-- Education — fully driven by linking (or quick-creating) existing portfolio
             entries; highestDegree/school/discipline/etc. are derived from these, not
             retyped here. -->
        <section class="card p-6 profile-card">
          <h4 class="section-title">Education</h4>
          <ExperienceLinker category="EDUCATION" v-model="form.linkedEducation" />
        </section>

        <!-- Experience — same deal: currentCompany/currentTitle/etc. are derived from
             whichever linked job is current (or most recent). -->
        <section class="card p-6 profile-card">
          <h4 class="section-title">Experience</h4>
          <ExperienceLinker category="JOB" v-model="form.linkedJobs" />
        </section>

        <!-- Generated sections -->
        <section v-for="section in sections" :key="section.title" class="card p-6 profile-card">
          <h4 class="section-title">
            {{ section.title }}
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="f in section.fields" :key="f.key">
              <label class="block text-sm font-medium text-gray-300 mb-1">{{ f.label }}</label>
              <AddressAutocomplete
                v-if="f.key === 'address'"
                v-model="form.address"
                @selected="applyAddress"
              />
              <select v-else-if="f.options" v-model="(form as any)[f.key]" class="input">
                <option value="">{{ f.emptyLabel || 'Select an option' }}</option>
                <option v-for="option in f.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <input
                v-else
                v-model="(form as any)[f.key]"
                :type="f.type || 'text'"
                class="input"
                :placeholder="f.placeholder || `Enter ${f.label.toLowerCase()}`"
                :pattern="f.type === 'url' ? URL_PATTERN : undefined"
                :title="f.type === 'url' ? URL_HELP : undefined"
                @blur="f.type === 'url' && normalizeUrlField(f.key)"
              />
            </div>
          </div>
        </section>

        <!-- EEO / voluntary disclosures -->
        <section class="card p-6 profile-card">
          <h4 class="section-title mb-1">
            EEO Disclosures <span class="text-gray-500 font-normal">(optional, voluntary)</span>
          </h4>
          <p class="text-xs text-gray-500 mb-3">
            Some applications ask these for equal-opportunity reporting. Leave blank to answer
            "Prefer not to say" by default.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div v-for="f in eeoFields" :key="f.key">
              <label class="block text-sm font-medium text-gray-300 mb-1">{{ f.label }}</label>
              <select v-model="(form as any)[f.key]" class="input">
                <option value="">Prefer not to say</option>
                <option v-for="option in f.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
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
        </section>

        <!-- Skills -->
        <section class="card p-6 profile-card">
          <h4 class="section-title">Skills</h4>
          <SkillsPicker v-model="form.linkedSkills" />
        </section>

      </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useGoApplyStore, type GoApplyProfile } from '@/stores/goapply'
import ExperienceLinker from '@/components/goapply/ExperienceLinker.vue'
import SkillsPicker from '@/components/goapply/SkillsPicker.vue'
import PhoneNumberInput from '@/components/goapply/PhoneNumberInput.vue'
import AddressAutocomplete from '@/components/goapply/AddressAutocomplete.vue'

const store = useGoApplyStore()
const URL_PATTERN = 'https?://.+'
const URL_HELP = 'Enter a complete HTTP or HTTPS URL.'

const SELECT_DEFAULTS: Partial<GoApplyProfile> = {
  phoneType: 'Mobile',
  phoneCountry: 'US',
  pronouns: '',
  workAuthUS: '',
  sponsorshipRequired: '',
  gender: '',
  ethnicity: '',
  hispanicLatino: '',
  veteranStatus: '',
  disabilityStatus: '',
  lgbtStatus: '',
  over18: undefined,
  over21: undefined,
  hasDriversLicense: undefined,
}

const form = reactive<GoApplyProfile>({
  name: '',
  email: '',
  phone: '',
  ...SELECT_DEFAULTS,
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  linkedJobs: [],
  linkedEducation: [],
  linkedSkills: [],
  jobCategories: [],
})

const categoryInput = ref('')
function addCategory() {
  const name = categoryInput.value.trim()
  if (!name) return
  const existing = form.jobCategories || []
  if (!existing.some(c => c.toLowerCase() === name.toLowerCase())) {
    form.jobCategories = [...existing, name]
  }
  categoryInput.value = ''
}
function removeCategory(name: string) {
  form.jobCategories = (form.jobCategories || []).filter(c => c !== name)
}

// Field groups mirror the extension's autofill field taxonomy (Personal Info,
// Location, Education, Experience, Work Authorization, Social & Links, Other)
// so every field GoApply can fill on a job application has somewhere to live.
interface FieldDef {
  key: keyof GoApplyProfile
  label: string
  type?: string
  placeholder?: string
  emptyLabel?: string
  options?: SelectOption[]
}

interface SelectOption {
  value: string
  label: string
}

const YES_NO_OPTIONS: SelectOption[] = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

const sections: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Personal Information',
    fields: [
      { key: 'firstName', label: 'First Name', placeholder: 'John' },
      { key: 'lastName', label: 'Last Name', placeholder: 'Doe' },
      { key: 'middleName', label: 'Middle Name' },
      { key: 'preferredName', label: 'Preferred Name' },
      { key: 'username', label: 'Username' },
      { key: 'phoneType', label: 'Phone Type', options: [
        { value: 'Mobile', label: 'Mobile' },
        { value: 'Home', label: 'Home' },
        { value: 'Work', label: 'Work' },
        { value: 'Other', label: 'Other' },
      ] },
      { key: 'birthday', label: 'Birthday', type: 'date' },
      { key: 'pronouns', label: 'Pronouns', emptyLabel: 'Prefer not to say', options: [
        { value: 'she/her', label: 'She / Her' },
        { value: 'he/him', label: 'He / Him' },
        { value: 'they/them', label: 'They / Them' },
        { value: 'she/they', label: 'She / They' },
        { value: 'he/they', label: 'He / They' },
      ] },
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
    title: 'Work Authorization',
    fields: [
      { key: 'workAuthUS', label: 'Authorized to Work in the US', emptyLabel: 'Select an answer', options: YES_NO_OPTIONS },
      { key: 'workAuth', label: 'Work Authorization (Other Country)' },
      { key: 'sponsorshipRequired', label: 'Require Sponsorship', emptyLabel: 'Select an answer', options: YES_NO_OPTIONS },
    ],
  },
  {
    title: 'Social & Links',
    fields: [
      { key: 'linkedin', label: 'LinkedIn URL', type: 'url', placeholder: 'https://linkedin.com/in/...' },
      { key: 'github', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/...' },
      { key: 'portfolio', label: 'Portfolio URL', type: 'url', placeholder: 'https://yourportfolio.com' },
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

const eeoFields: FieldDef[] = [
  { key: 'gender', label: 'Gender', options: [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Non-binary', label: 'Non-binary' },
    { value: 'Other', label: 'Other' },
  ] },
  { key: 'ethnicity', label: 'Race / Ethnicity', options: [
    { value: 'American Indian or Alaska Native', label: 'American Indian or Alaska Native' },
    { value: 'Asian', label: 'Asian' },
    { value: 'Black or African American', label: 'Black or African American' },
    { value: 'Native Hawaiian or Other Pacific Islander', label: 'Native Hawaiian or Other Pacific Islander' },
    { value: 'White', label: 'White' },
    { value: 'Two or more races', label: 'Two or more races' },
  ] },
  { key: 'hispanicLatino', label: 'Hispanic / Latino', options: YES_NO_OPTIONS },
  { key: 'veteranStatus', label: 'Veteran Status', options: [
    { value: 'I am a protected veteran', label: 'I am a protected veteran' },
    { value: 'I am not a protected veteran', label: 'I am not a protected veteran' },
  ] },
  { key: 'disabilityStatus', label: 'Disability Status', options: [
    { value: 'Yes, I have a disability', label: 'Yes, I have a disability' },
    { value: 'No, I do not have a disability', label: 'No, I do not have a disability' },
  ] },
  { key: 'lgbtStatus', label: 'LGBT+', options: YES_NO_OPTIONS },
]

// Tri-state (yes/no/unset) selects backed by Boolean|undefined fields
function boolSelectModel(key: 'over18' | 'over21' | 'hasDriversLicense') {
  return computed<string>({
    get: () => (form[key] === true ? 'yes' : form[key] === false ? 'no' : ''),
    set: (v: string) => {
      form[key] = v === 'yes' ? true : v === 'no' ? false : undefined
    },
  })
}
const over18Model = boolSelectModel('over18')
const over21Model = boolSelectModel('over21')
const hasDriversLicenseModel = boolSelectModel('hasDriversLicense')

function normalizeUrlField(key: keyof GoApplyProfile) {
  const value = form[key]
  if (typeof value !== 'string' || !value.trim()) return
  const normalized = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
  ;(form as any)[key] = normalized
}

function applyAddress(address: {
  label: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}) {
  form.address = address.address
  form.city = address.city
  form.state = address.state
  form.postalCode = address.postalCode
  form.country = address.country
  form.location = [address.city, address.state, address.country].filter(Boolean).join(', ') || address.label
}

// Populate form when profile loads. highestDegree/school/currentCompany/skills/etc.
// come along in `p` as server-derived values (see computeDerivedFields in
// api/src/routes/goapply.js) — they're read-only display data, not part of `form`.
watch(
  () => store.profile,
  (p) => {
    if (!p) return
    Object.assign(form, p)
    for (const [key, value] of Object.entries(SELECT_DEFAULTS)) {
      const current = (form as any)[key]
      if (current === null || current === undefined || (typeof value === 'string' && value && !current)) {
        ;(form as any)[key] = value
      }
    }
    form.linkedJobs = [...(p.linkedJobs || [])]
    form.linkedEducation = [...(p.linkedEducation || [])]
    form.linkedSkills = [...(p.linkedSkills || [])]
  },
  { immediate: true }
)

async function handleSave() {
  // linkedJobs/linkedEducation/linkedSkills are persisted immediately by
  // ExperienceLinker/SkillsPicker via their own endpoints — don't round-trip those
  // (or the derived highestDegree/school/currentCompany/etc. fields) through the flat
  // profile PUT, which no longer accepts them.
  const { linkedJobs, linkedEducation, linkedSkills, ...rest } = form
  await store.saveProfile(rest as GoApplyProfile)
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500;
}
.section-title {
  @apply text-sm font-semibold text-gray-200 mb-3 pb-2 border-b border-gray-700;
}
.profile-columns {
  column-count: 1;
  column-gap: 1.5rem;
}
.profile-card {
  display: inline-block;
  width: 100%;
  margin-bottom: 1.5rem;
  break-inside: avoid;
  vertical-align: top;
}
@media (min-width: 1024px) {
  .profile-columns { column-count: 2; }
}
</style>
