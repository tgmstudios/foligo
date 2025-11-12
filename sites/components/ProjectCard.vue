<template>
  <Card :variant="cardVariant" :interactive="true" @click="handleClick">
    <template #header>
      <div class="project-card__image-container">
        <img
          v-if="image"
          :src="image"
          :alt="title"
          class="project-card__image"
        />
        <div v-else class="project-card__image-placeholder">
          <slot name="image-placeholder">
            <span>Project Image</span>
          </slot>
        </div>
        <div v-if="tags && tags.length" class="project-card__tags">
          <span
            v-for="tag in tags.slice(0, 3)"
            :key="tag"
            class="project-card__tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </template>

    <div class="project-card__content">
      <Heading :size="'lg'" :weight="'semibold'" class="project-card__title">
        {{ title }}
      </Heading>

      <p v-if="description" class="project-card__description">
        {{ description }}
      </p>

      <div v-if="$slots.links || links" class="project-card__links">
        <slot name="links">
          <Button
            v-for="link in links"
            :key="link.label"
            :variant="'ghost'"
            :size="'sm'"
            @click.stop="handleLinkClick(link)"
          >
            {{ link.label }}
          </Button>
        </slot>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { navigateTo } from 'nuxt/app'

interface ProjectLink {
  label: string
  url: string
  external?: boolean
}

interface Props {
  title: string
  description?: string
  image?: string
  tags?: string[]
  links?: ProjectLink[]
  cardVariant?: 'default' | 'elevated' | 'outlined' | 'filled'
}

const props = withDefaults(defineProps<Props>(), {
  cardVariant: 'default'
})

const emit = defineEmits<{
  click: [event: Event]
  linkClick: [link: ProjectLink]
}>()

const handleClick = (event: Event) => {
  emit('click', event)
}

const handleLinkClick = (link: ProjectLink) => {
  emit('linkClick', link)
  if (link.external) {
    window.open(link.url, '_blank')
  } else {
    // Use NuxtLink navigation
    navigateTo(link.url)
  }
}
</script>

<style scoped>
.project-card__image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 0.5rem 0.5rem 0 0;
}

.project-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.project-card__image:hover {
  transform: scale(1.05);
}

.project-card__image-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--color-surface-variant, #f3f4f6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #6b7280);
  font-size: 1.125rem;
  font-weight: 500;
}

.project-card__tags {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.project-card__tag {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  backdrop-filter: blur(4px);
}

.project-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.project-card__title {
  margin: 0;
}

.project-card__description {
  color: var(--color-text-muted, #6b7280);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card__links {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .project-card__image-container {
    height: 150px;
  }

  .project-card__tags {
    gap: 0.25rem;
  }

  .project-card__tag {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card__image {
    transition: none;
  }

  .project-card__image:hover {
    transform: none;
  }
}
</style>