import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'elevenlabs-convai'
      }
    }
  })],
  resolve: {
    dedupe: ['vue'],
    alias: {
      '@': resolve(__dirname, 'src'),
      'marked': resolve(__dirname, 'node_modules/marked'),
      'parse5': resolve(__dirname, 'node_modules/parse5'),
      'mermaid': resolve(__dirname, 'node_modules/mermaid'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'localhost',
      'foligo.org',
      'www.foligo.org',
      'app.foligo.org'
    ],
    // Ensure Vite serves index.html for all routes (history mode support)
    fs: {
      strict: false
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue'],
          charts: ['chart.js', 'vue-chartjs'],
        },
      },
    },
  },
})
