<script setup>
/**
 * MateriasTagInput — Professional typeahead multi-select for materia assignment.
 *
 * Features:
 *  • Chip-based display of selected materias with 1-click removal
 *  • Live typeahead search filtered by name or category
 *  • Keyboard navigation (↑↓ navigate · Enter select · Backspace remove last · Escape close)
 *  • Teleport-based dropdown to escape table overflow clipping
 *  • Category color-coded dots and badges
 *  • Animated open/close transition
 */
import { catColor } from '../lib/colors.js'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  /** Array of selected materia IDs */
  modelValue: { type: Array, default: () => [] },
  /** All available materia objects: { id, nombre, creditos, grupos, categoria } */
  options:    { type: Array, default: () => [] },
  placeholder:{ type: String, default: 'Buscar materia…' },
  disabled:   { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

// ─── Refs ────────────────────────────────────────────────────────────────────
const query   = ref('')
const isOpen  = ref(false)
const hlIdx   = ref(0)
const inputEl = ref(null)
const rootEl  = ref(null)   // trigger wrapper
const dropEl  = ref(null)   // teleported dropdown

// Computed dropdown position (viewport-relative for `position: fixed`)
const dropStyle = ref({})

// ─── Derived ─────────────────────────────────────────────────────────────────
const selected = computed(() =>
  props.modelValue
    .map(id => props.options.find(o => o.id === id))
    .filter(Boolean)
)

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  return props.options.filter(o =>
    !props.modelValue.includes(o.id) &&
    (!q || o.nombre.toLowerCase().includes(q) || (o.categoria || '').toLowerCase().includes(q))
  )
})

// Reset highlight when the list changes
watch(filtered, () => { hlIdx.value = 0 })

// ─── Dropdown positioning ─────────────────────────────────────────────────────
function updatePos() {
  if (!rootEl.value) return
  const rect = rootEl.value.getBoundingClientRect()
  // Prefer opening downward; if too close to bottom, flip up
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const preferDown = spaceBelow >= 220 || spaceBelow >= spaceAbove
  dropStyle.value = {
    position: 'fixed',
    left:     `${rect.left}px`,
    width:    `${rect.width}px`,
    zIndex:   9999,
    ...(preferDown
      ? { top:    `${rect.bottom + 6}px` }
      : { bottom: `${window.innerHeight - rect.top + 6}px` }),
  }
}

// ─── Open / Close ────────────────────────────────────────────────────────────
function open() {
  if (props.disabled || isOpen.value) return
  isOpen.value = true
  nextTick(updatePos)
}

function close() {
  isOpen.value = false
  query.value  = ''
  hlIdx.value  = 0
}

// Track scroll/resize to keep dropdown aligned
watch(isOpen, active => {
  if (active) {
    window.addEventListener('scroll', updatePos, { capture: true, passive: true })
    window.addEventListener('resize', updatePos, { passive: true })
  } else {
    window.removeEventListener('scroll', updatePos, { capture: true })
    window.removeEventListener('resize', updatePos)
  }
})

// ─── Selection ───────────────────────────────────────────────────────────────
function pick(id) {
  if (!id || props.modelValue.includes(id)) return
  emit('update:modelValue', [...props.modelValue, id])
  query.value = ''
  hlIdx.value = 0
  nextTick(() => inputEl.value?.focus())
}

function remove(id) {
  emit('update:modelValue', props.modelValue.filter(m => m !== id))
}

function removeLast() {
  if (query.value === '' && props.modelValue.length)
    emit('update:modelValue', props.modelValue.slice(0, -1))
}

// ─── Keyboard ────────────────────────────────────────────────────────────────
function onKeyDown(e) {
  if (e.key === 'Backspace' && !query.value) {
    removeLast()
    return
  }
  if (!isOpen.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') { open(); e.preventDefault() }
    return
  }
  switch (e.key) {
    case 'ArrowDown':
      hlIdx.value = Math.min(hlIdx.value + 1, filtered.value.length - 1)
      e.preventDefault()
      break
    case 'ArrowUp':
      hlIdx.value = Math.max(hlIdx.value - 1, 0)
      e.preventDefault()
      break
    case 'Enter':
      if (filtered.value[hlIdx.value]) pick(filtered.value[hlIdx.value].id)
      e.preventDefault()
      break
    case 'Escape':
      close()
      inputEl.value?.blur()
      break
    case 'Tab':
      close()
      break
  }
}

// ─── Click-outside ───────────────────────────────────────────────────────────
function onPointerDown(e) {
  if (rootEl.value?.contains(e.target)) return
  if (dropEl.value?.contains(e.target)) return
  close()
}

onMounted(()  => document.addEventListener('pointerdown', onPointerDown, true))
onUnmounted(() => document.removeEventListener('pointerdown', onPointerDown, true))
</script>

<template>
  <div ref="rootEl" class="relative w-full">

    <!-- ═══ Trigger / Tag Box ═══════════════════════════════════════════════ -->
    <div
      @click="open(); inputEl?.focus()"
      :class="[
        'flex flex-wrap gap-1.5 items-center min-h-[44px] w-full px-2.5 py-2',
        'bg-surface-container-lowest border rounded-xl cursor-text',
        'transition-all duration-150 ease-out',
        disabled ? 'opacity-50 pointer-events-none' : '',
        isOpen
          ? 'border-secondary ring-2 ring-secondary/20 shadow-[0_0_0_4px_rgba(74,184,217,0.06)]'
          : 'border-outline-variant hover:border-outline'
      ]"
    >
      <!-- Chips for selected materias -->
      <span
        v-for="mat in selected"
        :key="mat.id"
        class="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full
               text-[11px] font-mono font-medium border transition-all duration-100
               cursor-default group flex-shrink-0"
        :style="{
          backgroundColor: catColor(mat.categoria) + '22',
          borderColor:     catColor(mat.categoria) + '70',
          color:           catColor(mat.categoria),
        }"
      >
        <!-- Category dot -->
        <span
          class="w-1.5 h-1.5 rounded-full flex-shrink-0"
          :style="{ backgroundColor: catColor(mat.categoria) }"
        ></span>
        <!-- Name -->
        <span class="truncate max-w-[96px]">{{ mat.nombre }}</span>
        <!-- Remove button -->
        <button
          type="button"
          @click.stop="remove(mat.id)"
          class="flex items-center justify-center w-3.5 h-3.5 rounded-full ml-0.5 flex-shrink-0
                 opacity-50 group-hover:opacity-100 hover:bg-white/20 transition-all duration-100"
          :title="`Quitar ${mat.nombre}`"
        >
          <svg width="7" height="7" viewBox="0 0 8 8" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M1 1l6 6M7 1L1 7"/>
          </svg>
        </button>
      </span>

      <!-- Search input -->
      <input
        ref="inputEl"
        v-model="query"
        @focus="open"
        @keydown="onKeyDown"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :placeholder="selected.length === 0 ? placeholder : ''"
        class="flex-1 min-w-[80px] bg-transparent outline-none border-none
               text-[13px] font-sans text-on-surface leading-none py-0.5
               placeholder:text-on-surface-variant/35"
      />

      <!-- Right: count badge + chevron -->
      <div class="flex items-center gap-1.5 ml-auto pl-1 flex-shrink-0">
        <span
          v-if="selected.length"
          class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full
                 bg-secondary/15 text-secondary border border-secondary/25 leading-none"
        >{{ selected.length }}</span>
        <span
          class="material-symbols-outlined text-outline text-[18px] transition-transform duration-200 leading-none"
          :class="isOpen ? 'rotate-180' : ''"
        >expand_more</span>
      </div>
    </div>

    <!-- ═══ Teleported Dropdown ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="tag-drop">
        <div
          v-if="isOpen"
          ref="dropEl"
          :style="dropStyle"
          class="bg-surface-container-high border border-outline-variant rounded-xl
                 shadow-2xl shadow-black/40 overflow-hidden"
        >
          <!-- Empty / no-results state -->
          <div
            v-if="!filtered.length"
            class="flex flex-col items-center gap-1.5 py-6 px-4 text-center"
          >
            <span class="material-symbols-outlined text-[28px] text-outline opacity-40">
              {{ query ? 'search_off' : 'checklist' }}
            </span>
            <p class="text-[12px] font-mono text-on-surface-variant">
              {{ query
                  ? `Sin resultados para "${query}"`
                  : 'Todas las materias ya están asignadas' }}
            </p>
          </div>

          <!-- Option list -->
          <ul v-else class="max-h-52 overflow-y-auto overscroll-contain py-1">
            <li
              v-for="(opt, idx) in filtered"
              :key="opt.id"
              @mouseenter="hlIdx = idx"
              @click="pick(opt.id)"
              :class="[
                'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-75',
                hlIdx === idx
                  ? 'bg-secondary/10'
                  : 'hover:bg-surface-container-highest'
              ]"
            >
              <!-- Category dot -->
              <span
                class="w-2 h-2 rounded-full flex-shrink-0"
                :style="{ backgroundColor: catColor(opt.categoria) }"
              ></span>

              <!-- Materia name -->
              <span class="flex-1 text-[13px] font-sans text-on-surface truncate">
                {{ opt.nombre }}
              </span>

              <!-- Meta: credits · groups · category -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded
                             bg-surface-container border border-outline-variant text-on-surface-variant leading-none">
                  {{ opt.creditos }}cr
                </span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded
                             bg-surface-container border border-outline-variant text-on-surface-variant leading-none">
                  {{ opt.grupos }}g
                </span>
                <span
                  class="text-[10px] font-mono px-1.5 py-0.5 rounded border leading-none"
                  :style="{
                    backgroundColor: catColor(opt.categoria) + '1a',
                    borderColor:     catColor(opt.categoria) + '55',
                    color:           catColor(opt.categoria),
                  }"
                >
                  {{ opt.categoria === 'Ciencias Básicas' ? 'Ciencias' : opt.categoria }}
                </span>
              </div>
            </li>
          </ul>

          <!-- Keyboard hint footer -->
          <div class="px-3 py-2 border-t border-outline-variant bg-surface-container-lowest
                      flex items-center gap-4">
            <span class="text-[10px] font-mono text-outline flex items-center gap-1">
              <kbd class="px-1 py-0.5 rounded bg-surface-container border border-outline-variant
                          text-[9px] leading-none">↑↓</kbd>
              navegar
            </span>
            <span class="text-[10px] font-mono text-outline flex items-center gap-1">
              <kbd class="px-1 py-0.5 rounded bg-surface-container border border-outline-variant
                          text-[9px] leading-none">↵</kbd>
              agregar
            </span>
            <span class="text-[10px] font-mono text-outline flex items-center gap-1">
              <kbd class="px-1 py-0.5 rounded bg-surface-container border border-outline-variant
                          text-[9px] leading-none">⌫</kbd>
              quitar
            </span>
            <span class="text-[10px] font-mono text-outline flex items-center gap-1">
              <kbd class="px-1 py-0.5 rounded bg-surface-container border border-outline-variant
                          text-[9px] leading-none">Esc</kbd>
              cerrar
            </span>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.tag-drop-enter-active {
  transition: opacity 0.12s ease, transform 0.12s cubic-bezier(0.2, 0, 0, 1);
}
.tag-drop-leave-active {
  transition: opacity 0.08s ease, transform 0.08s ease;
}
.tag-drop-enter-from,
.tag-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.96);
  transform-origin: top center;
}
</style>
