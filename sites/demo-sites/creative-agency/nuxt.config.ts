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
      title: 'Studio Creative - Innovative Design & Development',
      meta: [
        { name: 'description', content: 'Creative agency portfolio showcasing innovative design and cutting-edge development solutions' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})