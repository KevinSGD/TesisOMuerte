<script setup>
import { computed, ref } from 'vue'
import { addProfesor, ensureProfesoresCount, removeProfesor, state } from '../store/state'

const emit = defineEmits(['toast', 'prev', 'next'])

const nProfes  = ref(state.profesores.length || 5)
const search   = ref('')

const materiasOptions = computed(() =>
  state.materias
    .filter(m => (m.nombre || '').trim())
    .map(m => ({ id: m.id, label: `${m.nombre} · ${m.creditos}cr · ${m.grupos}g` }))
)

const profesoresFiltrados = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return state.profesores
  return state.profesores.filter(p =>
    (p.nombre || '').toLowerCase().includes(q) ||
    (p.profesorId || '').toLowerCase().includes(q)
  )
})

const profesoresValidos = computed(() =>
  state.profesores.length > 0 &&
  state.profesores.every(p => (p.nombre || '').trim() && (p.profesorId || '').trim() && p.materiaId)
)

const asignados = computed(() => state.profesores.filter(p => p.materiaId).length)

function generar() {
  if (!nProfes.value || nProfes.value < 1)
    return emit('toast', 'Ingresa una cantidad válida (≥1).', 'error')
  if (!materiasOptions.value.length)
    return emit('toast', 'Primero guarda al menos una materia.', 'error')
  ensureProfesoresCount(nProfes.value)
}

function guardar(p) {
  if (!(p.nombre    || '').trim()) return emit('toast', 'El nombre es requerido.', 'error')
  if (!(p.profesorId|| '').trim()) return emit('toast', 'El ID del profesor es requerido.', 'error')
  if (!p.materiaId)                return emit('toast', 'Asigna una materia al profesor.', 'error')
  p.editing = false
}

function editar(p)   { p.editing = true }

function eliminar(id) {
  removeProfesor(id)
  nProfes.value = state.profesores.length || 1
}

function continuar() {
  if (!state.profesores.length)   return emit('toast', 'Configura al menos un profesor.', 'error')
  if (!profesoresValidos.value)   return emit('toast', 'Completa y guarda todos los profesores.', 'error')
  emit('next')
}

function inicialesProfesor(nombre) {
  if (!nombre) return '??'
  return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function materiaNombre(id) {
  return state.materias.find(m => m.id === id)?.nombre || '—'
}

// Progress de carga horaria (simulado: creditos / 40 créditos máx)
function cargaPct(p) {
  const mat = state.materias.find(m => m.id === p.materiaId)
  if (!mat) return 0
  return Math.min(100, Math.round((Number(mat.creditos) / 40) * 100))
}
</script>

<template>
  <div class="px-4 md:px-margin-desktop py-8 max-w-container-max mx-auto flex flex-col h-full">

    <!-- ─── Page Header ─── -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h2 class="text-display-lg-mobile md:text-display-lg font-sans font-bold text-on-background">
          Gestión de Profesores
        </h2>
        <p class="text-body-md text-on-surface-variant mt-1">
          Administra el catálogo de docentes y su asignación de materias.
        </p>
      </div>

      <!-- Search + Add -->
      <div class="flex items-center gap-3 w-full md:w-auto flex-wrap">
        <!-- Quick gen -->
        <div class="flex items-center gap-2">
          <input
            v-model.number="nProfes"
            type="number" min="1" max="200"
            class="w-16 bg-surface-container-low border border-outline-variant rounded-lg
                   px-3 py-2 text-label-md font-mono text-on-surface text-center
                   focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
          />
          <button
            @click="generar"
            class="text-label-md font-mono px-3 py-2 rounded-lg border border-outline-variant
                   text-on-surface-variant hover:bg-surface-container-high transition-colors whitespace-nowrap"
          >
            Generar
          </button>
        </div>
        <!-- Search -->
        <div class="relative flex-1 md:w-64">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar profesor..."
            class="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl
                   pl-10 pr-4 py-2 text-body-sm
                   focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-colors"
          />
        </div>
        <!-- Add button -->
        <button
          @click="addProfesor"
          class="bg-primary hover:bg-primary-fixed text-on-primary px-5 py-2 rounded-xl
                 text-label-md font-mono transition-colors whitespace-nowrap flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">person_add</span>
          Agregar Profesor
        </button>
      </div>
    </div>

    <!-- ─── Summary chips ─── -->
    <div class="flex flex-wrap gap-3 mb-6">
      <div class="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-xl px-4 py-2">
        <span class="material-symbols-outlined text-primary text-[18px]">people</span>
        <span class="text-label-md font-mono text-on-surface-variant">Total:</span>
        <span class="text-label-md font-mono text-on-surface font-bold">{{ state.profesores.length }}</span>
      </div>
      <div class="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-xl px-4 py-2">
        <span class="material-symbols-outlined text-secondary text-[18px]">assignment_ind</span>
        <span class="text-label-md font-mono text-on-surface-variant">Asignados:</span>
        <span class="text-label-md font-mono text-secondary font-bold">{{ asignados }}</span>
      </div>
      <div
        v-if="state.materias.length === 0"
        class="flex items-center gap-2 bg-error/10 border border-error/30 rounded-xl px-4 py-2"
      >
        <span class="material-symbols-outlined text-error text-[18px]">warning</span>
        <span class="text-label-md font-mono text-error">No hay materias — ve al Paso 1 primero</span>
      </div>
    </div>

    <!-- ─── Table ─── -->
    <div class="bg-surface-container rounded-xl border border-outline-variant flex flex-col overflow-hidden flex-1 min-h-0">
      <div class="overflow-x-auto overflow-y-auto flex-1">
        <table class="w-full text-left border-collapse">
          <thead class="bg-surface-container-high sticky top-0 z-10 border-b border-outline-variant">
            <tr>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Nombre del Docente</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider w-36">ID / Código</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Materia Asignada</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider w-40">Carga (Créditos)</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider w-24">Estado</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider text-right w-32">Acciones</th>
            </tr>
          </thead>

          <tbody class="text-body-sm divide-y divide-outline-variant bg-surface">
            <!-- Empty state -->
            <tr v-if="!profesoresFiltrados.length">
              <td colspan="6" class="px-6 py-12 text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-[32px] block mb-2 opacity-30">school</span>
                {{ search ? 'Sin resultados para "' + search + '"' : 'Sin profesores. Usa "Generar" o "Agregar Profesor".' }}
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-for="(p, i) in profesoresFiltrados"
              :key="p.id"
              class="hover:bg-surface-container-low transition-colors"
            >
              <!-- Nombre + avatar -->
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center
                               text-on-surface font-bold text-[11px] font-mono flex-shrink-0">
                    {{ inicialesProfesor(p.nombre) }}
                  </div>
                  <div>
                    <div v-if="p.editing">
                      <input
                        v-model="p.nombre"
                        type="text"
                        placeholder="Nombre Apellido"
                        class="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5
                               text-body-sm text-on-surface w-full
                               focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                      />
                    </div>
                    <div v-else class="font-medium text-on-background">{{ p.nombre || '—' }}</div>
                    <div class="text-label-md font-mono text-on-surface-variant mt-0.5" v-if="!p.editing">
                      Prof. #{{ String(i + 1).padStart(2, '0') }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- ID -->
              <td class="p-4">
                <input
                  v-if="p.editing"
                  v-model="p.profesorId"
                  type="text"
                  placeholder="DOC-001"
                  class="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5
                         text-label-md font-mono text-on-surface
                         focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                />
                <span v-else class="text-label-md font-mono text-primary">{{ p.profesorId || '—' }}</span>
              </td>

              <!-- Materia -->
              <td class="p-4">
                <select
                  v-if="p.editing"
                  v-model="p.materiaId"
                  class="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5
                         text-body-sm text-on-surface
                         focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                >
                  <option :value="null">— Seleccionar materia —</option>
                  <option v-for="m in materiasOptions" :key="m.id" :value="m.id">{{ m.label }}</option>
                </select>
                <span v-else class="text-body-sm text-on-surface">{{ materiaNombre(p.materiaId) }}</span>
              </td>

              <!-- Carga (progress bar) -->
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-surface-container-highest h-2 rounded-full overflow-hidden max-w-[80px]">
                    <div
                      :style="{ width: cargaPct(p) + '%' }"
                      :class="[
                        'h-full rounded-full transition-all duration-500',
                        cargaPct(p) > 80 ? 'bg-tertiary-container' : cargaPct(p) > 50 ? 'bg-secondary' : 'bg-primary'
                      ]"
                    ></div>
                  </div>
                  <span class="text-label-md font-mono text-on-surface whitespace-nowrap">
                    {{ state.materias.find(m => m.id === p.materiaId)?.creditos || 0 }} cr
                  </span>
                </div>
              </td>

              <!-- Estado -->
              <td class="p-4">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 py-1 px-2 rounded text-label-md font-mono border',
                    p.materiaId
                      ? 'bg-primary-container/20 text-primary border-primary/20'
                      : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
                  ]"
                >
                  <span :class="['w-1.5 h-1.5 rounded-full', p.materiaId ? 'bg-primary' : 'bg-outline']"></span>
                  {{ p.materiaId ? 'Activo' : 'Sin asignar' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="p-4 text-right">
                <div class="flex justify-end gap-1">
                  <button
                    v-if="p.editing"
                    @click="guardar(p)"
                    class="text-label-md font-mono bg-primary/10 text-primary hover:bg-primary hover:text-on-primary
                           border border-primary/30 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[16px]">save</span>
                  </button>
                  <button
                    v-else
                    @click="editar(p)"
                    class="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    @click="eliminar(p.id)"
                    class="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table footer -->
      <div class="p-4 border-t border-outline-variant bg-surface-container flex items-center justify-between text-body-sm flex-wrap gap-2">
        <span class="text-on-surface-variant text-label-md font-mono">
          Mostrando {{ profesoresFiltrados.length }} de {{ state.profesores.length }} profesores
        </span>
        <span
          v-if="asignados < state.profesores.length"
          class="text-label-md font-mono text-error flex items-center gap-1"
        >
          <span class="material-symbols-outlined text-[14px]">warning</span>
          {{ state.profesores.length - asignados }} sin materia asignada
        </span>
        <span
          v-else-if="state.profesores.length > 0"
          class="text-label-md font-mono text-primary flex items-center gap-1"
        >
          <span class="material-symbols-outlined text-[14px]">check_circle</span>
          Todos asignados
        </span>
      </div>
    </div>

    <!-- ─── Nav Row ─── -->
    <div class="flex justify-between items-center pt-6 border-t border-outline-variant mt-6">
      <button
        @click="$emit('prev')"
        class="text-label-md font-mono px-5 py-2.5 rounded-xl border border-outline-variant
               text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Materias
      </button>
      <button
        @click="continuar"
        :disabled="!profesoresValidos"
        :class="[
          'text-label-md font-mono rounded-xl px-6 py-2.5 flex items-center gap-2 transition-colors',
          profesoresValidos
            ? 'bg-primary-container text-on-primary-container hover:bg-primary shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : 'bg-surface-container-high text-on-surface-variant border border-outline-variant cursor-not-allowed'
        ]"
      >
        Siguiente — Parámetros
        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>

  </div>
</template>
