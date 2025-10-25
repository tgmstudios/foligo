<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Edit Content</h1>
          <p class="text-gray-600 mt-1">{{ content?.title }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="togglePublishStatus"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              content?.isPublished
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            ]"
          >
            {{ content?.isPublished ? 'Published' : 'Draft' }}
          </button>
          <button
            @click="saveContent"
            :disabled="isSaving"
            class="btn btn-primary"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="content" class="space-y-6">
      <!-- Content Details -->
      <div class="card p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Content Details</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Title</label>
            <input
              v-model="editForm.title"
              type="text"
              class="input"
              placeholder="Content title"
            />
          </div>
          
          <div>
            <label class="label">Slug</label>
            <div class="flex">
              <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                {{ project?.subdomain }}.foligo.tech/
              </span>
              <input
                v-model="editForm.slug"
                type="text"
                class="flex-1 input rounded-l-none"
                placeholder="url-slug"
              />
            </div>
          </div>
          
          <div class="md:col-span-2">
            <label class="label">Excerpt</label>
            <textarea
              v-model="editForm.excerpt"
              rows="2"
              class="input"
              placeholder="Brief description"
            ></textarea>
          </div>
        </div>

        <!-- Metadata Fields -->
        <div v-if="content.type === 'PROJECT'" class="mt-6">
          <h4 class="text-sm font-medium text-gray-700 mb-3">Project Details</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label">Technologies</label>
              <input
                v-model="editForm.metadata.technologies"
                type="text"
                class="input"
                placeholder="React, Node.js, MongoDB"
              />
            </div>
            <div>
              <label class="label">Project URL</label>
              <input
                v-model="editForm.metadata.projectUrl"
                type="url"
                class="input"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        <div v-if="content.type === 'EXPERIENCE'" class="mt-6">
          <h4 class="text-sm font-medium text-gray-700 mb-3">Experience Details</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label">Company</label>
              <input
                v-model="editForm.metadata.company"
                type="text"
                class="input"
                placeholder="Company Name"
              />
            </div>
            <div>
              <label class="label">Position</label>
              <input
                v-model="editForm.metadata.position"
                type="text"
                class="input"
                placeholder="Job Title"
              />
            </div>
            <div>
              <label class="label">Start Date</label>
              <input
                v-model="editForm.metadata.startDate"
                type="date"
                class="input"
              />
            </div>
            <div>
              <label class="label">End Date</label>
              <input
                v-model="editForm.metadata.endDate"
                type="date"
                class="input"
              />
            </div>
          </div>
        </div>

        <div v-if="content.type === 'BLOG'" class="mt-6">
          <h4 class="text-sm font-medium text-gray-700 mb-3">Blog Details</h4>
          <div>
            <label class="label">Tags</label>
            <input
              v-model="editForm.metadata.tags"
              type="text"
              class="input"
              placeholder="technology, programming, web-development"
            />
          </div>
        </div>
      </div>

      <!-- Markdown Editor -->
      <div class="card">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Content</h3>
          <p class="text-sm text-gray-600 mt-1">Write your content in Markdown</p>
        </div>
        
        <MarkdownEditor
          v-model="editForm.content"
          @save="saveContent"
          @cancel="goBack"
        />
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-500">Loading content...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import MarkdownEditor from '@/components/editor/MarkdownEditor.vue'
import type { Content, Project } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const content = ref<Content | null>(null)
const project = ref<Project | null>(null)
const isSaving = ref(false)

const editForm = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  metadata: {
    technologies: '',
    projectUrl: '',
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    tags: ''
  }
})

const loadContent = async () => {
  try {
    const contentId = route.params.id as string
    const projectId = route.params.projectId as string
    
    // Load project first
    project.value = await projectStore.fetchProject(projectId)
    
    // Find content in project
    if (project.value?.content) {
      content.value = project.value.content.find(c => c.id === contentId) || null
      
      if (content.value) {
        // Populate form
        editForm.title = content.value.title
        editForm.slug = content.value.slug || ''
        editForm.excerpt = content.value.excerpt || ''
        editForm.content = content.value.content
        editForm.metadata = { ...editForm.metadata, ...content.value.metadata }
      }
    }
  } catch (error) {
    console.error('Failed to load content:', error)
    router.push('/projects')
  }
}

const saveContent = async () => {
  if (!content.value) return

  try {
    isSaving.value = true
    
    await projectStore.updateContent(content.value.id, {
      title: editForm.title,
      slug: editForm.slug || undefined,
      excerpt: editForm.excerpt || undefined,
      content: editForm.content,
      metadata: editForm.metadata
    })
    
    // Reload content to get updated data
    await loadContent()
  } catch (error) {
    console.error('Failed to save content:', error)
  } finally {
    isSaving.value = false
  }
}

const togglePublishStatus = async () => {
  if (!content.value) return

  try {
    await projectStore.updateContent(content.value.id, {
      isPublished: !content.value.isPublished
    })
    
    // Reload content to get updated data
    await loadContent()
  } catch (error) {
    console.error('Failed to toggle publish status:', error)
  }
}

const goBack = () => {
  router.push(`/projects/${route.params.projectId}`)
}

onMounted(() => {
  loadContent()
})
</script>