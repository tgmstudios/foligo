<template>
  <nav aria-label="Breadcrumb" :class="breadcrumbClasses">
    <ol class="breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="item.path || index"
        class="breadcrumb__item"
        :class="{ 'breadcrumb__item--current': index === items.length - 1 }"
      >
        <NuxtLink
          v-if="item.path && index !== items.length - 1"
          :to="item.path"
          class="breadcrumb__link"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
        <span
          v-else
          class="breadcrumb__current"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>

        <span
          v-if="index < items.length - 1"
          class="breadcrumb__separator"
          aria-hidden="true"
        >
          <slot name="separator">/</slot>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  path?: string
}

interface Props {
  items: BreadcrumbItem[]
  variant?: 'default' | 'simple' | 'dotted'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  variant: 'default',
  size: 'md'
})

const breadcrumbClasses = [
  'breadcrumb',
  `breadcrumb--${props.variant}`,
  `breadcrumb--${props.size}`
]
</script>

<style scoped>
.breadcrumb {
  --breadcrumb-color: var(--color-text-muted, #6b7280);
  --breadcrumb-current-color: var(--color-text, #1f2937);
  --breadcrumb-link-color: var(--color-primary, #3b82f6);
  --breadcrumb-hover-color: var(--color-primary-hover, #2563eb);
  --breadcrumb-font-size: 0.875rem;
  --breadcrumb-transition: color 0.2s ease;

  font-size: var(--breadcrumb-font-size);
  color: var(--breadcrumb-color);
}

.breadcrumb--sm {
  --breadcrumb-font-size: 0.75rem;
}

.breadcrumb--lg {
  --breadcrumb-font-size: 1rem;
}

.breadcrumb__list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
}

.breadcrumb__item {
  display: flex;
  align-items: center;
  color: var(--breadcrumb-color);
}

.breadcrumb__item--current {
  color: var(--breadcrumb-current-color);
  font-weight: 500;
}

.breadcrumb__link {
  color: var(--breadcrumb-link-color);
  text-decoration: none;
  transition: var(--breadcrumb-transition);
  padding: 0.25rem 0;
  border-radius: 0.25rem;
}

.breadcrumb__link:hover,
.breadcrumb__link:focus {
  color: var(--breadcrumb-hover-color);
  text-decoration: underline;
}

.breadcrumb__link:focus {
  outline: 2px solid var(--color-primary, #3b82f6);
  outline-offset: 2px;
}

.breadcrumb__current {
  color: var(--breadcrumb-current-color);
  font-weight: 500;
}

.breadcrumb__separator {
  margin: 0 0.5rem;
  color: var(--breadcrumb-color);
  font-weight: normal;
}

.breadcrumb--simple .breadcrumb__separator {
  margin: 0 0.25rem;
  opacity: 0.6;
}

.breadcrumb--dotted .breadcrumb__separator::before {
  content: '•';
  margin: 0 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .breadcrumb__list {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .breadcrumb__separator {
    display: none;
  }

  .breadcrumb__item:not(:last-child)::after {
    content: '/';
    margin-left: 0.25rem;
    color: var(--breadcrumb-color);
  }
}

@media (prefers-reduced-motion: reduce) {
  .breadcrumb__link {
    --breadcrumb-transition: none;
  }
}
</style>