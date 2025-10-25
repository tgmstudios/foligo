import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'
import './assets/css/main.css'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

// Configure Pinia store
const pinia = createPinia()
app.use(pinia)

// Configure router
app.use(router)

// Configure toast notifications
app.use(Toast, {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
})

// Initialize authentication on app startup
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')
