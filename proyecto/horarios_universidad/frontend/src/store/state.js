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
  // salonFilter is session-only (not persisted)
  salonFilter: null,
  lastRun: null,
  // Classroom configuration (persisted)
  salonesConfig: {
    numComunes: 8,
    numPC: 12,
    capComun: 40,
    capPC: 30,
    capPorGrupo: 30, // used for auto-group calculation
  },
  salonesPersonalizados: [], // [{nombre, tipo:'comun'|'pc', capacidad}]
  calendario: {
    dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    horas: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
    eventos: [],
  },
}

const loaded = loadState()

// ─── Migrations for existing localStorage data ───
if (loaded) {
  // materiaId (single) → materiaIds (array)
  if (loaded.profesores) {
    for (const p of loaded.profesores) {
      if (!p.materiaIds) {
        p.materiaIds = p.materiaId ? [p.materiaId] : []
      }
      // Add maxHoras if missing
      if (p.maxHoras === undefined) p.maxHoras = 22
    }
  }
  // Add demanda + autoGrupos to existing materias
  if (loaded.materias) {
    for (const m of loaded.materias) {
      if (m.demanda === undefined)    m.demanda = 0
      if (m.autoGrupos === undefined) m.autoGrupos = false
    }
  }
  // Add salonesConfig if missing
  if (!loaded.salonesConfig) {
    loaded.salonesConfig = { ...defaults.salonesConfig }
  } else {
    // Fill missing keys
    for (const k of Object.keys(defaults.salonesConfig)) {
      if (loaded.salonesConfig[k] === undefined)
        loaded.salonesConfig[k] = defaults.salonesConfig[k]
    }
  }
  if (!loaded.salonesPersonalizados) {
    loaded.salonesPersonalizados = []
  }
  // salonFilter is transient — always reset on load
  loaded.salonFilter = null
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
      // salonFilter intentionally NOT saved (transient)
      lastRun: state.lastRun,
      salonesConfig: state.salonesConfig,
      salonesPersonalizados: state.salonesPersonalizados,
      calendario: state.calendario,
    })
  },
  { deep: true },
)

// ─── Materias ───

export function ensureMateriasCount(n) {
  const target = Math.max(0, Number(n) || 0)
  while (state.materias.length < target) {
    state.materias.push({
      id: nextId('nextMatId'),
      nombre: '',
      creditos: 3,
      grupos: 1,
      categoria: 'Software',
      demanda: 0,
      autoGrupos: false,
      editing: true,
    })
  }
  while (state.materias.length > target) {
    state.materias.pop()
  }
}

export function addMateria() {
  state.materias.push({
    id: nextId('nextMatId'),
    nombre: '',
    creditos: 3,
    grupos: 1,
    categoria: 'Software',
    demanda: 0,
    autoGrupos: false,
    editing: true,
  })
}

export function removeMateria(id) {
  state.materias = state.materias.filter((m) => m.id !== id)
  for (const p of state.profesores) {
    p.materiaIds = (p.materiaIds || []).filter((mid) => mid !== id)
  }
}

// ─── Profesores ───

export function ensureProfesoresCount(n) {
  const target = Math.max(0, Number(n) || 0)
  while (state.profesores.length < target) {
    state.profesores.push({
      id: nextId('nextProfId'),
      nombre: '',
      profesorId: '',
      materiaIds: [],
      maxHoras: 22,
      editing: true,
    })
  }
  while (state.profesores.length > target) {
    state.profesores.pop()
  }
}

export function addProfesor() {
  state.profesores.push({
    id: nextId('nextProfId'),
    nombre: '',
    profesorId: '',
    materiaIds: [],
    maxHoras: 22,
    editing: true,
  })
}

export function removeProfesor(id) {
  state.profesores = state.profesores.filter((p) => p.id !== id)
}

// ─── Salones ───

/** Regenerate salonesPersonalizados from salonesConfig, preserving existing customizations */
export function syncSalones() {
  const { numComunes, numPC, capComun, capPC } = state.salonesConfig
  const existing = {}
  for (const s of state.salonesPersonalizados) {
    existing[s.nombre] = s
  }
  const newList = []
  for (let i = 1; i <= numPC; i++) {
    const nombre = `Lab ${i}`
    newList.push(existing[nombre] ?? { nombre, tipo: 'pc', capacidad: capPC })
  }
  for (let i = 1; i <= numComunes; i++) {
    const nombre = `Salon ${i}`
    newList.push(existing[nombre] ?? { nombre, tipo: 'comun', capacidad: capComun })
  }
  state.salonesPersonalizados = newList
}

// ─── Navigation & filter ───

export function setStep(n)          { state.step = n }
export function setSalonFilter(s)   { state.salonFilter = s || null }

// ─── Calendar ───

export function resetCalendar()    { state.calendario.eventos = [] }
export function setEventos(evts)   { state.calendario.eventos = evts }
export function setLastRun(result) { state.lastRun = result }

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

export function generateDemoSchedule() {
  const eventos = []
  const dias  = state.calendario.dias.length
  const horas = state.calendario.horas.length

  const mats  = state.materias.filter((m) => (m.nombre || '').trim())
  const profs = state.profesores.filter((p) => (p.nombre || '').trim())
  if (!mats.length || !profs.length) return []

  let k = 0
  for (const m of mats) {
    const grupos = Math.max(1, Number(m.grupos) || 1)
    for (let g = 1; g <= grupos; g++) {
      const p = profs[k % profs.length]
      eventos.push({
        id: `evt_demo_${m.id}_${p.id}_${g}_${k}`,
        materiaId: m.id,
        profesorId: p.id,
        salon: `A-${(k % 20) + 101}`,
        grupo: g,
        dayIndex: k % dias,
        hourIndex: (k * 2) % horas,
      })
      k++
    }
  }
  return eventos
}
