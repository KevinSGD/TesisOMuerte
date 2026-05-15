import { reactive, watch } from 'vue'
import { loadState, saveState } from '../lib/storage'

function nextId(key) {
  state[key] = Math.max(1, Number(state[key] || 1))
  const id = state[key]
  state[key] += 1
  return id
}

const defaults = {
  step: 0,
  nextMatId: 1,
  nextProfId: 1,
  materias: [],
  profesores: [],
  tiempoSegundos: 10,
  salonFilter: null,
  lastRun: null, // { status, message, timestamp, elapsed }
  calendario: {
    dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    horas: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
    eventos: [],
  },
}

const loaded = loadState()

// Migrate existing data: materiaId (single) → materiaIds (array)
if (loaded?.profesores) {
  for (const p of loaded.profesores) {
    if (!p.materiaIds) {
      p.materiaIds = p.materiaId ? [p.materiaId] : []
    }
  }
}

export const state = reactive({
  ...defaults,
  ...(loaded ?? {}),
})

watch(
  state,
  () => {
    saveState({
      step: state.step,
      nextMatId: state.nextMatId,
      nextProfId: state.nextProfId,
      materias: state.materias,
      profesores: state.profesores,
      tiempoSegundos: state.tiempoSegundos,
      salonFilter: state.salonFilter,
      lastRun: state.lastRun,
      calendario: state.calendario,
    })
  },
  { deep: true },
)

export function ensureMateriasCount(n) {
  const target = Math.max(0, Number(n) || 0)
  while (state.materias.length < target) {
    state.materias.push({
      id: nextId('nextMatId'),
      nombre: '',
      creditos: 3,
      grupos: 1,
      categoria: 'Software',
      editing: true,
    })
  }
  while (state.materias.length > target) {
    state.materias.pop()
  }
}

export function ensureProfesoresCount(n) {
  const target = Math.max(0, Number(n) || 0)
  while (state.profesores.length < target) {
    state.profesores.push({
      id: nextId('nextProfId'),
      nombre: '',
      profesorId: '',
      materiaIds: [],
      editing: true,
    })
  }
  while (state.profesores.length > target) {
    state.profesores.pop()
  }
}

export function addMateria() {
  state.materias.push({
    id: nextId('nextMatId'),
    nombre: '',
    creditos: 3,
    grupos: 1,
    categoria: 'Software',
    editing: true,
  })
}

export function removeMateria(id) {
  state.materias = state.materias.filter((m) => m.id !== id)
  for (const p of state.profesores) {
    p.materiaIds = (p.materiaIds || []).filter((mid) => mid !== id)
  }
}

export function addProfesor() {
  state.profesores.push({
    id: nextId('nextProfId'),
    nombre: '',
    profesorId: '',
    materiaIds: [],
    editing: true,
  })
}

export function removeProfesor(id) {
  state.profesores = state.profesores.filter((p) => p.id !== id)
}

export function setStep(n) {
  state.step = n
}

export function setSalonFilter(salon) {
  state.salonFilter = salon || null
}

export function resetCalendar() {
  state.calendario.eventos = []
}

export function setEventos(eventos) {
  state.calendario.eventos = eventos
}

export function upsertEvento(evento) {
  const idx = state.calendario.eventos.findIndex((e) => e.id === evento.id)
  if (idx >= 0) state.calendario.eventos[idx] = evento
  else state.calendario.eventos.push(evento)
}

export function moveEvento(eventoId, dayIndex, hourIndex) {
  const e = state.calendario.eventos.find((x) => x.id === eventoId)
  if (!e) return
  e.dayIndex = dayIndex
  e.hourIndex = hourIndex
}

export function removeEvento(eventoId) {
  state.calendario.eventos = state.calendario.eventos.filter((e) => e.id !== eventoId)
}

export function setLastRun(result) {
  state.lastRun = result
}

export function generateDemoSchedule() {
  const eventos = []
  const dias = state.calendario.dias.length
  const horas = state.calendario.horas.length

  const mats = state.materias.filter((m) => (m.nombre || '').trim())
  const profs = state.profesores.filter((p) => (p.nombre || '').trim())
  if (!mats.length || !profs.length) return []

  let k = 0
  for (const m of mats) {
    const grupos = Math.max(1, Number(m.grupos) || 1)
    for (let g = 1; g <= grupos; g++) {
      const p = profs[k % profs.length]
      const dayIndex = k % dias
      const hourIndex = (k * 2) % horas
      eventos.push({
        id: `evt_demo_${m.id}_${p.id}_${g}_${k}`,
        materiaId: m.id,
        profesorId: p.id,
        salon: `A-${(k % 20) + 101}`,
        grupo: g,
        dayIndex,
        hourIndex,
      })
      k++
    }
  }
  return eventos
}
