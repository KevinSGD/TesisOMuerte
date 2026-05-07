<script setup>
import { computed, ref } from 'vue'
import { moveEvento, removeEvento, resetCalendar, state, upsertEvento } from '../store/state'

const emit = defineEmits(['toast', 'prev'])

const editMode = ref(false)
const dragOver = ref({ dayIndex: -1, hourIndex: -1 })

const modalOn = ref(false)
const modalEvt = ref(null)

const materiasById = computed(() => Object.fromEntries(state.materias.map((m) => [m.id, m])))
const profesById = computed(() => Object.fromEntries(state.profesores.map((p) => [p.id, p])))

const eventosByCell = computed(() => {
  const map = new Map()
  for (const e of state.calendario.eventos) {
    const key = `${e.dayIndex}:${e.hourIndex}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(e)
  }
  return map
})

function cellKey(d, h) {
  return `${d}:${h}`
}

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
  if (dragOver.value.dayIndex === dayIndex && dragOver.value.hourIndex === hourIndex) {
    dragOver.value = { dayIndex: -1, hourIndex: -1 }
  }
}

function openModal(e) {
  modalEvt.value = { ...e }
  modalOn.value = true
}

function closeModal() {
  modalOn.value = false
  modalEvt.value = null
}

function saveModal() {
  const e = modalEvt.value
  if (!e) return
  if (!e.materiaId) return emit('toast', 'Selecciona una materia.')
  if (!e.profesorId) return emit('toast', 'Selecciona un profesor.')
  if (!e.salon || !String(e.salon).trim()) return emit('toast', 'Ingresa un salón.')
  upsertEvento({
    ...e,
    dayIndex: Number(e.dayIndex),
    hourIndex: Number(e.hourIndex),
    grupo: Number(e.grupo || 1),
  })
  closeModal()
}

function delModal() {
  const e = modalEvt.value
  if (!e) return
  removeEvento(e.id)
  closeModal()
}

const gridStyle = computed(() => {
  const cols = 1 + state.calendario.horas.length
  return {
    gridTemplateColumns: `180px repeat(${cols - 1}, minmax(120px, 1fr))`,
  }
})
</script>

<template>
  <div class="ph">
    <div class="ph-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="1.8" stroke-linecap="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 4v6M16 4v6" />
      </svg>
    </div>
    <div style="flex:1">
      <div class="ph-title">Calendario semanal</div>
      <div class="ph-desc">
        Horas arriba, días a la izquierda. Activa “Editar” para mover clases (drag & drop) o editar datos (materia/profesor/salón).
      </div>
    </div>
    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
      <button class="btn btn-ghost" @click="editMode = !editMode">{{ editMode ? 'Salir de editar' : 'Editar (mover clases)' }}</button>
      <button class="btn btn-danger" @click="resetCalendar">Vaciar calendario</button>
    </div>
  </div>

  <div class="cal-wrap">
    <div class="cal-grid" :style="gridStyle">
      <!-- esquina -->
      <div class="cal-cell cal-head"></div>
      <!-- horas arriba -->
      <div v-for="h in state.calendario.horas" :key="'h_' + h" class="cal-cell cal-head">{{ h }}</div>

      <!-- filas por día -->
      <template v-for="(d, di) in state.calendario.dias" :key="'d_' + d">
        <div class="cal-cell cal-day">{{ d }}</div>
        <div
          v-for="(h, hi) in state.calendario.horas"
          :key="cellKey(di, hi)"
          class="cal-cell"
          :class="{
            'cal-drop': editMode && dragOver.dayIndex === di && dragOver.hourIndex === hi,
          }"
          @dragover="(e) => onDragOver(e, di, hi)"
          @dragleave="() => onDragLeave(di, hi)"
          @drop="(e) => onDrop(e, di, hi)"
        >
          <div v-for="e in eventosByCell.get(cellKey(di, hi)) || []" :key="e.id">
            <div
              class="cal-event"
              :draggable="editMode"
              @dragstart="(ev) => onDragStart(ev, e)"
              @click="openModal(e)"
              :title="editMode ? 'Arrastra para mover / clic para editar' : 'Clic para ver/editar'"
            >
              <strong>
                {{ materiasById[e.materiaId]?.nombre || 'Materia' }}
                <span style="opacity:.55; font-size:.75rem;">G{{ e.grupo || 1 }}</span>
              </strong>
              <div class="cal-meta">{{ profesById[e.profesorId]?.nombre || 'Profesor' }}</div>
              <div class="cal-room">Salón: {{ e.salon }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <div class="nav-row">
    <button class="btn btn-ghost" @click="$emit('prev')">Volver</button>
  </div>

  <!-- Modal -->
  <div
    v-if="modalOn"
    style="
      position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center;
      z-index:300; padding:18px;
    "
    @click.self="closeModal"
  >
    <div class="card" style="width:min(720px, 100%); margin:0;">
      <div class="card-title">Editar clase</div>

      <div class="fg fg-2">
        <div class="fl">
          <label class="lbl">Materia <span class="req">*</span></label>
          <select v-model="modalEvt.materiaId" class="inp">
            <option value="">— Seleccionar —</option>
            <option v-for="m in state.materias" :key="m.id" :value="m.id">
              {{ m.nombre || '(sin nombre)' }}
            </option>
          </select>
        </div>
        <div class="fl">
          <label class="lbl">Profesor <span class="req">*</span></label>
          <select v-model="modalEvt.profesorId" class="inp">
            <option value="">— Seleccionar —</option>
            <option v-for="p in state.profesores" :key="p.id" :value="p.id">
              {{ p.nombre || '(sin nombre)' }}
            </option>
          </select>
        </div>
      </div>

      <div class="fg fg-3" style="margin-top:12px;">
        <div class="fl">
          <label class="lbl">Día <span class="req">*</span></label>
          <select v-model.number="modalEvt.dayIndex" class="inp">
            <option v-for="(d, di) in state.calendario.dias" :key="d" :value="di">{{ d }}</option>
          </select>
        </div>
        <div class="fl">
          <label class="lbl">Hora <span class="req">*</span></label>
          <select v-model.number="modalEvt.hourIndex" class="inp">
            <option v-for="(h, hi) in state.calendario.horas" :key="h" :value="hi">{{ h }}</option>
          </select>
        </div>
        <div class="fl">
          <label class="lbl">Salón <span class="req">*</span></label>
          <input v-model="modalEvt.salon" class="inp" type="text" placeholder="A-101" />
        </div>
      </div>

      <div class="fg fg-2" style="margin-top:12px;">
        <div class="fl">
          <label class="lbl">Grupo</label>
          <input v-model.number="modalEvt.grupo" class="inp" type="number" min="1" max="60" />
        </div>
        <div class="fl">
          <label class="lbl">ID evento</label>
          <input :value="modalEvt.id" class="inp" type="text" disabled />
        </div>
      </div>

      <div class="nav-row">
        <button class="btn btn-danger" @click="delModal">Eliminar</button>
        <button class="btn btn-ghost" @click="closeModal">Cancelar</button>
        <button class="btn btn-primary" @click="saveModal">Guardar</button>
      </div>
    </div>
  </div>
</template>

