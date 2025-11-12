<template>
  <component
    :is="as"
    :class="headingClasses"
    :id="id"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  level?: 1 | 2 | 3 | 4 | 5 | 6
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right'
  color?: 'primary' | 'secondary' | 'muted' | 'inherit'
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  as: 'h2',
  level: 2,
  size: 'lg',
  weight: 'semibold',
  align: 'left',
  color: 'inherit'
})

const headingClasses = computed(() => [
  'heading',
  `heading--${props.size}`,
  `heading--${props.weight}`,
  `heading--${props.align}`,
  `heading--${props.color}`
])
</script>

<style scoped>
.heading {
  --heading-margin: 0;
  --heading-line-height: 1.2;
  --heading-color: var(--color-text, #1f2937);
  --heading-transition: color 0.2s ease;

  margin: var(--heading-margin);
  line-height: var(--heading-line-height);
  color: var(--heading-color);
  transition: var(--heading-transition);
}

.heading--xs {
  font-size: 1.125rem;
}

.heading--sm {
  font-size: 1.25rem;
}

.heading--md {
  font-size: 1.5rem;
}

.heading--lg {
  font-size: 2rem;
}

.heading--xl {
  font-size: 2.5rem;
}

.heading--2xl {
  font-size: 3rem;
}

.heading--3xl {
  font-size: 3.75rem;
}

.heading--4xl {
  font-size: 4.5rem;
}

.heading--light {
  font-weight: 300;
}

.heading--normal {
  font-weight: 400;
}

.heading--medium {
  font-weight: 500;
}

.heading--semibold {
  font-weight: 600;
}

.heading--bold {
  font-weight: 700;
}

.heading--left {
  text-align: left;
}

.heading--center {
  text-align: center;
}

.heading--right {
  text-align: right;
}

.heading--primary {
  --heading-color: var(--color-primary, #3b82f6);
}

.heading--secondary {
  --heading-color: var(--color-secondary, #6b7280);
}

.heading--muted {
  --heading-color: var(--color-text-muted, #9ca3af);
}

.heading--inherit {
  --heading-color: inherit;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .heading--xl {
    font-size: 2rem;
  }

  .heading--2xl {
    font-size: 2.25rem;
  }

  .heading--3xl {
    font-size: 3rem;
  }

  .heading--4xl {
    font-size: 3.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .heading {
    --heading-transition: none;
  }
}
</style>