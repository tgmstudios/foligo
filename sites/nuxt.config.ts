// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: 80,
    host: '0.0.0.0'
  },
  modules: ['@nuxtjs/tailwindcss'],
  components: {
    dirs: ['~/components']
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'https://api.foligo.tech'
    }
  },
  app: {
    head: {
      title: 'Foligo - Portfolio Generator',
      meta: [
        { name: 'description', content: 'Dynamic portfolio sites powered by Foligo' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/squiggle.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/squiggle.svg' }
      ],
      script: [
        { src: '/env.js', defer: false }
      ]
    }
  },
  // Enable SSR for dynamic content
  ssr: true,
  // Handle all routes dynamically
  nitro: {
    experimental: {
      wasm: true
    }
  }
})