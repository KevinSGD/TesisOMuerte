<script setup>
import { computed, ref } from 'vue'
import { moveEvento, removeEvento, resetCalendar, state, upsertEvento } from '../store/state'

const emit = defineEmits(['toast', 'prev'])

const editMode = ref(false)
const dragOver = ref({ dayIndex: -1, hourIndex: -1 })
const modalOn  = ref(false)
const modalEvt = ref(null)

const materiasById = computed(() => Object.fromEntries(state.materias.map(m => [m.id, m])))
const profesById   = computed(() => Object.fromEntries(state.profesores.map(p => [p.id, p])))

const eventosByCell = computed(() => {
  const map = new Map()
  for (const e of state.calendario.eventos) {
    const key = `${e.dayIndex}:${e.hourIndex}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(e)
  }
  return map
})

function cellKey(d, h) { return `${d}:${h}` }

// Drag & drop
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

// Modal
function openModal(e) { modalEvt.value = { ...e }; modalOn.value = true }
function closeModal()  { modalOn.value = false; modalEvt.value = null }
function saveModal() {
  const e = modalEvt.value
  if (!e) return
  if (!e.materiaId)              return emit('toast', 'Selecciona una materia.',  'error')
  if (!e.profesorId)             return emit('toast', 'Selecciona un profesor.',  'error')
  if (!String(e.salon || '').trim()) return emit('toast', 'Ingresa un salón.',  'error')
  upsertEvento({ ...e, dayIndex: Number(e.dayIndex), hourIndex: Number(e.hourIndex), grupo: Number(e.grupo || 1) })
  closeModal()
}
function delModal() {
  if (!modalEvt.value) return
  removeEvento(modalEvt.value.id)
  closeModal()
}

// Color coding por materia (cyclic)
const COLORS = [
  { bg: 'bg-primary-container/20',   border: 'border-primary',   text: 'text-primary' },
  { bg: 'bg-secondary-container/20', border: 'border-secondary', text: 'text-secondary' },
  { bg: 'bg-tertiary-container/20',  border: 'border-tertiary',  text: 'text-tertiary' },
  { bg: 'bg-primary-fixed/10',       border: 'border-primary-fixed', text: 'text-primary-fixed' },
]
function colorFor(materiaId) {
  const idx = state.materias.findIndex(m => m.id === materiaId)
  return COLORS[Math.abs(idx) % COLORS.length] || COLORS[0]
}

// Stats
const statsLine = computed(() => {
  const n = state.calendario.eventos.length
  const dias = state.calendario.dias.length
  const horas = state.calendario.horas.length
  const pct = dias && horas ? Math.round((n / (dias * horas)) * 100) : 0
  return { n, pct }
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">

    <!-- ─── Header bar ─── -->
    <div class="px-4 md:px-margin-desktop py-6 border-b border-outline-variant bg-surface-container-lowest
                flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-headline-md font-sans font-bold text-on-surface">Horario Global</h2>
          <!-- Status badge -->
          <span
            v-if="state.lastRun"
            :class="[
              'text-label-md font-mono px-2.5 py-1 rounded border flex items-center gap-1.5',
              state.lastRun.status === 'OPTIMAL' || state.lastRun.status === 'FEASIBLE'
                ? 'bg-primary-container text-on-primary-container border-primary'
                : 'bg-surface-container-high text-on-surface-variant border-outline-variant'
            ]"
          >
            <span class="material-symbols-outlined text-[14px]">check_circle</span>
            {{ state.lastRun.status }}
          </span>
          <span class="text-label-md font-mono px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded border border-outline-variant">
            {{ statsLine.n }} clases · {{ statsLine.pct }}%
          </span>
        </div>
        <p class="text-body-sm text-on-surface-variant mt-1">
          Resultado del algoritmo CP-SAT. {{ editMode ? 'Modo edición activo — arrastra para mover clases.' : 'Clic en una clase para editarla.' }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 flex-wrap">
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
          {{ editMode ? 'Salir de editar' : 'Editar clases' }}
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

    <!-- ─── Empty state ─── -->
    <div
      v-if="!state.calendario.eventos.length"
      class="flex-1 flex flex-col items-center justify-center text-center p-8"
    >
      <div class="relative w-24 h-24 mb-6 flex items-center justify-center">
        <div class="absolute inset-0 bg-outline/10 rounded-full blur-xl"></div>
        <span class="material-symbols-outlined text-outline text-[48px] relative">calendar_month</span>
      </div>
      <h3 class="text-headline-sm font-sans text-on-surface mb-2">Sin horario generado</h3>
      <p class="text-body-sm text-on-surface-variant max-w-sm">
        Ve a Parámetros y ejecuta el algoritmo para generar el horario optimizado.
      </p>
      <button
        @click="$emit('prev')"
        class="mt-6 bg-primary-container text-on-primary-container text-label-md font-mono
               px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary transition-colors"
      >
        <span class="material-symbols-outlined text-[18px]">play_arrow</span>
        Ir a Parámetros
      </button>
    </div>

    <!-- ─── Calendar Grid ─── -->
    <div v-else class="flex-1 overflow-auto bg-surface-container-lowest">
      <div class="cal-grid min-w-[700px]">

        <!-- Corner cell -->
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
          <!-- Hour label (sticky left) -->
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
            class="border-b border-r border-outline-variant p-1 h-20 relative transition-colors"
            :class="{
              'bg-surface-container-lowest': !eventosByCell.get(cellKey(di, hi))?.length,
              'outline-dashed outline-2 outline-secondary/30': editMode && dragOver.dayIndex === di && dragOver.hourIndex === hi,
            }"
            @dragover="e => onDragOver(e, di, hi)"
            @dragleave="() => onDragLeave(di, hi)"
            @drop="e => onDrop(e, di, hi)"
          >
            <!-- Events in this cell -->
            <div
              v-for="e in eventosByCell.get(cellKey(di, hi)) || []"
              :key="e.id"
              :draggable="editMode"
              @dragstart="ev => onDragStart(ev, e)"
              @click="openModal(e)"
              :class="[
                'absolute inset-1 rounded p-1 flex flex-col justify-between cursor-pointer transition-all',
                colorFor(e.materiaId).bg,
                'border', colorFor(e.materiaId).border,
                'hover:opacity-90'
              ]"
              :title="editMode ? 'Arrastra para mover · clic para editar' : 'Clic para editar'"
            >
              <span :class="['text-[10px] font-mono font-bold truncate', colorFor(e.materiaId).text]">
                {{ materiasById[e.materiaId]?.nombre || 'Materia' }}
                <span class="opacity-60">G{{ e.grupo || 1 }}</span>
              </span>
              <span class="text-[9px] font-mono text-on-surface-variant truncate">
                {{ profesById[e.profesorId]?.nombre || 'Profesor' }}
              </span>
              <span class="text-[9px] font-mono text-on-surface-variant/70 truncate">
                {{ e.salon }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ─── Legend ─── -->
    <div
      v-if="state.calendario.eventos.length"
      class="flex-shrink-0 border-t border-outline-variant bg-surface-container-lowest px-4 py-3 flex flex-wrap gap-3 items-center"
    >
      <span class="text-label-md font-mono text-on-surface-variant mr-2">Materias:</span>
      <div
        v-for="m in state.materias.slice(0, 8)" :key="m.id"
        class="flex items-center gap-1.5"
      >
        <div :class="['w-2.5 h-2.5 rounded-full border', colorFor(m.id).border, colorFor(m.id).bg]"></div>
        <span class="text-[10px] font-mono text-on-surface-variant">{{ m.nombre }}</span>
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
        <!-- Modal header -->
        <div class="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
          <h3 class="text-headline-sm font-sans text-on-surface">Editar Clase</h3>
          <button @click="closeModal" class="text-on-surface-variant hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Modal body -->
        <div class="p-6 space-y-4" v-if="modalEvt">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Materia</label>
              <select
                v-model="modalEvt.materiaId"
                class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
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
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
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
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
              >
                <option v-for="(d, di) in state.calendario.dias" :key="d" :value="di">{{ d }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Hora</label>
              <select
                v-model.number="modalEvt.hourIndex"
                class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
              >
                <option v-for="(h, hi) in state.calendario.horas" :key="h" :value="hi">{{ h }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Salón</label>
              <input
                v-model="modalEvt.salon"
                type="text" placeholder="A-101"
                class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                       text-body-sm text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Grupo</label>
            <input
              v-model.number="modalEvt.grupo"
              type="number" min="1" max="60"
              class="w-24 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                     text-body-sm text-on-surface text-center focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
            />
          </div>
        </div>

        <!-- Modal footer -->
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
              class="text-label-md font-mono px-5 py-2 rounded-lg bg-primary-container text-on-primary-container
                     hover:bg-primary transition-colors flex items-center gap-2"
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
