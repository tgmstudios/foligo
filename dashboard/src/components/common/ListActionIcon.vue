<template>
  <svg
    class="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      v-if="name === 'edit'"
      stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-1.5-10.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
    />
    <path
      v-else-if="name === 'delete'"
      stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M19 7l-.87 12.14A2 2 0 0116.14 21H7.86a2 2 0 01-1.99-1.86L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
    <path
      v-else-if="name === 'restore'"
      stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M3 10h4V6m0 0a8 8 0 11-2.34 5.66M7 6L3 10"
    />
    <path
      v-else-if="name === 'test'"
      stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M9 3h6m-5 0v5l-5.5 9.5A2 2 0 006.23 21h11.54a2 2 0 001.73-3.5L14 8V3M8 15h8"
    />
    <path
      v-else
      stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7z"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: 'edit' | 'delete' | 'view' | 'restore' | 'test' }>()
</script>
