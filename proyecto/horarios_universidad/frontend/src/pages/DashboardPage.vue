<script setup>
import { computed, ref } from 'vue'
import { setSalonFilter, state } from '../store/state'
import { useHealthCheck } from '../composables/useHealthCheck'

const emit = defineEmits(['toast', 'goto'])

// Shared composable: same logic as App.vue, avoids duplicating the inline fetch code.
// Both instances check health independently on mount (lightweight endpoint).
const { backendOk, dbOk } = useHealthCheck()
const search = ref('')

const hasEvents = computed(() => state.calendario.eventos.length > 0)
const hasData   = computed(() => state.materias.length > 0 || state.profesores.length > 0)

// ─── Rooms derived from schedule eventos ───
const salonesMap = computed(() => {
  const map = {}
  for (const e of state.calendario.eventos) {
    if (!e.salon) continue
    if (!map[e.salon]) map[e.salon] = 0
    map[e.salon]++
  }
  return map
})

const salones = computed(() =>
  Object.entries(salonesMap.value)
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => {
      const aLab = a.nombre.toLowerCase().startsWith('lab')
      const bLab = b.nombre.toLowerCase().startsWith('lab')
      if (aLab !== bLab) return aLab ? -1 : 1
      return a.nombre.localeCompare(b.nombre, 'es', { numeric: true })
    })
)

const salonesFiltrados = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return salones.value
  return salones.value.filter(s => s.nombre.toLowerCase().includes(q))
})

const labs    = computed(() => salones.value.filter(s => s.nombre.toLowerCase().startsWith('lab')))
const normales= computed(() => salones.value.filter(s => !s.nombre.toLowerCase().startsWith('lab')))

const labsFiltrados    = computed(() => salonesFiltrados.value.filter(s => s.nombre.toLowerCase().startsWith('lab')))
const normalesFiltrados= computed(() => salonesFiltrados.value.filter(s => !s.nombre.toLowerCase().startsWith('lab')))

const maxSlots = computed(() =>
  state.calendario.dias.length * state.calendario.horas.length
)

function getRoomPct(count) {
  if (!maxSlots.value) return 0
  return Math.min(100, Math.round((count / maxSlots.value) * 100))
}

function getRoomLocation(nombre) {
  const num = parseInt(nombre.match(/\d+/)?.[0] || '1')
  if (nombre.toLowerCase().startsWith('lab'))
    return `Edificio A - Piso ${num <= 6 ? 1 : 2}`
  return `Edificio B - Piso ${num <= 4 ? 1 : 2}`
}

function getRoomCapacity(nombre) {
  return nombre.toLowerCase().startsWith('lab') ? 30 : 40
}

function openRoom(salonNombre) {
  setSalonFilter(salonNombre)
  emit('goto', 4)
}

function formatTS(ts) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return ts }
}
</script>

<template>
  <!-- ─── Empty/Setup state (no schedule generated yet) ─── -->
  <div v-if="!hasEvents" class="flex-1 flex items-center justify-center min-h-screen relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0b1326_70%)] pointer-events-none"></div>
    <div class="relative z-10 flex flex-col items-center max-w-xl px-8 text-center">
      <div class="relative w-32 h-32 mb-8 flex items-center justify-center">
        <div class="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
        <div class="relative bg-surface-container-highest border border-outline-variant rounded-full w-24 h-24 flex items-center justify-center">
          <span class="material-symbols-outlined filled text-primary text-[48px]">school</span>
        </div>
      </div>
      <h1 class="text-display-lg font-sans font-bold text-on-surface mb-4 tracking-tight">
        Bienvenido a GestorAulas
      </h1>
      <p class="text-body-md text-on-surface-variant mb-10 max-w-md leading-relaxed">
        {{ hasData
          ? 'Ya tienes datos configurados. Ejecuta el algoritmo para generar el horario y ver los salones.'
          : 'Configura materias, profesores y ejecuta el solver para ver el panel de salones.' }}
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <button
          v-if="hasData"
          @click="emit('goto', 3)"
          class="bg-primary text-background hover:bg-primary-fixed transition-colors duration-200
                 px-8 py-4 rounded-xl flex items-center gap-3 group
                 shadow-[0_0_20px_rgba(78,222,163,0.25)]"
        >
          <span class="material-symbols-outlined text-[20px]">play_arrow</span>
          <span class="text-label-md font-mono tracking-wide">Ejecutar Algoritmo</span>
        </button>
        <button
          v-else
          @click="emit('goto', 1)"
          class="bg-primary text-background hover:bg-primary-fixed transition-colors duration-200
                 px-8 py-4 rounded-xl flex items-center gap-3 group
                 shadow-[0_0_20px_rgba(78,222,163,0.25)]"
        >
          <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
          <span class="text-label-md font-mono tracking-wide">Comenzar Configuración</span>
        </button>
      </div>
      <!-- Status indicators — shape + color (not color alone) -->
      <div class="mt-10 flex items-center gap-4" role="status" aria-label="Estado de conexión">
        <div class="flex items-center gap-1.5">
          <span
            :class="['material-symbols-outlined text-[14px]', backendOk ? 'text-primary' : backendOk === false ? 'text-error' : 'text-outline']"
          >{{ backendOk ? 'check_circle' : backendOk === false ? 'cancel' : 'pending' }}</span>
          <span class="text-label-md font-mono text-outline">{{ backendOk ? 'API activa' : backendOk === false ? 'API offline' : 'Verificando...' }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span
            :class="['material-symbols-outlined text-[14px]', dbOk ? 'text-secondary' : dbOk === false ? 'text-error' : 'text-outline']"
          >{{ dbOk ? 'check_circle' : dbOk === false ? 'cancel' : 'pending' }}</span>
          <span class="text-label-md font-mono text-outline">{{ dbOk ? 'DB conectada' : dbOk === false ? 'DB offline' : 'Verificando...' }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ─── Room Dashboard (schedule generated) ─── -->
  <div v-else class="px-4 md:px-margin-desktop py-8 max-w-container-max mx-auto flex flex-col gap-8">

    <!-- Page header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-display-lg-mobile md:text-display-lg font-sans font-bold text-on-surface">
          Panel de Control
        </h1>
        <p class="text-body-md text-on-surface-variant mt-1">
          Gestiona los horarios de los {{ salones.length }} espacios educativos de la institución
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="emit('goto', 4)"
          class="bg-surface-container-high border border-outline-variant hover:border-primary
                 text-on-surface text-label-md font-mono py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">calendar_month</span>
          Horario Global
        </button>
        <button
          @click="emit('goto', 3)"
          class="bg-primary text-background text-label-md font-mono py-2.5 px-5 rounded-xl
                 flex items-center gap-2 transition-colors hover:bg-primary-fixed
                 shadow-[0_0_16px_rgba(78,222,163,0.25)]"
        >
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          Regenerar
        </button>
      </div>
    </div>

    <!-- ─── Top stats: 3 cards ─── -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

      <!-- Labs -->
      <div class="bg-surface-container border border-outline-variant rounded-xl p-5 flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0">
          <span class="text-secondary text-[28px] font-bold font-sans leading-none">{{ labs.length }}</span>
        </div>
        <div>
          <p class="text-body-sm text-on-surface-variant">Laboratorios de Sistemas</p>
          <p class="text-headline-sm font-sans font-bold text-on-surface">Disponibles</p>
        </div>
      </div>

      <!-- Salones Normales -->
      <div class="bg-surface-container border border-outline-variant rounded-xl p-5 flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-tertiary/15 flex items-center justify-center flex-shrink-0">
          <span class="text-tertiary text-[28px] font-bold font-sans leading-none">{{ normales.length }}</span>
        </div>
        <div>
          <p class="text-body-sm text-on-surface-variant">Salones Normales</p>
          <p class="text-headline-sm font-sans font-bold text-on-surface">Disponibles</p>
        </div>
      </div>

      <!-- Total clases -->
      <div class="bg-surface-container border border-outline-variant rounded-xl p-5 flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <span class="text-primary text-[28px] font-bold font-sans leading-none">{{ state.calendario.eventos.length }}</span>
        </div>
        <div>
          <p class="text-body-sm text-on-surface-variant">Clases Asignadas</p>
          <p class="text-headline-sm font-sans font-bold text-on-surface">Esta Semana</p>
        </div>
      </div>
    </div>

    <!-- ─── Algorithm result info bar ─── -->
    <div
      v-if="state.lastRun"
      class="bg-surface-container-low border border-outline-variant rounded-xl px-5 py-3 flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <span
          :class="[
            'w-2 h-2 rounded-full flex-shrink-0',
            ['OPTIMAL','FEASIBLE'].includes(state.lastRun.status)
              ? 'bg-primary shadow-[0_0_8px_#4edea3]'
              : 'bg-error'
          ]"
        ></span>
        <span class="text-label-md font-mono text-on-surface-variant">
          Última ejecución — {{ formatTS(state.lastRun.timestamp) }}
          · {{ state.lastRun.status }}
          <template v-if="state.lastRun.elapsed"> · {{ state.lastRun.elapsed }}s</template>
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span :class="['w-2 h-2 rounded-full', backendOk ? 'bg-primary' : 'bg-error']"></span>
        <span class="text-[11px] font-mono text-outline">{{ backendOk ? 'API activa' : 'API offline' }}</span>
      </div>
    </div>

    <!-- ─── Search bar ─── -->
    <div class="relative max-w-sm">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
      <input
        v-model="search"
        type="text"
        placeholder="Buscar salón..."
        class="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl
               text-body-sm text-on-surface placeholder-outline
               focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
      />
    </div>

    <!-- ─── Labs section ─── -->
    <section v-if="labsFiltrados.length">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-headline-sm font-sans font-bold text-on-surface">Laboratorios de Sistemas</h2>
        <span class="bg-surface-container-high text-on-surface-variant text-label-md font-mono px-2.5 py-0.5 rounded-full border border-outline-variant">
          {{ labsFiltrados.length }}
        </span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <button
          v-for="s in labsFiltrados"
          :key="s.nombre"
          @click="openRoom(s.nombre)"
          class="group bg-surface-container border border-outline-variant rounded-xl p-4 text-left
                 hover:border-secondary/50 hover:bg-surface-container-high transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-secondary/30"
        >
          <!-- Card top: icon + badge -->
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <span class="material-symbols-outlined text-secondary text-[20px]">computer</span>
            </div>
            <span class="text-[10px] font-mono bg-secondary/20 text-secondary px-2 py-0.5 rounded-full border border-secondary/30">
              Lab
            </span>
          </div>
          <!-- Name -->
          <p class="text-body-md font-sans font-bold text-on-surface mb-1 group-hover:text-secondary transition-colors">
            {{ s.nombre }}
          </p>
          <!-- Meta -->
          <div class="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant mb-3">
            <span class="material-symbols-outlined text-[14px]">group</span>
            <span>{{ getRoomCapacity(s.nombre) }}</span>
            <span class="text-outline">·</span>
            <span>{{ getRoomLocation(s.nombre) }}</span>
          </div>
          <!-- Usage bar -->
          <div class="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
            <div
              class="bg-secondary h-1 rounded-full transition-all duration-500"
              :style="{ width: getRoomPct(s.count) + '%' }"
            ></div>
          </div>
          <p class="text-[10px] font-mono text-on-surface-variant mt-1.5">{{ s.count }} clases</p>
        </button>
      </div>
    </section>

    <!-- ─── Salones normales section ─── -->
    <section v-if="normalesFiltrados.length">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-headline-sm font-sans font-bold text-on-surface">Salones Normales</h2>
        <span class="bg-surface-container-high text-on-surface-variant text-label-md font-mono px-2.5 py-0.5 rounded-full border border-outline-variant">
          {{ normalesFiltrados.length }}
        </span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <button
          v-for="s in normalesFiltrados"
          :key="s.nombre"
          @click="openRoom(s.nombre)"
          class="group bg-surface-container border border-outline-variant rounded-xl p-4 text-left
                 hover:border-tertiary/50 hover:bg-surface-container-high transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-tertiary/30"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-lg bg-tertiary/20 flex items-center justify-center">
              <span class="material-symbols-outlined text-tertiary text-[20px]">meeting_room</span>
            </div>
            <span class="text-[10px] font-mono bg-tertiary/20 text-tertiary px-2 py-0.5 rounded-full border border-tertiary/30">
              Salón
            </span>
          </div>
          <p class="text-body-md font-sans font-bold text-on-surface mb-1 group-hover:text-tertiary transition-colors">
            {{ s.nombre }}
          </p>
          <div class="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant mb-3">
            <span class="material-symbols-outlined text-[14px]">group</span>
            <span>{{ getRoomCapacity(s.nombre) }}</span>
            <span class="text-outline">·</span>
            <span>{{ getRoomLocation(s.nombre) }}</span>
          </div>
          <div class="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
            <div
              class="bg-tertiary h-1 rounded-full transition-all duration-500"
              :style="{ width: getRoomPct(s.count) + '%' }"
            ></div>
          </div>
          <p class="text-[10px] font-mono text-on-surface-variant mt-1.5">{{ s.count }} clases</p>
        </button>
      </div>
    </section>

    <!-- No results for search -->
    <div
      v-if="search && !labsFiltrados.length && !normalesFiltrados.length"
      class="text-center py-12 text-on-surface-variant"
    >
      <span class="material-symbols-outlined text-[40px] text-outline mb-3 block">search_off</span>
      <p class="text-body-md">Sin resultados para "{{ search }}"</p>
    </div>

  </div>
</template>
