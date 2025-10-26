<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
    <!-- Progress Bar -->
    <div class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">{{ currentStep }}</span>
                </div>
                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Step {{ currentStep }} of {{ totalSteps }}</span>
              </div>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ Math.round((currentStep / totalSteps) * 100) }}% Complete
            </div>
          </div>
          <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              class="bg-primary-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <!-- Step 1: Create First Project -->
        <div v-if="currentStep === 1" class="p-8">
          <div class="text-center mb-8">
            <div class="mx-auto h-16 w-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-6">
              <img :src="squiggleLogo" alt="Foligo" class="h-12 w-12 p-2" />
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Foligo!</h1>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Let's create your first project to get started.
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              You can always add more projects and customize them later.
            </p>
          </div>
          
          <div class="max-w-md mx-auto">
            <div class="space-y-4">
              <div>
                <label for="projectName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Name *
                </label>
                <input
                  id="projectName"
                  v-model="projectForm.name"
                  type="text"
                  required
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="e.g., My Portfolio"
                />
              </div>
              
              <div>
                <label for="projectDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="projectDescription"
                  v-model="projectForm.description"
                  rows="3"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="Brief description..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Optional Site Setup -->
        <div v-if="currentStep === 2" class="p-8">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create a Public Portfolio Site?</h2>
            <p class="text-gray-600 dark:text-gray-400">
              Optionally create a public portfolio site that can be accessed via a custom subdomain.
            </p>
          </div>
          
          <div class="max-w-lg mx-auto space-y-6">
            <!-- Want to create site toggle -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <div class="flex items-start">
                <input
                  id="wantsToCreateSite"
                  v-model="wantsToCreateSite"
                  type="checkbox"
                  class="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <div class="ml-3">
                  <label for="wantsToCreateSite" class="text-sm font-medium text-gray-900 dark:text-white">
                    Yes, create a public portfolio site for me
                  </label>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get a custom subdomain (e.g., yourname.foligo.tech) where your portfolio will be publicly accessible
                  </p>
                </div>
              </div>
            </div>

            <!-- Site configuration (only if they want a site) -->
            <div v-if="wantsToCreateSite" class="space-y-4 border-t border-gray-200 dark:border-gray-600 pt-6">
              <div>
                <label for="subdomain" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subdomain *
                </label>
                <div class="mt-1 flex rounded-md shadow-sm">
                  <input
                    id="subdomain"
                    v-model="siteConfig.subdomain"
                    type="text"
                    required
                    pattern="[a-z0-9-]+"
                    class="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="yourname"
                  />
                  <span class="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 sm:text-sm">
                    .foligo.tech
                  </span>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
              </div>

              <div>
                <label for="siteName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Site Name
                </label>
                <input
                  id="siteName"
                  v-model="siteConfig.siteName"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  placeholder="My Portfolio"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="primaryColor" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Primary Color
                  </label>
                  <div class="flex items-center space-x-2">
                    <input
                      id="primaryColor"
                      v-model="siteConfig.primaryColor"
                      type="color"
                      class="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded"
                    />
                    <input
                      v-model="siteConfig.primaryColor"
                      type="text"
                      class="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
                      pattern="#[0-9A-Fa-f]{6}"
                    />
                  </div>
                </div>

                <div>
                  <label for="secondaryColor" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Secondary Color
                  </label>
                  <div class="flex items-center space-x-2">
                    <input
                      id="secondaryColor"
                      v-model="siteConfig.secondaryColor"
                      type="color"
                      class="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded"
                    />
                    <input
                      v-model="siteConfig.secondaryColor"
                      type="text"
                      class="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
                      pattern="#[0-9A-Fa-f]{6}"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="bg-gray-50 dark:bg-gray-700 px-8 py-4 flex justify-between items-center">
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Previous
          </button>
          <div v-else></div>
          
          <button
            v-if="currentStep < totalSteps"
            @click="nextStep"
            :disabled="!canProceed"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            v-else
            @click="completeOnboarding"
            :disabled="isLoading"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Completing...' : 'Complete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projects'
import squiggleLogo from '@/assets/logos/squiggle.svg'

const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()

const currentStep = ref(1)
const totalSteps = 2
const isLoading = ref(false)
const wantsToCreateSite = ref(false)

const projectForm = reactive({
  name: '',
  description: ''
})

const siteConfig = reactive({
  siteName: authStore.user?.name || '',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  subdomain: ''
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return projectForm.name.trim().length > 0
    case 2:
      // If they don't want a site, they can proceed
      if (!wantsToCreateSite.value) return true
      // If they want a site, subdomain is required
      return siteConfig.subdomain.trim().length > 0 && /^[a-z0-9-]+$/.test(siteConfig.subdomain)
    default:
      return false
  }
})

const nextStep = async () => {
  if (currentStep.value === 1 && projectForm.name) {
    // Create the first project (without site config yet)
    try {
      await projectStore.createProject({
        name: projectForm.name,
        description: projectForm.description
      })
    } catch (error) {
      console.error('Failed to create project:', error)
      return
    }
  }
  
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const completeOnboarding = async () => {
  try {
    isLoading.value = true
    
    // If they wanted to create a site but it wasn't created yet, create it now
    if (wantsToCreateSite.value && siteConfig.subdomain) {
      try {
        // Get the most recently created project
        await projectStore.fetchProjects()
        const projects = projectStore.ownedProjects
        const latestProject = projects[0] // Most recent project
        
        if (latestProject) {
          // Update project with subdomain
          await projectStore.updateProject(latestProject.id, {
            subdomain: siteConfig.subdomain
          })

          // Set up site configuration
          await projectStore.updateSiteConfig(latestProject.id, {
            siteName: siteConfig.siteName,
            primaryColor: siteConfig.primaryColor,
            secondaryColor: siteConfig.secondaryColor
          })

          // Publish the site
          await projectStore.publishProject(latestProject.id, true)
        }
      } catch (error) {
        console.error('Failed to set up site:', error)
      }
    }
    
    await authStore.completeOnboarding()
    router.push('/')
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
