<script setup>
import { computed, ref } from 'vue'
import { state, resetCalendar, setEventos } from '../store/state'
import { runScheduler, saveData } from '../services/api'

const emit = defineEmits(['toast', 'prev', 'next'])

// Mapeo de días a índices (0=Lunes, 4=Viernes)
const DAY_MAP = {
  'Lunes': 0,
  'Martes': 1,
  'Miércoles': 2,
  'Jueves': 3,
  'Viernes': 4,
}

// Convertir registro del backend a formato de evento del calendario
function _parseScheduleEvents(records) {
  if (!Array.isArray(records)) return []
  
  const eventos = []
  const materiasMap = Object.fromEntries(state.materias.map(m => [m.nombre, m.id]))
  const profesoresMap = Object.fromEntries(state.profesores.map(p => [p.nombre, p.id]))
  
  for (let i = 0; i < records.length; i++) {
    const r = records[i]
    const dayIndex = DAY_MAP[r['Día']] ?? 0
    const bloque = Number(r['Bloque']) || 0
    const materiaId = materiasMap[r['Materia']] || null
    const profesorId = profesoresMap[r['Profesor']] || null
    const salon = r['Salón'] || ''
    const grupo = Number(r['Curso']) || 1
    
    if (!materiaId || !profesorId) continue
    
    eventos.push({
      id: `evt_${i}_${Date.now()}`,
      materiaId,
      profesorId,
      salon,
      grupo,
      dayIndex,
      hourIndex: bloque,
    })
  }
  
  return eventos
}

const loading = ref(false)

const resumen = computed(() => ({
  materias: state.materias.length,
  profesores: state.profesores.length,
  asignaciones: state.profesores.filter((p) => p.materiaId).length,
}))

function validarPrevio() {
  if (!state.materias.length) return 'Registra al menos una materia.'
  if (!state.profesores.length) return 'Configura al menos un profesor.'
  const matsOk = state.materias.every((m) => (m.nombre || '').trim() && Number(m.creditos) > 0 && Number(m.grupos) > 0 && !m.editing)
  if (!matsOk) return 'Asegúrate de guardar todas las materias.'
  const profsOk = state.profesores.every((p) => (p.nombre || '').trim() && (p.profesorId || '').trim() && p.materiaId && !p.editing)
  if (!profsOk) return 'Asegúrate de guardar todos los profesores y asignarles materia.'
  if (!Number(state.tiempoSegundos) || Number(state.tiempoSegundos) < 1) return 'Ingresa un tiempo válido en segundos (≥1).'
  return null
}

async function ejecutarAlgoritmo() {
  const err = validarPrevio()
  if (err) return emit('toast', err)

  loading.value = true
  
  try {
    // Paso 1: Guardar datos en la base de datos
    emit('toast', 'Guardando datos en la base de datos...')
    
    const materias = state.materias.map((m) => ({
      nombre: m.nombre,
      creditos: m.creditos,
      grupos: m.grupos,
      categoria: m.categoria,
    }))

    // Crear mapping de ID a nombre de materia
    const materiaIdToNombre = Object.fromEntries(state.materias.map(m => [m.id, m.nombre]))

    const profesores = state.profesores.map((p) => ({
      nombre: p.nombre,
      codigo: p.profesorId,
      materia_id: materiaIdToNombre[p.materiaId] || p.materiaId, // Usar nombre si existe, sino el ID
    }))

    await saveData({
      materias,
      profesores,
      clear_existing: true, // Limpiar datos previos
    })

    emit('toast', '✓ Datos guardados en la base de datos')

    // Paso 2: Ejecutar el algoritmo
    emit('toast', 'Ejecutando algoritmo de horarios...')

    const payload = {
      seed: 42,
      use_ui_data: true,
      materias: state.materias.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        codigo: `MAT-${String(m.id).padStart(3, '0')}`,
        grupos: m.grupos,
        horas: m.creditos, // el backend convierte horas -> créditos (1..4)
        categoria: m.categoria,
      })),
      profesores: state.profesores.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        codigo: p.profesorId,
        materias: [p.materiaId],
      })),
    }

    const out = await runScheduler(payload)

    if (!out) return emit('toast', 'Respuesta inválida del backend.')
    if (!['OPTIMAL', 'FEASIBLE'].includes(out.status)) {
      return emit('toast', out.message || `Estado: ${out.status}`)
    }

    const eventos = Array.isArray(out.df_asig_preview) ? _parseScheduleEvents(out.df_asig_preview) : []
    if (!eventos.length) {
      if (out.df_asig_preview) {
        console.warn('No se pudieron mapear eventos. Datos recibidos:', out.df_asig_preview)
      }
      return emit('toast', 'No se pudo generar el calendario desde la respuesta del backend.')
    }

    resetCalendar()
    setEventos(eventos)
    emit('toast', `✓ Horario generado con ${eventos.length} clases`)
    emit('next')
  } catch (e) {
    emit('toast', `Error: ${e.message || 'No se pudo completar la operación'}`)
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div class="ph">
    <div class="ph-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="1.8" stroke-linecap="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    </div>
    <div>
      <div class="ph-title">Parámetros</div>
      <div class="ph-desc">Ingresa el tiempo en segundos. Luego genera (demo) o importa el resultado de tu algoritmo para ver el calendario.</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Resumen</div>
    <div class="fg fg-3">
      <div class="card" style="margin:0; text-align:center;">
        <div style="font-family:var(--mono); font-size:2rem; font-weight:800; color:var(--cyan); line-height:1;">
          {{ resumen.materias }}
        </div>
        <div style="font-size:.72rem; color:var(--t3); text-transform:uppercase; letter-spacing:.08em; font-family:var(--mono);">
          Materias
        </div>
      </div>
      <div class="card" style="margin:0; text-align:center;">
        <div style="font-family:var(--mono); font-size:2rem; font-weight:800; color:var(--cyan); line-height:1;">
          {{ resumen.profesores }}
        </div>
        <div style="font-size:.72rem; color:var(--t3); text-transform:uppercase; letter-spacing:.08em; font-family:var(--mono);">
          Profesores
        </div>
      </div>
      <div class="card" style="margin:0; text-align:center;">
        <div style="font-family:var(--mono); font-size:2rem; font-weight:800; color:var(--cyan); line-height:1;">
          {{ resumen.asignaciones }}
        </div>
        <div style="font-size:.72rem; color:var(--t3); text-transform:uppercase; letter-spacing:.08em; font-family:var(--mono);">
          Asignaciones
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Tiempo de ejecución</div>
    <div style="max-width:420px">
      <div class="fl">
        <label class="lbl">Tiempo máximo (segundos) <span class="req">*</span></label>
        <input v-model.number="state.tiempoSegundos" class="inp" type="number" min="1" placeholder="10" />
        <span style="font-size:.73rem;color:var(--t3);margin-top:3px;">
          Aquí solo guardamos el parámetro; la conexión al solver la puedes hacer después.
        </span>
      </div>
    </div>
  </div>

  <div class="nav-row">
    <button class="btn btn-ghost" @click="$emit('prev')">Volver</button>
    <button class="btn btn-primary" :disabled="loading" @click="ejecutarAlgoritmo">
      <span v-if="loading" class="spinner"></span>
      {{ loading ? 'Ejecutando...' : 'Ejecutar algoritmo y ver calendario' }}
    </button>
  </div>
</template>

<style scoped>
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>

