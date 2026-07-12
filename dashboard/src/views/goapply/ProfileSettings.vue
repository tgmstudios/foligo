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

        <!-- Education — fully driven by linking (or quick-creating) existing portfolio
             entries; highestDegree/school/discipline/etc. are derived from these, not
             retyped here. -->
        <div>
          <h4 class="text-sm font-semibold text-gray-200 mb-3 pb-1 border-b border-gray-700">Education</h4>
          <ExperienceLinker category="EDUCATION" v-model="form.linkedEducation" />
        </div>

        <!-- Experience — same deal: currentCompany/currentTitle/etc. are derived from
             whichever linked job is current (or most recent). -->
        <div>
          <h4 class="text-sm font-semibold text-gray-200 mb-3 pb-1 border-b border-gray-700">Experience</h4>
          <ExperienceLinker category="JOB" v-model="form.linkedJobs" />
        </div>

        <!-- Generated sections -->
        <div v-for="section in sections" :key="section.title">
          <h4 class="text-sm font-semibold text-gray-200 mb-3 pb-1 border-b border-gray-700">
            {{ section.title }}
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="f in section.fields" :key="f.key">
              <label class="block text-sm font-medium text-gray-300 mb-1">{{ f.label }}</label>
              <select v-if="f.options" v-model="(form as any)[f.key]" class="input">
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
          <SkillsPicker v-model="form.linkedSkills" />
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
import { reactive, computed, watch } from 'vue'
import { useGoApplyStore, type GoApplyProfile } from '@/stores/goapply'
import ExperienceLinker from '@/components/goapply/ExperienceLinker.vue'
import SkillsPicker from '@/components/goapply/SkillsPicker.vue'

const store = useGoApplyStore()

const form = reactive<GoApplyProfile>({
  name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  linkedJobs: [],
  linkedEducation: [],
  linkedSkills: [],
})

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
      { key: 'phoneCountry', label: 'Phone Country', placeholder: 'US' },
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

// Populate form when profile loads. highestDegree/school/currentCompany/skills/etc.
// come along in `p` as server-derived values (see computeDerivedFields in
// api/src/routes/goapply.js) — they're read-only display data, not part of `form`.
watch(
  () => store.profile,
  (p) => {
    if (!p) return
    Object.assign(form, p)
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
</style>
