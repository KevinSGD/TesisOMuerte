<script setup>
import { ref, computed } from 'vue'
import { runScheduler } from '../services/api'
import WeeklyCalendar from '../components/WeeklyCalendar.vue'

// ── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ['Configuración', 'Materias', 'Profesores', 'Generar']
const step = ref(0)
function goStep(n) { step.value = n }

// ── Config ───────────────────────────────────────────────────────────────────
const config = ref({ seed: 42, num_salones_comunes: 10, num_salones_pc: 6 })

// ── Materias ─────────────────────────────────────────────────────────────────
const CATEGORIAS = ['Software', 'Humanidades', 'Ciencias Básicas', 'Infraestructura']
const materias = ref([
  { id: 1, nombre: 'Lógica de Programación', categoria: 'Software', horas: 3, grupos: 2 },
  { id: 2, nombre: 'Ética Profesional', categoria: 'Humanidades', horas: 2, grupos: 1 },
])
let nextMateriaId = 3

const newMateria = ref({ nombre: '', categoria: 'Software', horas: 3, grupos: 1 })
const materiaError = ref('')

function addMateria() {
  if (!newMateria.value.nombre.trim()) { materiaError.value = 'El nombre es requerido.'; return }
  materiaError.value = ''
  materias.value.push({ ...newMateria.value, id: nextMateriaId++ })
  newMateria.value = { nombre: '', categoria: 'Software', horas: 3, grupos: 1 }
}

function removeMateria(id) {
  materias.value = materias.value.filter(m => m.id !== id)
  profesores.value.forEach(p => { p.materias = p.materias.filter(mid => mid !== id) })
}

// ── Profesores ───────────────────────────────────────────────────────────────
const profesores = ref([
  { nombre: 'Ana García', codigo: 'P001', materias: [1] },
  { nombre: 'Luis Pérez', codigo: 'P002', materias: [2] },
])
const newProfesor = ref({ nombre: '', codigo: '', materias: [] })
const profesorError = ref('')

function addProfesor() {
  if (!newProfesor.value.nombre.trim()) { profesorError.value = 'El nombre es requerido.'; return }
  profesorError.value = ''
  profesores.value.push({ ...newProfesor.value, materias: [...newProfesor.value.materias] })
  newProfesor.value = { nombre: '', codigo: '', materias: [] }
}

function removeProfesor(idx) { profesores.value.splice(idx, 1) }

function toggleMateriaProfesor(profe, mid) {
  const i = profe.materias.indexOf(mid)
  if (i >= 0) profe.materias.splice(i, 1)
  else profe.materias.push(mid)
}

function toggleNewProfesorMateria(mid) {
  const i = newProfesor.value.materias.indexOf(mid)
  if (i >= 0) newProfesor.value.materias.splice(i, 1)
  else newProfesor.value.materias.push(mid)
}

// ── Run ──────────────────────────────────────────────────────────────────────
const loading = ref(false)
const error = ref('')
const result = ref(null)

async function execute() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const useUi = materias.value.length > 0 && profesores.value.length > 0
    const payload = {
      ...config.value,
      use_ui_data: useUi,
      materias: useUi ? materias.value : [],
      profesores: useUi ? profesores.value : [],
    }
    result.value = await runScheduler(payload)
  } catch (e) {
    error.value = e.message || 'Error al generar horario'
  } finally {
    loading.value = false
  }
}

const calendarData = computed(() => result.value?.df_asig_preview ?? [])

const statusClass = computed(() => {
  const s = result.value?.status
  if (s === 'OPTIMAL' || s === 'FEASIBLE') return 'status--ok'
  if (s === 'INFEASIBLE') return 'status--error'
  return 'status--warn'
})

const materiaById = computed(() => Object.fromEntries(materias.value.map(m => [m.id, m.nombre])))
</script>

<template>
  <div class="scheduler">

    <!-- Step tabs -->
    <div class="stepper">
      <button
        v-for="(label, i) in STEPS"
        :key="i"
        class="step-btn"
        :class="{ 'step-btn--active': step === i, 'step-btn--done': step > i }"
        @click="goStep(i)"
      >
        <span class="step-num">{{ step > i ? '✓' : i + 1 }}</span>
        <span class="step-label">{{ label }}</span>
      </button>
    </div>

    <!-- ── Step 0: Configuración ────────────────────────────────────────────── -->
    <div v-show="step === 0" class="card">
      <h2>Configuración general</h2>
      <p class="muted">Parámetros del solver y recursos disponibles.</p>

      <div class="form-grid">
        <div class="field">
          <label class="label">Semilla aleatoria</label>
          <input v-model.number="config.seed" type="number" min="0" class="inp" />
          <span class="hint">Controla la aleatorización inicial de datos.</span>
        </div>
        <div class="field">
          <label class="label">Salones comunes</label>
          <div class="range-row">
            <input v-model.number="config.num_salones_comunes" type="range" min="1" max="30" class="range" />
            <span class="range-val">{{ config.num_salones_comunes }}</span>
          </div>
        </div>
        <div class="field">
          <label class="label">Salones PC / Laboratorios</label>
          <div class="range-row">
            <input v-model.number="config.num_salones_pc" type="range" min="1" max="20" class="range" />
            <span class="range-val">{{ config.num_salones_pc }}</span>
          </div>
        </div>
      </div>

      <div class="config-summary">
        <div class="summary-chip">Semilla: <strong>{{ config.seed }}</strong></div>
        <div class="summary-chip">Comunes: <strong>{{ config.num_salones_comunes }}</strong></div>
        <div class="summary-chip">PC: <strong>{{ config.num_salones_pc }}</strong></div>
        <div class="summary-chip">Total salones: <strong>{{ config.num_salones_comunes + config.num_salones_pc }}</strong></div>
      </div>

      <div class="actions-row">
        <button class="btn-primary" @click="goStep(1)">Siguiente → Materias</button>
      </div>
    </div>

    <!-- ── Step 1: Materias ─────────────────────────────────────────────────── -->
    <div v-show="step === 1" class="card">
      <h2>Materias <span class="badge">{{ materias.length }}</span></h2>
      <p class="muted">Agrega las asignaturas que se incluirán en el horario.</p>

      <!-- Add form -->
      <div class="add-form">
        <div class="add-form-grid">
          <div class="field">
            <label class="label">Nombre</label>
            <input v-model="newMateria.nombre" type="text" class="inp" placeholder="ej. Cálculo I" @keyup.enter="addMateria" />
          </div>
          <div class="field">
            <label class="label">Categoría</label>
            <select v-model="newMateria.categoria" class="inp">
              <option v-for="c in CATEGORIAS" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="field field--sm">
            <label class="label">Horas / créditos</label>
            <input v-model.number="newMateria.horas" type="number" min="1" max="4" class="inp" />
          </div>
          <div class="field field--sm">
            <label class="label">Grupos</label>
            <input v-model.number="newMateria.grupos" type="number" min="1" max="10" class="inp" />
          </div>
        </div>
        <p v-if="materiaError" class="error-text">{{ materiaError }}</p>
        <button class="btn-add" @click="addMateria">+ Agregar materia</button>
      </div>

      <!-- List -->
      <div v-if="materias.length === 0" class="empty-list">No hay materias. Agrega al menos una.</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Categoría</th><th>Horas</th><th>Grupos</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in materias" :key="m.id">
            <td class="td-id">{{ m.id }}</td>
            <td>{{ m.nombre }}</td>
            <td><span class="tag" :class="`tag--${m.categoria.toLowerCase().replace(' ', '-').split('')[0]}`">{{ m.categoria }}</span></td>
            <td class="td-num">{{ m.horas }}h</td>
            <td class="td-num">{{ m.grupos }}</td>
            <td><button class="btn-remove" @click="removeMateria(m.id)">✕</button></td>
          </tr>
        </tbody>
      </table>

      <div class="actions-row">
        <button class="btn-ghost" @click="goStep(0)">← Atrás</button>
        <button class="btn-primary" :disabled="materias.length === 0" @click="goStep(2)">Siguiente → Profesores</button>
      </div>
    </div>

    <!-- ── Step 2: Profesores ───────────────────────────────────────────────── -->
    <div v-show="step === 2" class="card">
      <h2>Profesores <span class="badge">{{ profesores.length }}</span></h2>
      <p class="muted">Asigna los docentes y las materias que pueden dictar.</p>

      <!-- Add form -->
      <div class="add-form">
        <div class="add-form-grid">
          <div class="field">
            <label class="label">Nombre</label>
            <input v-model="newProfesor.nombre" type="text" class="inp" placeholder="ej. María López" @keyup.enter="addProfesor" />
          </div>
          <div class="field field--sm">
            <label class="label">Código (opcional)</label>
            <input v-model="newProfesor.codigo" type="text" class="inp" placeholder="ej. P003" />
          </div>
        </div>
        <label class="label" style="margin-top:12px">Materias que puede dictar</label>
        <div class="materia-checks">
          <label
            v-for="m in materias"
            :key="m.id"
            class="check-pill"
            :class="{ 'check-pill--active': newProfesor.materias.includes(m.id) }"
          >
            <input type="checkbox" :value="m.id" v-model="newProfesor.materias" style="display:none" />
            {{ m.nombre }}
          </label>
        </div>
        <p v-if="profesorError" class="error-text">{{ profesorError }}</p>
        <button class="btn-add" @click="addProfesor">+ Agregar profesor</button>
      </div>

      <!-- List -->
      <div v-if="profesores.length === 0" class="empty-list">No hay profesores. Agrega al menos uno.</div>
      <table v-else class="data-table">
        <thead>
          <tr><th>Nombre</th><th>Código</th><th>Materias asignadas</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="(p, idx) in profesores" :key="idx">
            <td>{{ p.nombre }}</td>
            <td class="td-id">{{ p.codigo || '—' }}</td>
            <td>
              <div class="materia-tags">
                <span
                  v-for="mid in p.materias"
                  :key="mid"
                  class="mtag"
                  @click="toggleMateriaProfesor(p, mid)"
                  title="Clic para quitar"
                >
                  {{ materiaById[mid] ?? `ID ${mid}` }} ✕
                </span>
                <span v-if="p.materias.length === 0" class="no-mats">Sin asignación</span>
              </div>
            </td>
            <td><button class="btn-remove" @click="removeProfesor(idx)">✕</button></td>
          </tr>
        </tbody>
      </table>

      <div class="actions-row">
        <button class="btn-ghost" @click="goStep(1)">← Atrás</button>
        <button class="btn-primary" :disabled="profesores.length === 0" @click="goStep(3)">Siguiente → Generar</button>
      </div>
    </div>

    <!-- ── Step 3: Generar ──────────────────────────────────────────────────── -->
    <div v-show="step === 3" class="card">
      <h2>Generar horario</h2>
      <p class="muted">Revisa el resumen y ejecuta el optimizador.</p>

      <!-- Summary -->
      <div class="summary-grid">
        <div class="summary-block">
          <div class="summary-title">Configuración</div>
          <div class="summary-row"><span>Semilla</span><strong>{{ config.seed }}</strong></div>
          <div class="summary-row"><span>Salones comunes</span><strong>{{ config.num_salones_comunes }}</strong></div>
          <div class="summary-row"><span>Salones PC</span><strong>{{ config.num_salones_pc }}</strong></div>
        </div>
        <div class="summary-block">
          <div class="summary-title">Materias ({{ materias.length }})</div>
          <div
            v-for="m in materias"
            :key="m.id"
            class="summary-row"
          >
            <span>{{ m.nombre }}</span>
            <strong>{{ m.horas }}h · {{ m.grupos }}g</strong>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-title">Profesores ({{ profesores.length }})</div>
          <div
            v-for="(p, i) in profesores"
            :key="i"
            class="summary-row"
          >
            <span>{{ p.nombre }}</span>
            <strong>{{ p.materias.length }} mat.</strong>
          </div>
        </div>
      </div>

      <div class="actions-row">
        <button class="btn-ghost" @click="goStep(2)">← Atrás</button>
        <button class="btn-primary btn-run" :disabled="loading" @click="execute">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'Ejecutando optimizador…' : '▶ Generar horario' }}
        </button>
      </div>

      <p v-if="error" class="error-text" style="margin-top:14px">{{ error }}</p>
    </div>

    <!-- ── Resultados ───────────────────────────────────────────────────────── -->
    <div v-if="result" class="card results-card">
      <div class="result-header">
        <h2>Resultados</h2>
        <span class="status-badge" :class="statusClass">{{ result.status }}</span>
      </div>
      <p class="muted">{{ result.message }}</p>

      <div class="result-meta">
        <div class="meta-chip">Asignaciones totales: <strong>{{ result.df_asig_rows }}</strong></div>
        <div v-if="result.excel_path" class="meta-chip">
          Archivo Excel: <strong>{{ result.excel_path.split(/[\\/]/).pop() }}</strong>
        </div>
        <div class="meta-chip">Vista previa: <strong>{{ calendarData.length }} clases</strong></div>
      </div>

      <h3 style="margin: 18px 0 10px;">Calendario semanal</h3>
      <WeeklyCalendar :data="calendarData" />
    </div>

  </div>
</template>

<style scoped>
.scheduler {
  display: grid;
  gap: 16px;
}

/* ── Stepper ── */
.stepper {
  display: flex;
  gap: 6px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px;
  flex-wrap: wrap;
}

.step-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 100px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 8px;
  padding: 9px 12px;
  cursor: pointer;
  color: var(--muted);
  transition: all 0.15s;
  font-size: 0.85rem;
}

.step-btn:hover {
  border-color: var(--line);
  color: var(--text);
}

.step-btn--active {
  background: rgba(111, 124, 255, 0.18);
  border-color: #5f6cf0;
  color: #dfe3ff;
}

.step-btn--done {
  color: var(--success);
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  flex-shrink: 0;
}

.step-btn--active .step-num {
  background: var(--primary);
  color: white;
}

.step-btn--done .step-num {
  background: var(--success);
  color: #fff;
}

/* ── Form grid ── */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.field { display: flex; flex-direction: column; gap: 4px; }
.field--sm { max-width: 120px; }

.inp {
  background: #0f1022;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 9px 11px;
  font-size: 0.88rem;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}

.inp:focus { border-color: var(--primary); }

.hint { font-size: 0.72rem; color: var(--muted); }

.range-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range { flex: 1; accent-color: var(--primary); cursor: pointer; }
.range-val { font-weight: 700; min-width: 28px; text-align: right; color: var(--primary); }

.config-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.summary-chip {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.8rem;
  color: var(--muted);
  background: var(--bg-soft);
}

/* ── Add form ── */
.add-form {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}

.add-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.btn-add {
  margin-top: 12px;
  border: 1px dashed var(--primary);
  background: rgba(111, 124, 255, 0.08);
  color: var(--primary);
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-add:hover { background: rgba(111, 124, 255, 0.18); }

/* ── Table ── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-weight: 600;
  font-size: 0.78rem;
}

.data-table td {
  padding: 9px 10px;
  border-bottom: 1px solid #1e1e3a;
  vertical-align: middle;
}

.td-id { color: var(--muted); font-size: 0.78rem; }
.td-num { text-align: center; }

.tag {
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: 600;
}

.tag--s { background: rgba(59, 91, 219, 0.2); color: #748ffc; }
.tag--h { background: rgba(156, 66, 245, 0.2); color: #cc5de8; }
.tag--c { background: rgba(47, 158, 68, 0.2); color: #69db7c; }
.tag--i { background: rgba(230, 119, 0, 0.2); color: #ffa94d; }

.btn-remove {
  background: transparent;
  border: 1px solid transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 6px;
  padding: 3px 7px;
  font-size: 0.78rem;
  transition: all 0.15s;
}

.btn-remove:hover { border-color: var(--error); color: var(--error); }

/* ── Profesores ── */
.materia-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 6px 0;
}

.check-pill {
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 5px 11px;
  font-size: 0.78rem;
  cursor: pointer;
  color: var(--muted);
  transition: all 0.15s;
  user-select: none;
}

.check-pill:hover { border-color: var(--primary); color: var(--text); }
.check-pill--active { background: rgba(111, 124, 255, 0.2); border-color: var(--primary); color: #dfe3ff; }

.materia-tags { display: flex; flex-wrap: wrap; gap: 5px; }

.mtag {
  background: rgba(111, 124, 255, 0.12);
  border: 1px solid rgba(111, 124, 255, 0.3);
  border-radius: 20px;
  padding: 2px 9px;
  font-size: 0.72rem;
  color: #a5b4fc;
  cursor: pointer;
}

.mtag:hover { background: rgba(255, 107, 107, 0.15); border-color: var(--error); color: var(--error); }
.no-mats { font-size: 0.75rem; color: var(--muted); font-style: italic; }

/* ── Summary ── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.summary-block {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px;
}

.summary-title {
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--primary);
  margin-bottom: 10px;
  letter-spacing: 0.3px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  padding: 4px 0;
  border-bottom: 1px solid #1e1e38;
  color: var(--muted);
}

.summary-row strong { color: var(--text); }
.summary-row:last-child { border-bottom: none; }

/* ── Run button ── */
.btn-ghost {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.15s;
}

.btn-ghost:hover { border-color: var(--text); color: var(--text); }

.btn-run {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  font-size: 0.95rem;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-list {
  text-align: center;
  padding: 24px;
  color: var(--muted);
  font-size: 0.85rem;
  border: 1px dashed var(--line);
  border-radius: 10px;
  margin-bottom: 14px;
}

.badge {
  background: rgba(111, 124, 255, 0.2);
  color: var(--primary);
  border-radius: 20px;
  padding: 2px 9px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-left: 8px;
  vertical-align: middle;
}

/* ── Results ── */
.results-card { border-color: rgba(46, 211, 162, 0.3); }

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.result-header h2 { margin: 0; }

.status-badge {
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status--ok { background: rgba(46, 211, 162, 0.2); color: var(--success); }
.status--error { background: rgba(255, 107, 107, 0.2); color: var(--error); }
.status--warn { background: rgba(230, 119, 0, 0.2); color: #ffa94d; }

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.meta-chip {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 0.8rem;
  color: var(--muted);
  background: var(--bg-soft);
}

.meta-chip strong { color: var(--text); }

@media (max-width: 700px) {
  .stepper { flex-direction: column; }
  .step-btn { flex: unset; }
  .add-form-grid, .form-grid, .summary-grid { grid-template-columns: 1fr; }
  .field--sm { max-width: unset; }
}
</style>
