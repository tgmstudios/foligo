<template>
  <Card :variant="cardVariant" :padding="true">
    <template #header>
      <Heading :size="'lg'" :weight="'semibold'" class="contact-form__title">
        {{ title }}
      </Heading>
    </template>

    <form @submit.prevent="handleSubmit" class="contact-form__form">
      <div class="contact-form__grid">
        <Input
          v-model="formData.name"
          label="Name"
          placeholder="Your full name"
          :error="errors.name"
          required
        />

        <Input
          v-model="formData.email"
          type="email"
          label="Email"
          placeholder="your.email@example.com"
          :error="errors.email"
          required
        />

        <Input
          v-if="showSubject"
          v-model="formData.subject"
          label="Subject"
          placeholder="What's this about?"
          :error="errors.subject"
          :required="subjectRequired"
        />

        <div class="contact-form__message-container">
          <label for="message" class="input__label">Message</label>
          <textarea
            id="message"
            v-model="formData.message"
            :class="textareaClasses"
            placeholder="Your message..."
            :required="messageRequired"
            maxlength="1000"
          />
          <div v-if="errors.message" class="input__error">{{ errors.message }}</div>
          <div class="contact-form__char-count">
            {{ formData.message.length }}/1000
          </div>
        </div>
      </div>

      <div class="contact-form__actions">
        <Button
          type="submit"
          :variant="'primary'"
          :size="'md'"
          :loading="loading"
          :disabled="!isFormValid"
        >
          {{ submitLabel }}
        </Button>

        <Button
          v-if="showCancel"
          type="button"
          :variant="'ghost'"
          :size="'md'"
          @click="$emit('cancel')"
        >
          Cancel
        </Button>
      </div>

      <div v-if="successMessage" class="contact-form__success">
        {{ successMessage }}
      </div>
    </form>
  </Card>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

interface FormData {
  name: string
  email: string
  subject: string
  message: string
}

interface Errors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

interface Props {
  title?: string
  submitLabel?: string
  showSubject?: boolean
  subjectRequired?: boolean
  messageRequired?: boolean
  showCancel?: boolean
  cardVariant?: 'default' | 'elevated' | 'outlined' | 'filled'
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Get in Touch',
  submitLabel: 'Send Message',
  showSubject: true,
  subjectRequired: false,
  messageRequired: true,
  showCancel: false,
  cardVariant: 'default'
})

const emit = defineEmits<{
  submit: [data: FormData]
  cancel: []
}>()

const formData = reactive<FormData>({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const errors = reactive<Errors>({})
const loading = ref(false)
const successMessage = ref('')

const isFormValid = computed(() => {
  return formData.name.trim() &&
         formData.email.trim() &&
         (!props.subjectRequired || formData.subject.trim()) &&
         (!props.messageRequired || formData.message.trim()) &&
         !Object.values(errors).some(error => error)
})

const textareaClasses = computed(() => [
  'contact-form__textarea',
  { 'input--error': errors.message }
])

const validateField = (field: keyof FormData) => {
  errors[field] = ''

  switch (field) {
    case 'name':
      if (!formData.name.trim()) {
        errors.name = 'Name is required'
      }
      break
    case 'email':
      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }
      break
    case 'subject':
      if (props.subjectRequired && !formData.subject.trim()) {
        errors.subject = 'Subject is required'
      }
      break
    case 'message':
      if (props.messageRequired && !formData.message.trim()) {
        errors.message = 'Message is required'
      } else if (formData.message.length > 1000) {
        errors.message = 'Message must be less than 1000 characters'
      }
      break
  }
}

const handleSubmit = async () => {
  // Validate all fields
  Object.keys(formData).forEach(key => validateField(key as keyof FormData))

  if (!isFormValid.value) return

  loading.value = true
  successMessage.value = ''

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    emit('submit', { ...formData })
    successMessage.value = 'Message sent successfully!'

    // Reset form
    Object.keys(formData).forEach(key => {
      formData[key as keyof FormData] = ''
    })
  } catch (error) {
    console.error('Form submission error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.contact-form__title {
  margin: 0 0 1.5rem 0;
}

.contact-form__form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contact-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.contact-form__message-container {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-form__textarea {
  padding: 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.contact-form__textarea:focus {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.contact-form__textarea.input--error {
  border-color: var(--color-error, #ef4444);
}

.contact-form__char-count {
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
  text-align: right;
  margin-top: 0.25rem;
}

.contact-form__actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.contact-form__success {
  padding: 1rem;
  background-color: var(--color-success-bg, #dcfce7);
  color: var(--color-success, #16a34a);
  border-radius: 0.5rem;
  text-align: center;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .contact-form__grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .contact-form__textarea {
    transition: none;
  }
}
</style>