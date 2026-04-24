<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  state: { type: String, default: 'unknown' }, // success | error | unknown
})

const dotClass = computed(() => {
  if (props.state === 'success') return 'dot dot-success'
  if (props.state === 'error') return 'dot dot-error'
  return 'dot dot-unknown'
})
</script>

<template>
  <div class="status-card">
    <div class="status-card-header">{{ label }}</div>
    <div class="status-card-body">
      <span :class="dotClass" />
      <span>{{ value }}</span>
    </div>
  </div>
</template>
