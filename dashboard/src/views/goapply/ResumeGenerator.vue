<template>
  <div class="p-6 flex gap-6">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">AI Resume Generator</h1>
          <p class="text-gray-400">Upload a template and select content to generate a tailored resume</p>
        </div>
        <div class="flex space-x-2">
          <button
            @click="showTemplateLibrary = !showTemplateLibrary"
            class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>Template Library</span>
          </button>
        </div>
      </div>

      <!-- Modals -->
      <TemplateLibraryModal
        :show="showTemplateLibrary"
        :templates="templates"
        @close="showTemplateLibrary = false"
        @select="loadTemplate"
        @delete="handleDeleteTemplate"
      />

    <PlaceholderGuideModal
      :show="showPlaceholderModal"
      @close="showPlaceholderModal = false"
    />

    <SaveTemplateModal
      :show="showSaveTemplateModal"
      :is-saving="templateSaving"
      @close="showSaveTemplateModal = false"
      @save="handleSaveTemplate"
    />

    <SaveResumeModal
      :show="showSaveResumeModal"
      :is-saving="historySaving"
      @close="showSaveResumeModal = false"
      @save="handleSaveResume"
    />

    <!-- Main Sections -->
    <TemplateUploadSection
      :template-id="templateId"
      :templates="templates"
      :selected-template-id="selectedTemplateId"
      :template-name="currentTemplateName"
      :template-description="currentTemplateDescription"
      :saved-template-id="savedTemplateId"
      :is-dragging="isDragging"
      @show-placeholder-guide="showPlaceholderModal = true"
      @template-selected="handleTemplateSelected"
      @show-save-template="showSaveTemplateModal = true"
      @clear-template="clearTemplate"
      @file-upload="handleTemplateUpload"
      @drag-state="isDragging = $event"
    />

    <ContentSelectionSection
      :show-preview="showPreview"
      :all-content-items="allContentItems"
      :selected-content-ids="selectedContentIds"
      :get-project-name="getProjectName"
      @toggle-content="handleToggleContent"
    />

    <JobDescriptionSection
      :show-preview="showPreview"
      v-model:job-description="jobDescription"
      v-model:resume-size="resumeSize"
    />

    <!-- Preview & Edit Step -->
    <ResumePreviewEditor
      v-if="showPreview"
      :edited-resume-data="editedResumeData"
      :is-improving="isImproving"
      :is-rendering="isRendering"
      @back="showPreview = false"
      @show-save-modal="showSaveResumeModal = true"
      @render="handleRenderFinalResume"
      @improve-text="handleImproveText"
      @update:summary="editedResumeData.summary = $event"
      @add-education="addEducation"
      @remove-education="removeEducation"
      @update-education="updateEducationField"
      @add-experience="addExperience"
      @remove-experience="removeExperience"
      @update-experience="updateExperienceField"
      @add-role="addRole"
      @remove-role="removeRole"
      @update-role="updateRoleField"
      @add-bullet="addBullet"
      @remove-bullet="removeBullet"
      @update-bullet="updateBullet"
      @add-project="addProject"
      @remove-project="removeProject"
      @update-project="updateProjectField"
      @add-project-bullet="addProjectBullet"
      @remove-project-bullet="removeProjectBullet"
      @update-project-bullet="updateProjectBullet"
      @add-proficiency-category="addProficiencyCategory"
      @remove-proficiency-category="removeProficiencyCategory"
      @update-proficiency="updateProficiencyField"
      @add-skill="addSkill"
      @remove-skill="removeSkill"
      @update-skill="updateSkill"
      @add-honor="addHonor"
      @remove-honor="removeHonor"
      @update-honor="updateHonor"
    />

      <!-- Step 4: Generate (Initial) -->
      <div v-if="!showPreview" class="flex justify-end space-x-4">
        <button
          @click="handleGenerateResume"
          :disabled="!canGenerate || isGenerating"
          class="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <span v-if="isGenerating">Generating...</span>
          <span v-else>Generate Resume</span>
          <svg v-if="isGenerating" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Right Sidebar for Resume History -->
    <div class="w-80 flex-shrink-0 bg-gray-900 border border-gray-700 rounded-lg flex flex-col sticky self-start" style="top: 5rem;">
      <!-- Sidebar Header -->
      <div class="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <h3 class="text-lg font-semibold text-white">Resume History</h3>
      </div>

      <!-- History List -->
      <div class="p-4 space-y-2">
        <div v-if="history.length === 0" class="text-center py-8 text-gray-400">
          <p class="text-sm">No resume history. Generate a resume to see it here.</p>
        </div>

        <div
          v-for="item in history"
          :key="item.id"
          @click="handleLoadFromHistory(item)"
          :class="[
            'p-3 rounded-lg cursor-pointer transition-all border',
            'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750 hover:border-gray-600'
          ]"
        >
          <div class="flex items-start justify-between mb-2">
            <h4 class="font-medium text-sm truncate flex-1 text-white">{{ item.name }}</h4>
            <button
              @click.stop="handleDeleteHistory(item.id)"
              class="ml-2 p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
              title="Delete resume"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>{{ item.resumeSize }}</span>
            <span>{{ formatDate(item.createdAt) }}</span>
          </div>
          <p class="text-xs text-gray-500 mb-1 line-clamp-2">{{ item.jobDescription.substring(0, 120) }}{{ item.jobDescription.length > 120 ? '...' : '' }}</p>
          <div v-if="item.template" class="mt-2 text-xs text-gray-500 truncate flex items-center">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ item.template.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '@/services/api'
import { useProjectStore } from '@/stores/projects'
import { useResumeTemplates } from '@/composables/useResumeTemplates'
import { useResumeHistory } from '@/composables/useResumeHistory'
import { useResumeEditing } from '@/composables/useResumeEditing'
import { useResumeGeneration } from '@/composables/useResumeGeneration'
import TemplateLibraryModal from '@/components/resume/TemplateLibraryModal.vue'
import PlaceholderGuideModal from '@/components/resume/PlaceholderGuideModal.vue'
import SaveTemplateModal from '@/components/resume/SaveTemplateModal.vue'
import SaveResumeModal from '@/components/resume/SaveResumeModal.vue'
import TemplateUploadSection from '@/components/resume/TemplateUploadSection.vue'
import ContentSelectionSection from '@/components/resume/ContentSelectionSection.vue'
import JobDescriptionSection from '@/components/resume/JobDescriptionSection.vue'
import ResumePreviewEditor from '@/components/resume/ResumePreviewEditor.vue'

// Helper to extract filename without extension
const getFileId = (filePath: string) => {
  const parts = filePath.split('/')
  const filename = parts[parts.length - 1]
  return filename.replace('.docx', '')
}

const toast = useToast()
const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

// Composables
const {
  templates,
  isSaving: templateSaving,
  fetchTemplates,
  saveTemplate,
  deleteTemplate: deleteTemplateFromLibrary
} = useResumeTemplates()

const {
  history,
  isSaving: historySaving,
  fetchHistory,
  saveToHistory,
  loadFromHistory,
  deleteHistory: deleteHistoryItem,
  formatDate
} = useResumeHistory()

const {
  editedResumeData,
  addEducation,
  removeEducation,
  addExperience,
  removeExperience,
  addRole,
  removeRole,
  addBullet,
  removeBullet,
  addProject,
  removeProject,
  addProjectBullet,
  removeProjectBullet,
  addProficiencyCategory,
  removeProficiencyCategory,
  addSkill,
  removeSkill,
  addHonor,
  removeHonor,
  prepareRenderData
} = useResumeEditing()

const {
  isGenerating,
  isRendering,
  isImproving,
  generateResumeContent,
  improveText: improveTextWithAI,
  renderResume,
  initializeResumeData
} = useResumeGeneration()

// State
const templateId = ref<string | null>(null)
const templatePath = ref<string | null>(null)
const selectedContentIds = ref<string[]>([])
const jobDescription = ref('')
const resumeSize = ref<'small' | 'medium' | 'large'>('medium')
const showPreview = ref(false)
const showPlaceholderModal = ref(false)
const isDragging = ref(false)
const showTemplateLibrary = ref(false)
const showSaveTemplateModal = ref(false)
const showSaveResumeModal = ref(false)
const selectedTemplateId = ref<string | null>(null)
const savedTemplateId = ref<string | null>(null)
const currentTemplateName = ref<string | null>(null)
const currentTemplateDescription = ref<string | null>(null)

const projects = computed(() => projectStore.projects)

const allContentItems = computed(() => {
  const items: any[] = []
  projects.value.forEach(project => {
    if (project.content) {
      project.content.forEach(content => {
        if (content.status !== 'REVISION' && 
            !content.revisionOf && 
            content.contentType !== 'SKILL') {
          items.push({
            ...content,
            projectId: project.id
          })
        }
      })
    }
  })
  return items
})

const canGenerate = computed(() => {
  return templateId.value && jobDescription.value.trim().length > 0
})

const getProjectName = (projectId: string) => {
  const project = projects.value.find(p => p.id === projectId)
  return project?.name || 'Unknown'
}

// Template Management
const handleTemplateUpload = async (file: File) => {
  if (!file.name.endsWith('.docx')) {
    toast.error('Please upload a .docx file')
    return
  }

  try {
    const formData = new FormData()
    formData.append('template', file)

    const response = await api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    templateId.value = response.data.templateId
    templatePath.value = response.data.templatePath
    
    if (response.data.savedTemplate) {
      savedTemplateId.value = response.data.savedTemplate.id
      currentTemplateName.value = response.data.savedTemplate.name
      currentTemplateDescription.value = response.data.savedTemplate.description
      await fetchTemplates()
    } else {
      currentTemplateName.value = file.name.replace('.docx', '')
      currentTemplateDescription.value = null
    }
    
    toast.success('Template uploaded successfully')
  } catch (error: any) {
    console.error('Upload error:', error)
    toast.error(error.response?.data?.message || 'Failed to upload template')
  }
}

const handleTemplateSelected = async (id: string) => {
  if (!id) return
  const template = templates.value.find(t => t.id === id)
  if (template) {
    await loadTemplate(template)
  }
}

const loadTemplate = async (template: any) => {
  const fileId = getFileId(template.templatePath)
  templateId.value = fileId
  templatePath.value = template.templatePath
  savedTemplateId.value = template.id
  currentTemplateName.value = template.name
  currentTemplateDescription.value = template.description
  selectedTemplateId.value = template.id
  showTemplateLibrary.value = false
  toast.success(`Loaded template: ${template.name}`)
}

const clearTemplate = () => {
  templateId.value = null
  templatePath.value = null
  savedTemplateId.value = null
  currentTemplateName.value = null
  currentTemplateDescription.value = null
  selectedTemplateId.value = null
}

const handleSaveTemplate = async (name: string, description: string) => {
  if (!templatePath.value) return

  try {
    const saved = await saveTemplate({
      name,
      description: description || undefined,
      templatePath: templatePath.value,
      fileName: currentTemplateName.value || 'template.docx'
    })

    savedTemplateId.value = saved.id
    currentTemplateName.value = saved.name
    currentTemplateDescription.value = saved.description
    showSaveTemplateModal.value = false
  } catch (error) {
    // Error already handled in composable
  }
}

const handleDeleteTemplate = async (id: string) => {
  await deleteTemplateFromLibrary(id)
  if (savedTemplateId.value === id) {
    clearTemplate()
  }
}

// Content Selection
const handleToggleContent = (id: string) => {
  const index = selectedContentIds.value.indexOf(id)
  if (index > -1) {
    selectedContentIds.value.splice(index, 1)
  } else {
    selectedContentIds.value.push(id)
  }
}

// Resume Generation
const handleGenerateResume = async () => {
  if (!canGenerate.value) return

  try {
    const selectedContent = selectedContentIds.value.length > 0
      ? allContentItems.value.filter(item => selectedContentIds.value.includes(item.id))
      : []

    const resumeData = await generateResumeContent({
      jobDescription: jobDescription.value,
      contentItems: selectedContent,
      resumeSize: resumeSize.value
    })

    editedResumeData.value = initializeResumeData(resumeData)
    showPreview.value = true
    toast.success('Resume content generated! Review and edit before generating the final document.')
  } catch (error) {
    // Error already handled in composable
  }
}

const handleImproveText = async (fieldPath: string) => {
  try {
    const parts = fieldPath.split('.')
    let currentText = ''
    
    if (parts[0] === 'summary') {
      currentText = editedResumeData.value.summary
    } else if (parts[0] === 'projects') {
      const index = parseInt(parts[1])
      const field = parts[2]
      currentText = editedResumeData.value.projects[index][field as keyof typeof editedResumeData.value.projects[0]] as string
    }

    const context = parts[0] === 'projects' 
      ? `Project: ${editedResumeData.value.projects[parseInt(parts[1])].title}`
      : ''

    const improvedText = await improveTextWithAI({
      originalText: currentText,
      jobDescription: jobDescription.value,
      context,
      size: resumeSize.value
    })

    if (parts[0] === 'summary') {
      editedResumeData.value.summary = improvedText
    } else if (parts[0] === 'projects') {
      const index = parseInt(parts[1])
      const field = parts[2]
      const project = editedResumeData.value.projects[index]
      if (field === 'title') {
        project.title = improvedText
      }
    }

    toast.success('Text improved!')
  } catch (error) {
    // Error already handled in composable
  }
}

const handleRenderFinalResume = async () => {
  try {
    if (!templatePath.value) {
      toast.error('Please select or upload a DOCX template before generating the final resume.')
      showTemplateLibrary.value = true
      return
    }

    const renderData = prepareRenderData()
    await renderResume(templatePath.value, renderData)
  } catch (error) {
    // Error already handled in composable
  }
}

// History Management
const handleLoadFromHistory = async (item: any) => {
  try {
    const historyItem = await loadFromHistory(item.id)

    if (historyItem.template) {
      templateId.value = historyItem.template.id
      templatePath.value = historyItem.template.templatePath
      savedTemplateId.value = historyItem.template.id
      currentTemplateName.value = historyItem.template.name
    }

    jobDescription.value = historyItem.jobDescription
    resumeSize.value = historyItem.resumeSize

    editedResumeData.value = initializeResumeData(historyItem.resumeData)
    showPreview.value = true
    toast.success(`Loaded resume: ${historyItem.name}`)

    // Sync URL so refresh returns to this resume
    router.replace({
      name: 'resume-generator',
      query: { resumeId: item.id }
    })
  } catch (error) {
    // Error already handled in composable
  }
}

const handleSaveResume = async (name: string) => {
  try {
    const renderData = prepareRenderData()
    await saveToHistory({
      name,
      templateId: savedTemplateId.value,
      jobDescription: jobDescription.value,
      resumeData: renderData,
      contentItemIds: selectedContentIds.value,
      resumeSize: resumeSize.value
    })
    showSaveResumeModal.value = false
  } catch (error) {
    // Error already handled in composable
  }
}

const handleDeleteHistory = async (id: string) => {
  await deleteHistoryItem(id)
}

// Editing helpers - delegate to composable
const updateEducationField = (index: number, field: string, value: any) => {
  const edu = editedResumeData.value.education[index]
  if (field === 'institution') edu.institution = value as string
  else if (field === 'degree') edu.degree = value as string
  else if (field === 'details') edu.details = value as string
  else if (field === 'date') edu.date = value as string
  else if (field === 'enabled') edu.enabled = value as boolean
}

const updateExperienceField = (index: number, field: string, value: any) => {
  const exp = editedResumeData.value.experience[index]
  if (field === 'company') exp.company = value as string
  else if (field === 'location') exp.location = value as string
  else if (field === 'description') exp.description = value as string
  else if (field === 'enabled') exp.enabled = value as boolean
}

const updateRoleField = (expIndex: number, roleIndex: number, field: string, value: any) => {
  const role = editedResumeData.value.experience[expIndex].roles[roleIndex]
  if (field === 'title') role.title = value as string
  else if (field === 'dateRange') role.dateRange = value as string
  else if (field === 'enabled') role.enabled = value as boolean
}

const updateBullet = (expIndex: number, roleIndex: number, bulletIndex: number, value: string) => {
  editedResumeData.value.experience[expIndex].roles[roleIndex].bullets[bulletIndex] = value
}

const updateProjectField = (index: number, field: string, value: any) => {
  const project = editedResumeData.value.projects[index]
  if (field === 'title') project.title = value as string
  else if (field === 'enabled') project.enabled = value as boolean
}

const updateProjectBullet = (index: number, bulletIndex: number, value: string) => {
  editedResumeData.value.projects[index].bullets[bulletIndex] = value
}

const updateProficiencyField = (index: number, field: string, value: any) => {
  const prof = editedResumeData.value.proficiencies[index]
  if (field === 'category') prof.category = value as string
  else if (field === 'enabled') prof.enabled = value as boolean
}

const updateSkill = (profIndex: number, skillIndex: number, value: string) => {
  editedResumeData.value.proficiencies[profIndex].skills[skillIndex] = value
}

const updateHonor = (index: number, value: string) => {
  editedResumeData.value.honors[index] = value
}

onMounted(async () => {
  await projectStore.fetchProjects()
  await fetchTemplates()
  await fetchHistory()

  // If a resumeId is present in the URL, auto-load that resume from history
  const resumeIdFromRoute = route.query.resumeId as string | undefined
  if (resumeIdFromRoute) {
    try {
      await handleLoadFromHistory({ id: resumeIdFromRoute } as any)
    } catch {
      // If load fails (e.g., no such history), just ignore and stay on blank generator
    }
  }
})
</script>
