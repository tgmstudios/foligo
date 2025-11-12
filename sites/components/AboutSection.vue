<template>
  <section :class="sectionClasses">
    <Container :size="containerSize">
      <div class="about-section__content">
        <div v-if="$slots.image || image" class="about-section__image-container">
          <slot name="image">
            <img
              v-if="image"
              :src="image"
              :alt="imageAlt || 'About image'"
              class="about-section__image"
            />
          </slot>
        </div>

        <div class="about-section__text">
          <slot name="title">
            <Heading :size="titleSize" :weight="'semibold'" class="about-section__title">
              {{ title }}
            </Heading>
          </slot>

          <slot name="content">
            <div class="about-section__body">
              <p v-for="paragraph in paragraphs" :key="paragraph" class="about-section__paragraph">
                {{ paragraph }}
              </p>
            </div>
          </slot>

          <div v-if="$slots.actions || actions" class="about-section__actions">
            <slot name="actions">
              <Button
                v-for="action in actions"
                :key="action.label"
                :variant="action.variant || 'primary'"
                :size="'md'"
                @click="action.onClick"
              >
                {{ action.label }}
              </Button>
            </slot>
          </div>

          <div v-if="$slots.stats || stats" class="about-section__stats">
            <slot name="stats">
              <div class="about-section__stat-grid">
                <div
                  v-for="stat in stats"
                  :key="stat.label"
                  class="about-section__stat"
                >
                  <div class="about-section__stat-number">{{ stat.number }}</div>
                  <div class="about-section__stat-label">{{ stat.label }}</div>
                </div>
              </div>
            </slot>
          </div>
        </div>
      </div>
    </Container>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface AboutAction {
  label: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  onClick: () => void
}

interface AboutStat {
  number: string | number
  label: string
}

interface Props {
  title?: string
  paragraphs?: string[]
  image?: string
  imageAlt?: string
  actions?: AboutAction[]
  stats?: AboutStat[]
  layout?: 'left' | 'right' | 'center'
  variant?: 'default' | 'alternate'
  containerSize?: 'sm' | 'md' | 'lg' | 'xl'
  titleSize?: 'xl' | '2xl' | '3xl'
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'left',
  variant: 'default',
  containerSize: 'lg',
  titleSize: '2xl'
})

const sectionClasses = computed(() => [
  'about-section',
  `about-section--${props.layout}`,
  `about-section--${props.variant}`
])
</script>

<style scoped>
.about-section {
  --about-section-padding: 4rem 0;
  --about-section-bg: var(--color-surface, #ffffff);
  --about-section-text-color: var(--color-text, #1f2937);

  background-color: var(--about-section-bg);
  color: var(--about-section-text-color);
  padding: var(--about-section-padding);
}

.about-section--alternate {
  --about-section-bg: var(--color-surface-variant, #f9fafb);
}

.about-section--center {
  text-align: center;
}

.about-section__content {
  display: grid;
  gap: 3rem;
  align-items: center;
}

.about-section--left .about-section__content,
.about-section--right .about-section__content {
  grid-template-columns: 1fr 1fr;
}

.about-section--right .about-section__content {
  direction: rtl;
}

.about-section--right .about-section__content > * {
  direction: ltr;
}

.about-section--center .about-section__content {
  grid-template-columns: 1fr;
  justify-items: center;
}

.about-section__image-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.about-section__image {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.about-section__text {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.about-section__title {
  --heading-color: var(--about-section-text-color);
  margin: 0;
}

.about-section__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.about-section__paragraph {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--about-section-text-color);
  opacity: 0.9;
  margin: 0;
}

.about-section__actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.about-section__stats {
  margin-top: 1rem;
}

.about-section__stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.about-section__stat {
  text-align: center;
}

.about-section__stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary, #3b82f6);
  line-height: 1;
}

.about-section__stat-label {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  font-weight: 500;
  margin-top: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .about-section--left .about-section__content,
  .about-section--right .about-section__content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .about-section--right .about-section__content {
    direction: ltr;
  }
}

@media (max-width: 768px) {
  .about-section {
    --about-section-padding: 2rem 0;
  }

  .about-section__actions {
    flex-direction: column;
  }

  .about-section__actions button {
    width: 100%;
  }

  .about-section__stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .about-section__stat-number {
    font-size: 1.5rem;
  }
}
</style>