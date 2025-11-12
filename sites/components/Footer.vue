<template>
  <footer :class="footerClasses">
    <Container :size="containerSize" :padding="true">
      <div class="footer__content">
        <slot name="content">
          <div class="footer__sections">
            <div v-if="$slots.brand || brandText" class="footer__brand">
              <slot name="brand">
                <h3 class="footer__brand-title">{{ brandText }}</h3>
              </slot>
            </div>

            <div v-if="$slots.links" class="footer__links">
              <slot name="links" />
            </div>

            <div v-if="$slots.social" class="footer__social">
              <slot name="social" />
            </div>
          </div>
        </slot>

        <div v-if="$slots.bottom || copyright" class="footer__bottom">
          <slot name="bottom">
            <p class="footer__copyright">{{ copyright }}</p>
          </slot>
        </div>
      </div>
    </Container>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'dark' | 'minimal'
  containerSize?: 'sm' | 'md' | 'lg' | 'xl'
  brandText?: string
  copyright?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  containerSize: 'lg',
  brandText: 'Brand',
  copyright: `© ${new Date().getFullYear()} All rights reserved.`
})

const footerClasses = computed(() => [
  'footer',
  `footer--${props.variant}`
])
</script>

<style scoped>
.footer {
  --footer-bg: var(--color-surface-variant, #f9fafb);
  --footer-border-color: var(--color-border, #e5e7eb);
  --footer-text-color: var(--color-text, #1f2937);
  --footer-link-color: var(--color-text, #1f2937);
  --footer-link-hover-color: var(--color-primary, #3b82f6);

  background-color: var(--footer-bg);
  border-top: 1px solid var(--footer-border-color);
  color: var(--footer-text-color);
  padding: 2rem 0;
}

.footer--dark {
  --footer-bg: var(--color-text, #1f2937);
  --footer-border-color: var(--color-border, #374151);
  --footer-text-color: white;
  --footer-link-color: rgba(255, 255, 255, 0.8);
  --footer-link-hover-color: white;
}

.footer--minimal {
  --footer-bg: transparent;
  --footer-border-color: var(--color-border, #e5e7eb);
  padding: 1rem 0;
}

.footer__content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.footer__sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer__brand-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: var(--footer-text-color);
}

.footer__links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer__links li {
  margin-bottom: 0.5rem;
}

.footer__links a {
  color: var(--footer-link-color);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer__links a:hover,
.footer__links a:focus {
  color: var(--footer-link-hover-color);
  text-decoration: underline;
}

.footer__social {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.footer__bottom {
  border-top: 1px solid var(--footer-border-color);
  padding-top: 1rem;
  margin-top: 1rem;
}

.footer__copyright {
  margin: 0;
  font-size: 0.875rem;
  color: var(--footer-text-color);
  opacity: 0.8;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .footer {
    padding: 1.5rem 0;
  }

  .footer__sections {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .footer__social {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .footer__links a {
    transition: none;
  }
}
</style>