<script setup>
import { computed, onMounted, ref } from 'vue'
import { state } from '../store/state'
import { getApiHealth, getDbHealth } from '../services/api'

const emit = defineEmits(['toast', 'goto'])

const backendOk = ref(null)
const dbOk      = ref(null)
const loading   = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    const r = await getApiHealth()
    backendOk.value = !!r.ok
  } catch { backendOk.value = false }
  try {
    const r = await getDbHealth()
    dbOk.value = !!r.ok
  } catch { dbOk.value = false }
  loading.value = false
})

const metrics = computed(() => [
  {
    label:   'Materias Registradas',
    value:   state.materias.length,
    icon:    'book',
    color:   'text-tertiary',
    border:  'hover:border-tertiary/50',
    badge:   'CATÁLOGO',
  },
  {
    label:   'Profesores Registrados',
    value:   state.profesores.length,
    icon:    'person',
    color:   'text-secondary',
    border:  'hover:border-secondary/50',
    badge:   'ACTIVOS',
  },
  {
    label:   'Asignaciones Realizadas',
    value:   state.profesores.filter(p => p.materiaId).length,
    icon:    'assignment_ind',
    color:   'text-primary',
    border:  'hover:border-primary/50',
    badge:   'VINCULADOS',
  },
  {
    label:   'Clases Programadas',
    value:   state.calendario.eventos.length,
    icon:    'event',
    color:   'text-primary-fixed',
    border:  'hover:border-primary-fixed/50',
    badge:   'HORARIO',
  },
])

// Demanda semanal: count de eventos por día
const demandaData = computed(() => {
  const dias = state.calendario.dias
  const counts = dias.map((_, i) =>
    state.calendario.eventos.filter(e => e.dayIndex === i).length
  )
  const max = Math.max(...counts, 1)
  return dias.map((d, i) => ({
    label: d.slice(0, 3).toUpperCase(),
    count: counts[i],
    pct:   Math.round((counts[i] / max) * 100),
  }))
})

// Estado del algoritmo
const algoStatus = computed(() => {
  if (!state.lastRun) return null
  return state.lastRun
})

// Ocupación global
const ocupacion = computed(() => {
  const total = state.calendario.dias.length * state.calendario.horas.length
  if (!total) return 0
  return Math.min(100, Math.round((state.calendario.eventos.length / total) * 100))
})

const hasData = computed(() =>
  state.materias.length > 0 || state.profesores.length > 0
)

function formatTS(ts) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return ts }
}
</script>

<template>
  <!-- ─── Empty State ─── -->
  <div v-if="!hasData" class="flex-1 flex items-center justify-center min-h-screen relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#171f33_0%,_#0b1326_70%)] pointer-events-none"></div>
    <div class="relative z-10 flex flex-col items-center max-w-xl px-8 text-center">
      <div class="relative w-32 h-32 mb-8 flex items-center justify-center">
        <div class="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
        <div class="relative bg-surface-container-highest border border-outline-variant rounded-full w-24 h-24 flex items-center justify-center">
          <span class="material-symbols-outlined filled text-primary text-[48px]">event_busy</span>
        </div>
      </div>
      <h1 class="text-display-lg font-sans font-bold text-on-surface mb-4 tracking-tight">
        Bienvenido a GestorAulas
      </h1>
      <p class="text-body-md text-on-surface-variant mb-10 max-w-md leading-relaxed">
        No hay horarios generados. Configure los parámetros para comenzar a organizar el flujo académico de la institución.
      </p>
      <button
        @click="emit('goto', 1)"
        class="bg-primary text-on-primary hover:bg-primary-fixed transition-colors duration-200
               px-8 py-4 rounded-xl flex items-center gap-3 group
               shadow-[0_0_20px_rgba(78,222,163,0.25)]"
      >
        <span class="text-label-md font-mono tracking-wide">Comenzar Configuración de Horario</span>
        <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </button>
      <p class="mt-8 text-label-md font-mono text-outline flex items-center gap-2">
        <span class="material-symbols-outlined text-[16px]">info</span>
        Las secciones se habilitarán tras registrar materias y profesores.
      </p>
    </div>
  </div>

  <!-- ─── Dashboard con datos ─── -->
  <div v-else class="px-4 md:px-margin-desktop py-8 md:py-10 max-w-container-max mx-auto">

    <!-- Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
      <div>
        <h2 class="text-display-lg-mobile md:text-display-lg font-sans font-bold text-on-surface">
          Panel de Control
        </h2>
        <p class="text-body-md text-on-surface-variant mt-2 max-w-2xl">
          Visión general del sistema — {{ state.materias.length }} materias,
          {{ state.profesores.length }} profesores,
          {{ state.calendario.eventos.length }} clases programadas.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="emit('goto', 4)"
          class="bg-surface-container-high border border-outline-variant hover:border-primary
                 text-on-surface text-label-md font-mono py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">calendar_month</span>
          Horario Global
        </button>
        <button
          @click="emit('goto', 3)"
          class="bg-primary text-on-primary-container text-label-md font-mono py-2 px-4 rounded-xl
                 flex items-center gap-2 transition-colors hover:bg-primary-container
                 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
        >
          <span class="material-symbols-outlined text-[18px]">play_arrow</span>
          Ejecutar Algoritmo
        </button>
      </div>
    </div>

    <!-- Bento Grid -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">

      <!-- ─── Metric Cards (4 × col-3) ─── -->
      <div
        v-for="m in metrics"
        :key="m.label"
        :class="['col-span-1 md:col-span-3 bg-surface-container rounded-xl border border-outline-variant p-6 flex flex-col justify-between group transition-colors', m.border]"
      >
        <div class="flex justify-between items-start mb-4">
          <div class="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center" :class="m.color">
            <span class="material-symbols-outlined">{{ m.icon }}</span>
          </div>
          <span class="bg-surface-bright text-on-surface-variant text-[10px] font-mono px-2 py-1 rounded">
            {{ m.badge }}
          </span>
        </div>
        <div>
          <h3 class="text-display-lg font-sans font-bold text-on-surface leading-none">{{ m.value }}</h3>
          <p class="text-body-sm text-on-surface-variant mt-2">{{ m.label }}</p>
        </div>
      </div>

      <!-- ─── Algorithm Status (col-8) ─── -->
      <div class="col-span-1 md:col-span-8 bg-surface-container rounded-xl border border-outline-variant overflow-hidden flex flex-col relative">
        <!-- Top accent gradient -->
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary-container"></div>

        <div class="p-6 md:p-8 flex-1 flex flex-col justify-between">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="material-symbols-outlined text-primary text-[20px]">memory</span>
                <h3 class="text-headline-sm font-sans text-on-surface">Estado del Algoritmo</h3>
              </div>
              <p class="text-body-sm text-on-surface-variant">Motor CP-SAT (Google OR-Tools) — Resolución de restricciones</p>
            </div>
            <!-- Status badge -->
            <span
              :class="[
                'text-label-md font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5 border',
                backendOk
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-error/10 text-error border-error/20'
              ]"
            >
              <span
                :class="[
                  'w-2 h-2 rounded-full',
                  backendOk ? 'bg-primary shadow-[0_0_8px_#4edea3]' : 'bg-error'
                ]"
              ></span>
              {{ backendOk ? 'DISPONIBLE' : 'OFFLINE' }}
            </span>
          </div>

          <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Last run info -->
            <div>
              <p class="text-label-md font-mono text-on-surface-variant mb-2">ÚLTIMA EJECUCIÓN</p>
              <p class="text-headline-md font-sans text-on-surface">
                {{ algoStatus ? formatTS(algoStatus.timestamp) : 'Sin ejecuciones aún' }}
              </p>
              <div v-if="algoStatus" class="mt-3 flex items-center gap-2 text-body-sm text-outline">
                <span class="material-symbols-outlined text-[16px]">
                  {{ algoStatus.status === 'OPTIMAL' || algoStatus.status === 'FEASIBLE' ? 'check_circle' : 'error' }}
                </span>
                {{ algoStatus.message || algoStatus.status }}
              </div>
              <div v-else class="mt-3 flex items-center gap-2 text-body-sm text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px]">schedule</span>
                Configura y ejecuta desde Parámetros
              </div>
            </div>
            <!-- Ocupación global -->
            <div>
              <div class="flex justify-between items-end mb-2">
                <p class="text-label-md font-mono text-on-surface-variant">OCUPACIÓN DEL HORARIO</p>
                <span class="text-headline-sm font-sans text-secondary">{{ ocupacion }}%</span>
              </div>
              <div class="w-full bg-surface-container-highest rounded-full h-2 mb-2 overflow-hidden border border-outline-variant/30 relative">
                <div
                  class="bg-secondary h-2 rounded-full relative progress-shimmer overflow-hidden transition-all duration-700"
                  :style="{ width: ocupacion + '%' }"
                ></div>
              </div>
              <p class="text-[11px] font-mono text-on-surface-variant text-right">
                {{ state.calendario.eventos.length }} / {{ state.calendario.dias.length * state.calendario.horas.length }} bloques
              </p>
            </div>
          </div>
        </div>

        <!-- Terminal footer -->
        <div class="bg-surface-container-lowest border-t border-outline-variant px-6 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-outline text-[16px]">terminal</span>
            <span class="text-[11px] font-mono text-outline">
              SYS_MSG: {{ backendOk ? 'API scheduler disponible.' : 'Inicia el backend con start-api.ps1' }}
            </span>
          </div>
          <button
            @click="emit('goto', 4)"
            class="text-primary hover:text-primary-container text-label-md font-mono underline underline-offset-2"
          >
            Ver Horario
          </button>
        </div>
      </div>

      <!-- ─── Demanda Semanal bar chart (col-4) ─── -->
      <div class="col-span-1 md:col-span-4 bg-surface-container rounded-xl border border-outline-variant p-6 flex flex-col">
        <div class="flex items-center gap-2 mb-6">
          <span class="material-symbols-outlined text-tertiary-fixed-dim text-[20px]">bar_chart</span>
          <h3 class="text-headline-sm font-sans text-on-surface">Demanda Semanal</h3>
        </div>

        <!-- Bars -->
        <div class="flex-1 flex items-end justify-between gap-2 relative mt-auto pt-4">
          <!-- Gridlines -->
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
            <div class="border-b border-outline-variant/20 w-full"></div>
            <div class="border-b border-outline-variant/20 w-full"></div>
            <div class="border-b border-outline-variant/20 w-full"></div>
            <div class="border-b border-outline-variant/20 w-full"></div>
          </div>
          <!-- Each day bar -->
          <div
            v-for="d in demandaData"
            :key="d.label"
            class="flex flex-col items-center gap-2 w-full z-10"
          >
            <div class="w-full bg-surface-container-highest rounded-t-sm h-24 relative group">
              <div
                :style="{ height: (d.pct || 2) + '%' }"
                :class="[
                  'absolute bottom-0 w-full rounded-t-sm transition-all duration-500',
                  d.count > 0 ? 'bg-primary/80 group-hover:bg-primary' : 'bg-surface-container-high'
                ]"
              ></div>
            </div>
            <span class="text-[10px] font-mono text-on-surface-variant">{{ d.label }}</span>
          </div>
        </div>

        <!-- Totals -->
        <div class="mt-4 pt-3 border-t border-outline-variant flex justify-between items-center">
          <span class="text-label-md font-mono text-on-surface-variant">
            Total: {{ state.calendario.eventos.length }} clases
          </span>
          <span class="text-[10px] font-mono text-outline">
            {{ state.calendario.dias.length }} días × {{ state.calendario.horas.length }} bloques
          </span>
        </div>
      </div>

      <!-- ─── Info banner (col-12) ─── -->
      <div class="col-span-1 md:col-span-12 bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-outline text-[18px]">info</span>
          </div>
          <p class="text-body-sm text-on-surface-variant">
            <template v-if="state.calendario.eventos.length">
              Horario generado con {{ state.calendario.eventos.length }} clases distribuidas en {{ state.calendario.dias.length }} días.
              Puedes editarlo en la vista de Calendario.
            </template>
            <template v-else>
              Aún no hay horario generado. Ve a <strong class="text-primary">Parámetros</strong> para configurar y ejecutar el algoritmo.
            </template>
          </p>
        </div>
        <button
          @click="emit('goto', state.calendario.eventos.length ? 4 : 3)"
          class="text-on-surface hover:text-primary transition-colors text-label-md font-mono
                 border border-outline-variant hover:border-primary px-3 py-1.5 rounded-lg
                 bg-surface-container whitespace-nowrap flex-shrink-0"
        >
          {{ state.calendario.eventos.length ? 'Ver Calendario' : 'Ir a Parámetros' }}
        </button>
      </div>

    </div>
  </div>
</template>
