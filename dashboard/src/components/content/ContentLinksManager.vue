<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-white">Links</h3>
      <button
        @click="showCreateModal = true"
        class="btn btn-sm btn-primary"
      >
        + Add Link
      </button>
    </div>

    <!-- Links List -->
    <div class="space-y-2">
      <div
        v-for="link in links"
        :key="link.id"
        class="group p-2.5 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="text-sm text-white font-medium truncate">
              {{ getRelatedContentTitle(link) }}
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-gray-400">
                {{ formatContentType(getRelatedContentType(link)) }}
              </span>
              <span class="text-xs text-gray-500">•</span>
              <span class="text-xs text-gray-400">
                {{ formatLinkType(link.linkType) }}
              </span>
            </div>
        </div>
        <button
          @click="deleteLink(link.id)"
            class="flex-shrink-0 p-1 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete link"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
        </div>
      </div>
      <div v-if="links.length === 0" class="text-center text-gray-400 py-6 text-sm">
        No links yet
      </div>
    </div>

    <!-- Create Link Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="showCreateModal = false"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <form @submit.prevent="createLink">
            <div class="bg-gray-800 px-6 pt-6 pb-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-white">Create Link</h3>
                <button
                  type="button"
                  @click="showCreateModal = false"
                  class="text-gray-400 hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="label">Related Content *</label>
                  <select
                    v-model="newLink.targetId"
                    required
                    class="input"
                  >
                    <option value="">Select related content</option>
                    <option
                      v-for="item in targetOptions"
                      :key="item.id"
                      :value="item.id"
                      :disabled="item.id === props.sourceId"
                    >
                      {{ item.title }} ({{ item.contentType || 'content' }})
                    </option>
                  </select>
                  <p class="text-xs text-gray-400 mt-1">
                    Link this content to another content item. The relationship is bidirectional.
                  </p>
                </div>
                <div>
                  <label class="label">Link Type *</label>
                  <select
                    v-model="newLink.linkType"
                    required
                    class="input"
                  >
                    <option value="related">Related</option>
                    <option value="similar">Similar</option>
                    <option value="part-of">Part Of</option>
                    <option value="follows">Follows</option>
                  </select>
                  <p class="text-xs text-gray-400 mt-1">
                    Describes how this content relates to the other content.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-800 px-6 py-3 flex justify-end space-x-3">
              <button
                type="button"
                @click="showCreateModal = false"
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isCreating"
                class="btn btn-primary"
              >
                {{ isCreating ? 'Creating...' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { formatContentType, formatLinkType } from '@/utils'
import type { ContentLink, Content } from '@/stores/projects'

interface Props {
  sourceId: string
  sourceType: 'content' | 'project'
  projectId: string
}

const props = defineProps<Props>()

const links = ref<ContentLink[]>([])
const contentMap = ref<Map<string, Content>>(new Map())
const showCreateModal = ref(false)
const isCreating = ref(false)
const targetOptions = ref<Array<Content>>([])

const newLink = ref({
  sourceId: props.sourceId,
  sourceType: 'content' as const,
  targetId: '',
  targetType: 'content' as const,
  linkType: 'related'
})

const fetchLinks = async () => {
  try {
    // Fetch links using contentId parameter (undirected)
    const response = await api.get(`/projects/${props.projectId}/content-links`, {
      params: {
        contentId: props.sourceId
      }
    })
    links.value = response.data
    
    // Fetch all content to get names
    await loadContentMap()
  } catch (error) {
    console.error('Failed to fetch links:', error)
  }
}

const loadContentMap = async () => {
  try {
    const response = await api.get(`/projects/${props.projectId}/content`)
    const allContent: Content[] = response.data
    contentMap.value = new Map(allContent.map(c => [c.id, c]))
  } catch (error) {
    console.error('Failed to load content map:', error)
  }
}

const loadTargetOptions = async () => {
  try {
    const response = await api.get(`/projects/${props.projectId}/content`)
    // Filter out the current content and revisions
    targetOptions.value = response.data.filter((c: Content) => 
      c.id !== props.sourceId && 
      c.status !== 'REVISION' && 
      !c.revisionOf
    )
  } catch (error) {
    console.error('Failed to load target options:', error)
  }
}

const createLink = async () => {
  try {
    isCreating.value = true
    // Always create content-to-content links
    await api.post(`/projects/${props.projectId}/content-links`, {
      sourceId: props.sourceId,
      sourceType: 'content',
      targetId: newLink.value.targetId,
      targetType: 'content',
      linkType: newLink.value.linkType
    })
    await fetchLinks()
    newLink.value = {
      sourceId: props.sourceId,
      sourceType: 'content' as const,
      targetId: '',
      targetType: 'content' as const,
      linkType: 'related'
    }
    showCreateModal.value = false
  } catch (error) {
    console.error('Failed to create link:', error)
    alert('Failed to create link. Make sure the content is different and the link does not already exist.')
  } finally {
    isCreating.value = false
  }
}

const deleteLink = async (linkId: string) => {
  if (!confirm('Are you sure you want to delete this link?')) return
  
  try {
    await api.delete(`/content-links/${linkId}`)
    links.value = links.value.filter(l => l.id !== linkId)
  } catch (error) {
    console.error('Failed to delete link:', error)
  }
}

const getRelatedContentTitle = (link: ContentLink) => {
  // For undirected links, show the other content (not the current one)
  const otherContentId = link.sourceId === props.sourceId ? link.targetId : link.sourceId
  const content = contentMap.value.get(otherContentId)
  
  if (content) {
    return content.title || 'Untitled'
  }
  
  // Fallback if content not loaded
  return `Content ${otherContentId.substring(0, 8)}...`
}

const getRelatedContentType = (link: ContentLink) => {
  const otherContentId = link.sourceId === props.sourceId ? link.targetId : link.sourceId
  const content = contentMap.value.get(otherContentId)
  
  if (content) {
    return content.contentType || 'CONTENT'
  }
  
  return 'CONTENT'
}

onMounted(() => {
  fetchLinks()
  loadTargetOptions()
})
</script>

