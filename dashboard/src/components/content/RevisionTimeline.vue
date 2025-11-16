<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="close"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="close"></div>
      
      <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
        <!-- Header -->
        <div class="bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold text-white">Revision History</h3>
              <p class="text-sm text-gray-400 mt-1">Browse and restore previous versions of this content</p>
            </div>
            <button
              @click="close"
              class="text-gray-400 hover:text-white transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Timeline Content -->
        <div class="bg-gray-800 px-6 py-6 max-h-[70vh] overflow-y-auto">
          <div class="relative">
            <!-- Timeline Line -->
            <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-600"></div>

            <!-- Current Version -->
            <div class="relative mb-8">
              <div class="flex items-start">
                <!-- Timeline Dot -->
                <div class="relative z-10 flex-shrink-0">
                  <div class="w-4 h-4 bg-primary-500 rounded-full border-4 border-gray-800"></div>
                </div>
                
                <!-- Content Card -->
                <div class="ml-6 flex-1">
                  <div class="bg-gray-700 rounded-lg p-4 border-2 border-primary-500">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                          <span class="px-2 py-1 text-xs bg-primary-600 text-white rounded font-medium">Current Version</span>
                          <span :class="getStatusClass(content?.status)" class="px-2 py-1 text-xs rounded">
                            {{ formatContentStatus(content?.status || '') }}
                          </span>
                        </div>
                        <h4 class="text-white font-semibold mb-1">{{ content?.title || 'Untitled' }}</h4>
                        <p class="text-sm text-gray-400">
                          {{ formatDate(content?.updatedAt) }}
                        </p>
                        <p v-if="content?.excerpt" class="text-sm text-gray-300 mt-2 line-clamp-2">
                          {{ content.excerpt }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Revisions Timeline -->
            <div v-if="revisions.length > 0" class="space-y-6">
              <div
                v-for="(revision, index) in revisions"
                :key="revision.id"
                class="relative"
              >
                <div class="flex items-start">
                  <!-- Timeline Dot -->
                  <div class="relative z-10 flex-shrink-0">
                    <div 
                      class="w-4 h-4 rounded-full border-4 border-gray-800 transition-all cursor-pointer hover:scale-125"
                      :class="selectedRevision?.id === revision.id ? 'bg-blue-500' : 'bg-gray-500'"
                      @click="selectRevision(revision)"
                    ></div>
                  </div>
                  
                  <!-- Content Card -->
                  <div class="ml-6 flex-1">
                    <div 
                      class="bg-gray-700 rounded-lg p-4 transition-all cursor-pointer hover:bg-gray-600"
                      :class="selectedRevision?.id === revision.id ? 'ring-2 ring-blue-500' : ''"
                      @click="selectRevision(revision)"
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center space-x-2 mb-2">
                            <span class="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded font-medium">
                              Revision {{ revision.revisionNumber }}
                            </span>
                            <span :class="getStatusClass(revision.status)" class="px-2 py-1 text-xs rounded">
                              {{ formatContentStatus(revision.status) }}
                            </span>
                          </div>
                          <h4 class="text-white font-semibold mb-1">{{ revision.title || 'Untitled' }}</h4>
                          <p class="text-sm text-gray-400">
                            {{ formatDate(revision.revisedAt || revision.createdAt) }}
                          </p>
                          <p v-if="revision.excerpt" class="text-sm text-gray-300 mt-2 line-clamp-2">
                            {{ revision.excerpt }}
                          </p>
                        </div>
                        <div class="flex items-center space-x-2 ml-4">
                          <button
                            @click.stop="previewRevision(revision)"
                            class="px-3 py-1.5 text-sm bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors"
                            title="Preview this revision"
                          >
                            Preview
                          </button>
                          <button
                            @click.stop="restoreRevision(revision)"
                            class="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            title="Restore this revision"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-12">
              <svg class="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-gray-400">No revisions yet</p>
              <p class="text-sm text-gray-500 mt-1">Revisions are automatically created when you save changes</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
          <button
            @click="close"
            class="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div
      v-if="previewingRevision"
      class="fixed inset-0 z-[60] overflow-y-auto"
      @click.self="previewingRevision = null"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="previewingRevision = null"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div class="bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white">
                  Revision {{ previewingRevision.revisionNumber }} Preview
                </h3>
                <p class="text-sm text-gray-400 mt-1">
                  {{ formatDate(previewingRevision.revisedAt || previewingRevision.createdAt) }}
                </p>
              </div>
              <button
                @click="previewingRevision = null"
                class="text-gray-400 hover:text-white transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="bg-gray-800 px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div class="prose prose-invert max-w-none">
              <h2 class="text-white">{{ previewingRevision.title }}</h2>
              <p v-if="previewingRevision.excerpt" class="text-gray-300 italic mb-4">
                {{ previewingRevision.excerpt }}
              </p>
              <div v-html="renderedContent" class="text-white"></div>
            </div>
          </div>
          
          <div class="bg-gray-800 px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
            <button
              @click="previewingRevision = null"
              class="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              @click="restoreRevision(previewingRevision)"
              class="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
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
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import { marked } from 'marked'
import { useToast } from 'vue-toastification'
import { formatContentStatus } from '@/utils'
import type { Content } from '@/stores/projects'

const toast = useToast()

interface Props {
  isOpen: boolean
  contentId: string
  projectId: string
  content?: Content | null
}

interface Emits {
  (e: 'close'): void
  (e: 'revision-restored'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const revisions = ref<Content[]>([])
const selectedRevision = ref<Content | null>(null)
const previewingRevision = ref<Content | null>(null)
const isLoading = ref(false)

const renderedContent = computed(() => {
  if (!previewingRevision.value) return ''
  return marked(previewingRevision.value.content || '')
})

const fetchRevisions = async () => {
  if (!props.isOpen) return
  
  try {
    isLoading.value = true
    const response = await api.get(`/projects/${props.projectId}/content/${props.contentId}/revisions`)
    revisions.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch revisions:', error)
    toast.error('Failed to load revision history')
  } finally {
    isLoading.value = false
  }
}

const selectRevision = (revision: Content) => {
  selectedRevision.value = selectedRevision.value?.id === revision.id ? null : revision
}

const viewRevision = async (revision: Content) => {
  try {
    const response = await api.get(`/projects/${props.projectId}/content/${props.contentId}/revisions/${revision.id}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch revision details:', error)
    toast.error('Failed to load revision details')
    return null
  }
}

const previewRevision = async (revision: Content) => {
  const fullRevision = await viewRevision(revision)
  if (fullRevision) {
    previewingRevision.value = fullRevision
  }
}

const restoreRevision = async (revision: Content) => {
  if (!confirm(`Are you sure you want to restore Revision ${revision.revisionNumber}? This will create a new revision of the current content.`)) {
    return
  }
  
  try {
    await api.post(`/projects/${props.projectId}/content/${props.contentId}/revisions/${revision.id}/restore`)
    toast.success('Revision restored successfully')
    emit('revision-restored')
    previewingRevision.value = null
    selectedRevision.value = null
    await fetchRevisions()
    close()
  } catch (error) {
    console.error('Failed to restore revision:', error)
    toast.error('Failed to restore revision')
  }
}

const close = () => {
  previewingRevision.value = null
  selectedRevision.value = null
  emit('close')
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
    DRAFT: 'bg-amber-500/20 text-amber-400',
    PUBLISHED: 'bg-green-500/20 text-green-400',
    HIDDEN: 'bg-yellow-500/20 text-yellow-400',
    REVISION: 'bg-blue-500/20 text-blue-400'
  }
  return classes[status || 'DRAFT'] || classes.DRAFT
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    fetchRevisions()
  }
})

onMounted(() => {
  if (props.isOpen) {
    fetchRevisions()
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prose {
  color: white;
}

.prose h2 {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.prose p {
  color: #d1d5db;
  margin-bottom: 1rem;
}

.prose code {
  background-color: #1f2937;
  color: #60a5fa;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.prose pre {
  background-color: #1f2937;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.prose pre code {
  background-color: transparent;
  padding: 0;
}

.prose a {
  color: #60a5fa;
  text-decoration: underline;
}

.prose ul, .prose ol {
  color: #d1d5db;
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.prose li {
  margin-bottom: 0.5rem;
}

.prose blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: #9ca3af;
}
</style>

