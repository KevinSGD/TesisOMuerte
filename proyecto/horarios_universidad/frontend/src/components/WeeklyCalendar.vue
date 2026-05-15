<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const BLOQUES = Array.from({ length: 11 }, (_, i) => i + 1)
const HORAS = [
  '7:00–8:00', '8:00–9:00', '9:00–10:00', '10:00–11:00', '11:00–12:00',
  '12:00–13:00', '13:00–14:00', '14:00–15:00', '15:00–16:00', '16:00–17:00', '17:00–18:00',
]

const PALETTE = [
  '#3b5bdb', '#1098ad', '#2f9e44', '#e67700', '#c2255c',
  '#6741d9', '#0c8599', '#5c940d', '#d9480f', '#862e9c',
  '#1864ab', '#087f5b', '#a61e4d', '#343a40', '#495057',
]

const materiaColorMap = computed(() => {
  const map = {}
  let i = 0
  for (const row of props.data) {
    if (!(row.Materia in map)) {
      map[row.Materia] = PALETTE[i % PALETTE.length]
      i++
    }
  }
  return map
})

const grid = computed(() => {
  const map = {}
  for (const dia of DIAS) {
    map[dia] = {}
    for (const b of BLOQUES) map[dia][b] = []
  }
  for (const row of props.data) {
    if (map[row.Día]?.[row.Bloque] !== undefined) {
      map[row.Día][row.Bloque].push(row)
    }
  }
  return map
})

const hasData = computed(() => props.data.length > 0)
</script>

<template>
  <div class="cal-wrap">
    <div v-if="!hasData" class="cal-empty">No hay datos para mostrar en el calendario.</div>

    <div v-else class="cal-scroll">
      <table class="cal-table">
        <thead>
          <tr>
            <th class="th-hora">Hora</th>
            <th v-for="dia in DIAS" :key="dia" class="th-dia">{{ dia }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(hora, idx) in HORAS" :key="idx">
            <td class="td-hora">
              <span class="hora-num">{{ idx + 1 }}</span>
              <span class="hora-str">{{ hora }}</span>
            </td>
            <td
              v-for="dia in DIAS"
              :key="dia"
              class="td-cell"
              :class="{ 'td-cell--empty': grid[dia][idx + 1].length === 0 }"
            >
              <div
                v-for="(cls, ci) in grid[dia][idx + 1]"
                :key="ci"
                class="cls-chip"
                :style="{ borderLeftColor: materiaColorMap[cls.Materia] }"
              >
                <div class="cls-materia">{{ cls.Materia }}</div>
                <div class="cls-meta">{{ cls.Profesor }}</div>
                <div class="cls-meta">{{ cls.Salón }} · {{ cls.Curso }}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="hasData" class="cal-legend">
      <div
        v-for="(color, materia) in materiaColorMap"
        :key="materia"
        class="legend-item"
      >
        <span class="legend-dot" :style="{ background: color }" />
        {{ materia }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cal-wrap {
  width: 100%;
}

.cal-empty {
  text-align: center;
  padding: 40px;
  color: var(--muted);
}

.cal-scroll {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--line);
}

.cal-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
  font-size: 0.78rem;
}

.th-hora {
  width: 90px;
  padding: 10px 8px;
  text-align: left;
  color: var(--muted);
  background: #0f1022;
  font-weight: 600;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.th-dia {
  padding: 10px 8px;
  text-align: center;
  font-weight: 700;
  background: #0f1022;
  border-bottom: 1px solid var(--line);
  border-left: 1px solid var(--line);
  letter-spacing: 0.3px;
}

.td-hora {
  padding: 8px;
  vertical-align: top;
  background: #0c0d1f;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  min-width: 90px;
}

.hora-num {
  display: block;
  font-weight: 700;
  color: var(--primary);
  font-size: 0.72rem;
}

.hora-str {
  color: var(--muted);
  font-size: 0.68rem;
}

.td-cell {
  padding: 4px;
  vertical-align: top;
  border-bottom: 1px solid var(--line);
  border-left: 1px solid var(--line);
  min-width: 130px;
  background: var(--card);
}

.td-cell--empty {
  background: #0e0f25;
}

.cls-chip {
  border-left: 3px solid var(--primary);
  background: rgba(111, 124, 255, 0.08);
  border-radius: 6px;
  padding: 5px 7px;
  margin-bottom: 3px;
}

.cls-materia {
  font-weight: 600;
  color: var(--text);
  font-size: 0.74rem;
  line-height: 1.3;
  margin-bottom: 2px;
}

.cls-meta {
  color: var(--muted);
  font-size: 0.66rem;
  line-height: 1.3;
}

.cal-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg-soft);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--muted);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
