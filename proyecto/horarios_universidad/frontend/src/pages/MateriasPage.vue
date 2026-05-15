<script setup>
import { computed, ref } from 'vue'
import { addMateria, ensureMateriasCount, removeMateria, state } from '../store/state'

const emit = defineEmits(['toast', 'next'])

const nMaterias = ref(state.materias.length || 5)

const CATEGORIAS = ['Software', 'Humanidades', 'Ciencias Básicas']

const materiasValidas = computed(() =>
  state.materias.length > 0 &&
  state.materias.every(
    m => (m.nombre || '').trim() && Number(m.creditos) > 0 && Number(m.grupos) > 0 && (m.categoria || '').trim()
  )
)

function generar() {
  if (!nMaterias.value || nMaterias.value < 1)
    return emit('toast', 'Ingresa una cantidad válida (≥1).', 'error')
  ensureMateriasCount(nMaterias.value)
}

function guardar(m) {
  if (!(m.nombre || '').trim()) return emit('toast', 'El nombre es requerido.', 'error')
  if (!Number(m.creditos) || Number(m.creditos) < 1) return emit('toast', 'Créditos inválidos (≥1).', 'error')
  if (!Number(m.grupos)   || Number(m.grupos)   < 1) return emit('toast', 'Grupos inválidos (≥1).', 'error')
  if (!(m.categoria || '').trim()) return emit('toast', 'Selecciona una categoría.', 'error')
  m.editing = false
}

function editar(m) { m.editing = true }

function eliminar(id) {
  removeMateria(id)
  nMaterias.value = state.materias.length || 1
}

function continuar() {
  if (!state.materias.length)  return emit('toast', 'Registra al menos una materia.', 'error')
  if (!materiasValidas.value)  return emit('toast', 'Completa y guarda todas las materias.', 'error')
  emit('next')
}

function categoriaBadgeClass(cat) {
  if (cat === 'Software')       return 'bg-primary/10 text-primary border-primary/20'
  if (cat === 'Humanidades')    return 'bg-secondary/10 text-secondary border-secondary/20'
  return 'bg-tertiary/10 text-tertiary border-tertiary/20'
}
</script>

<template>
  <div class="px-4 md:px-margin-desktop py-8 max-w-[1024px] mx-auto flex flex-col gap-8">

    <!-- ─── Page Header ─── -->
    <header class="flex flex-col gap-6">
      <div class="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-display-lg-mobile md:text-display-lg font-sans font-bold text-primary">
            Configuración de Parámetros
          </h1>
          <p class="text-body-md text-on-surface-variant mt-2">
            Defina los datos base para la generación de horarios.
          </p>
        </div>
        <!-- Generar rápido -->
        <div class="flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <label class="text-label-md font-mono text-on-surface-variant whitespace-nowrap">Cant. materias:</label>
            <input
              v-model.number="nMaterias"
              type="number" min="1" max="200"
              class="w-20 bg-surface-container-lowest border border-outline-variant rounded-lg
                     px-3 py-2 text-label-md font-mono text-on-surface text-center
                     focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
            />
          </div>
          <button
            @click="generar"
            class="text-label-md font-mono px-4 py-2 rounded-lg border border-outline
                   text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">refresh</span>
            Generar apartados
          </button>
        </div>
      </div>

      <!-- Stepper -->
      <div class="w-full flex items-center relative py-4">
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-outline-variant z-0"></div>
        <div
          class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary z-0 transition-all duration-500"
          :style="{ width: materiasValidas ? '50%' : '5%' }"
        ></div>
        <div class="flex justify-between w-full z-10 relative">
          <!-- Step 1: Materias (activo) -->
          <div class="flex flex-col items-center gap-2 bg-background px-4">
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <span class="text-label-md font-mono text-on-primary-fixed font-bold">1</span>
            </div>
            <span class="text-label-md font-mono text-primary">Materias</span>
          </div>
          <!-- Step 2: Profesores (bloqueado hasta completar) -->
          <div class="flex flex-col items-center gap-2 bg-background px-4">
            <div :class="[
              'w-8 h-8 rounded-full border flex items-center justify-center',
              materiasValidas ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-high border-outline-variant'
            ]">
              <span class="text-label-md font-mono text-on-surface-variant">2</span>
            </div>
            <span class="text-label-md font-mono text-on-surface-variant">Docentes</span>
          </div>
          <!-- Step 3: Parámetros -->
          <div class="flex flex-col items-center gap-2 bg-background px-4">
            <div class="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center">
              <span class="text-label-md font-mono text-on-surface-variant">3</span>
            </div>
            <span class="text-label-md font-mono text-on-surface-variant">Parámetros</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ─── Tabla de Materias ─── -->
    <section class="w-full bg-surface-container rounded-xl border-t-2 border-t-primary border-x border-b border-outline-variant flex flex-col overflow-hidden">
      <!-- Card header -->
      <div class="p-6 border-b border-outline-variant flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 class="text-headline-sm font-sans text-on-surface">Paso 1: Materias y Grupos</h2>
          <p class="text-body-sm text-on-surface-variant mt-1">
            Ingresa el catálogo de materias, créditos y cantidad de grupos a programar.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-label-md font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
            {{ state.materias.length }} materias
          </span>
          <span
            v-if="materiasValidas"
            class="text-label-md font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-[14px]">check_circle</span> Completo
          </span>
        </div>
      </div>

      <!-- Table -->
      <div class="w-full overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr class="bg-surface-container-low border-b border-outline-variant">
              <th class="text-label-md font-mono text-on-surface-variant px-6 py-4 w-8">#</th>
              <th class="text-label-md font-mono text-on-surface-variant px-6 py-4">Nombre de Materia</th>
              <th class="text-label-md font-mono text-on-surface-variant px-6 py-4 w-32 text-center">Créditos</th>
              <th class="text-label-md font-mono text-on-surface-variant px-6 py-4 w-32 text-center">Grupos</th>
              <th class="text-label-md font-mono text-on-surface-variant px-6 py-4 w-44">Categoría</th>
              <th class="text-label-md font-mono text-on-surface-variant px-6 py-4 text-right w-36">Acciones</th>
            </tr>
          </thead>
          <tbody v-if="!state.materias.length">
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-on-surface-variant text-body-sm">
                <span class="material-symbols-outlined text-[32px] block mb-2 opacity-30">book</span>
                Sin materias. Ingresa la cantidad arriba y haz clic en "Generar apartados".
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr
              v-for="(m, i) in state.materias"
              :key="m.id"
              class="border-b border-outline-variant hover:bg-surface-container-low/60 transition-colors"
            >
              <!-- Index -->
              <td class="px-6 py-3 text-label-md font-mono text-on-surface-variant">
                {{ String(i + 1).padStart(2, '0') }}
              </td>
              <!-- Nombre -->
              <td class="px-6 py-3">
                <input
                  v-if="m.editing"
                  v-model="m.nombre"
                  type="text"
                  placeholder="Ej. Álgebra Lineal"
                  class="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2
                         text-body-sm text-on-surface placeholder:text-on-surface-variant/40
                         focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all"
                />
                <span v-else class="text-body-sm text-on-surface font-medium">{{ m.nombre }}</span>
              </td>
              <!-- Créditos -->
              <td class="px-6 py-3 text-center">
                <input
                  v-if="m.editing"
                  v-model.number="m.creditos"
                  type="number" min="1" max="40"
                  class="w-20 bg-surface-container-lowest border border-outline-variant rounded px-3 py-2
                         text-label-md font-mono text-on-surface text-center
                         focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                />
                <span v-else class="text-label-md font-mono text-primary">{{ m.creditos }}</span>
              </td>
              <!-- Grupos -->
              <td class="px-6 py-3 text-center">
                <input
                  v-if="m.editing"
                  v-model.number="m.grupos"
                  type="number" min="1" max="60"
                  class="w-20 bg-surface-container-lowest border border-outline-variant rounded px-3 py-2
                         text-label-md font-mono text-on-surface text-center
                         focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                />
                <span v-else class="text-label-md font-mono text-secondary">{{ m.grupos }}</span>
              </td>
              <!-- Categoría -->
              <td class="px-6 py-3">
                <select
                  v-if="m.editing"
                  v-model="m.categoria"
                  class="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2
                         text-body-sm text-on-surface
                         focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                >
                  <option v-for="cat in CATEGORIAS" :key="cat" :value="cat">{{ cat }}</option>
                </select>
                <span
                  v-else
                  :class="['inline-flex items-center text-label-md font-mono px-2 py-1 rounded border', categoriaBadgeClass(m.categoria)]"
                >{{ m.categoria }}</span>
              </td>
              <!-- Actions -->
              <td class="px-6 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <button
                    v-if="m.editing"
                    @click="guardar(m)"
                    class="text-label-md font-mono bg-primary/10 text-primary hover:bg-primary hover:text-on-primary
                           border border-primary/30 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[16px]">save</span> Guardar
                  </button>
                  <button
                    v-else
                    @click="editar(m)"
                    class="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    @click="eliminar(m.id)"
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

      <!-- Add Row button -->
      <div class="p-4 border-t border-outline-variant bg-surface-container-low flex justify-start">
        <button
          @click="addMateria"
          class="text-label-md font-mono text-primary flex items-center gap-2
                 hover:bg-surface-container-high px-3 py-2 rounded transition-colors"
        >
          <span class="material-symbols-outlined text-[18px]">add</span>
          Añadir Materia
        </button>
      </div>
    </section>

    <!-- ─── Paso 2 preview (bloqueado) ─── -->
    <section
      class="w-full bg-surface-container-lowest rounded-xl border border-outline-variant
             flex flex-col overflow-hidden opacity-50 pointer-events-none"
    >
      <div class="p-6 border-b border-outline-variant">
        <h2 class="text-headline-sm font-sans text-on-surface">Paso 2: Docentes</h2>
        <p class="text-body-sm text-on-surface-variant mt-1">
          Registro de plantilla docente. Requerido: Nombre y materia asignada.
        </p>
      </div>
      <div class="p-6 flex items-center justify-center h-24 bg-surface-container-low/50">
        <span class="text-label-md font-mono text-on-surface-variant flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">lock</span>
          Complete el Paso 1 para continuar
        </span>
      </div>
    </section>

    <!-- ─── Bottom Actions ─── -->
    <div class="flex justify-end pt-6 border-t border-outline-variant">
      <button
        @click="continuar"
        :disabled="!materiasValidas"
        :class="[
          'text-label-md font-mono rounded-xl px-6 py-3 flex items-center gap-2 transition-colors',
          materiasValidas
            ? 'bg-primary-container text-on-primary-container hover:bg-primary shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : 'bg-surface-container-high text-on-surface-variant border border-outline-variant cursor-not-allowed'
        ]"
      >
        Siguiente Paso — Profesores
        <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>

  </div>
</template>
