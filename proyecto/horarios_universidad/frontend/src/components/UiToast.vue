<script setup>
defineProps({
  on:   { type: Boolean, default: false },
  msg:  { type: String,  default: '' },
  type: { type: String,  default: 'info' }, // 'info' | 'success' | 'error'
})
</script>

<template>
  <Teleport to="body">
    <div
      role="status"
      aria-live="polite"
      :class="[
        'fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl border max-w-sm',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        'transition-all duration-200',
        on ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none',
        type === 'success'
          ? 'bg-surface-container border-primary/30'
          : type === 'error'
            ? 'bg-surface-container border-error/30'
            : 'bg-surface-container border-secondary/30'
      ]"
    >
      <span
        :class="[
          'material-symbols-outlined filled flex-shrink-0 text-[20px]',
          type === 'success' ? 'text-primary' : type === 'error' ? 'text-error' : 'text-secondary'
        ]"
      >
        {{ type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info' }}
      </span>
      <span class="text-body-sm text-on-surface flex-1">{{ msg }}</span>
      <div
        :class="[
          'absolute bottom-0 left-0 h-0.5 w-full rounded-b-xl',
          type === 'success' ? 'bg-primary' : type === 'error' ? 'bg-error' : 'bg-secondary'
        ]"
      ></div>
    </div>
  </Teleport>
</template>
