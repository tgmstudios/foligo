<template>
  <div class="space-y-6">
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-white">Step 4: Review & Edit</h2>
        <button
          @click="$emit('back')"
          class="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back
        </button>
      </div>

      <!-- Summary Section -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Professional Summary
        </label>
        <div class="flex space-x-2">
          <textarea
            :value="editedResumeData.summary"
            @input="updateField('summary', ($event.target as HTMLTextAreaElement).value)"
            rows="4"
            class="flex-1 px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          ></textarea>
          <button
            @click="$emit('improve-text', 'summary')"
            :disabled="isImproving"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <span v-if="isImproving">Improving...</span>
            <span v-else>✨ AI Improve</span>
          </button>
        </div>
      </div>

      <!-- Education Section -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-2">Education</label>
        <div class="space-y-3">
          <div
            v-for="(edu, index) in editedResumeData.education"
            :key="index"
            class="border border-gray-700 rounded-lg p-4"
          >
            <div class="flex items-center space-x-3 mb-3">
              <input 
                type="checkbox" 
                :checked="edu.enabled"
                @change="updateEducationField(index, 'enabled', ($event.target as HTMLInputElement).checked)"
                class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded" 
              />
              <input 
                :value="edu.institution"
                @input="updateEducationField(index, 'institution', ($event.target as HTMLInputElement).value)"
                placeholder="Institution" 
                class="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white" 
              />
              <button @click="$emit('remove-education', index)" class="text-gray-400 hover:text-red-400">×</button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input 
                :value="edu.degree"
                @input="updateEducationField(index, 'degree', ($event.target as HTMLInputElement).value)"
                placeholder="Degree" 
                class="px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white" 
              />
              <input 
                :value="edu.date"
                @input="updateEducationField(index, 'date', ($event.target as HTMLInputElement).value)"
                placeholder="Date" 
                class="px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white" 
              />
            </div>
            <input 
              :value="edu.details"
              @input="updateEducationField(index, 'details', ($event.target as HTMLInputElement).value)"
              placeholder="Details (GPA, honors, etc.)" 
              class="mt-2 w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white" 
            />
          </div>
          <button @click="$emit('add-education')" class="text-sm px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">+ Add Education</button>
        </div>
      </div>

      <!-- Experience Section -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-2">Professional Experience</label>
        <div class="space-y-4">
          <div
            v-for="(exp, expIndex) in editedResumeData.experience"
            :key="expIndex"
            class="border border-gray-700 rounded-lg p-4"
          >
            <div class="flex items-center space-x-3 mb-3">
              <input 
                type="checkbox" 
                :checked="exp.enabled"
                @change="updateExperienceField(expIndex, 'enabled', ($event.target as HTMLInputElement).checked)"
                class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded" 
              />
              <input 
                :value="exp.company"
                @input="updateExperienceField(expIndex, 'company', ($event.target as HTMLInputElement).value)"
                placeholder="Company" 
                class="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white font-medium" 
              />
              <input 
                :value="exp.location"
                @input="updateExperienceField(expIndex, 'location', ($event.target as HTMLInputElement).value)"
                placeholder="Location" 
                class="px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white" 
              />
              <button @click="$emit('remove-experience', expIndex)" class="text-gray-400 hover:text-red-400">×</button>
            </div>
            <input 
              :value="exp.description"
              @input="updateExperienceField(expIndex, 'description', ($event.target as HTMLInputElement).value)"
              placeholder="Company description" 
              class="w-full mb-3 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm" 
            />
            <div class="space-y-3 ml-7">
              <div
                v-for="(role, roleIndex) in exp.roles"
                :key="roleIndex"
                class="border-l-2 border-gray-600 pl-3"
              >
                <div class="flex items-center space-x-2 mb-2">
                  <input 
                    type="checkbox" 
                    :checked="role.enabled"
                    @change="updateRoleField(expIndex, roleIndex, 'enabled', ($event.target as HTMLInputElement).checked)"
                    class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded" 
                  />
                  <input 
                    :value="role.title"
                    @input="updateRoleField(expIndex, roleIndex, 'title', ($event.target as HTMLInputElement).value)"
                    placeholder="Job Title" 
                    class="flex-1 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-white text-sm" 
                  />
                  <input 
                    :value="role.dateRange"
                    @input="updateRoleField(expIndex, roleIndex, 'dateRange', ($event.target as HTMLInputElement).value)"
                    placeholder="Date Range" 
                    class="px-2 py-1 border border-gray-600 rounded bg-gray-800 text-white text-sm w-32" 
                  />
                  <button @click="$emit('remove-role', expIndex, roleIndex)" class="text-gray-400 hover:text-red-400 text-sm">×</button>
                </div>
                <div class="space-y-1">
                  <div
                    v-for="(bullet, bulletIndex) in role.bullets"
                    :key="bulletIndex"
                    class="flex items-start space-x-2"
                  >
                    <span class="text-gray-400 mt-1">•</span>
                    <textarea
                      :value="bullet"
                      @input="updateBullet(expIndex, roleIndex, bulletIndex, ($event.target as HTMLTextAreaElement).value)"
                      rows="1"
                      class="flex-1 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-white text-sm resize-none"
                      placeholder="Bullet point"
                    ></textarea>
                    <button @click="$emit('remove-bullet', expIndex, roleIndex, bulletIndex)" class="text-gray-400 hover:text-red-400 text-sm">×</button>
                  </div>
                  <button @click="$emit('add-bullet', expIndex, roleIndex)" class="text-xs text-gray-400 hover:text-gray-300 ml-4">+ Add Bullet</button>
                </div>
              </div>
              <button @click="$emit('add-role', expIndex)" class="text-sm text-gray-400 hover:text-gray-300 ml-4">+ Add Role</button>
            </div>
          </div>
          <button @click="$emit('add-experience')" class="text-sm px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">+ Add Experience</button>
        </div>
      </div>

      <!-- Projects Section -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-2">Technical Projects</label>
        <div class="space-y-3">
          <div
            v-for="(project, index) in editedResumeData.projects"
            :key="index"
            class="border border-gray-700 rounded-lg p-4"
          >
            <div class="flex items-center space-x-3 mb-3">
              <input 
                type="checkbox" 
                :checked="project.enabled"
                @change="updateProjectField(index, 'enabled', ($event.target as HTMLInputElement).checked)"
                class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded" 
              />
              <input 
                :value="project.title"
                @input="updateProjectField(index, 'title', ($event.target as HTMLInputElement).value)"
                placeholder="Project title" 
                class="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white font-medium" 
              />
              <button @click="$emit('remove-project', index)" class="text-gray-400 hover:text-red-400">×</button>
            </div>
            <div class="space-y-1 ml-7">
              <div
                v-for="(bullet, bulletIndex) in project.bullets"
                :key="bulletIndex"
                class="flex items-start space-x-2"
              >
                <span class="text-gray-400 mt-1">•</span>
                <textarea
                  :value="bullet"
                  @input="updateProjectBullet(index, bulletIndex, ($event.target as HTMLTextAreaElement).value)"
                  rows="1"
                  class="flex-1 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-white text-sm resize-none"
                  placeholder="Bullet point"
                ></textarea>
                <button @click="$emit('remove-project-bullet', index, bulletIndex)" class="text-gray-400 hover:text-red-400 text-sm">×</button>
              </div>
              <button @click="$emit('add-project-bullet', index)" class="text-xs text-gray-400 hover:text-gray-300 ml-4">+ Add Bullet</button>
            </div>
          </div>
          <button @click="$emit('add-project')" class="text-sm px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">+ Add Project</button>
        </div>
      </div>

      <!-- Proficiencies Section -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-2">Technical Proficiencies</label>
        <div class="space-y-3">
          <div
            v-for="(prof, profIndex) in editedResumeData.proficiencies"
            :key="profIndex"
            class="border border-gray-700 rounded-lg p-4"
          >
            <div class="flex items-center space-x-3 mb-2">
              <input 
                type="checkbox" 
                :checked="prof.enabled"
                @change="updateProficiencyField(profIndex, 'enabled', ($event.target as HTMLInputElement).checked)"
                class="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded" 
              />
              <input 
                :value="prof.category"
                @input="updateProficiencyField(profIndex, 'category', ($event.target as HTMLInputElement).value)"
                placeholder="Category name" 
                class="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white font-medium" 
              />
              <button @click="$emit('remove-proficiency-category', profIndex)" class="text-gray-400 hover:text-red-400">×</button>
            </div>
            <div class="space-y-1">
              <div
                v-for="(skill, skillIndex) in prof.skills"
                :key="skillIndex"
                class="flex items-center space-x-2"
              >
                <input 
                  :value="skill"
                  @input="updateSkill(profIndex, skillIndex, ($event.target as HTMLInputElement).value)"
                  placeholder="Skill" 
                  class="flex-1 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-white text-sm" 
                />
                <button @click="$emit('remove-skill', profIndex, skillIndex)" class="text-gray-400 hover:text-red-400 text-sm">×</button>
              </div>
              <button @click="$emit('add-skill', profIndex)" class="text-xs text-gray-400 hover:text-gray-300">+ Add Skill</button>
            </div>
          </div>
          <button @click="$emit('add-proficiency-category')" class="text-sm px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">+ Add Category</button>
        </div>
      </div>

      <!-- Honors Section -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-300 mb-2">Honors & Leadership</label>
        <div class="space-y-2">
          <div
            v-for="(honor, index) in editedResumeData.honors"
            :key="index"
            class="flex items-center space-x-2"
          >
            <span class="text-gray-400">•</span>
            <input 
              :value="honor"
              @input="updateHonor(index, ($event.target as HTMLInputElement).value)"
              placeholder="Honor or award" 
              class="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white" 
            />
            <button @click="$emit('remove-honor', index)" class="text-gray-400 hover:text-red-400">×</button>
          </div>
          <button @click="$emit('add-honor')" class="text-sm px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">+ Add Honor</button>
        </div>
      </div>
    </div>

    <!-- Generate Final Resume -->
    <div class="flex justify-between items-center">
      <button
        @click="$emit('show-save-modal')"
        class="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
      >
        💾 Save to History
      </button>
      <div class="flex space-x-4">
        <button
          @click="$emit('back')"
          class="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          @click="$emit('render')"
          :disabled="isRendering"
          class="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <span v-if="isRendering">Rendering...</span>
          <span v-else>Generate Final Resume</span>
          <svg v-if="isRendering" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ResumeData } from '@/composables/useResumeEditing'

const props = defineProps<{
  editedResumeData: ResumeData
  isImproving: boolean
  isRendering: boolean
}>()

const emit = defineEmits<{
  back: []
  'show-save-modal': []
  render: []
  'improve-text': [field: string]
  'update:summary': [value: string]
  'add-education': []
  'remove-education': [index: number]
  'update-education': [index: number, field: string, value: any]
  'add-experience': []
  'remove-experience': [index: number]
  'update-experience': [index: number, field: string, value: any]
  'add-role': [expIndex: number]
  'remove-role': [expIndex: number, roleIndex: number]
  'update-role': [expIndex: number, roleIndex: number, field: string, value: any]
  'add-bullet': [expIndex: number, roleIndex: number]
  'remove-bullet': [expIndex: number, roleIndex: number, bulletIndex: number]
  'update-bullet': [expIndex: number, roleIndex: number, bulletIndex: number, value: string]
  'add-project': []
  'remove-project': [index: number]
  'update-project': [index: number, field: string, value: any]
  'add-project-bullet': [index: number]
  'remove-project-bullet': [index: number, bulletIndex: number]
  'update-project-bullet': [index: number, bulletIndex: number, value: string]
  'add-proficiency-category': []
  'remove-proficiency-category': [index: number]
  'update-proficiency': [index: number, field: string, value: any]
  'add-skill': [profIndex: number]
  'remove-skill': [profIndex: number, skillIndex: number]
  'update-skill': [profIndex: number, skillIndex: number, value: string]
  'add-honor': []
  'remove-honor': [index: number]
  'update-honor': [index: number, value: string]
}>()

const updateField = (field: string, value: any) => {
  if (field === 'summary') {
    emit('update:summary', value)
  }
}

const updateEducationField = (index: number, field: string, value: any) => {
  emit('update-education', index, field, value)
}

const updateExperienceField = (index: number, field: string, value: any) => {
  emit('update-experience', index, field, value)
}

const updateRoleField = (expIndex: number, roleIndex: number, field: string, value: any) => {
  emit('update-role', expIndex, roleIndex, field, value)
}

const updateBullet = (expIndex: number, roleIndex: number, bulletIndex: number, value: string) => {
  emit('update-bullet', expIndex, roleIndex, bulletIndex, value)
}

const updateProjectField = (index: number, field: string, value: any) => {
  emit('update-project', index, field, value)
}

const updateProjectBullet = (index: number, bulletIndex: number, value: string) => {
  emit('update-project-bullet', index, bulletIndex, value)
}

const updateProficiencyField = (index: number, field: string, value: any) => {
  emit('update-proficiency', index, field, value)
}

const updateSkill = (profIndex: number, skillIndex: number, value: string) => {
  emit('update-skill', profIndex, skillIndex, value)
}

const updateHonor = (index: number, value: string) => {
  emit('update-honor', index, value)
}
</script>

<style scoped>
.card {
  @apply bg-gray-800 rounded-lg p-6 border border-gray-700;
}
</style>

