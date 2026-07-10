<template>
  <div class="page">
    <div class="card">
      <div class="logo">Foligo</div>

      <!-- No code -->
      <div v-if="!code" class="state">
        <h2>No Device Code</h2>
        <p>Open this page from your GoApply extension to link your device.</p>
      </div>

      <!-- Linking -->
      <div v-else-if="status === 'linking'" class="state">
        <div class="spinner" />
        <h2>Linking Device</h2>
        <p>Connecting your GoApply extension to Foligo...</p>
        <code class="code-block">{{ code }}</code>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="state">
        <div class="icon-ring icon-success">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2>Connected!</h2>
        <p>Your GoApply extension is now linked to your Foligo account. You can close this tab.</p>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'error'" class="state">
        <div class="icon-ring icon-error">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2>Connection Failed</h2>
        <p>{{ errorMessage }}</p>
        <button @click="retry" class="btn">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const status = ref<'loading' | 'linking' | 'success' | 'error'>('loading')
const code = ref('')
const errorMessage = ref('')

function init() {
  const codeParam = route.query.code as string
  if (!codeParam || codeParam.length < 4) {
    status.value = 'error'
    errorMessage.value = 'No device code found. Please try again from your extension.'
    return
  }
  code.value = codeParam.toUpperCase()
  status.value = 'linking'

  // Listen for the content script's result
  window.addEventListener('message', handleContentScriptMessage)
}

function handleContentScriptMessage(event: MessageEvent) {
  if (event.data?.type === 'foligo-device-link') {
    if (event.data.success) {
      status.value = 'success'
    } else {
      status.value = 'error'
      errorMessage.value = event.data.error || 'Failed to link device. Make sure you\'re logged into Foligo.'
    }
  }
}

function retry() {
  status.value = 'linking'
  window.location.reload()
}

onMounted(() => init())
onUnmounted(() => window.removeEventListener('message', handleContentScriptMessage))
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F6F9FC;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(10, 37, 64, 0.08);
  padding: 40px 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
}
.logo {
  font-size: 24px;
  font-weight: 800;
  color: #0A2540;
  margin-bottom: 24px;
  letter-spacing: -0.5px;
}
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
h2 {
  font-size: 18px;
  font-weight: 700;
  color: #0A2540;
  margin: 0;
}
p {
  font-size: 13px;
  color: #6B7C93;
  margin: 0;
  line-height: 1.5;
}
.code-block {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 6px;
  color: #635BFF;
  background: #F0F4FF;
  border-radius: 10px;
  padding: 8px 16px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E0E6ED;
  border-top-color: #635BFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.icon-ring {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-success { background: #E6F7EE; }
.icon-error { background: #FDE8EC; }
.icon {
  width: 24px;
  height: 24px;
}
.icon-success .icon { color: #00A86B; }
.icon-error .icon { color: #DF1B41; }
.btn {
  margin-top: 8px;
  padding: 8px 20px;
  background: #635BFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn:hover { background: #5851DB; }
</style>
