<template>
  <div>
    <div class="flex w-full gap-2">
      <select :value="country" class="input country-select" aria-label="Phone country" @change="changeCountry">
        <option v-for="option in countries" :key="option.code" :value="option.code">
          {{ option.code }} {{ option.dial }}
        </option>
      </select>
      <input
        :value="displayNumber"
        type="tel"
        inputmode="tel"
        autocomplete="tel-national"
        class="input number-input"
        placeholder="555 123 4567"
        :aria-invalid="Boolean(error)"
        @input="changeNumber"
        @blur="validate"
      />
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-400">{{ error }}</p>
    <p v-else class="mt-1 text-xs text-gray-500">Saved in international format, including country code.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface CountryOption { code: string; dial: string }

const props = defineProps<{ modelValue: string; country?: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:country': [value: string]
}>()

const countries: CountryOption[] = [
  { code: 'US', dial: '+1' }, { code: 'CA', dial: '+1' },
  { code: 'GB', dial: '+44' }, { code: 'AU', dial: '+61' },
  { code: 'IN', dial: '+91' }, { code: 'DE', dial: '+49' },
  { code: 'FR', dial: '+33' }, { code: 'ES', dial: '+34' },
  { code: 'IT', dial: '+39' }, { code: 'NL', dial: '+31' },
  { code: 'IE', dial: '+353' }, { code: 'NZ', dial: '+64' },
  { code: 'SG', dial: '+65' }, { code: 'JP', dial: '+81' },
  { code: 'BR', dial: '+55' }, { code: 'MX', dial: '+52' },
]

const selectedCountry = computed(() => countries.find((item) => item.code === props.country) || countries[0])
const nationalNumber = ref('')
const error = ref('')

function digits(value: string) { return value.replace(/\D/g, '') }

function readNational(value: string) {
  const allDigits = digits(value)
  const dialDigits = digits(selectedCountry.value.dial)
  return value.trim().startsWith('+') && allDigits.startsWith(dialDigits)
    ? allDigits.slice(dialDigits.length)
    : allDigits
}

watch(() => [props.modelValue, props.country] as const, () => {
  nationalNumber.value = readNational(props.modelValue || '')
}, { immediate: true })

const displayNumber = computed(() => nationalNumber.value.replace(/(\d{3})(?=\d)/g, '$1 ').trim())

function emitInternational() {
  const number = digits(nationalNumber.value)
  emit('update:modelValue', number ? `${selectedCountry.value.dial}${number}` : '')
}

function changeCountry(event: Event) {
  const countryCode = (event.target as HTMLSelectElement).value
  const option = countries.find((item) => item.code === countryCode) || countries[0]
  emit('update:country', countryCode)
  const number = digits(nationalNumber.value)
  emit('update:modelValue', number ? `${option.dial}${number}` : '')
}

function changeNumber(event: Event) {
  const maxNationalLength = 15 - digits(selectedCountry.value.dial).length
  nationalNumber.value = digits((event.target as HTMLInputElement).value).slice(0, maxNationalLength)
  error.value = ''
  emitInternational()
}

function validate(event?: Event) {
  const nationalCount = digits(nationalNumber.value).length
  const internationalCount = nationalCount + digits(selectedCountry.value.dial).length
  error.value = nationalCount === 0 || (nationalCount >= 7 && internationalCount <= 15) ? '' : 'Enter a valid international phone number.'
  ;(event?.target as HTMLInputElement | undefined)?.setCustomValidity(error.value)
}
</script>

<style scoped>
.input { @apply w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500; }
.country-select { flex: 0 0 7rem; width: 7rem; }
.number-input { flex: 1 1 0%; width: 0; min-width: 0; }
</style>
