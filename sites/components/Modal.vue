<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click="handleOverlayClick"
        @keydown.esc="close"
      >
        <div
          ref="modalRef"
          class="modal"
          :class="modalClasses"
          @click.stop
          role="dialog"
          :aria-labelledby="titleId"
          :aria-describedby="contentId"
        >
          <div v-if="showHeader" class="modal__header">
            <Heading
              v-if="title"
              :id="titleId"
              :size="'lg'"
              :weight="'semibold'"
              class="modal__title"
            >
              {{ title }}
            </Heading>

            <button
              v-if="showClose"
              class="modal__close"
              @click="close"
              :aria-label="'Close modal'"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div :id="contentId" class="modal__content">
            <slot />
          </div>

          <div v-if="$slots.footer" class="modal__footer">
            <slot name="footer" :close="close" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'

interface Props {
  isOpen: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'centered'
  showHeader?: boolean
  showClose?: boolean
  closeOnOverlay?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  showHeader: true,
  showClose: true,
  closeOnOverlay: true,
  persistent: false
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  open: []
  close: []
  'after-open': []
  'after-close': []
}>()

const modalRef = ref<HTMLElement>()
const titleId = ref(`modal-title-${Math.random().toString(36).substr(2, 9)}`)
const contentId = ref(`modal-content-${Math.random().toString(36).substr(2, 9)}`)

const modalClasses = computed(() => [
  'modal',
  `modal--${props.size}`,
  `modal--${props.variant}`
])

const close = () => {
  if (props.persistent) return
  emit('update:isOpen', false)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close()
  }
}

// Focus management
watch(() => props.isOpen, async (newValue) => {
  await nextTick()

  if (newValue) {
    // Focus the modal when opening
    modalRef.value?.focus()
    emit('open')
  } else {
    emit('after-close')
  }
})

// Accessibility: trap focus inside modal
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    const modal = modalRef.value
    if (!modal) return

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        event.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        event.preventDefault()
      }
    }
  }
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

defineExpose({
  close
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(2px);
}

.modal {
  --modal-radius: 0.75rem;
  --modal-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --modal-bg: var(--color-surface, #ffffff);
  --modal-border: 1px solid var(--color-border, #e5e7eb);

  background-color: var(--modal-bg);
  border-radius: var(--modal-radius);
  box-shadow: var(--modal-shadow);
  border: var(--modal-border);
  max-height: 90vh;
  max-width: 90vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  outline: none;
}

.modal--sm {
  width: 100%;
  max-width: 384px;
}

.modal--md {
  width: 100%;
  max-width: 512px;
}

.modal--lg {
  width: 100%;
  max-width: 768px;
}

.modal--xl {
  width: 100%;
  max-width: 1024px;
}

.modal--full {
  width: 100%;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
}

.modal--centered {
  align-self: center;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  margin-bottom: 1.5rem;
}

.modal__title {
  margin: 0;
  flex: 1;
}

.modal__close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  color: var(--color-text-muted, #6b7280);
  transition: color 0.2s ease, background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal__close:hover {
  color: var(--color-text, #1f2937);
  background-color: var(--color-surface-variant, #f9fafb);
}

.modal__content {
  padding: 0 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal__footer {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
  margin-top: 1.5rem;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.9);
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal {
    max-height: 95vh;
    max-width: 95vw;
  }

  .modal__header {
    padding: 1rem 1rem 0;
    margin-bottom: 1rem;
  }

  .modal__content {
    padding: 0 1rem;
  }

  .modal__footer {
    padding: 1rem;
    margin-top: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal,
  .modal-leave-active .modal {
    transition: none;
  }

  .modal-enter-from .modal,
  .modal-leave-to .modal {
    transform: none;
  }
}
</style>