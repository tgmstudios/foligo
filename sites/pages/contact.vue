<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-300">Loading...</p>
      </div>
    </div>

    <!-- Error State -->
    <SiteNotFound v-else-if="error" :error="error" />

    <!-- Contact Page -->
    <div v-else-if="siteData" class="min-h-screen bg-slate-900 text-slate-100">
      <!-- Header -->
      <CommonHeader 
        :site-name="siteData?.siteConfig?.siteName || siteData?.project?.name || 'Portfolio'"
        :site-description="siteData?.siteConfig?.siteDescription || ''"
      />

      <!-- Main Content -->
      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Hero Section -->
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-white mb-4">
            Get In Touch
          </h2>
          <p class="text-xl text-slate-300 max-w-3xl mx-auto">
            I'd love to hear from you. Send me a message and I'll respond as soon as possible.
          </p>
        </div>

        <!-- Contact Form -->
        <div class="bg-slate-800 rounded-lg shadow-md p-8 border border-slate-700">
          <form @submit.prevent="submitForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-slate-200 mb-2">Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  id="name"
                  required
                  class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-slate-200 mb-2">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  id="email"
                  required
                  class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div>
              <label for="subject" class="block text-sm font-medium text-slate-200 mb-2">Subject</label>
              <input
                v-model="form.subject"
                type="text"
                id="subject"
                required
                class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Message subject"
              />
            </div>
            
            <div>
              <label for="message" class="block text-sm font-medium text-slate-200 mb-2">Message</label>
              <textarea
                v-model="form.message"
                id="message"
                rows="6"
                required
                class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your message..."
              ></textarea>
            </div>
            
            <div class="text-center">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                {{ isSubmitting ? 'Sending...' : 'Send Message' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Social Links -->
        <div v-if="socialLinks && Object.keys(socialLinks).length > 0" class="mt-12 text-center">
          <h3 class="text-2xl font-bold text-white mb-6">Connect With Me</h3>
          <div class="flex flex-wrap justify-center gap-4">
            <a 
              v-for="(url, platform) in socialLinks" 
              :key="platform"
              :href="url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="group flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-700 hover:border-blue-500"
            >
              <component :is="getSocialIcon(platform)" class="w-6 h-6 text-slate-300 group-hover:text-white" />
              <span class="text-slate-300 group-hover:text-white font-medium capitalize">{{ platform }}</span>
            </a>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-slate-800 border-t border-slate-700 mt-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="text-center">
            <p class="text-slate-400">
              © {{ new Date().getFullYear() }} {{ siteData?.siteConfig?.siteName || siteData?.project?.name }}. 
              Powered by <a href="https://foligo.tech" class="text-blue-400 hover:text-blue-300">Foligo</a>.
            </p>
          </div>
        </div>
      </footer>
    </div>

    <!-- Fallback State -->
    <div v-else class="min-h-screen bg-slate-900 flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-white mb-4">Site Not Found</h1>
        <p class="text-slate-300">Unable to load site data.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSubdomain } from '~/composables/useSubdomain'
import IconTwitter from '~/components/icons/IconTwitter.vue'
import IconGithub from '~/components/icons/IconGithub.vue'
import IconLinkedIn from '~/components/icons/IconLinkedIn.vue'
import IconInstagram from '~/components/icons/IconInstagram.vue'

const config = useRuntimeConfig()
const { extractSubdomain } = useSubdomain()

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const isSubmitting = ref(false)

// Get social links from site config
const socialLinks = computed(() => {
  return siteData?.value?.siteConfig?.socialLinks || {}
})

const getSocialIcon = (platform) => {
  const icons = {
    twitter: IconTwitter,
    github: IconGithub,
    linkedin: IconLinkedIn,
    instagram: IconInstagram
  }
  return icons[platform.toLowerCase()] || null
}

const getSubdomain = () => {
  let host = ''
  
  if (process.client) {
    host = window.location.hostname
  } else if (process.server) {
    const headers = useRequestHeaders()
    host = headers.host || headers['x-forwarded-host'] || ''
  }
  
  if (!host) return null
  
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('localhost')) {
    return 'test'
  }
  
  return extractSubdomain()
}

// Fetch site data
const { data: siteData, pending, error } = await useFetch(() => {
  const extractedSubdomain = getSubdomain()
  
  if (!extractedSubdomain) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid subdomain'
    })
  }
  
  return `/api/site/${extractedSubdomain}`
}, {
  key: 'site-data',
  baseURL: config.public.apiBaseUrl,
  server: true
})

const submitForm = async () => {
  isSubmitting.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    form.value = {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
    
    alert('Message sent successfully!')
  } catch (error) {
    console.error('Error sending message:', error)
    alert('Failed to send message. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
