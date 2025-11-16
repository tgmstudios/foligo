<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-white">Revision History</h3>
    </div>

    <!-- Current Version -->
    <div class="mb-4 p-4 bg-gray-700 rounded-md border-2 border-primary-500">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center space-x-2">
            <span class="px-2 py-1 text-xs bg-primary-600 text-white rounded font-medium">Current</span>
            <span class="text-white font-medium">{{ content?.title }}</span>
          </div>
          <p class="text-sm text-gray-400 mt-1">
            Last updated: {{ formatDate(content?.updatedAt) }}
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <span :class="getStatusClass(content?.status)" class="px-2 py-1 text-xs rounded">
            {{ formatContentStatus(content?.status || '') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Revisions List -->
    <div class="space-y-2">
      <div
        v-for="revision in revisions"
        :key="revision.id"
        class="p-4 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors cursor-pointer"
        @click="viewRevision(revision)"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-1">
              <span class="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
                Revision {{ revision.revisionNumber }}
              </span>
              <span class="text-white font-medium">{{ revision.title }}</span>
            </div>
            <p class="text-sm text-gray-400">
              Created: {{ formatDate(revision.revisedAt || revision.createdAt) }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click.stop="previewRevision(revision)"
              class="text-sm text-primary-400 hover:text-primary-300"
            >
              Preview
            </button>
            <button
              @click.stop="restoreRevision(revision)"
              class="text-sm text-green-400 hover:text-green-300"
            >
              Restore
            </button>
            <button
              @click.stop="deleteRevision(revision.id)"
              class="text-sm text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      <div v-if="revisions.length === 0" class="text-center text-gray-400 py-8">
        No revisions yet. Revisions are automatically created when you save changes.
      </div>
    </div>

    <!-- Revision Preview Modal -->
    <div
      v-if="previewingRevision"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="previewingRevision = null"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div class="bg-gray-800 px-6 pt-6 pb-4">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-medium text-white">
                  Revision {{ previewingRevision.revisionNumber }} Preview
                </h3>
                <p class="text-sm text-gray-400">
                  {{ formatDate(previewingRevision.revisedAt || previewingRevision.createdAt) }}
                </p>
              </div>
              <button
                @click="previewingRevision = null"
                class="text-gray-400 hover:text-gray-300"
              >
                ×
              </button>
            </div>
          </div>
          
          <div class="bg-gray-800 px-6 py-4 max-h-96 overflow-y-auto">
            <div class="prose prose-invert max-w-none">
              <h2>{{ previewingRevision.title }}</h2>
              <p v-if="previewingRevision.excerpt" class="text-gray-300 italic">
                {{ previewingRevision.excerpt }}
              </p>
              <div v-html="renderedContent"></div>
            </div>
          </div>
          
          <div class="bg-gray-800 px-6 py-3 flex justify-end space-x-3">
            <button
              @click="previewingRevision = null"
              class="btn btn-secondary"
            >
              Close
            </button>
            <button
              @click="restoreRevision(previewingRevision)"
              class="btn btn-primary"
            >
              Restore This Revision
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { marked } from 'marked'
import { formatContentStatus } from '@/utils'
import type { Content } from '@/stores/projects'

interface Props {
  contentId: string
  projectId: string
  content?: Content | null
}

interface Emits {
  (e: 'revision-restored'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const revisions = ref<Content[]>([])
const previewingRevision = ref<Content | null>(null)

const renderedContent = computed(() => {
  if (!previewingRevision.value) return ''
  return marked(previewingRevision.value.content || '')
})

const fetchRevisions = async () => {
  try {
    const response = await api.get(`/projects/${props.projectId}/content/${props.contentId}/revisions`)
    revisions.value = response.data
  } catch (error) {
    console.error('Failed to fetch revisions:', error)
  }
}

const viewRevision = async (revision: Content) => {
  try {
    const response = await api.get(`/projects/${props.projectId}/content/${props.contentId}/revisions/${revision.id}`)
    previewingRevision.value = response.data
  } catch (error) {
    console.error('Failed to fetch revision details:', error)
  }
}

const previewRevision = async (revision: Content) => {
  await viewRevision(revision)
}

const restoreRevision = async (revision: Content) => {
  if (!confirm(`Are you sure you want to restore Revision ${revision.revisionNumber}? This will create a new revision of the current content.`)) return
  
  try {
    await api.post(`/projects/${props.projectId}/content/${props.contentId}/revisions/${revision.id}/restore`)
    emit('revision-restored')
    previewingRevision.value = null
    await fetchRevisions()
  } catch (error) {
    console.error('Failed to restore revision:', error)
  }
}

const deleteRevision = async (revisionId: string) => {
  if (!confirm('Are you sure you want to delete this revision?')) return
  
  try {
    await api.delete(`/projects/${props.projectId}/content/${props.contentId}/revisions/${revisionId}`)
    revisions.value = revisions.value.filter(r => r.id !== revisionId)
  } catch (error) {
    console.error('Failed to delete revision:', error)
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusClass = (status?: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'bg-gray-600 text-gray-300',
    PUBLISHED: 'bg-green-600 text-white',
    HIDDEN: 'bg-yellow-600 text-white',
    REVISION: 'bg-blue-600 text-white'
  }
  return classes[status || 'DRAFT'] || classes.DRAFT
}

onMounted(() => {
  fetchRevisions()
})
</script>

