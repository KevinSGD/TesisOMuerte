<script setup>
import { computed, ref } from 'vue'
import { addProfesor, ensureProfesoresCount, removeProfesor, state } from '../store/state'

const emit = defineEmits(['toast', 'prev', 'next'])

const nProfes = ref(state.profesores.length || 1)

const materiasOptions = computed(() =>
  state.materias
    .filter((m) => (m.nombre || '').trim())
    .map((m) => ({ id: m.id, label: `${m.nombre} · ${m.creditos}cr · ${m.grupos}g` })),
)

const profesoresValidos = computed(() =>
  state.profesores.every((p) => (p.nombre || '').trim() && (p.profesorId || '').trim() && p.materiaId),
)

function generar() {
  if (!nProfes.value || nProfes.value < 1) return emit('toast', 'Ingresa una cantidad válida de profesores (≥1).')
  if (!materiasOptions.value.length) return emit('toast', 'Primero guarda al menos una materia con nombre.')
  ensureProfesoresCount(nProfes.value)
}

function guardar(p) {
  if (!(p.nombre || '').trim()) return emit('toast', 'Cada profesor debe tener nombre.')
  if (!(p.profesorId || '').trim()) return emit('toast', 'Cada profesor debe tener un ID.')
  if (!p.materiaId) return emit('toast', 'Asigna una materia al profesor.')
  p.editing = false
}

function editar(p) {
  p.editing = true
}

function eliminar(id) {
  removeProfesor(id)
  nProfes.value = state.profesores.length || 1
}

function continuar() {
  if (!state.profesores.length) return emit('toast', 'Configura al menos un profesor.')
  if (!profesoresValidos.value) return emit('toast', 'Completa y guarda todos los profesores antes de continuar.')
  emit('next')
}
</script>

<template>
  <div class="ph">
    <div class="ph-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="1.8" stroke-linecap="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    </div>
    <div>
      <div class="ph-title">Profesores</div>
      <div class="ph-desc">Define cuántos profesores vas a registrar y asígnales una materia ya guardada.</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Cantidad de profesores</div>
    <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
      <div class="fl">
        <label class="lbl">Número de profesores <span class="req">*</span></label>
        <input v-model.number="nProfes" class="inp" type="number" min="1" max="200" placeholder="10" style="width:180px;" />
      </div>
      <button class="btn btn-ghost" @click="generar">Generar apartados</button>
      <button class="btn btn-primary" style="margin-left:auto;" @click="addProfesor">+ Agregar uno más</button>
    </div>
  </div>

  <div class="card" v-if="state.profesores.length > 0">
    <div class="card-title">Profesores guardados</div>
    <div class="profesores-list">
      <div v-for="profesor in state.profesores" :key="profesor.id" class="profesor-item">
        <div class="profesor-name">{{ profesor.nombre }}</div>
        <div class="profesor-details">
          <span class="profesor-id">{{ profesor.profesorId }}</span>
          <span class="profesor-materia">
            {{
              state.materias.find((m) => m.id === profesor.materiaId)?.nombre || 'Sin asignar'
            }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Profesores registrados</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>ID</th>
            <th>Materia asignada</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="!state.profesores.length">
          <tr>
            <td colspan="5">
              <div class="empty-state">No hay profesores registrados.</div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="(p, i) in state.profesores" :key="p.id">
            <td class="td-mono">{{ String(i + 1).padStart(2, '0') }}</td>
            <td class="td-main" style="min-width:220px">
              <input v-if="p.editing" v-model="p.nombre" class="inp" type="text" placeholder="Nombre Apellido" />
              <span v-else>{{ p.nombre }}</span>
            </td>
            <td style="min-width:160px">
              <input v-if="p.editing" v-model="p.profesorId" class="inp" type="text" placeholder="DOC-001" />
              <span v-else class="td-mono">{{ p.profesorId }}</span>
            </td>
            <td style="min-width:280px">
              <select v-if="p.editing" v-model="p.materiaId" class="inp">
                <option :value="null">— Seleccionar materia —</option>
                <option v-for="m in materiasOptions" :key="m.id" :value="m.id">
                  {{ m.label }}
                </option>
              </select>
              <span v-else>
                {{
                  state.materias.find((m) => m.id === p.materiaId)?.nombre
                    ? state.materias.find((m) => m.id === p.materiaId)?.nombre
                    : '—'
                }}
              </span>
            </td>
            <td style="text-align:right; white-space:nowrap;">
              <button v-if="p.editing" class="btn btn-primary btn-sm" @click="guardar(p)">Guardar</button>
              <button v-else class="btn btn-ghost btn-sm" @click="editar(p)">Editar</button>
              <button class="btn btn-danger btn-sm" @click="eliminar(p.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="nav-row">
    <button class="btn btn-ghost" @click="$emit('prev')">Volver</button>
    <button class="btn btn-primary" @click="continuar">Continuar a Parámetros</button>
  </div>
</template>

<style scoped>
.profesores-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.profesor-item {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}

.profesor-name {
  font-weight: 600;
  color: var(--t1);
  margin-bottom: 6px;
  font-size: 1rem;
}

.profesor-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--t3);
}

.profesor-id,
.profesor-materia {
  font-family: var(--mono);
}
</style>

