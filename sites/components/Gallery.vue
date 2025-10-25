<template>
  <div :class="galleryClasses">
    <div v-if="$slots.header" class="gallery__header">
      <slot name="header" />
    </div>

    <div class="gallery__grid" :style="gridStyle">
      <div
        v-for="(item, index) in items"
        :key="item.id || index"
        class="gallery__item"
        :class="{ 'gallery__item--featured': item.featured }"
        @click="handleItemClick(item, index)"
      >
        <div class="gallery__image-container">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.alt || item.title"
            class="gallery__image"
            loading="lazy"
          />
          <div v-else class="gallery__image-placeholder">
            {{ item.title || 'Gallery Item' }}
          </div>

          <div v-if="item.overlay" class="gallery__overlay">
            <slot name="overlay" :item="item" :index="index">
              <div class="gallery__overlay-content">
                <h3 class="gallery__overlay-title">{{ item.title }}</h3>
                <p v-if="item.description" class="gallery__overlay-description">
                  {{ item.description }}
                </p>
              </div>
            </slot>
          </div>

          <div v-if="item.tags && item.tags.length" class="gallery__tags">
            <span
              v-for="tag in item.tags.slice(0, 2)"
              :key="tag"
              class="gallery__tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLoadMore && hasMore" class="gallery__load-more">
      <Button
        :variant="'outline'"
        :size="'md'"
        :loading="loading"
        @click="loadMore"
      >
        Load More
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface GalleryItem {
  id?: string | number
  title?: string
  description?: string
  image?: string
  alt?: string
  tags?: string[]
  featured?: boolean
  overlay?: boolean
  [key: string]: any
}

interface Props {
  items: GalleryItem[]
  columns?: number | { sm: number; md: number; lg: number; xl: number }
  gap?: string
  aspectRatio?: string
  showLoadMore?: boolean
  hasMore?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  columns: 3,
  gap: '1rem',
  aspectRatio: '16/9',
  showLoadMore: false,
  hasMore: false,
  loading: false
})

const emit = defineEmits<{
  'item-click': [item: GalleryItem, index: number]
  'load-more': []
}>()

const galleryClasses = computed(() => [
  'gallery'
])

const gridStyle = computed(() => {
  const columns = typeof props.columns === 'number'
    ? props.columns
    : props.columns.lg

  return {
    '--gallery-columns': columns,
    '--gallery-gap': props.gap,
    '--gallery-aspect-ratio': props.aspectRatio
  }
})

const handleItemClick = (item: GalleryItem, index: number) => {
  emit('item-click', item, index)
}

const loadMore = () => {
  emit('load-more')
}
</script>

<style scoped>
.gallery {
  --gallery-columns: 3;
  --gallery-gap: 1rem;
  --gallery-aspect-ratio: 16/9;
}

.gallery__header {
  margin-bottom: 1.5rem;
}

.gallery__grid {
  display: grid;
  grid-template-columns: repeat(var(--gallery-columns), 1fr);
  gap: var(--gallery-gap);
  margin-bottom: 2rem;
}

.gallery__item {
  position: relative;
  cursor: pointer;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.gallery__item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.gallery__item--featured {
  grid-column: span 2;
  grid-row: span 2;
}

.gallery__image-container {
  position: relative;
  width: 100%;
  aspect-ratio: var(--gallery-aspect-ratio);
  overflow: hidden;
}

.gallery__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery__item:hover .gallery__image {
  transform: scale(1.05);
}

.gallery__image-placeholder {
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

.gallery__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.7) 100%
  );
  display: flex;
  align-items: flex-end;
  padding: 1.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery__item:hover .gallery__overlay {
  opacity: 1;
}

.gallery__overlay-content {
  color: white;
}

.gallery__overlay-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.gallery__overlay-description {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0;
  line-height: 1.4;
}

.gallery__tags {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.gallery__tag {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.625rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  backdrop-filter: blur(4px);
}

.gallery__load-more {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

/* Responsive grid adjustments */
@media (max-width: 640px) {
  .gallery__grid {
    --gallery-columns: 1;
  }

  .gallery__item--featured {
    grid-column: span 1;
    grid-row: span 1;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .gallery__grid {
    --gallery-columns: 2;
  }

  .gallery__item--featured {
    grid-column: span 2;
    grid-row: span 1;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .gallery__grid {
    --gallery-columns: 3;
  }

  .gallery__item--featured {
    grid-column: span 2;
    grid-row: span 2;
  }
}

@media (min-width: 1025px) {
  .gallery__grid {
    --gallery-columns: 4;
  }

  .gallery__item--featured {
    grid-column: span 2;
    grid-row: span 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gallery__item,
  .gallery__image,
  .gallery__overlay {
    transition: none;
  }

  .gallery__item:hover {
    transform: none;
  }

  .gallery__item:hover .gallery__image {
    transform: none;
  }

  .gallery__item:hover .gallery__overlay {
    opacity: 1;
  }
}
</style>