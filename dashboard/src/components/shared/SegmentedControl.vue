<template>
  <div ref="root" class="segmented" role="group">
    <span class="seg-pill" :class="[activePillClass, { ready }]" :style="pillStyle" aria-hidden="true" />
    <button
      v-for="option in options"
      :key="option.value"
      :ref="(el) => setButton(option.value, el)"
      type="button"
      class="seg-button"
      :class="{ on: option.value === modelValue }"
      :title="option.title ?? option.label"
      :aria-label="option.title ?? option.label"
      :aria-pressed="option.value === modelValue"
      @click="emit('update:modelValue', option.value)"
    >
      <slot :option="option" :active="option.value === modelValue">{{ option.label }}</slot>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Option {
  value: T
  label?: string
  title?: string
  /** Classes applied to the sliding pill while this option is active (e.g. tone colors). */
  pillClass?: string
  /** Component rendered by the consumer's slot (e.g. an icon). */
  icon?: unknown
}

const props = defineProps<{ modelValue: T; options: Option[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: T): void }>()

const root = ref<HTMLElement>()
const buttons = new Map<T, HTMLElement>()
const box = ref({ x: 0, y: 0, w: 0, h: 0 })
// The pill snaps into place on first measure, then slides on every change after.
const ready = ref(false)

const setButton = (value: T, el: unknown) => {
  if (el instanceof HTMLElement) buttons.set(value, el)
  else buttons.delete(value)
}

const activePillClass = computed(() => props.options.find((o) => o.value === props.modelValue)?.pillClass)
const pillStyle = computed(() => ({
  width: `${box.value.w}px`,
  height: `${box.value.h}px`,
  transform: `translate(${box.value.x}px, ${box.value.y}px)`,
  opacity: box.value.w ? 1 : 0
}))

function measure() {
  const el = buttons.get(props.modelValue)
  if (!el) return
  box.value = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
}

let observer: ResizeObserver | undefined
onMounted(async () => {
  await nextTick()
  measure()
  requestAnimationFrame(() => (ready.value = true))
  if (root.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(root.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => props.modelValue, () => nextTick(measure))
</script>

<style scoped>
.segmented {
  position: relative;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 3px;
  border-radius: 11px;
  background: rgb(255 255 255 / 0.05);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.05);
}
.seg-button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 540;
  background: transparent;
  box-shadow: none;
  transition: color 160ms ease;
}
.seg-button.on {
  color: var(--ink);
}
@media (hover: hover) and (pointer: fine) {
  .seg-button:not(.on):hover {
    color: var(--ink);
    background: transparent;
  }
}
.seg-pill {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  border-radius: 8px;
  background: var(--surface-hover);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 0 1px 3px rgb(0 0 0 / 0.35);
  pointer-events: none;
}
.seg-pill.ready {
  transition:
    transform 300ms var(--ease-drawer),
    width 300ms var(--ease-drawer),
    height 300ms var(--ease-drawer),
    background-color 200ms ease,
    box-shadow 200ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .seg-pill.ready {
    transition: background-color 200ms ease;
  }
}
</style>
