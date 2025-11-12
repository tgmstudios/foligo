<template>
  <header :class="headerClasses">
    <slot />
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'hero' | 'sticky'
  height?: 'sm' | 'md' | 'lg' | 'auto'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  height: 'auto'
})

const headerClasses = computed(() => [
  'header',
  `header--${props.variant}`,
  `header--${props.height}`
])
</script>

<style scoped>
.header {
  --header-bg: var(--color-surface, #ffffff);
  --header-border-color: var(--color-border, #e5e7eb);
  --header-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  background-color: var(--header-bg);
  border-bottom: 1px solid var(--header-border-color);
  position: relative;
}

.header--hero {
  --header-bg: linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-secondary, #6b7280) 100%);
  --header-border-color: transparent;
  color: white;
  min-height: 60vh;
  display: flex;
  align-items: center;
}

.header--sticky {
  --header-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 40;
}

.header--sm {
  min-height: 8rem;
}

.header--md {
  min-height: 12rem;
}

.header--lg {
  min-height: 16rem;
}

.header--auto {
  min-height: auto;
}
</style>