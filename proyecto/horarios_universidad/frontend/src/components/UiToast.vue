<script setup>
defineProps({
  on: { type: Boolean, required: true },
  msg: { type: String, required: true },
})
</script>

<template>
  <div class="toast" :class="{ on }" role="status" aria-live="polite">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <span>{{ msg }}</span>
  </div>
</template>

