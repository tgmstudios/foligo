<template>
  <div class="min-h-screen bg-white">
    <!-- Navigation -->
    <Navbar
      :menu-items="navigation"
      :brand-text="'Alex Chen'"
      variant="default"
      :sticky="true"
    />

    <!-- Page Content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <Footer
      :copyright="`© ${new Date().getFullYear()} Alex Chen. All rights reserved.`"
      container-size="lg"
    >
      <template #brand>
        <div class="text-lg font-semibold">Alex Chen</div>
        <div class="text-sm opacity-80">Full Stack Developer</div>
      </template>

      <template #links>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="font-semibold mb-2">Quick Links</h4>
            <ul class="space-y-1">
              <li><NuxtLink to="/" class="text-sm hover:text-gray-600">Home</NuxtLink></li>
              <li><NuxtLink to="/about" class="text-sm hover:text-gray-600">About</NuxtLink></li>
              <li><NuxtLink to="/projects" class="text-sm hover:text-gray-600">Projects</NuxtLink></li>
              <li><NuxtLink to="/contact" class="text-sm hover:text-gray-600">Contact</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Connect</h4>
            <ul class="space-y-1">
              <li><a href="#" class="text-sm hover:text-gray-600">LinkedIn</a></li>
              <li><a href="#" class="text-sm hover:text-gray-600">GitHub</a></li>
              <li><a href="#" class="text-sm hover:text-gray-600">Twitter</a></li>
            </ul>
          </div>
        </div>
      </template>
    </Footer>
  </div>
</template>

<script setup lang="ts">
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const navigation = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Projects', path: '/projects' },
  { label: 'Contact', path: '/contact' }
]
</script>