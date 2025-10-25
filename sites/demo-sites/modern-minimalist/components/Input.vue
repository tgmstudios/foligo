<template>
  <div class="input-wrapper">
    <label v-if="label" :for="inputId" class="input__label">{{ label }}</label>
    <div class="input__container">
      <input
        :id="inputId"
        ref="inputRef"
        v-model="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :minlength="minlength"
        :pattern="pattern"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      <slot name="prefix" />
      <slot name="suffix" />
    </div>
    <div v-if="error" class="input__error">{{ error }}</div>
    <div v-if="hint && !error" class="input__hint">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  maxlength?: number
  minlength?: number
  pattern?: string
  error?: string
  hint?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  variant: 'outlined'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
}>()

const inputRef = ref<HTMLInputElement>()
const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`)

const inputClasses = computed(() => [
  'input',
  `input--${props.variant}`,
  `input--${props.size}`,
  {
    'input--error': !!props.error,
    'input--disabled': props.disabled,
    'input--readonly': props.readonly
  }
])

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur()
})
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #1f2937);
  margin-bottom: 0.25rem;
}

.input__container {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  --input-padding: 0.75rem;
  --input-radius: 0.5rem;
  --input-border-color: var(--color-border, #d1d5db);
  --input-bg: var(--color-surface, #ffffff);
  --input-text-color: var(--color-text, #1f2937);
  --input-transition: all 0.2s ease;

  flex: 1;
  padding: var(--input-padding);
  border-radius: var(--input-radius);
  border: 1px solid var(--input-border-color);
  background-color: var(--input-bg);
  color: var(--input-text-color);
  font-size: 1rem;
  transition: var(--input-transition);
  outline: none;
}

.input::placeholder {
  color: var(--color-text-muted, #9ca3af);
}

.input:focus {
  --input-border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input--filled {
  --input-bg: var(--color-surface-variant, #f9fafb);
  --input-border-color: transparent;
}

.input--filled:focus {
  --input-bg: var(--input-bg);
}

.input--outlined {
  --input-border-color: var(--color-border, #d1d5db);
}

.input--sm {
  --input-padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.input--lg {
  --input-padding: 1rem;
  font-size: 1.125rem;
}

.input--error {
  --input-border-color: var(--color-error, #ef4444);
}

.input--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input--disabled,
.input--readonly {
  opacity: 0.6;
  cursor: not-allowed;
}

.input__error {
  font-size: 0.75rem;
  color: var(--color-error, #ef4444);
  margin-top: 0.25rem;
}

.input__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
  margin-top: 0.25rem;
}

@media (prefers-reduced-motion: reduce) {
  .input {
    --input-transition: none;
  }
}
</style>