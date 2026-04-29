<script setup>
import { ref, computed } from 'vue'
import { runScheduler } from '../services/api'
import ScheduleCalendar from '../components/ScheduleCalendar.vue'

// ── Estado general ──────────────────────────────────────────────
const useCustomData = ref(false)
const loading = ref(false)
const error = ref('')
const result = ref(null)
const activeTab = ref('config') // 'config' | 'materias' | 'profesores'

// ── Configuración ────────────────────────────────────────────────
const config = ref({
  seed: 42,
  num_profes: 20,
  num_salones_comunes: 8,
  num_salones_pc: 12,
})

// ── Materias ─────────────────────────────────────────────────────
let nextMateriaId = 3
const materias = ref([
  { id: 1, nombre: 'Lógica de Programación', categoria: 'Software', horas: 3, grupos: 2 },
  { id: 2, nombre: 'Ética', categoria: 'Humanidades', horas: 2, grupos: 1 },
])
const CATEGORIAS = ['Software', 'Humanidades', 'Ciencias Básicas']

function addMateria() {
  materias.value.push({ id: nextMateriaId++, nombre: '', categoria: 'Software', horas: 3, grupos: 1 })
}
function removeMateria(idx) {
  const id = materias.value[idx].id
  materias.value.splice(idx, 1)
  // limpiar referencias en profesores
  for (const p of profesores.value) {
    p.materias = p.materias.filter(m => m !== id)
  }
}

// ── Profesores ───────────────────────────────────────────────────
const profesores = ref([
  { nombre: 'Ana García', codigo: 'P001', materias: [1] },
  { nombre: 'Luis Pérez', codigo: 'P002', materias: [2] },
])

function addProfesor() {
  profesores.value.push({ nombre: '', codigo: '', materias: [] })
}
function removeProfesor(idx) {
  profesores.value.splice(idx, 1)
}
function toggleMateria(profIdx, materiaId) {
  const p = profesores.value[profIdx]
  const i = p.materias.indexOf(materiaId)
  if (i === -1) p.materias.push(materiaId)
  else p.materias.splice(i, 1)
}
function profTieneMateria(profIdx, materiaId) {
  return profesores.value[profIdx].materias.includes(materiaId)
}

// ── Validaciones ─────────────────────────────────────────────────
const validationErrors = computed(() => {
  if (!useCustomData.value) return []
  const errs = []
  if (materias.value.length === 0) errs.push('Agrega al menos una materia.')
  if (profesores.value.length === 0) errs.push('Agrega al menos un profesor.')
  for (const m of materias.value) {
    if (!m.nombre.trim()) errs.push(`Una materia no tiene nombre.`)
    const tieneProfe = profesores.value.some(p => p.materias.includes(m.id))
    if (!tieneProfe) errs.push(`"${m.nombre || 'Sin nombre'}" no tiene profesores asignados.`)
  }
  return errs
})

// ── Generación ───────────────────────────────────────────────────
async function generate() {
  if (validationErrors.value.length) return
  loading.value = true
  error.value = ''
  result.value = null

  try {
    const payload = {
      seed: config.value.seed,
      num_profes: useCustomData.value ? profesores.value.length : config.value.num_profes,
      num_salones_comunes: config.value.num_salones_comunes,
      num_salones_pc: config.value.num_salones_pc,
      use_ui_data: useCustomData.value,
      materias: useCustomData.value ? materias.value : [],
      profesores: useCustomData.value ? profesores.value : [],
    }
    result.value = await runScheduler(payload)
  } catch (e) {
    error.value = e.message || 'Error al comunicarse con el servidor.'
  } finally {
    loading.value = false
  }
}

// ── Stats formateadas ─────────────────────────────────────────────
const statsItems = computed(() => {
  if (!result.value) return []
  return [
    { label: 'Estado', value: result.value.status, ok: result.value.ok },
    { label: 'Clases generadas', value: result.value.df_asig_rows ?? '—' },
    { label: 'Mensaje', value: result.value.message ?? '—' },
  ]
})
</script>

<template>
  <div class="gen-layout">
    <!-- ── Panel de configuración ─────────────────────── -->
    <div class="gen-form-col">
      <div class="card">
        <h2 class="section-title">Generador de Horarios</h2>
        <p class="muted">Configura los parámetros y genera el horario académico semanal.</p>

        <!-- Toggle datos -->
        <div class="toggle-row">
          <button
            class="toggle-btn"
            :class="{ active: !useCustomData }"
            @click="useCustomData = false"
          >
            Datos por defecto
          </button>
          <button
            class="toggle-btn"
            :class="{ active: useCustomData }"
            @click="useCustomData = true"
          >
            Datos personalizados
          </button>
        </div>
      </div>

      <!-- ── Tabs de entrada ────────────────── -->
      <div class="card">
        <div class="tabs-row">
          <button class="tab-btn" :class="{ active: activeTab === 'config' }" @click="activeTab = 'config'">
            Configuración
          </button>
          <button
            v-if="useCustomData"
            class="tab-btn"
            :class="{ active: activeTab === 'materias' }"
            @click="activeTab = 'materias'"
          >
            Materias <span class="badge">{{ materias.length }}</span>
          </button>
          <button
            v-if="useCustomData"
            class="tab-btn"
            :class="{ active: activeTab === 'profesores' }"
            @click="activeTab = 'profesores'"
          >
            Profesores <span class="badge">{{ profesores.length }}</span>
          </button>
        </div>

        <!-- Tab: Configuración -->
        <div v-if="activeTab === 'config'" class="tab-content">
          <div class="form-grid">
            <div class="field">
              <label class="label">Semilla (seed)</label>
              <input v-model.number="config.seed" type="number" class="inp" />
              <span class="hint">Controla la aleatoriedad del algoritmo</span>
            </div>
            <div class="field" v-if="!useCustomData">
              <label class="label">Número de profesores</label>
              <input v-model.number="config.num_profes" type="number" min="1" class="inp" />
            </div>
            <div class="field">
              <label class="label">Salones comunes</label>
              <input v-model.number="config.num_salones_comunes" type="number" min="1" class="inp" />
            </div>
            <div class="field">
              <label class="label">Salones PC / laboratorio</label>
              <input v-model.number="config.num_salones_pc" type="number" min="1" class="inp" />
            </div>
          </div>
          <p class="muted hint-box">
            Con datos por defecto se usan 51 materias y {{ config.num_profes }} profesores generados automáticamente.
          </p>
        </div>

        <!-- Tab: Materias -->
        <div v-if="activeTab === 'materias' && useCustomData" class="tab-content">
          <div class="list-header">
            <span class="muted">{{ materias.length }} materia(s)</span>
            <button class="btn-add" @click="addMateria">+ Agregar</button>
          </div>
          <div v-for="(m, idx) in materias" :key="m.id" class="item-row">
            <div class="item-fields">
              <input v-model="m.nombre" class="inp" placeholder="Nombre de la materia" />
              <select v-model="m.categoria" class="sel-inline">
                <option v-for="cat in CATEGORIAS" :key="cat" :value="cat">{{ cat }}</option>
              </select>
              <div class="num-pair">
                <div class="field-sm">
                  <label class="label-sm">Horas/créd.</label>
                  <input v-model.number="m.horas" type="number" min="1" max="4" class="inp-sm" />
                </div>
                <div class="field-sm">
                  <label class="label-sm">Grupos</label>
                  <input v-model.number="m.grupos" type="number" min="1" class="inp-sm" />
                </div>
              </div>
            </div>
            <button class="btn-remove" @click="removeMateria(idx)" title="Eliminar">✕</button>
          </div>
          <p v-if="materias.length === 0" class="muted empty-hint">No hay materias. Agrega al menos una.</p>
        </div>

        <!-- Tab: Profesores -->
        <div v-if="activeTab === 'profesores' && useCustomData" class="tab-content">
          <div class="list-header">
            <span class="muted">{{ profesores.length }} profesor(es)</span>
            <button class="btn-add" @click="addProfesor">+ Agregar</button>
          </div>
          <div v-for="(p, pidx) in profesores" :key="pidx" class="item-row item-row--prof">
            <div class="prof-top">
              <input v-model="p.nombre" class="inp" placeholder="Nombre del profesor" />
              <input v-model="p.codigo" class="inp inp-codigo" placeholder="Código (ej: P001)" />
              <button class="btn-remove" @click="removeProfesor(pidx)" title="Eliminar">✕</button>
            </div>
            <div class="materias-check">
              <span class="label-sm">Puede dictar:</span>
              <div class="check-grid">
                <label
                  v-for="m in materias"
                  :key="m.id"
                  class="check-label"
                  :class="{ checked: profTieneMateria(pidx, m.id) }"
                >
                  <input
                    type="checkbox"
                    class="check-input"
                    :checked="profTieneMateria(pidx, m.id)"
                    @change="toggleMateria(pidx, m.id)"
                  />
                  {{ m.nombre || `Materia ${m.id}` }}
                </label>
              </div>
            </div>
          </div>
          <p v-if="profesores.length === 0" class="muted empty-hint">No hay profesores. Agrega al menos uno.</p>
        </div>
      </div>

      <!-- Errores de validación -->
      <div v-if="validationErrors.length" class="validation-box">
        <p v-for="e in validationErrors" :key="e" class="val-err">⚠ {{ e }}</p>
      </div>

      <!-- Botón generar -->
      <button
        class="btn-generate"
        :disabled="loading || validationErrors.length > 0"
        @click="generate"
      >
        <span v-if="loading" class="spinner" />
        {{ loading ? 'Generando horario...' : 'Generar Horario' }}
      </button>

      <p v-if="error" class="error-text">{{ error }}</p>
    </div>

    <!-- ── Panel de resultados ────────────────────────── -->
    <div v-if="result" class="gen-result-col">
      <!-- Stats -->
      <div class="card stats-card">
        <h3 class="section-title">Resultado</h3>
        <div class="stats-row">
          <div
            v-for="s in statsItems"
            :key="s.label"
            class="stat-item"
            :class="{ 'stat-ok': s.ok === true, 'stat-err': s.ok === false }"
          >
            <span class="stat-label">{{ s.label }}</span>
            <span class="stat-value">{{ s.value }}</span>
          </div>
        </div>
      </div>

      <!-- Calendario semanal -->
      <div class="card">
        <h3 class="section-title">Horario Semanal</h3>
        <ScheduleCalendar :rows="result.horario ?? []" />
      </div>
    </div>

    <!-- Placeholder cuando no hay resultado -->
    <div v-else class="gen-result-col empty-result">
      <div class="empty-card">
        <div class="empty-icon">📅</div>
        <p class="muted">El horario generado aparecerá aquí</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gen-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1100px) {
  .gen-layout {
    grid-template-columns: 1fr;
  }
}

.gen-form-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.gen-result-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Tabs ─────────────────────────────────── */
.tabs-row {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 16px;
  padding-bottom: 0;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--muted);
  padding: 8px 14px;
  cursor: pointer;
  font-size: 0.88rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  border-radius: 6px 6px 0 0;
  transition: color 0.15s;
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}

.badge {
  background: rgba(111, 124, 255, 0.25);
  color: var(--primary);
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 0.72rem;
  margin-left: 4px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Toggle datos ─────────────────────────── */
.toggle-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.toggle-btn {
  flex: 1;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 10px;
  padding: 9px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}
.toggle-btn.active {
  background: rgba(111, 124, 255, 0.2);
  border-color: var(--primary);
  color: var(--text);
  font-weight: 600;
}

/* ── Form fields ──────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.inp {
  background: #0f1022;
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.88rem;
  width: 100%;
}
.inp:focus { outline: none; border-color: var(--primary); }
.hint { color: var(--muted); font-size: 0.75rem; }
.hint-box {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.8rem;
  background: var(--bg-soft);
}

/* ── Lista materias/profesores ────────────── */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn-add {
  background: rgba(111, 124, 255, 0.15);
  border: 1px solid rgba(111, 124, 255, 0.4);
  color: var(--primary);
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.83rem;
  font-weight: 600;
}
.btn-add:hover { background: rgba(111, 124, 255, 0.25); }

.item-row {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px;
  background: var(--bg-soft);
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.item-row--prof { flex-direction: column; }

.item-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sel-inline {
  background: #0f1022;
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 0.85rem;
  cursor: pointer;
}

.num-pair {
  display: flex;
  gap: 8px;
}
.field-sm { display: flex; flex-direction: column; gap: 2px; }
.label-sm { font-size: 0.72rem; color: var(--muted); font-weight: 600; }
.inp-sm {
  background: #0f1022;
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 8px;
  width: 70px;
  font-size: 0.85rem;
}

.btn-remove {
  background: transparent;
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: var(--error);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.8rem;
  flex-shrink: 0;
}
.btn-remove:hover { background: rgba(255, 107, 107, 0.1); }

.empty-hint { font-size: 0.82rem; text-align: center; padding: 8px 0; }

/* ── Profesores ───────────────────────────── */
.prof-top {
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: center;
}
.inp-codigo { max-width: 110px; }

.materias-check {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.check-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--muted);
  cursor: pointer;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 4px 8px;
  transition: all 0.12s;
  user-select: none;
}
.check-label:hover { border-color: var(--primary); color: var(--text); }
.check-label.checked {
  background: rgba(111, 124, 255, 0.15);
  border-color: var(--primary);
  color: var(--text);
}
.check-input { display: none; }

/* ── Validación ───────────────────────────── */
.validation-box {
  border: 1px solid rgba(255, 107, 107, 0.4);
  border-radius: 10px;
  background: rgba(255, 107, 107, 0.08);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.val-err { color: var(--error); font-size: 0.82rem; margin: 0; }

/* ── Botón generar ────────────────────────── */
.btn-generate {
  width: 100%;
  border: 1px solid #6a77ff;
  background: linear-gradient(180deg, #7480ff, #5f6cf0);
  color: white;
  border-radius: 12px;
  padding: 13px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s;
}
.btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Stats resultado ──────────────────────── */
.stats-card { }
.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.stat-item {
  flex: 1;
  min-width: 120px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--bg-soft);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-ok { border-color: rgba(46, 211, 162, 0.4); background: rgba(46, 211, 162, 0.07); }
.stat-err { border-color: rgba(255, 107, 107, 0.4); background: rgba(255, 107, 107, 0.07); }
.stat-label { font-size: 0.75rem; color: var(--muted); }
.stat-value { font-size: 0.95rem; font-weight: 700; }

.section-title { margin: 0 0 6px; font-size: 1rem; }

/* ── Placeholder sin resultado ────────────── */
.empty-result { justify-content: flex-start; }
.empty-card {
  border: 1px dashed var(--line);
  border-radius: 14px;
  padding: 48px 24px;
  text-align: center;
  background: var(--bg-soft);
}
.empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
</style>
