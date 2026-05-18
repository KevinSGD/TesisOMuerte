<script setup>
/**
 * TagSelect — Modern multi-select with typeahead filter and chip badges.
 * Replaces the <select multiple> + Ctrl-click UX across ProfesoresPage.
 *
 * Props:
 *   modelValue  Array<id>   Currently selected IDs (v-model)
 *   options     Array<{id, label}>   Full list of selectable items
 *   placeholder String      Input placeholder text
 *   disabled    Boolean     Read-only mode
 *
 * Keyboard:
 *   Backspace on empty input → removes last chip
 *   Escape → closes dropdown
 *   Enter  → selects first dropdown match
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  modelValue:  { type: Array,   default: () => [] },
  options:     { type: Array,   default: () => [] }, // [{ id, label }]
  placeholder: { type: String,  default: 'Buscar materia...' },
  disabled:    { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const search  = ref('')
const open    = ref(false)
const root    = ref(null)
const inputEl = ref(null)

// ── Derived lists ────────────────────────────────────────────────────────
const selected = computed(() =>
  props.modelValue
    .map(id => props.options.find(o => o.id === id))
    .filter(Boolean)
)

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return props.options.filter(o =>
    !props.modelValue.includes(o.id) &&
    (!q || o.label.toLowerCase().includes(q))
  )
})

// ── Mutations ────────────────────────────────────────────────────────────
function add(id) {
  if (props.disabled || props.modelValue.includes(id)) return
  emit('update:modelValue', [...props.modelValue, id])
  search.value = ''
  inputEl.value?.focus()
}

function remove(id) {
  if (props.disabled) return
  emit('update:modelValue', props.modelValue.filter(x => x !== id))
}

function onKeydown(e) {
  if (e.key === 'Backspace' && !search.value && selected.value.length) {
    remove(selected.value[selected.value.length - 1].id)
  }
  if (e.key === 'Escape') { open.value = false; search.value = '' }
  if (e.key === 'Enter' && filtered.value.length) {
    e.preventDefault()
    add(filtered.value[0].id)
  }
}

// ── Click-outside ────────────────────────────────────────────────────────
function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) {
    open.value   = false
    search.value = ''
  }
}
onMounted(()      => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

// Chip label: trim the " · 3cr · 2g" suffix for compact display
function chipLabel(opt) {
  return opt.label.split('·')[0].trim()
}
</script>

<template>
  <div ref="root" class="relative w-full">

    <!-- ── Tag container ─────────────────────────────────────────────── -->
    <div
      @click="!disabled && inputEl?.focus()"
      :class="[
        'min-h-[42px] flex flex-wrap items-center gap-1.5 rounded-xl px-3 py-2 transition-all cursor-text',
        'bg-surface-container-lowest border',
        open && !disabled
          ? 'border-secondary ring-1 ring-secondary/40'
          : 'border-outline-variant hover:border-secondary/50',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
      ]"
    >
      <!-- Selected chips -->
      <span
        v-for="opt in selected"
        :key="opt.id"
        class="inline-flex items-center gap-1 text-[13px] font-mono leading-none
               bg-primary/12 text-primary border border-primary/25
               rounded-lg px-2 py-1 select-none transition-colors
               hover:bg-primary/20"
      >
        <span class="material-symbols-outlined text-[12px] text-primary/60">book</span>
        {{ chipLabel(opt) }}
        <button
          type="button"
          @click.stop="remove(opt.id)"
          :aria-label="`Quitar ${chipLabel(opt)}`"
          class="ml-0.5 flex items-center justify-center
                 w-4 h-4 rounded-full text-primary/50
                 hover:text-primary hover:bg-primary/25 transition-colors leading-none"
        >×</button>
      </span>

      <!-- Search input -->
      <input
        v-if="!disabled"
        ref="inputEl"
        v-model="search"
        type="text"
        :placeholder="selected.length === 0 ? placeholder : ''"
        class="flex-1 min-w-[100px] bg-transparent text-body-sm text-on-surface
               outline-none placeholder:text-on-surface-variant/50 py-0.5"
        @focus="open = true"
        @keydown="onKeydown"
      />

      <!-- Chevron -->
      <span
        class="material-symbols-outlined text-[18px] text-on-surface-variant/60 transition-transform duration-200 ml-auto flex-shrink-0"
        :class="open ? 'rotate-180' : ''"
      >expand_more</span>
    </div>

    <!-- ── Dropdown ───────────────────────────────────────────────────── -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-95"
    >
      <div
        v-if="open"
        class="absolute top-full left-0 right-0 mt-1.5 z-50
               bg-surface-container-high border border-outline-variant
               rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto"
      >
        <!-- Results -->
        <template v-if="filtered.length">
          <button
            v-for="opt in filtered"
            :key="opt.id"
            type="button"
            @mousedown.prevent="add(opt.id)"
            class="w-full text-left px-4 py-2.5 flex items-center gap-2.5
                   text-body-sm text-on-surface transition-colors
                   hover:bg-primary/10 hover:text-primary group"
          >
            <span class="material-symbols-outlined text-[16px] text-on-surface-variant/40 group-hover:text-primary/60 transition-colors">add_circle</span>
            <span class="flex-1 truncate">{{ opt.label }}</span>
          </button>
        </template>

        <!-- No results -->
        <div
          v-else-if="search"
          class="px-4 py-3 flex items-center gap-2 text-body-sm text-on-surface-variant"
        >
          <span class="material-symbols-outlined text-[16px]">search_off</span>
          Sin resultados para "<span class="text-on-surface">{{ search }}</span>"
        </div>

        <!-- All selected -->
        <div
          v-else-if="!filtered.length && !search"
          class="px-4 py-3 flex items-center gap-2 text-body-sm text-on-surface-variant"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">check_circle</span>
          Todas las materias están asignadas
        </div>
      </div>
    </Transition>
  </div>
</template>
