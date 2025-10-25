<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
    <!-- Progress Bar -->
    <div class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">{{ currentStep }}</span>
                </div>
                <span class="ml-2 text-sm font-medium text-gray-700">Step {{ currentStep }} of {{ totalSteps }}</span>
              </div>
            </div>
            <div class="text-sm text-gray-500">
              {{ Math.round((currentStep / totalSteps) * 100) }}% Complete
            </div>
          </div>
          <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
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
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Step 1: Welcome -->
        <div v-if="currentStep === 1" class="p-8">
          <div class="text-center">
            <div class="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <svg class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-4">Welcome to Foligo!</h1>
            <p class="text-lg text-gray-600 mb-8">
              Let's get you set up with your portfolio management dashboard. 
              This will only take a few minutes.
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="text-center">
                <div class="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900">Create Projects</h3>
                <p class="text-sm text-gray-600">Organize your work into projects</p>
              </div>
              
              <div class="text-center">
                <div class="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900">Manage Content</h3>
                <p class="text-sm text-gray-600">Add and organize your content</p>
              </div>
              
              <div class="text-center">
                <div class="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900">AI Features</h3>
                <p class="text-sm text-gray-600">Get AI-powered insights</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Create First Project -->
        <div v-if="currentStep === 2" class="p-8">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Create Your First Project</h2>
            <p class="text-gray-600">
              Let's start by creating your first portfolio project. You can always add more later.
            </p>
          </div>
          
          <form @submit.prevent="createFirstProject" class="max-w-md mx-auto">
            <div class="space-y-4">
              <div>
                <label for="projectName" class="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  id="projectName"
                  v-model="projectForm.name"
                  type="text"
                  required
                  class="input w-full"
                  placeholder="e.g., My Portfolio, Web Development Showcase"
                />
              </div>
              
              <div>
                <label for="projectDescription" class="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="projectDescription"
                  v-model="projectForm.description"
                  rows="3"
                  class="input w-full"
                  placeholder="Brief description of your project..."
                ></textarea>
              </div>
            </div>
          </form>
        </div>

        <!-- Step 3: Choose Template -->
        <div v-if="currentStep === 3" class="p-8">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Choose a Template</h2>
            <p class="text-gray-600">
              Select a template to get started quickly, or choose blank to start from scratch.
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="template in templates"
              :key="template.id"
              @click="selectedTemplate = template.id"
              class="cursor-pointer rounded-lg border-2 p-4 transition-all duration-200"
              :class="selectedTemplate === template.id 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-4xl mb-2">{{ template.icon }}</div>
                  <div class="text-sm text-gray-600">{{ template.name }}</div>
                </div>
              </div>
              <h3 class="font-semibold text-gray-900 mb-1">{{ template.name }}</h3>
              <p class="text-sm text-gray-600">{{ template.description }}</p>
            </div>
          </div>
        </div>

        <!-- Step 4: Preferences -->
        <div v-if="currentStep === 4" class="p-8">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Set Your Preferences</h2>
            <p class="text-gray-600">
              Help us personalize your experience.
            </p>
          </div>
          
          <div class="max-w-md mx-auto space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                What's your primary focus?
              </label>
              <div class="space-y-2">
                <label v-for="focus in focusAreas" :key="focus.id" class="flex items-center">
                  <input
                    v-model="preferences.focus"
                    :value="focus.id"
                    type="radio"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span class="ml-2 text-sm text-gray-700">{{ focus.name }}</span>
                </label>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                How often do you plan to update your portfolio?
              </label>
              <select v-model="preferences.updateFrequency" class="input w-full">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="as-needed">As needed</option>
              </select>
            </div>
            
            <div class="flex items-center">
              <input
                v-model="preferences.enableNotifications"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700">
                Send me helpful tips and updates about new features
              </span>
            </div>
          </div>
        </div>

        <!-- Step 5: Complete -->
        <div v-if="currentStep === 5" class="p-8 text-center">
          <div class="mx-auto h-16 w-16 bg-success-100 rounded-full flex items-center justify-center mb-6">
            <svg class="h-8 w-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">You're All Set!</h2>
          <p class="text-gray-600 mb-8">
            Welcome to Foligo! Your dashboard is ready and you can start creating amazing portfolios.
          </p>
          
          <div class="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 class="font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex items-center">
                <svg class="h-4 w-4 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Add content to your project
              </div>
              <div class="flex items-center">
                <svg class="h-4 w-4 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Customize your portfolio design
              </div>
              <div class="flex items-center">
                <svg class="h-4 w-4 text-success-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Share your portfolio with others
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="bg-gray-50 px-8 py-4 flex justify-between items-center">
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            class="btn btn-outline"
          >
            Previous
          </button>
          <div v-else></div>
          
          <button
            v-if="currentStep < totalSteps"
            @click="nextStep"
            :disabled="!canProceed"
            class="btn btn-primary"
          >
            {{ currentStep === 4 ? 'Complete Setup' : 'Next' }}
          </button>
          <button
            v-else
            @click="completeOnboarding"
            :disabled="isLoading"
            class="btn btn-primary"
          >
            {{ isLoading ? 'Completing...' : 'Get Started' }}
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

const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()

const currentStep = ref(1)
const totalSteps = 5
const isLoading = ref(false)

const projectForm = reactive({
  name: '',
  description: ''
})

const selectedTemplate = ref('blank')

const preferences = reactive({
  focus: 'web-development',
  updateFrequency: 'monthly',
  enableNotifications: true
})

const templates = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch',
    icon: '📄'
  },
  {
    id: 'portfolio',
    name: 'Portfolio Template',
    description: 'Perfect for showcasing your work',
    icon: '💼'
  },
  {
    id: 'blog',
    name: 'Blog Template',
    description: 'Great for writing and sharing thoughts',
    icon: '📝'
  },
  {
    id: 'showcase',
    name: 'Project Showcase',
    description: 'Highlight your projects and achievements',
    icon: '🚀'
  },
  {
    id: 'resume',
    name: 'Resume Template',
    description: 'Professional resume and CV',
    icon: '👔'
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'For artists and creative professionals',
    icon: '🎨'
  }
]

const focusAreas = [
  { id: 'web-development', name: 'Web Development' },
  { id: 'design', name: 'Design' },
  { id: 'writing', name: 'Writing' },
  { id: 'photography', name: 'Photography' },
  { id: 'business', name: 'Business' },
  { id: 'other', name: 'Other' }
]

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return true
    case 2:
      return projectForm.name.trim().length > 0
    case 3:
      return selectedTemplate.value !== ''
    case 4:
      return preferences.focus !== ''
    case 5:
      return true
    default:
      return false
  }
})

const nextStep = async () => {
  if (currentStep.value === 2 && projectForm.name) {
    // Create the first project
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
    await authStore.completeOnboarding()
    router.push('/')
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
