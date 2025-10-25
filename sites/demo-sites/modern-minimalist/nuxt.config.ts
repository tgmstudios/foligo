// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/tailwindcss'],
  components: {
    dirs: ['~/components']
  },
  app: {
    head: {
      title: 'Alex Chen - Modern Minimalist Portfolio',
      meta: [
        { name: 'description', content: 'Modern minimalist portfolio showcasing clean design and innovative solutions' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})