<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Project Details</h1>
          <p class="text-gray-600 mt-1">{{ project?.name || 'Loading...' }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="showCreateContentModal = true"
            class="btn btn-primary"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Content
          </button>
          <button
            @click="showSettingsModal = true"
            class="btn btn-outline"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="projectStore.isLoading" class="space-y-6">
      <div class="card p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div class="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>

    <!-- Project Not Found -->
    <div v-else-if="!project" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
      <p class="mt-1 text-sm text-gray-500">The project you're looking for doesn't exist or you don't have access to it.</p>
      <div class="mt-6">
        <router-link to="/projects" class="btn btn-primary">
          Back to Projects
        </router-link>
      </div>
    </div>

    <!-- Project Content -->
    <div v-else class="space-y-6">
      <!-- Project Info -->
      <div class="card p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ project.name }}</h2>
            <p class="text-gray-600 mb-4">{{ project.description || 'No description provided' }}</p>
            
            <div class="flex items-center space-x-6 text-sm text-gray-500">
              <div class="flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Created {{ formatDate(project.createdAt) }}
              </div>
              <div class="flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Updated {{ formatDate(project.updatedAt) }}
              </div>
              <div class="flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ project._count?.content || 0 }} posts
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <span
              v-if="project.ownerId === authStore.user?.id"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              Owner
            </span>
            <span
              v-else
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              Member
            </span>
          </div>
        </div>
      </div>

      <!-- Team Members -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Team Members</h3>
          <button
            v-if="canManageMembers"
            @click="showAddMemberModal = true"
            class="btn btn-outline btn-sm"
          >
            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Member
          </button>
        </div>
        
        <div v-if="project.members && project.members.length > 0" class="space-y-3">
          <div
            v-for="member in project.members"
            :key="member.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center">
              <div class="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium text-gray-600">
                  {{ member.user.name.charAt(0) }}
                </span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">{{ member.user.name }}</p>
                <p class="text-xs text-gray-500">{{ member.user.email }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-red-100 text-red-800': member.role === 'ADMIN',
                  'bg-yellow-100 text-yellow-800': member.role === 'EDITOR',
                  'bg-green-100 text-green-800': member.role === 'VIEWER'
                }"
              >
                {{ member.role }}
              </span>
              <button
                v-if="canManageMembers && member.userId !== authStore.user?.id"
                @click="removeMember(member)"
                class="text-gray-400 hover:text-danger-500"
                title="Remove member"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-4 text-gray-500">
          No team members yet
        </div>
      </div>

      <!-- Content Overview -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Content Overview</h3>
          <router-link
            to="/content"
            class="btn btn-primary btn-sm"
          >
            <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Manage Content
          </router-link>
        </div>
        
        <div v-if="project.content && project.content.length > 0" class="space-y-3">
          <div
            v-for="content in project.content"
            :key="content.id"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div class="flex items-center flex-1">
              <div class="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <span class="text-sm font-medium text-gray-600">
                  {{ getContentIcon(content.type) }}
                </span>
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <h4 class="text-sm font-medium text-gray-900">{{ content.title }}</h4>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800': content.isPublished,
                      'bg-gray-100 text-gray-800': !content.isPublished
                    }"
                  >
                    {{ content.isPublished ? 'Published' : 'Draft' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  {{ content.type }} • {{ formatDate(content.updatedAt) }}
                </p>
                <p v-if="content.excerpt" class="text-xs text-gray-600 mt-1 line-clamp-2">
                  {{ content.excerpt }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <router-link
                :to="`/projects/${projectId}/content/${content.id}/edit`"
                class="text-primary-600 hover:text-primary-500 text-sm"
              >
                Edit
              </router-link>
              <button
                @click="deleteContent(content)"
                class="text-gray-400 hover:text-danger-500"
                title="Delete content"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No content yet</h3>
          <p class="mt-1 text-sm text-gray-500">Start by adding your first post.</p>
          <div class="mt-6">
            <button
              @click="showCreateContentModal = true"
              class="btn btn-primary"
            >
              Add Content
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div
      v-if="showAddMemberModal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showAddMemberModal = false"></div>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form @submit.prevent="addMember">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                Add Team Member
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label for="memberEmail" class="label">Email Address</label>
                  <input
                    id="memberEmail"
                    v-model="memberForm.email"
                    type="email"
                    required
                    class="input"
                    placeholder="Enter member's email address"
                  />
                </div>
                
                <div>
                  <label for="memberRole" class="label">Role</label>
                  <select
                    id="memberRole"
                    v-model="memberForm.role"
                    class="input"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                :disabled="isAddingMember"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ isAddingMember ? 'Adding...' : 'Add Member' }}
              </button>
              <button
                type="button"
                @click="showAddMemberModal = false"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Content Modal -->
    <CreateContentModal
      :is-open="showCreateContentModal"
      :project="project"
      @close="showCreateContentModal = false"
      @created="handleContentCreated"
    />

    <!-- Project Settings Modal -->
    <div
      v-if="showSettingsModal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showSettingsModal = false"></div>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form @submit.prevent="saveProjectSettings">
            <div class="bg-white px-6 pt-6 pb-4">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Project Settings
                </h3>
                <button
                  type="button"
                  @click="showSettingsModal = false"
                  class="text-gray-400 hover:text-gray-500"
                >
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Project Basic Info -->
              <div class="space-y-6">
                <div>
                  <h4 class="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="projectName" class="block text-sm font-medium text-gray-700 mb-1">
                        Project Name *
                      </label>
                      <input
                        id="projectName"
                        v-model="projectForm.name"
                        type="text"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter project name"
                      />
                    </div>
                    <div>
                      <label for="projectSubdomain" class="block text-sm font-medium text-gray-700 mb-1">
                        Subdomain
                      </label>
                      <input
                        id="projectSubdomain"
                        v-model="projectForm.subdomain"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="my-portfolio"
                      />
                      <p class="text-xs text-gray-500 mt-1">Will be available at {subdomain}.foligo.tech</p>
                    </div>
                  </div>
                  <div class="mt-4">
                    <label for="projectDescription" class="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="projectDescription"
                      v-model="projectForm.description"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe your project..."
                    ></textarea>
                  </div>
                </div>

                <!-- Site Configuration -->
                <div>
                  <h4 class="text-md font-medium text-gray-900 mb-4">Site Configuration</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="siteName" class="block text-sm font-medium text-gray-700 mb-1">
                        Site Name
                      </label>
                      <input
                        id="siteName"
                        v-model="siteForm.siteName"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="My Portfolio"
                      />
                    </div>
                    <div>
                      <label for="siteDescription" class="block text-sm font-medium text-gray-700 mb-1">
                        Site Description
                      </label>
                      <input
                        id="siteDescription"
                        v-model="siteForm.siteDescription"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="A brief description of your site"
                      />
                    </div>
                  </div>
                </div>

                <!-- Color Scheme -->
                <div>
                  <h4 class="text-md font-medium text-gray-900 mb-4">Color Scheme</h4>
                  <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label for="primaryColor" class="block text-sm font-medium text-gray-700 mb-1">
                        Primary
                      </label>
                      <input
                        id="primaryColor"
                        v-model="siteForm.primaryColor"
                        type="color"
                        class="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label for="secondaryColor" class="block text-sm font-medium text-gray-700 mb-1">
                        Secondary
                      </label>
                      <input
                        id="secondaryColor"
                        v-model="siteForm.secondaryColor"
                        type="color"
                        class="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label for="accentColor" class="block text-sm font-medium text-gray-700 mb-1">
                        Accent
                      </label>
                      <input
                        id="accentColor"
                        v-model="siteForm.accentColor"
                        type="color"
                        class="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label for="backgroundColor" class="block text-sm font-medium text-gray-700 mb-1">
                        Background
                      </label>
                      <input
                        id="backgroundColor"
                        v-model="siteForm.backgroundColor"
                        type="color"
                        class="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label for="textColor" class="block text-sm font-medium text-gray-700 mb-1">
                        Text
                      </label>
                      <input
                        id="textColor"
                        v-model="siteForm.textColor"
                        type="color"
                        class="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <!-- Layout Settings -->
                <div>
                  <h4 class="text-md font-medium text-gray-900 mb-4">Layout Settings</h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label for="indexLayout" class="block text-sm font-medium text-gray-700 mb-1">
                        Index Layout
                      </label>
                      <select
                        id="indexLayout"
                        v-model="siteForm.indexLayout"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                        <option value="masonry">Masonry</option>
                      </select>
                    </div>
                    <div>
                      <label for="archiveLayout" class="block text-sm font-medium text-gray-700 mb-1">
                        Archive Layout
                      </label>
                      <select
                        id="archiveLayout"
                        v-model="siteForm.archiveLayout"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                        <option value="masonry">Masonry</option>
                      </select>
                    </div>
                    <div>
                      <label for="singleLayout" class="block text-sm font-medium text-gray-700 mb-1">
                        Single Layout
                      </label>
                      <select
                        id="singleLayout"
                        v-model="siteForm.singleLayout"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="standard">Standard</option>
                        <option value="wide">Wide</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- SEO Settings -->
                <div>
                  <h4 class="text-md font-medium text-gray-900 mb-4">SEO Settings</h4>
                  <div class="space-y-4">
                    <div>
                      <label for="metaTitle" class="block text-sm font-medium text-gray-700 mb-1">
                        Meta Title
                      </label>
                      <input
                        id="metaTitle"
                        v-model="siteForm.metaTitle"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Page title for search engines"
                      />
                    </div>
                    <div>
                      <label for="metaDescription" class="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        id="metaDescription"
                        v-model="siteForm.metaDescription"
                        rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Description for search engines"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <!-- Publish Status -->
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 class="text-sm font-medium text-gray-900">Publish Status</h5>
                    <p class="text-xs text-gray-500">Make your site publicly accessible</p>
                  </div>
                  <div class="flex items-center">
                    <input
                      id="isPublished"
                      v-model="projectForm.isPublished"
                      type="checkbox"
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label for="isPublished" class="ml-2 text-sm text-gray-700">
                      Publish site
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                :disabled="isSaving"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {{ isSaving ? 'Saving...' : 'Save Settings' }}
              </button>
              <button
                type="button"
                @click="showSettingsModal = false"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore, type ProjectMember, type Content } from '@/stores/projects'
import { format } from 'date-fns'
import CreateContentModal from '@/components/content/CreateContentModal.vue'

const route = useRoute()
const authStore = useAuthStore()
const projectStore = useProjectStore()

const projectId = route.params.id as string
const showAddMemberModal = ref(false)
const showSettingsModal = ref(false)
const showCreateContentModal = ref(false)
const isAddingMember = ref(false)
const isSaving = ref(false)

const memberForm = reactive({
  email: '',
  role: 'VIEWER' as 'VIEWER' | 'EDITOR' | 'ADMIN'
})

const projectForm = reactive({
  name: '',
  description: '',
  subdomain: '',
  isPublished: false
})

const siteForm = reactive({
  siteName: '',
  siteDescription: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  accentColor: '#F59E0B',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  indexLayout: 'grid',
  archiveLayout: 'list',
  singleLayout: 'standard',
  metaTitle: '',
  metaDescription: ''
})

const project = computed(() => projectStore.currentProject)

const canManageMembers = computed(() => {
  if (!project.value || !authStore.user) return false
  return project.value.ownerId === authStore.user.id
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const addMember = async () => {
  if (!memberForm.email || !projectId) return

  try {
    isAddingMember.value = true
    await projectStore.addProjectMember(projectId, memberForm.email, memberForm.role)
    showAddMemberModal.value = false
    memberForm.email = ''
    memberForm.role = 'VIEWER'
  } catch (error) {
    console.error('Failed to add member:', error)
  } finally {
    isAddingMember.value = false
  }
}

const removeMember = async (member: ProjectMember) => {
  if (!confirm(`Are you sure you want to remove ${member.user.name} from this project?`)) {
    return
  }

  try {
    await projectStore.removeProjectMember(projectId, member.userId)
  } catch (error) {
    console.error('Failed to remove member:', error)
  }
}

const getContentIcon = (type: string) => {
  switch (type) {
    case 'PROJECT':
      return '🚀'
    case 'BLOG':
      return '📝'
    case 'EXPERIENCE':
      return '💼'
    default:
      return '📄'
  }
}

const deleteContent = async (content: Content) => {
  if (!confirm(`Are you sure you want to delete "${content.title}"?`)) {
    return
  }

  try {
    await projectStore.deleteContent(content.id)
  } catch (error) {
    console.error('Failed to delete content:', error)
  }
}

const handleContentCreated = (newContent: Content) => {
  showCreateContentModal.value = false
  // Content is automatically added to the project by the store
}

const saveProjectSettings = async () => {
  if (!project.value) return

  try {
    isSaving.value = true

    // Update project basic info
    await projectStore.updateProject(projectId, {
      name: projectForm.name,
      description: projectForm.description,
      subdomain: projectForm.subdomain
    })

    // Update site configuration
    await projectStore.updateSiteConfig(projectId, {
      siteName: siteForm.siteName,
      siteDescription: siteForm.siteDescription,
      primaryColor: siteForm.primaryColor,
      secondaryColor: siteForm.secondaryColor,
      accentColor: siteForm.accentColor,
      backgroundColor: siteForm.backgroundColor,
      textColor: siteForm.textColor,
      indexLayout: siteForm.indexLayout,
      archiveLayout: siteForm.archiveLayout,
      singleLayout: siteForm.singleLayout,
      metaTitle: siteForm.metaTitle,
      metaDescription: siteForm.metaDescription,
      layoutConfig: {} // Add empty layoutConfig object
    })

    // Update publish status
    await projectStore.publishProject(projectId, projectForm.isPublished)

    showSettingsModal.value = false
  } catch (error) {
    console.error('Failed to save project settings:', error)
  } finally {
    isSaving.value = false
  }
}

const initializeForms = () => {
  if (project.value) {
    // Initialize project form
    projectForm.name = project.value.name || ''
    projectForm.description = project.value.description || ''
    projectForm.subdomain = project.value.subdomain || ''
    projectForm.isPublished = project.value.isPublished || false

    // Initialize site form
    if (project.value.siteConfig) {
      const config = project.value.siteConfig
      siteForm.siteName = config.siteName || ''
      siteForm.siteDescription = config.siteDescription || ''
      siteForm.primaryColor = config.primaryColor || '#3B82F6'
      siteForm.secondaryColor = config.secondaryColor || '#1E40AF'
      siteForm.accentColor = config.accentColor || '#F59E0B'
      siteForm.backgroundColor = config.backgroundColor || '#FFFFFF'
      siteForm.textColor = config.textColor || '#1F2937'
      siteForm.indexLayout = config.indexLayout || 'grid'
      siteForm.archiveLayout = config.archiveLayout || 'list'
      siteForm.singleLayout = config.singleLayout || 'standard'
      siteForm.metaTitle = config.metaTitle || ''
      siteForm.metaDescription = config.metaDescription || ''
    }
  }
}

onMounted(async () => {
  await projectStore.fetchProject(projectId)
  initializeForms()
})
</script>
