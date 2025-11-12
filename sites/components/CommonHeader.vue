<template>
  <header class="bg-slate-900 border-b border-slate-700 shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <div>
          <h1 class="text-3xl font-bold text-white">
            {{ siteName }}
          </h1>
          <p v-if="siteDescription" class="text-slate-400 mt-2">
            {{ siteDescription }}
          </p>
        </div>
        <nav class="hidden md:flex space-x-8">
          <NuxtLink to="/" class="text-slate-300 hover:text-white transition-colors">Home</NuxtLink>
          <NuxtLink to="/projects" class="text-slate-300 hover:text-white transition-colors">Projects</NuxtLink>
          <NuxtLink to="/blog" class="text-slate-300 hover:text-white transition-colors">Blog</NuxtLink>
          <NuxtLink to="/experience" class="text-slate-300 hover:text-white transition-colors">Experience</NuxtLink>
          <NuxtLink to="/contact" class="text-slate-300 hover:text-white transition-colors">Contact</NuxtLink>
        </nav>
        
        <!-- Mobile menu button -->
        <button 
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Mobile menu dropdown -->
      <div v-if="mobileMenuOpen" class="md:hidden border-t border-slate-700 bg-slate-800">
        <div class="px-4 py-2 space-y-1">
          <NuxtLink to="/" class="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">Home</NuxtLink>
          <NuxtLink to="/projects" class="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">Projects</NuxtLink>
          <NuxtLink to="/blog" class="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">Blog</NuxtLink>
          <NuxtLink to="/experience" class="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">Experience</NuxtLink>
          <NuxtLink to="/contact" class="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors">Contact</NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  siteName: {
    type: String,
    required: true
  },
  siteDescription: {
    type: String,
    default: ''
  }
})

const mobileMenuOpen = ref(false)
</script>

<style scoped>
/* Active link styling */
.router-link-active {
  color: white;
  font-weight: 600;
}
</style>

