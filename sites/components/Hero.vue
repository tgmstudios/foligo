<template>
  <section :class="heroClasses">
    <Container :size="containerSize" :center="false">
      <div class="hero__content">
        <div class="hero__text">
          <slot name="title">
            <Heading :size="titleSize" :weight="'bold'" class="hero__title">
              {{ title }}
            </Heading>
          </slot>

          <slot name="subtitle">
            <p v-if="subtitle" class="hero__subtitle">{{ subtitle }}</p>
          </slot>

          <slot name="description">
            <p v-if="description" class="hero__description">{{ description }}</p>
          </slot>

          <div v-if="$slots.actions || actions" class="hero__actions">
            <slot name="actions">
              <Button
                v-for="action in actions"
                :key="action.label"
                :variant="action.variant || 'primary'"
                :size="'lg'"
                @click="action.onClick"
              >
                {{ action.label }}
              </Button>
            </slot>
          </div>
        </div>

        <div v-if="$slots.media || media" class="hero__media">
          <slot name="media">
            <img
              v-if="media && media.type === 'image'"
              :src="media.src"
              :alt="media.alt || title"
              class="hero__image"
            />
            <video
              v-else-if="media && media.type === 'video'"
              :src="media.src"
              autoplay
              muted
              loop
              class="hero__video"
            />
          </slot>
        </div>
      </div>
    </Container>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface HeroAction {
  label: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  onClick: () => void
}

interface HeroMedia {
  type: 'image' | 'video'
  src: string
  alt?: string
}

interface Props {
  title?: string
  subtitle?: string
  description?: string
  actions?: HeroAction[]
  media?: HeroMedia
  layout?: 'left' | 'right' | 'center'
  variant?: 'default' | 'gradient' | 'image'
  height?: 'sm' | 'md' | 'lg' | 'full'
  containerSize?: 'sm' | 'md' | 'lg' | 'xl'
  titleSize?: '2xl' | '3xl' | '4xl'
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'left',
  variant: 'default',
  height: 'lg',
  containerSize: 'lg',
  titleSize: '3xl'
})

const heroClasses = computed(() => [
  'hero',
  `hero--${props.layout}`,
  `hero--${props.variant}`,
  `hero--${props.height}`
])
</script>

<style scoped>
.hero {
  --hero-padding: 4rem 0;
  --hero-bg: var(--color-surface, #ffffff);
  --hero-text-color: var(--color-text, #1f2937);
  --hero-title-color: var(--hero-text-color);
  --hero-subtitle-color: var(--color-text-muted, #6b7280);

  background-color: var(--hero-bg);
  color: var(--hero-text-color);
  padding: var(--hero-padding);
  position: relative;
  overflow: hidden;
}

.hero--center {
  text-align: center;
}

.hero--gradient {
  --hero-bg: linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-secondary, #6b7280) 100%);
  --hero-text-color: white;
  --hero-title-color: white;
  --hero-subtitle-color: rgba(255, 255, 255, 0.8);
}

.hero--image {
  --hero-bg: center/cover no-repeat;
  background-image: var(--hero-bg-image);
}

.hero--sm {
  --hero-padding: 2rem 0;
}

.hero--md {
  --hero-padding: 3rem 0;
}

.hero--full {
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.hero__content {
  display: grid;
  gap: 3rem;
}

.hero--left .hero__content,
.hero--right .hero__content {
  grid-template-columns: 1fr 1fr;
  align-items: center;
}

.hero--right .hero__content {
  direction: rtl;
}

.hero--right .hero__content > * {
  direction: ltr;
}

.hero--center .hero__content {
  grid-template-columns: 1fr;
  justify-items: center;
}

.hero__text {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero__title {
  --heading-color: var(--hero-title-color);
  margin: 0;
}

.hero__subtitle {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--hero-subtitle-color);
  margin: 0;
}

.hero__description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--hero-text-color);
  opacity: 0.9;
  margin: 0;
  max-width: 600px;
}

.hero__actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero__media {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero__image,
.hero__video {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.hero__video {
  width: 100%;
  max-width: 500px;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .hero--left .hero__content,
  .hero--right .hero__content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .hero--right .hero__content {
    direction: ltr;
  }
}

@media (max-width: 768px) {
  .hero {
    --hero-padding: 2rem 0;
  }

  .hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero__actions button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__video {
    animation: none;
  }
}
</style>