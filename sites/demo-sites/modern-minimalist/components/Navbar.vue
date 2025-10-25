<template>
  <nav :class="navbarClasses">
    <div class="navbar__container">
      <div class="navbar__brand">
        <slot name="brand">
          <NuxtLink to="/" class="navbar__logo">
            {{ brandText }}
          </NuxtLink>
        </slot>
      </div>

      <div class="navbar__menu" :class="{ 'navbar__menu--open': isMenuOpen }">
        <slot name="menu" :closeMenu="closeMenu">
          <ul class="navbar__list">
            <li v-for="item in menuItems" :key="item.path" class="navbar__item">
              <NuxtLink
                :to="item.path"
                :class="navbarItemClasses(item.path)"
                @click="closeMenu"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </slot>
      </div>

      <div class="navbar__actions">
        <slot name="actions" />
      </div>

      <button
        v-if="mobileMenu"
        class="navbar__toggle"
        @click="toggleMenu"
        :aria-label="isMenuOpen ? 'Close menu' : 'Open menu'"
      >
        <span class="navbar__toggle-bar" :class="{ 'navbar__toggle-bar--open': isMenuOpen }"></span>
        <span class="navbar__toggle-bar" :class="{ 'navbar__toggle-bar--open': isMenuOpen }"></span>
        <span class="navbar__toggle-bar" :class="{ 'navbar__toggle-bar--open': isMenuOpen }"></span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface MenuItem {
  label: string
  path: string
}

interface Props {
  brandText?: string
  menuItems?: MenuItem[]
  variant?: 'default' | 'transparent' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  sticky?: boolean
  mobileMenu?: boolean
  fixed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  brandText: 'Brand',
  menuItems: () => [],
  variant: 'default',
  size: 'md',
  sticky: false,
  mobileMenu: true,
  fixed: false
})

const route = useRoute()
const isMenuOpen = ref(false)

const navbarClasses = computed(() => [
  'navbar',
  `navbar--${props.variant}`,
  `navbar--${props.size}`,
  {
    'navbar--sticky': props.sticky,
    'navbar--fixed': props.fixed,
    'navbar--menu-open': isMenuOpen.value
  }
])

const navbarItemClasses = (path: string) => computed(() => [
  'navbar__link',
  { 'navbar__link--active': route.path === path }
])

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// Close menu on route change
watch(() => route.path, () => {
  closeMenu()
})
</script>

<style scoped>
.navbar {
  --navbar-bg: var(--color-surface, #ffffff);
  --navbar-border-color: var(--color-border, #e5e7eb);
  --navbar-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --navbar-height: 4rem;
  --navbar-transition: all 0.3s ease;

  background-color: var(--navbar-bg);
  border-bottom: 1px solid var(--navbar-border-color);
  box-shadow: var(--navbar-shadow);
  position: relative;
  z-index: 50;
  transition: var(--navbar-transition);
}

.navbar--transparent {
  --navbar-bg: transparent;
  --navbar-shadow: none;
  --navbar-border-color: transparent;
}

.navbar--filled {
  --navbar-bg: var(--color-primary, #3b82f6);
  --navbar-border-color: transparent;
}

.navbar--sticky,
.navbar--fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.navbar--sticky {
  position: sticky;
}

.navbar__container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--navbar-height);
}

.navbar__brand {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.navbar__logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text, #1f2937);
  text-decoration: none;
  transition: color 0.2s ease;
}

.navbar--filled .navbar__logo {
  color: white;
}

.navbar__logo:hover {
  color: var(--color-primary, #3b82f6);
}

.navbar--filled .navbar__logo:hover {
  color: rgba(255, 255, 255, 0.8);
}

.navbar__menu {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.navbar__list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 2rem;
}

.navbar__item {
  display: flex;
}

.navbar__link {
  color: var(--color-text, #1f2937);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  transition: color 0.2s ease;
  position: relative;
}

.navbar--filled .navbar__link {
  color: rgba(255, 255, 255, 0.9);
}

.navbar__link:hover,
.navbar__link--active {
  color: var(--color-primary, #3b82f6);
}

.navbar--filled .navbar__link:hover,
.navbar--filled .navbar__link--active {
  color: white;
}

.navbar__link--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-primary, #3b82f6);
  transform: scaleX(1);
  transition: transform 0.2s ease;
}

.navbar--filled .navbar__link--active::after {
  background-color: white;
}

.navbar__link:not(.navbar__link--active)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-primary, #3b82f6);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.navbar__link:hover::after {
  transform: scaleX(1);
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.navbar__toggle {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 60;
}

.navbar__toggle-bar {
  width: 2rem;
  height: 2px;
  background-color: var(--color-text, #1f2937);
  transition: all 0.3s ease;
  transform-origin: center;
}

.navbar--filled .navbar__toggle-bar {
  background-color: white;
}

/* Mobile styles */
@media (max-width: 768px) {
  .navbar__menu {
    position: fixed;
    top: var(--navbar-height);
    left: 0;
    right: 0;
    background-color: var(--navbar-bg);
    border-bottom: 1px solid var(--navbar-border-color);
    flex-direction: column;
    padding: 1rem;
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }

  .navbar--filled .navbar__menu {
    background-color: var(--color-primary, #3b82f6);
  }

  .navbar__menu--open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .navbar__list {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .navbar__item {
    width: 100%;
  }

  .navbar__link {
    display: block;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .navbar--filled .navbar__link {
    border-bottom-color: rgba(255, 255, 255, 0.2);
  }

  .navbar__link::after {
    display: none;
  }

  .navbar__toggle {
    display: flex;
  }

  .navbar__toggle-bar--open:nth-child(1) {
    transform: rotate(45deg) translate(6px, 6px);
  }

  .navbar__toggle-bar--open:nth-child(2) {
    opacity: 0;
  }

  .navbar__toggle-bar--open:nth-child(3) {
    transform: rotate(-45deg) translate(6px, -6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .navbar,
  .navbar__menu,
  .navbar__link,
  .navbar__toggle-bar {
    transition: none;
  }
}
</style>