<script setup>
import { computed, ref } from 'vue'
import { state, resetCalendar, setEventos, setLastRun, syncSalones } from '../store/state'
import { runScheduler, saveData } from '../services/api'

const emit = defineEmits(['toast', 'prev', 'next'])

const DAY_MAP = { 'Lunes': 0, 'Martes': 1, 'Miércoles': 2, 'Jueves': 3, 'Viernes': 4 }

function _parseScheduleEvents(records) {
  if (!Array.isArray(records)) return []
  const eventos = []
  const materiasMap   = Object.fromEntries(state.materias.map(m  => [m.nombre,  m.id]))
  const profesoresMap = Object.fromEntries(state.profesores.map(p => [p.nombre,  p.id]))
  for (let i = 0; i < records.length; i++) {
    const r = records[i]
    const dayIndex   = DAY_MAP[r['Día']] ?? 0
    const bloque     = Number(r['Bloque']) || 0
    const materiaId  = materiasMap[r['Materia']] || null
    const profesorId = profesoresMap[r['Profesor']] || null
    const salon      = r['Salón'] || ''

    const cursoStr = String(r['Curso'] || '')
    const gMatch   = cursoStr.match(/G(\d+)/i)
    const grupo    = gMatch ? Number(gMatch[1]) : 1

    if (!materiaId || !profesorId) continue
    eventos.push({
      id: `evt_${i}_${Date.now()}`,
      materiaId, profesorId, salon, grupo, dayIndex,
      hourIndex: bloque,
    })
  }
  return eventos
}

const loading      = ref(false)
const logMessages  = ref([])

function addLog(msg, type = 'info') {
  logMessages.value.unshift({ msg, type, ts: new Date().toLocaleTimeString('es-CO') })
}

const resumen = computed(() => ({
  materias:     state.materias.length,
  profesores:   state.profesores.length,
  asignaciones: state.profesores.filter(p => p.materiaIds?.length > 0).length,
  grupos:       state.materias.reduce((s, m) => s + (Number(m.grupos) || 0), 0),
}))

const listo = computed(() => {
  if (!state.materias.length || !state.profesores.length) return false
  const matsOk  = state.materias.every(m =>
    (m.nombre || '').trim() && Number(m.creditos) > 0 && Number(m.grupos) > 0 && !m.editing)
  const profsOk = state.profesores.every(p =>
    (p.nombre || '').trim() && (p.profesorId || '').trim() && p.materiaIds?.length > 0 && !p.editing)
  return matsOk && profsOk
})

function validarPrevio() {
  if (!state.materias.length)   return 'Registra al menos una materia.'
  if (!state.profesores.length) return 'Configura al menos un profesor.'
  const matsOk = state.materias.every(m =>
    (m.nombre || '').trim() && Number(m.creditos) > 0 && Number(m.grupos) > 0 && !m.editing)
  if (!matsOk) return 'Asegúrate de guardar todas las materias.'
  const profsOk = state.profesores.every(p =>
    (p.nombre || '').trim() && (p.profesorId || '').trim() && p.materiaIds?.length > 0 && !p.editing)
  if (!profsOk) return 'Asegúrate de guardar todos los profesores y asignarles materia.'
  if (!Number(state.tiempoSegundos) || Number(state.tiempoSegundos) < 1)
    return 'Ingresa un tiempo válido en segundos (≥1).'
  return null
}

async function ejecutarAlgoritmo() {
  const err = validarPrevio()
  if (err) return emit('toast', err, 'error')

  loading.value     = true
  logMessages.value = []
  addLog('Iniciando proceso de generación de horarios...', 'info')

  try {
    addLog('Guardando datos en la base de datos...', 'info')
    emit('toast', 'Guardando datos...', 'info')

    const materiaIdToNombre = Object.fromEntries(state.materias.map(m => [m.id, m.nombre]))
    await saveData({
      materias: state.materias.map(m => ({
        nombre: m.nombre, creditos: m.creditos, grupos: m.grupos, categoria: m.categoria,
      })),
      profesores: state.profesores.map(p => ({
        nombre: p.nombre,
        codigo: p.profesorId,
        materia_ids: (p.materiaIds || []).map(id => materiaIdToNombre[id] || id),
        materia_id: materiaIdToNombre[(p.materiaIds || [])[0]] || null,
      })),
      clear_existing: true,
    })
    addLog('✓ Datos guardados exitosamente', 'success')

    addLog(`Ejecutando solver CP-SAT (timeout: ${state.tiempoSegundos}s)...`, 'info')
    emit('toast', 'Ejecutando algoritmo...', 'info')

    const t0 = Date.now()
    const out = await runScheduler({
      seed: 42,
      max_time_seconds: Number(state.tiempoSegundos),
      use_ui_data: true,
      materias: state.materias.map(m => ({
        id: m.id, nombre: m.nombre,
        codigo: `MAT-${String(m.id).padStart(3, '0')}`,
        grupos: m.grupos, horas: m.creditos, categoria: m.categoria,
      })),
      profesores: state.profesores.map(p => ({
        id: p.id, nombre: p.nombre, codigo: p.profesorId,
        materias: p.materiaIds?.length ? p.materiaIds : [],
        max_horas: p.maxHoras || 22,
      })),
    })

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

    if (!out) { addLog('Respuesta inválida del backend.', 'error'); return emit('toast', 'Respuesta inválida.', 'error') }
    if (!['OPTIMAL', 'FEASIBLE'].includes(out.status)) {
      addLog(`Estado: ${out.status} — ${out.message || ''}`, 'error')
      return emit('toast', out.message || `Estado: ${out.status}`, 'error')
    }

    addLog(`✓ Solver completado en ${elapsed}s — Estado: ${out.status}`, 'success')

    const eventos = Array.isArray(out.df_asig_preview) ? _parseScheduleEvents(out.df_asig_preview) : []
    if (!eventos.length) {
      addLog('No se pudieron mapear eventos del resultado.', 'error')
      return emit('toast', 'No se pudo generar el calendario. Revisa la consola.', 'error')
    }

    addLog(`✓ ${eventos.length} clases mapeadas al calendario`, 'success')

    resetCalendar()
    setEventos(eventos)
    setLastRun({
      status: out.status,
      message: out.message || out.status,
      timestamp: new Date().toISOString(),
      elapsed: parseFloat(elapsed),
    })

    emit('toast', `Horario generado: ${eventos.length} clases (${out.status})`, 'success')
    emit('next')
  } catch (e) {
    const msg = e.message || 'No se pudo completar la operación'
    addLog(`Error: ${msg}`, 'error')
    emit('toast', `Error: ${msg}`, 'error')
  } finally {
    loading.value = false
  }
}

// ─── Salon config ───
function handleSyncSalones() {
  syncSalones()
  emit('toast', `Salones sincronizados: ${state.salonesPersonalizados.length} espacios`, 'success')
}

const TIPOS_SALON = ['comun', 'pc']
</script>

<template>
  <div class="px-4 md:px-margin-desktop py-8 max-w-[1024px] mx-auto flex flex-col gap-8">

    <!-- ─── Header ─── -->
    <header>
      <h1 class="text-display-lg-mobile md:text-display-lg font-sans font-bold text-on-surface">
        Parámetros del Algoritmo
      </h1>
      <p class="text-body-md text-on-surface-variant mt-2">
        Configura el tiempo de ejecución, las aulas disponibles y ejecuta el solver de restricciones.
      </p>
    </header>

    <!-- ─── Resumen de datos ─── -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="(val, key) in resumen" :key="key"
        class="bg-surface-container border border-outline-variant rounded-xl p-5
               flex flex-col gap-2 hover:border-primary/40 transition-colors"
      >
        <span class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">{{ key }}</span>
        <span class="text-display-lg font-sans font-bold text-on-surface leading-none">{{ val }}</span>
      </div>
    </div>

    <!-- ─── Configuración de Aulas ─── -->
    <div class="bg-surface-container rounded-xl border-t-2 border-t-secondary border-x border-b border-outline-variant overflow-hidden">
      <div class="p-6 border-b border-outline-variant">
        <h2 class="text-headline-sm font-sans text-on-surface">Configuración de Aulas</h2>
        <p class="text-body-sm text-on-surface-variant mt-1">
          Define el inventario de espacios físicos. Sincroniza para aplicar los cambios al catálogo.
        </p>
      </div>

      <div class="p-6 space-y-6">
        <!-- Config grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Labs (PC)</label>
            <input
              v-model.number="state.salonesConfig.numPC"
              type="number" min="0" max="50"
              class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                     text-headline-sm font-mono text-on-surface text-center
                     focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Salones</label>
            <input
              v-model.number="state.salonesConfig.numComunes"
              type="number" min="0" max="100"
              class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                     text-headline-sm font-mono text-on-surface text-center
                     focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Cap. Lab</label>
            <input
              v-model.number="state.salonesConfig.capPC"
              type="number" min="1" max="200"
              class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                     text-headline-sm font-mono text-on-surface text-center
                     focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Cap. Salón</label>
            <input
              v-model.number="state.salonesConfig.capComun"
              type="number" min="1" max="500"
              class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                     text-headline-sm font-mono text-on-surface text-center
                     focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Cap./Grupo</label>
            <input
              v-model.number="state.salonesConfig.capPorGrupo"
              type="number" min="1" max="200"
              class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5
                     text-headline-sm font-mono text-on-surface text-center
                     focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
              title="Capacidad por grupo (usada para auto-calcular grupos en Materias)"
            />
          </div>
        </div>

        <!-- Sync button -->
        <div class="flex items-center gap-3 flex-wrap">
          <button
            @click="handleSyncSalones"
            class="text-label-md font-mono px-5 py-2.5 rounded-xl border border-secondary/40 text-secondary
                   bg-secondary/10 hover:bg-secondary hover:text-on-secondary flex items-center gap-2 transition-colors"
          >
            <span class="material-symbols-outlined text-[18px]">sync</span>
            Sincronizar Salones
          </button>
          <span class="text-label-md font-mono text-on-surface-variant">
            {{ state.salonesPersonalizados.length }} espacios configurados
          </span>
        </div>

        <!-- Salon list table -->
        <div v-if="state.salonesPersonalizados.length" class="border border-outline-variant rounded-xl overflow-hidden">
          <div class="max-h-56 overflow-y-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-surface-container-high sticky top-0 z-10">
                <tr class="border-b border-outline-variant">
                  <th class="px-4 py-2.5 text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Nombre</th>
                  <th class="px-4 py-2.5 text-label-md font-mono text-on-surface-variant uppercase tracking-wider w-36">Tipo</th>
                  <th class="px-4 py-2.5 text-label-md font-mono text-on-surface-variant uppercase tracking-wider w-32 text-center">Capacidad</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant bg-surface-container-lowest">
                <tr
                  v-for="s in state.salonesPersonalizados"
                  :key="s.nombre"
                  class="hover:bg-surface-container-low/60 transition-colors"
                >
                  <td class="px-4 py-2.5">
                    <span class="text-body-sm text-on-surface font-medium flex items-center gap-2">
                      <span :class="['material-symbols-outlined text-[16px]', s.tipo === 'pc' ? 'text-secondary' : 'text-tertiary']">
                        {{ s.tipo === 'pc' ? 'computer' : 'meeting_room' }}
                      </span>
                      {{ s.nombre }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5">
                    <select
                      v-model="s.tipo"
                      class="bg-surface-container border border-outline-variant rounded px-2 py-1
                             text-label-md font-mono text-on-surface
                             focus:outline-none focus:border-secondary"
                    >
                      <option value="comun">Salón</option>
                      <option value="pc">Lab PC</option>
                    </select>
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <input
                      v-model.number="s.capacidad"
                      type="number" min="1" max="500"
                      class="w-20 bg-surface-container border border-outline-variant rounded px-2 py-1
                             text-label-md font-mono text-on-surface text-center
                             focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p v-else class="text-label-md font-mono text-on-surface-variant">
          Haz clic en "Sincronizar Salones" para generar el catálogo de espacios.
        </p>
      </div>
    </div>

    <!-- ─── Configuración del Solver ─── -->
    <div class="bg-surface-container rounded-xl border-t-2 border-t-primary border-x border-b border-outline-variant overflow-hidden">
      <div class="p-6 border-b border-outline-variant">
        <h2 class="text-headline-sm font-sans text-on-surface">Configuración del Solver</h2>
        <p class="text-body-sm text-on-surface-variant mt-1">
          El solver CP-SAT encontrará la asignación óptima de clases, salones y horarios.
        </p>
      </div>

      <div class="p-6 space-y-6">
        <!-- Tiempo máximo -->
        <div class="max-w-xs">
          <label class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider block mb-2">
            Tiempo máximo de ejecución (segundos)
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="state.tiempoSegundos"
              type="number" min="1" max="600"
              class="w-32 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3
                     text-headline-sm font-mono text-on-surface text-center
                     focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all"
            />
            <div class="space-y-1">
              <p class="text-body-sm text-on-surface-variant">Recomendado: 10–60 segundos</p>
              <p class="text-label-md font-mono text-outline">Más tiempo = mejor solución</p>
            </div>
          </div>
        </div>

        <!-- Presets -->
        <div class="flex flex-wrap gap-2">
          <span class="text-label-md font-mono text-on-surface-variant mr-2 self-center">Presets:</span>
          <button
            v-for="t in [10, 30, 60, 120, 240]" :key="t"
            @click="state.tiempoSegundos = t"
            :class="[
              'text-label-md font-mono px-3 py-1.5 rounded-lg border transition-colors',
              state.tiempoSegundos === t
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary/30 hover:text-on-surface'
            ]"
          >{{ t }}s</button>
        </div>

        <!-- Validation warning -->
        <div
          v-if="!listo"
          class="flex items-start gap-3 bg-error/10 border border-error/30 rounded-xl px-4 py-3"
        >
          <span class="material-symbols-outlined text-error text-[20px] flex-shrink-0 mt-0.5">warning</span>
          <div>
            <p class="text-body-sm text-error font-medium">Datos incompletos</p>
            <ul class="text-label-md font-mono text-error/80 mt-1 space-y-0.5 list-disc list-inside">
              <li v-if="!state.materias.length">Sin materias registradas</li>
              <li v-else-if="state.materias.some(m => m.editing)">Hay materias sin guardar</li>
              <li v-if="!state.profesores.length">Sin profesores registrados</li>
              <li v-else-if="state.profesores.some(p => p.editing)">Hay profesores sin guardar</li>
              <li v-else-if="state.profesores.some(p => !p.materiaIds?.length)">Hay profesores sin materia asignada</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Log de ejecución ─── -->
    <div
      v-if="logMessages.length || loading"
      class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
        <span class="material-symbols-outlined text-outline text-[16px]">terminal</span>
        <span class="text-label-md font-mono text-on-surface-variant">LOG DE EJECUCIÓN</span>
        <div v-if="loading" class="ml-auto flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          <span class="text-label-md font-mono text-primary">Ejecutando...</span>
        </div>
      </div>
      <div class="p-4 space-y-1.5 max-h-48 overflow-y-auto">
        <div
          v-for="(log, i) in logMessages" :key="i"
          :class="[
            'flex items-start gap-2 text-[11px] font-mono',
            log.type === 'error'   ? 'text-error' :
            log.type === 'success' ? 'text-primary' : 'text-on-surface-variant'
          ]"
        >
          <span class="text-outline flex-shrink-0">{{ log.ts }}</span>
          <span>{{ log.msg }}</span>
        </div>
        <div v-if="loading && !logMessages.length" class="text-[11px] font-mono text-on-surface-variant animate-pulse">
          Inicializando...
        </div>
      </div>
    </div>

    <!-- ─── Bottom Actions ─── -->
    <div class="flex justify-between items-center pt-6 border-t border-outline-variant">
      <button
        @click="$emit('prev')"
        :disabled="loading"
        class="text-label-md font-mono px-5 py-2.5 rounded-xl border border-outline-variant
               text-on-surface-variant hover:bg-surface-container-high transition-colors
               flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Profesores
      </button>

      <button
        @click="ejecutarAlgoritmo"
        :disabled="loading || !listo"
        :class="[
          'text-label-md font-mono rounded-xl px-8 py-3 flex items-center gap-3 transition-all',
          loading
            ? 'bg-primary-container/50 text-on-surface-variant cursor-not-allowed'
            : listo
              ? 'bg-primary text-background hover:bg-primary-fixed shadow-[0_0_25px_rgba(78,222,163,0.3)]'
              : 'bg-surface-container-high text-on-surface-variant border border-outline-variant cursor-not-allowed'
        ]"
      >
        <span v-if="loading" class="relative flex h-4 w-4">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span class="relative inline-flex rounded-full h-4 w-4 bg-primary/50"></span>
        </span>
        <span v-else class="material-symbols-outlined text-[20px]">play_arrow</span>
        <span>{{ loading ? 'Ejecutando Algoritmo...' : 'Ejecutar Algoritmo y Ver Horario' }}</span>
      </button>
    </div>

  </div>
</template>
