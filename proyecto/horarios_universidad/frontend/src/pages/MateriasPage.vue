<script setup>
import { computed, ref } from 'vue'
import { addMateria, ensureMateriasCount, removeMateria, state } from '../store/state'

const emit = defineEmits(['toast', 'next'])

const nMaterias = ref(state.materias.length || 1)

const materiasValidas = computed(() =>
  state.materias.every(
    (m) => (m.nombre || '').trim() && Number(m.creditos) > 0 && Number(m.grupos) > 0 && (m.categoria || '').trim(),
  ),
)

function generar() {
  if (!nMaterias.value || nMaterias.value < 1) return emit('toast', 'Ingresa una cantidad válida de materias (≥1).')
  ensureMateriasCount(nMaterias.value)
}

function guardar(m) {
  if (!(m.nombre || '').trim()) return emit('toast', 'Cada materia debe tener nombre.')
  if (!Number(m.creditos) || Number(m.creditos) < 1) return emit('toast', 'Créditos inválidos (≥1).')
  if (!Number(m.grupos) || Number(m.grupos) < 1) return emit('toast', 'Grupos inválidos (≥1).')
  if (!(m.categoria || '').trim()) return emit('toast', 'Selecciona una categoría.')
  m.editing = false
}

function editar(m) {
  m.editing = true
}

function eliminar(id) {
  removeMateria(id)
  nMaterias.value = state.materias.length || 1
}

function continuar() {
  if (!state.materias.length) return emit('toast', 'Registra al menos una materia.')
  if (!materiasValidas.value) return emit('toast', 'Completa y guarda todas las materias antes de continuar.')
  emit('next')
}
</script>

<template>
  <div class="ph">
    <div class="ph-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="1.8" stroke-linecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </div>
    <div>
      <div class="ph-title">Materias</div>
      <div class="ph-desc">Primero define cuántas materias vas a registrar. Luego completa créditos e intensidad (grupos).</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Cantidad de materias</div>
    <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
      <div class="fl">
        <label class="lbl">Número de materias <span class="req">*</span></label>
        <input v-model.number="nMaterias" class="inp" type="number" min="1" max="200" placeholder="6" style="width:180px;" />
      </div>
      <button class="btn btn-ghost" @click="generar">Generar apartados</button>
      <button class="btn btn-primary" style="margin-left:auto;" @click="addMateria">+ Agregar una más</button>
    </div>
  </div>

  <div class="card" v-if="state.materias.length > 0">
    <div class="card-title">Materias guardadas</div>
    <div class="materias-list">
      <div v-for="materia in state.materias" :key="materia.id" class="materia-item">
        <div class="materia-name">{{ materia.nombre }}</div>
        <div class="materia-details">
          <span class="materia-creditos">{{ materia.creditos }} créditos</span>
          <span class="materia-grupos">{{ materia.grupos }} grupos</span>
          <span class="materia-categoria">{{ materia.categoria }}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Materias registradas</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Créditos</th>
            <th>Grupos</th>
            <th>Categoría</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="!state.materias.length">
          <tr>
            <td colspan="6">
              <div class="empty-state">No hay materias registradas.</div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="(m, i) in state.materias" :key="m.id">
            <td class="td-mono">{{ String(i + 1).padStart(2, '0') }}</td>
            <td class="td-main" style="min-width:240px">
              <input v-if="m.editing" v-model="m.nombre" class="inp" type="text" placeholder="Ej: Álgebra Lineal" />
              <span v-else>{{ m.nombre }}</span>
            </td>
            <td style="width:160px">
              <input v-if="m.editing" v-model.number="m.creditos" class="inp" type="number" min="1" max="40" />
              <span v-else class="td-mono">{{ m.creditos }}</span>
            </td>
            <td style="width:160px">
              <input v-if="m.editing" v-model.number="m.grupos" class="inp" type="number" min="1" max="60" />
              <span v-else class="td-mono">{{ m.grupos }}</span>
            </td>
            <td style="width:220px">
              <select v-if="m.editing" v-model="m.categoria" class="inp">
                <option value="Software">Software</option>
                <option value="Humanidades">Humanidades</option>
                <option value="Ciencias Básicas">Ciencias Básicas</option>
              </select>
              <span v-else class="td-mono">{{ m.categoria }}</span>
            </td>
            <td style="text-align:right; white-space:nowrap;">
              <button v-if="m.editing" class="btn btn-primary btn-sm" @click="guardar(m)">Guardar</button>
              <button v-else class="btn btn-ghost btn-sm" @click="editar(m)">Editar</button>
              <button class="btn btn-danger btn-sm" @click="eliminar(m.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="nav-row">
    <button class="btn btn-primary" @click="continuar">Continuar a Profesores</button>
  </div>
</template>

<style scoped>
.materias-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.materia-item {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}

.materia-name {
  font-weight: 600;
  color: var(--t1);
  margin-bottom: 6px;
  font-size: 1rem;
}

.materia-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--t3);
}

.materia-creditos,
.materia-grupos,
.materia-categoria {
  font-family: var(--mono);
}
</style>

