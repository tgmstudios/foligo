<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="card__header">
      <slot name="header" />
    </div>

    <div class="card__content">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  padding?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  interactive: false,
  padding: true
})

const cardClasses = computed(() => [
  'card',
  `card--${props.variant}`,
  `card--${props.size}`,
  {
    'card--interactive': props.interactive,
    'card--padding': props.padding
  }
])
</script>

<style scoped>
.card {
  --card-radius: 0.75rem;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --card-border-color: var(--color-border, #e5e7eb);
  --card-bg: var(--color-surface, #ffffff);
  --card-transition: all 0.2s ease;

  background-color: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--card-border-color);
  overflow: hidden;
  transition: var(--card-transition);
}

.card--elevated {
  --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card--outlined {
  --card-shadow: none;
  --card-border-color: var(--color-primary, #3b82f6);
}

.card--filled {
  --card-shadow: none;
  --card-bg: var(--color-surface-variant, #f9fafb);
  --card-border-color: transparent;
}

.card--interactive {
  cursor: pointer;
}

.card--interactive:hover {
  --card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.card--sm {
  --card-radius: 0.5rem;
}

.card--lg {
  --card-radius: 1rem;
}

.card__header,
.card__footer {
  padding: 1rem 1.5rem;
  background-color: var(--card-bg);
}

.card__header {
  border-bottom: 1px solid var(--card-border-color);
}

.card__footer {
  border-top: 1px solid var(--card-border-color);
}

.card__content {
  padding: 1.5rem;
}

.card--padding.card__content {
  padding: 1.5rem;
}

.card--sm .card__content {
  padding: 1rem;
}

.card--lg .card__content {
  padding: 2rem;
}

@media (prefers-reduced-motion: reduce) {
  .card {
    --card-transition: none;
  }

  .card--interactive:hover {
    transform: none;
  }
}
</style>