<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    :type="type"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
  loading: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const buttonClasses = computed(() => [
  'button',
  `button--${props.variant}`,
  `button--${props.size}`,
  {
    'button--loading': props.loading,
    'button--disabled': props.disabled
  }
])

const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.button {
  --button-padding: 0.75rem 1.5rem;
  --button-radius: 0.5rem;
  --button-font-size: 1rem;
  --button-font-weight: 500;
  --button-transition: all 0.2s ease;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: var(--button-padding);
  border-radius: var(--button-radius);
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
  transition: var(--button-transition);
  cursor: pointer;
  border: 1px solid transparent;
  outline: none;
  text-decoration: none;
  user-select: none;
}

.button:hover:not(.button--disabled):not(.button--loading) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button:active:not(.button--disabled):not(.button--loading) {
  transform: translateY(0);
}

.button--disabled,
.button--loading {
  cursor: not-allowed;
  opacity: 0.6;
}

.button--primary {
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border-color: var(--color-primary, #3b82f6);
}

.button--primary:hover:not(.button--disabled):not(.button--loading) {
  background-color: var(--color-primary-hover, #2563eb);
  border-color: var(--color-primary-hover, #2563eb);
}

.button--secondary {
  background-color: var(--color-secondary, #6b7280);
  color: white;
  border-color: var(--color-secondary, #6b7280);
}

.button--secondary:hover:not(.button--disabled):not(.button--loading) {
  background-color: var(--color-secondary-hover, #4b5563);
  border-color: var(--color-secondary-hover, #4b5563);
}

.button--outline {
  background-color: transparent;
  color: var(--color-primary, #3b82f6);
  border-color: var(--color-primary, #3b82f6);
}

.button--outline:hover:not(.button--disabled):not(.button--loading) {
  background-color: var(--color-primary, #3b82f6);
  color: white;
}

.button--ghost {
  background-color: transparent;
  color: var(--color-text, #1f2937);
  border-color: transparent;
}

.button--ghost:hover:not(.button--disabled):not(.button--loading) {
  background-color: var(--color-surface-hover, rgba(0, 0, 0, 0.05));
}

.button--sm {
  --button-padding: 0.5rem 1rem;
  --button-font-size: 0.875rem;
}

.button--lg {
  --button-padding: 1rem 2rem;
  --button-font-size: 1.125rem;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    --button-transition: none;
  }

  .button:hover {
    transform: none;
  }
}
</style>