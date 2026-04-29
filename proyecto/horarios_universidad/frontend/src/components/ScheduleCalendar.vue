<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
})

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const NUM_BLOQUES = 11
const HORAS = [
  '7:00', '8:00', '9:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
]

const filterProfesor = ref('')
const filterMateria = ref('')

const profesores = computed(() => {
  const set = new Set(props.rows.map(r => r.Profesor))
  return ['', ...Array.from(set).sort()]
})

const materias = computed(() => {
  const set = new Set(props.rows.map(r => r.Materia))
  return ['', ...Array.from(set).sort()]
})

const filteredRows = computed(() => {
  return props.rows.filter(r => {
    if (filterProfesor.value && r.Profesor !== filterProfesor.value) return false
    if (filterMateria.value && r.Materia !== filterMateria.value) return false
    return true
  })
})

const grid = computed(() => {
  const g = {}
  for (const dia of DIAS) {
    g[dia] = {}
    for (let b = 1; b <= NUM_BLOQUES; b++) g[dia][b] = []
  }
  for (const row of filteredRows.value) {
    if (g[row.Día]?.[row.Bloque]) g[row.Día][row.Bloque].push(row)
  }
  return g
})

const PALETTE = [
  '#4f46e5', '#7c3aed', '#0369a1', '#047857', '#b45309',
  '#be123c', '#0e7490', '#7e22ce', '#15803d', '#c2410c',
]

const colorCache = {}
function materiaColor(materia) {
  if (colorCache[materia]) return colorCache[materia]
  let h = 0
  for (const c of materia) h = (h * 31 + c.charCodeAt(0)) >>> 0
  colorCache[materia] = PALETTE[h % PALETTE.length]
  return colorCache[materia]
}

function resetFiltros() {
  filterProfesor.value = ''
  filterMateria.value = ''
}
</script>

<template>
  <div class="calendar-wrapper">
    <div class="cal-filters">
      <div class="filter-group">
        <label class="label">Filtrar por profesor</label>
        <select v-model="filterProfesor" class="sel">
          <option value="">Todos</option>
          <option v-for="p in profesores.slice(1)" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="label">Filtrar por materia</label>
        <select v-model="filterMateria" class="sel">
          <option value="">Todas</option>
          <option v-for="m in materias.slice(1)" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <button v-if="filterProfesor || filterMateria" class="btn-ghost-sm" @click="resetFiltros">
        Limpiar filtros
      </button>
    </div>

    <div class="cal-scroll">
      <table class="cal-table">
        <thead>
          <tr>
            <th class="th-hora">Hora</th>
            <th v-for="dia in DIAS" :key="dia" class="th-dia">{{ dia }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in NUM_BLOQUES" :key="b">
            <td class="td-hora">
              <span class="hora-label">{{ HORAS[b - 1] }}</span>
              <span class="bloque-num">B{{ b }}</span>
            </td>
            <td v-for="dia in DIAS" :key="dia" class="td-cell">
              <div v-if="grid[dia][b].length" class="cell-cards">
                <div
                  v-for="(item, i) in grid[dia][b]"
                  :key="i"
                  class="class-card"
                  :style="{ borderLeftColor: materiaColor(item.Materia) }"
                >
                  <div class="card-materia" :style="{ color: materiaColor(item.Materia) }">
                    {{ item.Materia }}
                  </div>
                  <div class="card-meta">
                    <span class="badge-curso">{{ item.Curso }}</span>
                  </div>
                  <div class="card-info">{{ item.Profesor }}</div>
                  <div class="card-salon">{{ item.Salón }}</div>
                </div>
              </div>
              <div v-else class="cell-empty" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="cal-footer">
      <span class="muted">
        {{ filteredRows.length }} clases
        {{ filterProfesor || filterMateria ? '(filtradas)' : 'en total' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.calendar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cal-filters {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sel {
  background: #0f1022;
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 0.85rem;
  cursor: pointer;
  min-width: 180px;
}

.btn-ghost-sm {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 8px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 0.82rem;
  align-self: flex-end;
}
.btn-ghost-sm:hover { border-color: var(--primary); color: var(--text); }

.cal-scroll {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.cal-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 780px;
}

.th-hora {
  width: 72px;
  min-width: 72px;
  background: var(--bg-soft);
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 8px 6px;
  text-align: center;
  border-bottom: 1px solid var(--line);
  position: sticky;
  left: 0;
  z-index: 2;
}

.th-dia {
  background: var(--bg-soft);
  color: var(--text);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 10px 8px;
  text-align: center;
  border-bottom: 2px solid var(--primary);
  border-left: 1px solid var(--line);
  min-width: 160px;
}

.td-hora {
  background: var(--bg-soft);
  border-bottom: 1px solid var(--line);
  padding: 4px 6px;
  text-align: center;
  position: sticky;
  left: 0;
  z-index: 1;
  vertical-align: top;
}

.hora-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text);
}

.bloque-num {
  display: block;
  font-size: 0.68rem;
  color: var(--muted);
}

.td-cell {
  border-left: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 4px;
  vertical-align: top;
  min-height: 48px;
}

.cell-cards {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.class-card {
  background: rgba(111, 124, 255, 0.08);
  border: 1px solid rgba(111, 124, 255, 0.2);
  border-left-width: 3px;
  border-radius: 6px;
  padding: 5px 7px;
  cursor: default;
  transition: background 0.15s;
}

.class-card:hover {
  background: rgba(111, 124, 255, 0.16);
}

.card-materia {
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 2px;
  white-space: normal;
}

.card-meta {
  margin-bottom: 2px;
}

.badge-curso {
  font-size: 0.66rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--muted);
}

.card-info {
  font-size: 0.68rem;
  color: var(--muted);
}

.card-salon {
  font-size: 0.65rem;
  color: var(--muted);
  opacity: 0.75;
}

.cell-empty {
  min-height: 28px;
}

.cal-footer {
  text-align: right;
  font-size: 0.8rem;
}
</style>
