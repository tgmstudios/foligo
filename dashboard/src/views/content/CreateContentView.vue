<template>
  <div class="p-6">
    <div v-if="isCreating" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-400">Creating {{ contentType }}...</p>
      </div>
    </div>
    
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-400 mb-4">{{ error }}</div>
      <button @click="$router.back()" class="btn btn-secondary">Go Back</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const contentType = route.params.type as string
const projectId = route.params.projectId as string
const isCreating = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    // Wait for projects to load if needed
    if (projectStore.projects.length === 0) {
      await projectStore.fetchProjects()
    }
    
    let targetProjectId = projectId
    
    if (!targetProjectId) {
      // Check for selected project from global state or window
      targetProjectId = (window as any).selectedProjectId
      
      // If still no project, use the first available project
      if (!targetProjectId && projectStore.projects.length > 0) {
        targetProjectId = projectStore.projects[0].id
      }
    }
    
    if (!targetProjectId) {
      error.value = 'No projects found. Please create a project first.'
      isCreating.value = false
      return
    }
    
    const newContent = await projectStore.createContent(targetProjectId, {
      contentType: contentType.toUpperCase(),
      title: getDefaultTitle(contentType),
      content: `# ${getDefaultTitle(contentType)}\n\nStart writing your content here...`,
      status: 'DRAFT'
    })
    
    router.replace(`/portfolios/${targetProjectId}/content/${newContent.id}/edit`)
  } catch (err: any) {
    console.error('Failed to create content:', err)
    error.value = err.message || 'Failed to create content. Please try again.'
    isCreating.value = false
  }
})

const getDefaultTitle = (type: string) => {
  const titles: Record<string, string> = {
    project: 'New Portfolio',
    blog: 'New Blog Post',
    experience: 'New Experience',
    skill: 'New Skill'
  }
  return titles[type.toLowerCase()] || 'New Content'
}
</script>

