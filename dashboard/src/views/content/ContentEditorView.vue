<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Edit Content</h1>
        </div>
        <div class="flex items-center space-x-3">
          <button
            type="button"
            @click="deleteContent"
            :disabled="isDeleting || isSaving"
            class="px-4 py-2 rounded-md text-sm font-medium border border-red-700/60 bg-red-600/10 text-red-300 hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
          <select
            v-model="editForm.status"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium border min-w-[140px] transition-colors',
              getStatusDropdownClass(editForm.status)
            ]"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="HIDDEN">Hidden</option>
          </select>
          <button
            @click="showRevisionTimeline = true"
            class="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 border border-gray-600 flex items-center space-x-2"
            title="View revision history"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Revision History</span>
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

    <div v-if="content" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Main Content Area -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Content Details -->
        <div class="card p-6">
          <h3 class="text-lg font-medium text-white mb-4">Content Details</h3>
          
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
                <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-400 text-sm">
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

          <!-- Project-specific Fields -->
          <div v-if="content.type === 'PROJECT'" class="mt-6 space-y-6">
            
            <!-- Dates -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="label">Start Date</label>
                <input
                  v-model="editForm.startDate"
                  type="date"
                  class="input"
                />
              </div>
              <div>
                <label class="label">End Date</label>
                <input
                  v-model="editForm.endDate"
                  type="date"
                  class="input"
                  :disabled="editForm.isOngoing"
                />
              </div>
              <div class="flex items-end">
                <label class="flex items-center space-x-2">
                  <input
                    v-model="editForm.isOngoing"
                    type="checkbox"
                    class="rounded"
                  />
                  <span class="text-sm text-gray-300">Ongoing</span>
                </label>
              </div>
            </div>

            <!-- Featured Image -->
            <div>
              <FeaturedImageSelector
                v-model="editForm.featuredImage"
                :project-id="content.projectId"
              />
            </div>

            <!-- Project Links -->
            <div>
              <label class="label">Project Links</label>
              <div class="space-y-2">
                <input
                  v-model="editForm.projectLinks.github"
                  type="url"
                  class="input"
                  placeholder="GitHub URL"
                />
                <input
                  v-model="editForm.projectLinks.devpost"
                  type="url"
                  class="input"
                  placeholder="Devpost URL"
                />
                <div v-for="(link, index) in editForm.projectLinks.other" :key="index" class="flex gap-2">
                  <input
                    v-model="editForm.projectLinks.other[index]"
                    type="url"
                    class="input flex-1"
                    placeholder="Other link URL"
                  />
                  <button
                    @click="editForm.projectLinks.other.splice(index, 1)"
                    type="button"
                    class="btn btn-sm btn-secondary"
                  >
                    Remove
                  </button>
                </div>
                <button
                  @click="editForm.projectLinks.other.push('')"
                  type="button"
                  class="btn btn-sm btn-secondary"
                >
                  + Add Link
                </button>
              </div>
            </div>

            <!-- Contributors -->
            <div>
              <label class="label">Contributors</label>
              <div class="space-y-2">
                <div v-for="(contributor, index) in editForm.contributors" :key="index" class="flex gap-2">
                  <input
                    v-model="editForm.contributors[index]"
                    type="text"
                    class="input flex-1"
                    placeholder="Contributor name or ID"
                  />
                  <button
                    @click="editForm.contributors.splice(index, 1)"
                    type="button"
                    class="btn btn-sm btn-secondary"
                  >
                    Remove
                  </button>
                </div>
                <button
                  @click="editForm.contributors.push('')"
                  type="button"
                  class="btn btn-sm btn-secondary"
                >
                  + Add Contributor
                </button>
              </div>
            </div>

            <!-- Skills -->
            <div>
              <SkillsManager
                v-model="editForm.linkedSkills"
                :project-id="content.projectId"
              />
            </div>
          </div>

          <!-- Blog-specific Fields -->
          <div v-if="content.type === 'BLOG'" class="mt-6 space-y-6">
            <!-- Featured Image -->
            <div>
              <FeaturedImageSelector
                v-model="editForm.featuredImage"
                :project-id="content.projectId"
              />
            </div>
          </div>

          <!-- Experience-specific Fields -->
          <div v-if="content.type === 'EXPERIENCE'" class="mt-6 space-y-6">
            
            <!-- Category -->
            <div>
              <label class="label">Category *</label>
              <select
                v-model="editForm.experienceCategory"
                class="input"
                required
              >
                <option value="JOB">Job Experience</option>
                <option value="EDUCATION">Education</option>
                <option value="CERTIFICATION">Certification/License</option>
              </select>
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="label">Start Date</label>
                <input
                  v-model="editForm.startDate"
                  type="date"
                  class="input"
                />
              </div>
              <div>
                <label class="label">End Date</label>
                <input
                  v-model="editForm.endDate"
                  type="date"
                  class="input"
                  :disabled="editForm.isOngoing"
                />
              </div>
              <div class="flex items-end">
                <label class="flex items-center space-x-2">
                  <input
                    v-model="editForm.isOngoing"
                    type="checkbox"
                    class="rounded"
                  />
                  <span class="text-sm text-gray-300">Ongoing</span>
                </label>
              </div>
            </div>

            <!-- Location -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">Location</label>
                <input
                  v-model="editForm.location"
                  type="text"
                  class="input"
                  placeholder="City, State/Country"
                />
              </div>
              <div>
                <label class="label">Location Type</label>
                <select
                  v-model="editForm.locationType"
                  class="input"
                >
                  <option value="">Select type</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        <!-- Experience Roles -->
        <div v-if="content.type === 'EXPERIENCE'" class="card">
          <ExperienceRolesEditor
            :content-id="content.id"
            :project-id="content.projectId"
          />
        </div>

        <!-- Markdown Editor -->
        <div class="card">
          <div class="p-6 border-b border-gray-600 flex items-center justify-between gap-4">
            <div>
              <h3 class="text-lg font-medium text-white">Content</h3>
              <p class="text-sm text-gray-400 mt-1">Write your content in Markdown</p>
            </div>
            <div class="flex rounded-lg bg-gray-700 p-1" role="group" aria-label="Content view">
              <button
                type="button"
                :aria-pressed="contentView === 'edit'"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  contentView === 'edit'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white'
                ]"
                @click="contentView = 'edit'"
              >
                Edit
              </button>
              <button
                type="button"
                :aria-pressed="contentView === 'preview'"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  contentView === 'preview'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white'
                ]"
                @click="contentView = 'preview'"
              >
                Preview
              </button>
            </div>
          </div>
          
          <div class="h-[600px]">
            <MarkdownCodeEditor
              v-if="contentView === 'edit'"
              v-model="editForm.content"
              :project-id="content.projectId"
              @save="handleMarkdownSave"
            />
            <MarkdownPreview
              v-else
              :content="editForm.content"
            />
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="lg:col-span-1">
        <!-- Editor Studio -->
        <div class="card p-6 mb-6">
          <div class="text-center mb-4">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-white">Editor Studio</h3>
            <p class="text-sm text-gray-400">A full-page editor with a live preview, revision history, and an AI assistant that edits directly</p>
          </div>
          <button
            @click="openEditorStudio"
            class="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Switch to Editor Studio</span>
          </button>
        </div>

        <!-- Content Stats -->
        <div class="card p-6 mb-6">
          <h3 class="text-lg font-medium text-white mb-4">Content Stats</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Words</span>
              <span class="font-medium text-white">{{ wordCount }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Characters</span>
              <span class="font-medium text-white">{{ characterCount }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Last Updated</span>
              <span class="font-medium text-white">{{ formatDate(content.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="card p-6 mb-6">
          <TagManager
            v-model="editForm.tags"
            :project-id="content.projectId"
          />
        </div>

        <!-- Content Blocks (for advanced post types) -->
        <!-- <div v-if="content.type === 'PROJECT' || content.type === 'BLOG'" class="card p-6 mb-6">
          <ContentBlocksEditor
            :content-id="content.id"
            :project-id="content.projectId"
          />
        </div> -->

        <!-- Content Links -->
        <div class="card p-6 mb-6">
          <ContentLinksManager
            :source-id="content.id"
            source-type="content"
            :project-id="content.projectId"
          />
        </div>

        <!-- Social Post Generator -->
        <div class="card p-6">
          <div class="text-center mb-4">
            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-white">Social Post Generator</h3>
            <p class="text-sm text-gray-400">Generate posts for LinkedIn or X</p>
          </div>

          <!-- Platform Selection -->
          <div class="mb-4">
            <div class="flex rounded-lg bg-gray-700 p-1">
              <button
                @click="selectedPlatform = 'linkedin'"
                :class="[
                  'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  selectedPlatform === 'linkedin'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                ]"
              >
                <div class="flex items-center justify-center space-x-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>LinkedIn</span>
                </div>
              </button>
              <button
                @click="selectedPlatform = 'x'"
                :class="[
                  'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  selectedPlatform === 'x'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:text-white'
                ]"
              >
                <div class="flex items-center justify-center space-x-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>X</span>
                </div>
              </button>
            </div>
          </div>

          <button
            @click="generateSocialPosts"
            :disabled="isGeneratingSocialPosts"
            class="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-md hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <svg v-if="!isGeneratingSocialPosts" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <svg v-else class="w-5 h-5 spin-reverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ isGeneratingSocialPosts ? 'Generating...' : `Generate ${selectedPlatform === 'linkedin' ? 'LinkedIn' : 'X'} Post` }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400">Loading content...</div>
    </div>

    <!-- Revision Timeline Modal -->
    <RevisionTimeline
      :is-open="showRevisionTimeline"
      :content-id="content?.id || ''"
      :project-id="content?.projectId || ''"
      :content="content"
      @close="showRevisionTimeline = false"
      @revision-restored="loadContent"
    />

    <!-- Social Post Modal -->
    <div v-if="showSocialPostsModal && socialPost" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="closeSocialPostsModal"></div>
        
        <div class="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <!-- Header -->
          <div :class="[
            'px-6 pt-6 pb-4',
            socialPost.platform === 'linkedin' 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700'
              : 'bg-gradient-to-r from-gray-800 to-gray-900'
          ]">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  socialPost.platform === 'linkedin' ? 'bg-gray-800' : 'bg-gray-700'
                ]">
                  <svg v-if="socialPost.platform === 'linkedin'" class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <svg v-else class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg leading-6 font-medium text-white">
                    {{ socialPost.platform === 'linkedin' ? 'LinkedIn' : 'X' }} Post
                  </h3>
                  <p :class="[
                    'text-sm',
                    socialPost.platform === 'linkedin' ? 'text-blue-100' : 'text-gray-300'
                  ]">Copy and share on {{ socialPost.platform === 'linkedin' ? 'LinkedIn' : 'X' }}</p>
                </div>
              </div>
              <button
                @click="closeSocialPostsModal"
                class="text-white hover:text-gray-200 focus:outline-none"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="bg-gray-800 px-6 py-4">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2">
                  <svg v-if="socialPost.platform === 'linkedin'" class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <svg v-else class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <h4 class="text-md font-medium text-white">{{ socialPost.platform === 'linkedin' ? 'LinkedIn' : 'X' }}</h4>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    v-if="socialPost.platform === 'linkedin'"
                    @click="postToLinkedIn"
                    class="px-3 py-1.5 text-sm text-white rounded-md focus:outline-none focus:ring-2 flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>Post</span>
                  </button>
                  <button
                    v-else
                    @click="postToX"
                    class="px-3 py-1.5 text-sm text-white rounded-md focus:outline-none focus:ring-2 flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 focus:ring-gray-500"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Post</span>
                  </button>
                  <button
                    @click="copyToClipboard(socialPost.post, socialPost.platform === 'linkedin' ? 'LinkedIn' : 'X')"
                    :class="[
                      'px-3 py-1.5 text-sm text-white rounded-md focus:outline-none focus:ring-2 flex items-center space-x-1',
                      socialPost.platform === 'linkedin'
                        ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        : 'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500'
                    ]"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              <div :class="[
                'border border-gray-600 rounded-lg p-4',
                socialPost.platform === 'linkedin' ? 'bg-gray-900 max-h-96 overflow-y-auto' : 'bg-gray-900'
              ]">
                <p class="text-white whitespace-pre-wrap">{{ socialPost.post }}</p>
                <p v-if="socialPost.platform === 'x'" class="text-xs text-gray-400 mt-2">
                  {{ socialPost.post.length }} character{{ socialPost.post.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-800 px-6 py-4 flex justify-end">
            <button
              @click="closeSocialPostsModal"
              class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useProjectStore } from '@/stores/projects'
import MarkdownCodeEditor from '@/components/editor/MarkdownCodeEditor.vue'
import MarkdownPreview from '@/components/studio/MarkdownPreview.vue'
import TagManager from '@/components/content/TagManager.vue'
import SkillsManager from '@/components/content/SkillsManager.vue'
import ContentBlocksEditor from '@/components/content/ContentBlocksEditor.vue'
import ExperienceRolesEditor from '@/components/content/ExperienceRolesEditor.vue'
import ContentLinksManager from '@/components/content/ContentLinksManager.vue'
import RevisionTimeline from '@/components/content/RevisionTimeline.vue'
import FeaturedImageSelector from '@/components/content/FeaturedImageSelector.vue'
import type { Content, Project, ContentTag, Skill } from '@/stores/projects'
import { format } from 'date-fns'
import { useToast } from 'vue-toastification'
import api, { aiApi } from '@/services/api'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const toast = useToast()

const content = ref<Content | null>(null)
const project = ref<Project | null>(null)
const isSaving = ref(false)
const isDeleting = ref(false)
const showRevisionTimeline = ref(false)
const contentView = ref<'edit' | 'preview'>('preview')

// Unsaved-changes tracking, so leaving the page (including to Editor Studio)
// prompts a confirmation instead of silently discarding edits — same pattern
// as ContentStudioView.vue's dirty/confirmDiscardChanges guard.
const dirty = ref(false)
const isPopulatingForm = ref(false)

// Social Post Generator State
const isGeneratingSocialPosts = ref(false)
const showSocialPostsModal = ref(false)
const selectedPlatform = ref<'linkedin' | 'x'>('linkedin')
const socialPost = ref<{ post: string; platform: string } | null>(null)

const editForm = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  // Project-specific fields
  startDate: '',
  endDate: '',
  isOngoing: false,
  featuredImage: '',
  projectLinks: {
    github: '',
    devpost: '',
    other: [] as string[]
  },
  contributors: [] as string[],
  linkedSkills: [] as Skill[],
  // Experience-specific fields
  experienceCategory: '' as 'JOB' | 'EDUCATION' | 'CERTIFICATION' | '',
  location: '',
  locationType: '' as 'REMOTE' | 'HYBRID' | 'ONSITE' | '',
  // Tags
  tags: [] as ContentTag[],
  // Status
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'REVISION',
  // Legacy metadata (deprecated - kept for backward compatibility)
  metadata: {}
})

watch(editForm, () => {
  if (!isPopulatingForm.value) dirty.value = true
}, { deep: true, flush: 'sync' })

// Computed properties
const wordCount = computed(() => {
  if (!editForm.content) return 0
  return editForm.content.trim().split(/\s+/).filter(word => word.length > 0).length
})

const characterCount = computed(() => {
  return editForm.content?.length || 0
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const getStatusClass = (status?: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'text-amber-400 bg-amber-400/20',
    PUBLISHED: 'text-green-400 bg-green-400/20',
    HIDDEN: 'text-yellow-400 bg-yellow-400/20',
    REVISION: 'text-blue-400 bg-blue-400/20'
  }
  return classes[status || 'DRAFT'] || classes.DRAFT
}

const getStatusDropdownClass = (status: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'bg-amber-500/20 text-amber-300 border-amber-600/50 hover:bg-amber-500/30',
    PUBLISHED: 'bg-green-500/20 text-green-300 border-green-600/50 hover:bg-green-500/30',
    HIDDEN: 'bg-yellow-500/20 text-yellow-300 border-yellow-600/50 hover:bg-yellow-500/30',
    REVISION: 'bg-blue-500/20 text-blue-300 border-blue-600/50 hover:bg-blue-500/30'
  }
  return classes[status || 'DRAFT'] || classes.DRAFT
}

const openEditorStudio = () => {
  if (!content.value) return
  router.push({ name: 'studio-content', params: { projectId: content.value.projectId, id: content.value.id } })
}

// Social Post Generator Methods
const generateSocialPosts = async () => {
  if (!content.value || !project.value) return

  try {
    isGeneratingSocialPosts.value = true
    
    const response = await aiApi.post('/ai/social-posts', {
      contentId: content.value.id,
      projectId: content.value.projectId,
      platform: selectedPlatform.value
    })
    
    socialPost.value = response.data
    showSocialPostsModal.value = true
    toast.success(`${selectedPlatform.value === 'linkedin' ? 'LinkedIn' : 'X'} post generated successfully!`)
  } catch (error: any) {
    console.error('Failed to generate social post:', error)
    toast.error(error.response?.data?.message || 'Failed to generate social post. Please try again.')
  } finally {
    isGeneratingSocialPosts.value = false
  }
}

const copyToClipboard = async (text: string, platform: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${platform} post copied to clipboard!`)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      toast.success(`${platform} post copied to clipboard!`)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
    document.body.removeChild(textArea)
  }
}

const getPostUrl = (): string => {
  if (!content.value || !project.value) return ''
  
  // Extract URL from post text if it exists
  const urlMatch = socialPost.value?.post.match(/https?:\/\/[^\s]+/i)
  if (urlMatch) {
    return urlMatch[0]
  }
  
  // Otherwise construct it from content and project
  const slug = content.value.slug || content.value.id
  return `https://${project.value.subdomain}.foligo.tech/${slug}`
}

const postToLinkedIn = () => {
  if (!socialPost.value) return
  
  const url = getPostUrl()
  if (!url) {
    toast.error('Unable to determine post URL')
    return
  }
  
  // LinkedIn share URL
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  window.open(shareUrl, '_blank', 'width=600,height=400')
  toast.info('Opening LinkedIn share dialog...')
}

const postToX = () => {
  if (!socialPost.value) return
  
  const url = getPostUrl()
  if (!url) {
    toast.error('Unable to determine post URL')
    return
  }
  
  // Extract text from post (remove the URL to avoid duplication since X will show it as a link card)
  let postText = socialPost.value.post
  // Remove the URL if it appears anywhere in the text (to avoid duplication)
  const urlRegex = new RegExp(`\\s*${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'gi')
  postText = postText.replace(urlRegex, ' ').trim().replace(/\s+/g, ' ')
  
  // X/Twitter share URL - X will automatically show the URL as a link preview card
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(url)}`
  window.open(shareUrl, '_blank', 'width=600,height=400')
  toast.info('Opening X share dialog...')
}

const closeSocialPostsModal = () => {
  showSocialPostsModal.value = false
  socialPost.value = null
}

const loadContent = async () => {
  try {
    isPopulatingForm.value = true
    const contentId = route.params.id as string
    const projectId = route.params.projectId as string

    // Load project first
    project.value = await projectStore.fetchProject(projectId)

    // Fetch full content with all relationships
    const response = await api.get(`/content/${contentId}`)
    content.value = response.data

    if (content.value) {
      // Populate form
      editForm.title = content.value.title
      editForm.slug = content.value.slug || ''
      editForm.excerpt = content.value.excerpt || ''
      editForm.content = content.value.content
      
      // Project-specific fields
      if (content.value.startDate) {
        editForm.startDate = content.value.startDate.split('T')[0]
      }
      if (content.value.endDate) {
        editForm.endDate = content.value.endDate.split('T')[0]
      }
      editForm.isOngoing = content.value.isOngoing || false
      editForm.featuredImage = content.value.featuredImage || ''
      editForm.projectLinks = content.value.projectLinks || { github: '', devpost: '', other: [] }
      editForm.contributors = content.value.contributors || []
      editForm.linkedSkills = content.value.linkedSkills || []
      
      // Experience-specific fields
      editForm.experienceCategory = content.value.experienceCategory || ''
      editForm.location = content.value.location || ''
      editForm.locationType = content.value.locationType || ''
      
      // Tags
      editForm.tags = content.value.tags || []
      
      // Status
      editForm.status = content.value.status || 'DRAFT'
      
      // Legacy metadata (deprecated - kept for backward compatibility)
      editForm.metadata = content.value.metadata || {}
    }
  } catch (error) {
    console.error('Failed to load content:', error)
    router.push('/portfolios')
  } finally {
    isPopulatingForm.value = false
    dirty.value = false
  }
}

const handleMarkdownSave = async (contentValue: string) => {
  // Update the form content with the value from the editor
  editForm.content = contentValue
  // Then save the content
  await saveContent()
}

const deleteContent = async () => {
  if (!content.value || isDeleting.value) return

  const contentToDelete = content.value
  if (!window.confirm(`Are you sure you want to delete "${contentToDelete.title}"? This action cannot be undone.`)) {
    return
  }

  try {
    isDeleting.value = true
    await projectStore.deleteContent(contentToDelete.id)
    toast.success('Content deleted')
    await router.push(`/portfolios/${contentToDelete.projectId}`)
  } catch (error: any) {
    console.error('Failed to delete content:', error)
    toast.error(error.response?.data?.message || 'Failed to delete content')
  } finally {
    isDeleting.value = false
  }
}

const saveContent = async () => {
  if (!content.value) return

  try {
    isSaving.value = true
    
    const updateData: any = {
      title: editForm.title,
      slug: editForm.slug || undefined,
      excerpt: editForm.excerpt || undefined,
      content: editForm.content,
      metadata: editForm.metadata,
      status: editForm.status
    }
    
    // Add project-specific fields
    if (content.value.type === 'PROJECT') {
      if (editForm.startDate) updateData.startDate = editForm.startDate
      if (editForm.endDate) updateData.endDate = editForm.endDate
      updateData.isOngoing = editForm.isOngoing
      if (editForm.featuredImage) updateData.featuredImage = editForm.featuredImage
      updateData.projectLinks = editForm.projectLinks
      updateData.contributors = editForm.contributors.filter(c => c.trim())
    }

    // Add blog-specific fields
    if (content.value.type === 'BLOG') {
      if (editForm.featuredImage) updateData.featuredImage = editForm.featuredImage
    }
    
    // Add experience-specific fields
    if (content.value.type === 'EXPERIENCE') {
      if (editForm.experienceCategory) updateData.experienceCategory = editForm.experienceCategory
      if (editForm.location) updateData.location = editForm.location
      if (editForm.locationType) updateData.locationType = editForm.locationType
      if (editForm.startDate) updateData.startDate = editForm.startDate
      if (editForm.endDate) updateData.endDate = editForm.endDate
      updateData.isOngoing = editForm.isOngoing
    }
    
    await projectStore.updateContent(content.value.id, updateData)
    
    // Update tags separately
    if (editForm.tags && editForm.tags.length > 0) {
      await api.post(`/projects/${content.value.projectId}/content/${content.value.id}/tags`, {
        tagIds: editForm.tags.map(t => t.id)
      })
    }
    
    // Update skills separately (for projects)
    if (content.value.type === 'PROJECT' && editForm.linkedSkills && editForm.linkedSkills.length > 0) {
      await api.post(`/projects/${content.value.projectId}/content/${content.value.id}/skills`, {
        skillIds: editForm.linkedSkills.map(s => s.id)
      })
    }
    
    // Reload content to get updated data
    await loadContent()
  } catch (error) {
    console.error('Failed to save content:', error)
  } finally {
    isSaving.value = false
  }
}

// Status is now managed through the status dropdown in the header

function confirmDiscardChanges(): boolean {
  if (!dirty.value) return true
  return window.confirm('You have unsaved changes. Leave without saving?')
}

// Covers every way of leaving this page — Back, the sidebar, opening Editor
// Studio via openEditorStudio(), etc. — since they're all just route changes.
onBeforeRouteLeave(() => confirmDiscardChanges())

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

// Refetch if this exact post was changed elsewhere (e.g. by the AI Content
// Creator) — but don't clobber in-progress local edits; just let the user
// know instead.
function handleDataChanged(event: Event) {
  const detail = (event as CustomEvent).detail as { kind?: string; postId?: string } | undefined
  if (detail?.kind !== 'post' || detail.postId !== content.value?.id) return
  if (dirty.value) {
    toast.info('This post was updated elsewhere. Save or discard your changes, then reload to see the latest version.')
    return
  }
  loadContent()
}

onMounted(() => {
  loadContent()
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('foligo-data-changed', handleDataChanged)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('foligo-data-changed', handleDataChanged)
})
</script>

<style scoped>
/* Status dropdown - only color code the select button, not the options */
select[class*="getStatusDropdownClass"] option,
select option {
  background-color: #1f2937;
  color: #ffffff;
}

/* Reverse spin animation for spinners */
@keyframes spin-reverse {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

.spin-reverse {
  animation: spin-reverse 1s linear infinite;
}
</style>
