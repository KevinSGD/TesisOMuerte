<script setup>
import { computed, ref } from 'vue'
import { addProfesor, ensureProfesoresCount, removeProfesor, state } from '../store/state'
import MateriasTagInput from '../components/MateriasTagInput.vue'
import { catColor } from '../lib/colors.js'

const emit = defineEmits(['toast', 'prev', 'next'])

const nProfes = ref(state.profesores.length || 5)
const search  = ref('')

/** Full materia objects passed to MateriasTagInput as options */
const materiasDisponibles = computed(() =>
  state.materias.filter(m => (m.nombre || '').trim())
)

const profesoresFiltrados = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return state.profesores
  return state.profesores.filter(p =>
    (p.nombre     || '').toLowerCase().includes(q) ||
    (p.profesorId || '').toLowerCase().includes(q)
  )
})

const profesoresValidos = computed(() =>
  state.profesores.length > 0 &&
  state.profesores.every(p =>
    (p.nombre     || '').trim() &&
    (p.profesorId || '').trim() &&
    p.materiaIds?.length > 0 &&
    !p.editing
  )
)

const asignados = computed(() =>
  state.profesores.filter(p => p.materiaIds?.length > 0).length
)

// ─── Actions ──────────────────────────────────────────────────────────────────

function generar() {
  if (!nProfes.value || nProfes.value < 1)
    return emit('toast', 'Ingresa una cantidad válida (≥1).', 'error')
  if (!materiasDisponibles.value.length)
    return emit('toast', 'Primero guarda al menos una materia.', 'error')
  ensureProfesoresCount(nProfes.value)
}

function guardar(p) {
  if (!(p.nombre     || '').trim()) return emit('toast', 'El nombre es requerido.', 'error')
  if (!(p.profesorId || '').trim()) return emit('toast', 'El ID del profesor es requerido.', 'error')
  if (!p.materiaIds?.length)        return emit('toast', 'Asigna al menos una materia.', 'error')
  if (!p.maxHoras || p.maxHoras < 1) return emit('toast', 'Intensidad horaria inválida (≥1).', 'error')
  p.editing = false
}

function editar(p)   { p.editing = true }

function eliminar(id) {
  removeProfesor(id)
  nProfes.value = state.profesores.length || 1
}

function continuar() {
  if (!state.profesores.length) return emit('toast', 'Configura al menos un profesor.', 'error')
  if (!profesoresValidos.value) return emit('toast', 'Completa y guarda todos los profesores.', 'error')
  emit('next')
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function iniciales(nombre) {
  if (!nombre) return '??'
  return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function cargaCreditos(p) {
  return (p.materiaIds || []).reduce((sum, id) => {
    const mat = state.materias.find(m => m.id === id)
    return sum + (mat ? Number(mat.creditos) : 0)
  }, 0)
}

function cargaPct(p) {
  return Math.min(100, Math.round((cargaCreditos(p) / (p.maxHoras || 22)) * 100))
}

function materiaNombre(id) {
  return state.materias.find(m => m.id === id)?.nombre || '?'
}

/** Avatar gradient based on initials hash */
function avatarGradient(nombre) {
  let h = 0
  for (const c of (nombre || '?')) h = (h << 5) - h + c.charCodeAt(0)
  const hue = Math.abs(h) % 360
  return `linear-gradient(135deg, hsl(${hue},55%,28%), hsl(${(hue + 40) % 360},60%,22%))`
}
</script>

<template>
  <div class="px-4 md:px-margin-desktop py-8 max-w-container-max mx-auto flex flex-col h-full gap-0">

    <!-- ═══ Page Header ════════════════════════════════════════════════════════ -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h2 class="text-display-lg-mobile md:text-display-lg font-sans font-bold text-on-background">
          Gestión de Profesores
        </h2>
        <p class="text-body-md text-on-surface-variant mt-1">
          Administra el catálogo de docentes y su asignación multi-materia.
        </p>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-3 w-full md:w-auto flex-wrap">
        <!-- Quick generate -->
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
                   text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Generar
          </button>
        </div>
        <!-- Search -->
        <div class="relative flex-1 min-w-[180px] md:w-64">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                       text-on-surface-variant text-[18px]">search</span>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar profesor…"
            class="w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl
                   pl-10 pr-4 py-2 text-body-sm
                   focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-colors"
          />
        </div>
        <!-- Add button -->
        <button
          @click="addProfesor"
          class="bg-primary hover:bg-primary-fixed text-on-primary px-5 py-2.5 rounded-xl
                 text-label-md font-mono transition-colors whitespace-nowrap flex items-center gap-2
                 shadow-[0_0_16px_rgba(53,201,138,0.2)]"
        >
          <span class="material-symbols-outlined text-[18px]">person_add</span>
          Agregar Profesor
        </button>
      </div>
    </div>

    <!-- ═══ Summary bar ════════════════════════════════════════════════════════ -->
    <div class="flex flex-wrap gap-3 mb-5">
      <div class="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-xl px-4 py-2">
        <span class="material-symbols-outlined text-primary text-[18px]">people</span>
        <span class="text-label-md font-mono text-on-surface-variant">Total</span>
        <span class="text-label-md font-mono text-on-surface font-bold">{{ state.profesores.length }}</span>
      </div>
      <div class="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-xl px-4 py-2">
        <span class="material-symbols-outlined text-secondary text-[18px]">assignment_ind</span>
        <span class="text-label-md font-mono text-on-surface-variant">Con materias</span>
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

    <!-- ═══ Table ══════════════════════════════════════════════════════════════ -->
    <div class="bg-surface-container rounded-xl border border-outline-variant flex flex-col overflow-hidden flex-1 min-h-0">
      <div class="overflow-x-auto overflow-y-auto flex-1">
        <table class="w-full text-left border-collapse min-w-[980px]">
          <thead class="bg-surface-container-high sticky top-0 z-10 border-b border-outline-variant">
            <tr>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider w-56">Docente</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider w-32">ID / Código</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider">Materias Asignadas</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider w-44">Carga horaria</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider w-24">Estado</th>
              <th class="p-4 text-label-md font-mono text-on-surface-variant uppercase tracking-wider text-right w-28">Acciones</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-outline-variant bg-surface">

            <!-- Empty state -->
            <tr v-if="!profesoresFiltrados.length">
              <td colspan="6" class="px-6 py-16 text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-[40px] block mb-3 opacity-20">school</span>
                <p class="text-body-md">
                  {{ search
                    ? `Sin resultados para "${search}"`
                    : 'Sin profesores. Usa "Generar" o "Agregar Profesor".' }}
                </p>
              </td>
            </tr>

            <!-- Data rows -->
            <tr
              v-for="(p, i) in profesoresFiltrados"
              :key="p.id"
              :class="[
                'transition-colors',
                p.editing
                  ? 'bg-surface-container-low/70 border-l-2 border-l-secondary/40'
                  : 'hover:bg-surface-container-low/40'
              ]"
            >

              <!-- ── Nombre + avatar ── -->
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <!-- Avatar with gradient based on name -->
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center
                           text-white font-bold text-[12px] font-mono flex-shrink-0
                           ring-1 ring-white/10"
                    :style="{ background: avatarGradient(p.nombre) }"
                  >
                    {{ iniciales(p.nombre) }}
                  </div>
                  <div class="min-w-0">
                    <input
                      v-if="p.editing"
                      v-model="p.nombre"
                      type="text"
                      placeholder="Nombre Apellido"
                      class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5
                             text-body-sm text-on-surface
                             focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                    />
                    <div v-else>
                      <p class="text-body-sm font-semibold text-on-surface truncate">{{ p.nombre || '—' }}</p>
                      <p class="text-label-md font-mono text-on-surface-variant">Prof. #{{ String(i + 1).padStart(2, '0') }}</p>
                    </div>
                  </div>
                </div>
              </td>

              <!-- ── ID / Código ── -->
              <td class="p-4">
                <input
                  v-if="p.editing"
                  v-model="p.profesorId"
                  type="text"
                  placeholder="DOC-001"
                  class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5
                         text-label-md font-mono text-on-surface
                         focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                />
                <span v-else class="text-label-md font-mono text-primary">{{ p.profesorId || '—' }}</span>
              </td>

              <!-- ── Materias (MateriasTagInput in edit / chips in view) ── -->
              <td class="p-4 min-w-[280px]">

                <!-- EDIT MODE: full typeahead tag input -->
                <MateriasTagInput
                  v-if="p.editing"
                  :model-value="p.materiaIds || []"
                  :options="materiasDisponibles"
                  placeholder="Buscar y agregar materia…"
                  @update:modelValue="(ids) => { p.materiaIds = ids }"
                />

                <!-- VIEW MODE: compact chip list with overflow handling -->
                <template v-else>
                  <div v-if="p.materiaIds?.length" class="flex flex-wrap gap-1">
                    <span
                      v-for="mid in p.materiaIds.slice(0, 3)"
                      :key="mid"
                      class="inline-flex items-center gap-1 text-[11px] font-mono
                             rounded-full px-2 py-0.5 border leading-none"
                      :style="{
                        backgroundColor: catColor(state.materias.find(m => m.id === mid)?.categoria) + '1a',
                        borderColor:     catColor(state.materias.find(m => m.id === mid)?.categoria) + '55',
                        color:           catColor(state.materias.find(m => m.id === mid)?.categoria),
                      }"
                    >
                      <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            :style="{ backgroundColor: catColor(state.materias.find(m => m.id === mid)?.categoria) }">
                      </span>
                      {{ materiaNombre(mid) }}
                    </span>
                    <span
                      v-if="p.materiaIds.length > 3"
                      class="text-[11px] font-mono text-outline self-center"
                    >+{{ p.materiaIds.length - 3 }} más</span>
                  </div>
                  <span v-else class="text-[13px] text-on-surface-variant">—</span>
                </template>
              </td>

              <!-- ── Carga horaria + maxHoras ── -->
              <td class="p-4">
                <div class="flex flex-col gap-2">
                  <!-- Credits + progress bar -->
                  <div class="flex items-center gap-2.5">
                    <div class="w-20 bg-surface-container-highest h-2 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        :style="{ width: cargaPct(p) + '%' }"
                        :class="[
                          'h-full rounded-full transition-all duration-500',
                          cargaPct(p) > 80 ? 'bg-error' : cargaPct(p) > 50 ? 'bg-secondary' : 'bg-primary'
                        ]"
                      ></div>
                    </div>
                    <span class="text-label-md font-mono text-on-surface whitespace-nowrap text-[11px]">
                      {{ cargaCreditos(p) }} cr
                    </span>
                  </div>

                  <!-- Max hours (intensidad horaria) -->
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-outline text-[13px]">schedule</span>
                    <span class="text-[10px] font-mono text-on-surface-variant">Máx:</span>
                    <input
                      v-if="p.editing"
                      v-model.number="p.maxHoras"
                      type="number" min="1" max="80"
                      class="w-14 bg-surface-container-lowest border border-outline-variant rounded-lg
                             px-2 py-0.5 text-[11px] font-mono text-on-surface text-center
                             focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                      title="Intensidad horaria máxima semanal"
                    />
                    <span v-else class="text-[11px] font-mono text-on-surface-variant">
                      {{ p.maxHoras || 22 }} h/sem
                    </span>
                  </div>
                </div>
              </td>

              <!-- ── Estado ── -->
              <td class="p-4">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-label-md font-mono border whitespace-nowrap',
                    p.editing
                      ? 'bg-secondary/10 text-secondary border-secondary/30'
                      : p.materiaIds?.length
                        ? 'bg-primary/10 text-primary border-primary/25'
                        : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
                  ]"
                >
                  <span :class="[
                    'w-1.5 h-1.5 rounded-full',
                    p.editing    ? 'bg-secondary animate-pulse'
                    : p.materiaIds?.length ? 'bg-primary' : 'bg-outline'
                  ]"></span>
                  {{ p.editing ? 'Editando' : p.materiaIds?.length ? 'Activo' : 'Sin asignar' }}
                </span>
              </td>

              <!-- ── Actions ── -->
              <td class="p-4 text-right">
                <div class="flex justify-end gap-1">
                  <button
                    v-if="p.editing"
                    @click="guardar(p)"
                    class="text-label-md font-mono bg-primary/10 text-primary hover:bg-primary hover:text-on-primary
                           border border-primary/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Guardar cambios"
                  >
                    <span class="material-symbols-outlined text-[16px]">save</span>
                    <span class="hidden md:inline">Guardar</span>
                  </button>
                  <button
                    v-else
                    @click="editar(p)"
                    class="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/10
                           rounded-lg transition-colors"
                    title="Editar"
                  >
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    @click="eliminar(p.id)"
                    class="p-2 text-on-surface-variant hover:text-error hover:bg-error/10
                           rounded-lg transition-colors"
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
      <div class="p-4 border-t border-outline-variant bg-surface-container
                  flex items-center justify-between text-body-sm flex-wrap gap-2">
        <span class="text-on-surface-variant text-label-md font-mono">
          {{ profesoresFiltrados.length }} de {{ state.profesores.length }} docentes
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
          Todos los docentes asignados
        </span>
      </div>
    </div>

    <!-- ═══ Navigation ══════════════════════════════════════════════════════════ -->
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
            ? 'bg-primary-container text-on-primary-container hover:bg-primary shadow-[0_0_15px_rgba(53,201,138,0.15)]'
            : 'bg-surface-container-high text-on-surface-variant border border-outline-variant cursor-not-allowed'
        ]"
      >
        Siguiente — Parámetros
        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>

  </div>
</template>
