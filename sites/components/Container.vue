<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  padding: true,
  center: false
})

const containerClasses = computed(() => [
  'container',
  `container--${props.size}`,
  {
    'container--padding': props.padding,
    'container--center': props.center
  }
])
</script>

<style scoped>
.container {
  --container-max-width-sm: 640px;
  --container-max-width-md: 768px;
  --container-max-width-lg: 1024px;
  --container-max-width-xl: 1280px;
  --container-max-width-full: 100%;
  --container-padding: 1rem;

  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.container--padding {
  padding-left: var(--container-padding);
  padding-right: var(--container-padding);
}

.container--sm {
  max-width: var(--container-max-width-sm);
}

.container--md {
  max-width: var(--container-max-width-md);
}

.container--lg {
  max-width: var(--container-max-width-lg);
}

.container--xl {
  max-width: var(--container-max-width-xl);
}

.container--full {
  max-width: var(--container-max-width-full);
}

.container--center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container--padding {
    --container-padding: 0.75rem;
  }
}
</style>