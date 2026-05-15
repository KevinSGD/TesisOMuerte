<script setup>
import { computed, ref, watch } from 'vue'
import { moveEvento, removeEvento, resetCalendar, setSalonFilter, state, upsertEvento } from '../store/state'
import { verifySchedule } from '../services/api'

const emit = defineEmits(['toast', 'prev'])

const editMode   = ref(false)
const dragOver   = ref({ dayIndex: -1, hourIndex: -1 })
const modalOn    = ref(false)
const modalEvt   = ref(null)
const verifying  = ref(false)
const conflicts  = ref([])
const showConflicts = ref(false)

// ─── Room filter ───
const salonFilterLocal = ref(state.salonFilter || '')
watch(() => state.salonFilter, v => { salonFilterLocal.value = v || '' })

const uniqueSalones = computed(() => {
  const s = new Set(state.calendario.eventos.map(e => e.salon).filter(Boolean))
  return [...s].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
})

function changeSalonFilter(val) {
  setSalonFilter(val || null)
}

// Events filtered by room
const eventosFiltrados = computed(() =>
  state.salonFilter
    ? state.calendario.eventos.filter(e => e.salon === state.salonFilter)
    : state.calendario.eventos
)

// ─── Lookups ───
const materiasById = computed(() => Object.fromEntries(state.materias.map(m => [m.id, m])))
const profesById   = computed(() => Object.fromEntries(state.profesores.map(p => [p.id, p])))

const eventosByCell = computed(() => {
  const map = new Map()
  for (const e of eventosFiltrados.value) {
    const key = `${e.dayIndex}:${e.hourIndex}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(e)
  }
  return map
})

function cellKey(d, h) { return `${d}:${h}` }

// ─── Drag & drop ───
function onDragStart(evt, e) {
  if (!editMode.value) return
  evt.dataTransfer.setData('text/plain', e.id)
  evt.dataTransfer.effectAllowed = 'move'
}
function onDrop(evt, dayIndex, hourIndex) {
  if (!editMode.value) return
  const id = evt.dataTransfer.getData('text/plain')
  if (!id) return
  moveEvento(id, dayIndex, hourIndex)
  dragOver.value = { dayIndex: -1, hourIndex: -1 }
}
function onDragOver(evt, dayIndex, hourIndex) {
  if (!editMode.value) return
  evt.preventDefault()
  dragOver.value = { dayIndex, hourIndex }
}
function onDragLeave(dayIndex, hourIndex) {
  if (dragOver.value.dayIndex === dayIndex && dragOver.value.hourIndex === hourIndex)
    dragOver.value = { dayIndex: -1, hourIndex: -1 }
}

// ─── Modal ───
function openModal(e) { modalEvt.value = { ...e }; modalOn.value = true }
function closeModal()  { modalOn.value = false; modalEvt.value = null }
function saveModal() {
  const e = modalEvt.value
  if (!e) return
  if (!e.materiaId)                   return emit('toast', 'Selecciona una materia.',  'error')
  if (!e.profesorId)                  return emit('toast', 'Selecciona un profesor.',  'error')
  if (!String(e.salon || '').trim())  return emit('toast', 'Ingresa un salón.',  'error')
  upsertEvento({ ...e, dayIndex: Number(e.dayIndex), hourIndex: Number(e.hourIndex), grupo: Number(e.grupo || 1) })
  closeModal()
}
function delModal() {
  if (!modalEvt.value) return
  removeEvento(modalEvt.value.id)
  closeModal()
}

// ─── Color coding (cyclic by materia) ───
const COLORS = [
  { bg: 'bg-primary/15',   border: 'border-primary/60',   text: 'text-primary' },
  { bg: 'bg-secondary/15', border: 'border-secondary/60', text: 'text-secondary' },
  { bg: 'bg-tertiary/15',  border: 'border-tertiary/60',  text: 'text-tertiary' },
  { bg: 'bg-primary-fixed/10', border: 'border-primary-fixed/60', text: 'text-primary-fixed' },
]
function colorFor(materiaId) {
  const idx = state.materias.findIndex(m => m.id === materiaId)
  return COLORS[Math.abs(idx) % COLORS.length] || COLORS[0]
}

// ─── Stats ───
const statsLine = computed(() => {
  const n   = eventosFiltrados.value.length
  const tot = state.calendario.dias.length * state.calendario.horas.length
  const pct = tot ? Math.round((n / tot) * 100) : 0
  return { n, pct }
})

// ─── Verify conflicts ───
async function verificar() {
  if (!state.calendario.eventos.length) return emit('toast', 'No hay clases para verificar.', 'info')
  verifying.value = true
  conflicts.value = []
  try {
    const result = await verifySchedule(state.calendario.eventos)
    conflicts.value = result.conflicts || []
    showConflicts.value = true
    if (!result.conflicts?.length) {
      emit('toast', 'Sin conflictos detectados ✓', 'success')
    } else {
      emit('toast', `${result.conflicts.length} conflicto(s) detectados`, 'error')
    }
  } catch (e) {
    emit('toast', 'Error al verificar: ' + (e.message || ''), 'error')
  } finally {
    verifying.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">

    <!-- ─── Header bar ─── -->
    <div class="px-4 md:px-margin-desktop py-4 border-b border-outline-variant bg-surface-container-lowest
                flex flex-col gap-3 flex-shrink-0">

      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <h2 class="text-headline-md font-sans font-bold text-on-surface">
              {{ state.salonFilter ? state.salonFilter : 'Horario Global' }}
            </h2>
            <span
              v-if="state.lastRun"
              :class="[
                'text-label-md font-mono px-2.5 py-1 rounded border flex items-center gap-1.5',
                ['OPTIMAL','FEASIBLE'].includes(state.lastRun.status)
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-surface-container-high text-on-surface-variant border-outline-variant'
              ]"
            >
              <span class="material-symbols-outlined text-[14px]">check_circle</span>
              {{ state.lastRun.status }}
            </span>
            <span class="text-label-md font-mono px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded border border-outline-variant">
              {{ statsLine.n }} clases
              <template v-if="state.salonFilter"> · filtrado</template>
            </span>
          </div>
          <p class="text-body-sm text-on-surface-variant mt-0.5">
            {{ editMode ? 'Modo edición — arrastra para mover.' : 'Clic en una clase para editar.' }}
          </p>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Verify -->
          <button
            @click="verificar"
            :disabled="verifying"
            :class="[
              'text-label-md font-mono px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors',
              conflicts.length && showConflicts
                ? 'bg-error/10 border-error/30 text-error'
                : 'bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
            ]"
            title="Verificar conflictos de horario"
          >
            <span v-if="verifying" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            <span v-else class="material-symbols-outlined text-[18px]">fact_check</span>
            {{ verifying ? 'Verificando...' : conflicts.length && showConflicts ? `${conflicts.length} conflictos` : 'Verificar' }}
          </button>

          <!-- Edit mode -->
          <button
            @click="editMode = !editMode"
            :class="[
              'text-label-md font-mono px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors',
              editMode
                ? 'bg-secondary/10 border-secondary text-secondary'
                : 'bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary'
            ]"
          >
            <span class="material-symbols-outlined text-[18px]">{{ editMode ? 'edit_off' : 'edit' }}</span>
            {{ editMode ? 'Salir' : 'Editar' }}
          </button>

          <button
            @click="resetCalendar"
            class="text-label-md font-mono px-4 py-2 rounded-xl border border-error/30 text-error
                   hover:bg-error/10 flex items-center gap-2 transition-colors"
          >
            <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
            Vaciar
          </button>
          <button
            @click="$emit('prev')"
            class="text-label-md font-mono px-4 py-2 rounded-xl border border-outline-variant
                   text-on-surface-variant hover:bg-surface-container-high flex items-center gap-2 transition-colors"
          >
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            Parámetros
          </button>
        </div>
      </div>

      <!-- ─── Room filter bar ─── -->
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-label-md font-mono text-on-surface-variant">Filtrar por salón:</span>
        <select
          :value="salonFilterLocal"
          @change="changeSalonFilter($event.target.value)"
          class="bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5
                 text-label-md font-mono text-on-surface
                 focus:outline-none focus:border-secondary transition-colors"
        >
          <option value="">Todos los salones ({{ state.calendario.eventos.length }})</option>
          <option v-for="s in uniqueSalones" :key="s" :value="s">
            {{ s }} ({{ state.calendario.eventos.filter(e => e.salon === s).length }})
          </option>
        </select>
        <button
          v-if="state.salonFilter"
          @click="changeSalonFilter('')"
          class="text-label-md font-mono text-on-surface-variant hover:text-on-surface flex items-center gap-1
                 bg-surface-container-high border border-outline-variant rounded-lg px-3 py-1.5 transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">close</span>
          Limpiar filtro
        </button>
      </div>

      <!-- ─── Conflicts panel ─── -->
      <div
        v-if="showConflicts && conflicts.length"
        class="bg-error/10 border border-error/30 rounded-xl p-3 space-y-1"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="text-label-md font-mono text-error font-bold">
            {{ conflicts.length }} conflicto(s) detectado(s)
          </span>
          <button @click="showConflicts = false" class="text-error/60 hover:text-error">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        <div v-for="(c, i) in conflicts.slice(0, 5)" :key="i"
             class="flex items-start gap-2 text-[11px] font-mono text-error/80">
          <span class="material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5">
            {{ c.type === 'salon' ? 'meeting_room' : 'person' }}
          </span>
          {{ c.message }}
        </div>
        <p v-if="conflicts.length > 5" class="text-[10px] font-mono text-error/60">
          ... y {{ conflicts.length - 5 }} más
        </p>
      </div>
    </div>

    <!-- ─── Empty state ─── -->
    <div
      v-if="!state.calendario.eventos.length"
      class="flex-1 flex flex-col items-center justify-center text-center p-8"
    >
      <span class="material-symbols-outlined text-outline text-[48px] mb-4">calendar_month</span>
      <h3 class="text-headline-sm font-sans text-on-surface mb-2">Sin horario generado</h3>
      <p class="text-body-sm text-on-surface-variant max-w-sm">
        Ve a Parámetros y ejecuta el algoritmo para generar el horario optimizado.
      </p>
      <button
        @click="$emit('prev')"
        class="mt-6 bg-primary text-background text-label-md font-mono
               px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-fixed transition-colors"
      >
        <span class="material-symbols-outlined text-[18px]">play_arrow</span>
        Ir a Parámetros
      </button>
    </div>

    <!-- ─── Calendar Grid ─── -->
    <div v-else class="flex-1 overflow-auto bg-surface-container-lowest">
      <div class="cal-grid min-w-[700px]">

        <!-- Corner -->
        <div class="bg-surface-container-high border-b border-r border-outline-variant p-2 sticky top-0 left-0 z-30"></div>

        <!-- Day headers -->
        <div
          v-for="(d, di) in state.calendario.dias"
          :key="'dh_' + di"
          class="bg-surface-container-high border-b border-r border-outline-variant p-2
                 text-center text-label-md font-mono text-on-surface sticky top-0 z-20"
        >
          {{ d }}
        </div>

        <!-- Rows per hour -->
        <template v-for="(h, hi) in state.calendario.horas" :key="'hr_' + hi">
          <!-- Hour label -->
          <div
            class="border-b border-r border-outline-variant p-2 text-right text-label-md font-mono
                   text-on-surface-variant bg-surface-container-high sticky left-0 z-10"
          >
            {{ h }}
          </div>

          <!-- Day cells -->
          <div
            v-for="(d, di) in state.calendario.dias"
            :key="cellKey(di, hi)"
            class="border-b border-r border-outline-variant p-1 min-h-[5rem] relative transition-colors"
            :class="{
              'outline-dashed outline-2 outline-secondary/30': editMode && dragOver.dayIndex === di && dragOver.hourIndex === hi,
            }"
            @dragover="e => onDragOver(e, di, hi)"
            @dragleave="() => onDragLeave(di, hi)"
            @drop="e => onDrop(e, di, hi)"
          >
            <!-- Bug fix #7: stack events vertically instead of overlapping -->
            <div class="flex flex-col gap-0.5 h-full">
              <div
                v-for="e in eventosByCell.get(cellKey(di, hi)) || []"
                :key="e.id"
                :draggable="editMode"
                @dragstart="ev => onDragStart(ev, e)"
                @click="openModal(e)"
                :class="[
                  'flex-1 rounded p-1 flex flex-col justify-between cursor-pointer transition-opacity min-h-[1.5rem]',
                  'border',
                  colorFor(e.materiaId).bg,
                  colorFor(e.materiaId).border,
                  'hover:opacity-80',
                  editMode ? 'cursor-grab' : 'cursor-pointer'
                ]"
                :title="editMode ? 'Arrastra para mover · clic para editar' : 'Clic para editar'"
              >
                <span :class="['text-[9px] font-mono font-bold truncate leading-tight', colorFor(e.materiaId).text]">
                  {{ materiasById[e.materiaId]?.nombre || 'Materia' }}
                  <span class="opacity-60">G{{ e.grupo }}</span>
                </span>
                <span class="text-[8px] font-mono text-on-surface-variant/80 truncate leading-tight hidden sm:block">
                  {{ profesById[e.profesorId]?.nombre?.split(' ')[0] || '—' }}
                </span>
                <span class="text-[8px] font-mono text-on-surface-variant/60 truncate leading-tight">
                  {{ e.salon }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ─── Legend ─── -->
    <div
      v-if="state.calendario.eventos.length"
      class="flex-shrink-0 border-t border-outline-variant bg-surface-container-lowest px-4 py-2.5 flex flex-wrap gap-3 items-center"
    >
      <span class="text-label-md font-mono text-on-surface-variant">Materias:</span>
      <div v-for="m in state.materias.slice(0, 8)" :key="m.id" class="flex items-center gap-1.5">
        <div :class="['w-2.5 h-2.5 rounded-sm border', colorFor(m.id).border, colorFor(m.id).bg]"></div>
        <span class="text-[10px] font-mono text-on-surface-variant truncate max-w-[8rem]">{{ m.nombre }}</span>
      </div>
      <span v-if="state.materias.length > 8" class="text-[10px] font-mono text-outline">
        +{{ state.materias.length - 8 }} más
      </span>
    </div>

  </div>

  <!-- ─── Edit Modal ─── -->
  <Teleport to="body">
    <div
      v-if="modalOn"
      class="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-lg bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        <div class="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
          <h3 class="text-headline-sm font-sans text-on-surface">Editar Clase</h3>
          <button @click="closeModal" class="text-on-surface-variant hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 space-y-4" v-if="modalEvt">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Materia</label>
              <select
                v-model="modalEvt.materiaId"
                class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary"
              >
                <option :value="null">— Seleccionar —</option>
                <option v-for="m in state.materias" :key="m.id" :value="m.id">{{ m.nombre || '(sin nombre)' }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Profesor</label>
              <select
                v-model="modalEvt.profesorId"
                class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary"
              >
                <option :value="null">— Seleccionar —</option>
                <option v-for="p in state.profesores" :key="p.id" :value="p.id">{{ p.nombre || '(sin nombre)' }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Día</label>
              <select
                v-model.number="modalEvt.dayIndex"
                class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary"
              >
                <option v-for="(d, di) in state.calendario.dias" :key="d" :value="di">{{ d }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Hora</label>
              <select
                v-model.number="modalEvt.hourIndex"
                class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary"
              >
                <option v-for="(h, hi) in state.calendario.horas" :key="h" :value="hi">{{ h }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Salón</label>
              <input
                v-model="modalEvt.salon"
                type="text" placeholder="Lab 1"
                class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Grupo</label>
            <input
              v-model.number="modalEvt.grupo"
              type="number" min="1" max="60"
              class="w-24 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                     text-body-sm text-on-surface text-center focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        <div class="px-6 py-4 border-t border-outline-variant flex justify-between items-center">
          <button
            @click="delModal"
            class="text-label-md font-mono px-4 py-2 rounded-lg border border-error/30 text-error
                   hover:bg-error/10 flex items-center gap-2 transition-colors"
          >
            <span class="material-symbols-outlined text-[18px]">delete</span>
            Eliminar
          </button>
          <div class="flex gap-2">
            <button
              @click="closeModal"
              class="text-label-md font-mono px-4 py-2 rounded-lg border border-outline-variant
                     text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="saveModal"
              class="text-label-md font-mono px-5 py-2 rounded-lg bg-primary text-background
                     hover:bg-primary-fixed transition-colors flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">save</span>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
