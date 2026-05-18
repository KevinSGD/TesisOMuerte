<script setup>
import { computed, ref } from 'vue'
import { state, setStep } from './store/state'
import { useHealthCheck } from './composables/useHealthCheck'
import DashboardPage  from './pages/DashboardPage.vue'
import MateriasPage   from './pages/MateriasPage.vue'
import ProfesoresPage from './pages/ProfesoresPage.vue'
import ParametrosPage from './pages/ParametrosPage.vue'
import CalendarioPage from './pages/CalendarioPage.vue'
import UiToast        from './components/UiToast.vue'

// ── Shared health state (single source of truth, no duplicate fetches) ──
const { backendOk, dbOk } = useHealthCheck()

// ── Toast ───────────────────────────────────────────────────────────────
const toastMsg  = ref('')
const toastType = ref('info')
const toastOn   = ref(false)

function toast(msg, type = 'info') {
  toastMsg.value  = msg
  toastType.value = type
  toastOn.value   = true
  window.clearTimeout(toast._t)
  toast._t = window.setTimeout(() => (toastOn.value = false), 3400)
}

// ── Navigation ──────────────────────────────────────────────────────────
const mobileMenuOpen = ref(false)
const helpOpen       = ref(false)

function goto(n) {
  setStep(n)
  mobileMenuOpen.value = false
}

const navItems = [
  { step: 0, icon: 'dashboard',        label: 'Dashboard' },
  { step: 1, icon: 'book',             label: 'Materias' },
  { step: 2, icon: 'school',           label: 'Profesores' },
  { step: 3, icon: 'settings_suggest', label: 'Parámetros' },
  { step: 4, icon: 'calendar_month',   label: 'Calendario' },
]

// ── Badges ──────────────────────────────────────────────────────────────
const badges = computed(() => ({
  materias:   state.materias.length,
  profesores: state.profesores.length,
  // BUG FIX: was p.materiaId (singular) — store uses materiaIds[] since v2
  asignados:  state.profesores.filter(p => p.materiaIds?.length > 0).length,
  eventos:    state.calendario.eventos.length,
}))

function badgeFor(step) {
  if (step === 1) return badges.value.materias   || null
  if (step === 2) return badges.value.profesores  || null
  if (step === 3) return badges.value.asignados   || null
  if (step === 4) return badges.value.eventos     || null
  return null
}

const hasData = computed(() => state.materias.length > 0)
</script>

<template>
  <!-- ── Skip link (a11y: keyboard users skip nav) ── -->
  <a href="#main-content" class="skip-link">Saltar al contenido principal</a>

  <div class="flex h-screen overflow-hidden bg-background text-on-background font-sans antialiased">

    <!-- ─── Sidebar Desktop ─── -->
    <nav
      aria-label="Navegación principal"
      class="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col z-40
             bg-surface-container border-r border-outline-variant"
    >
      <!-- Logo -->
      <div class="px-6 py-8 flex flex-col gap-4 border-b border-outline-variant/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
            <span class="material-symbols-outlined filled text-on-primary-container text-[22px]">school</span>
          </div>
          <div>
            <h1 class="text-headline-sm font-sans font-black text-primary leading-none">GestorAulas</h1>
            <p class="text-label-md font-mono text-on-surface-variant uppercase tracking-wider mt-1">Sistema de Horarios</p>
          </div>
        </div>
        <!-- CTA — FIX: text-on-primary (high contrast #002918 on #35c98a = 8.3:1 ✓) -->
        <button
          @click="goto(1)"
          class="mt-2 w-full bg-primary hover:bg-primary-fixed text-on-primary
                 text-label-md font-mono py-2.5 px-4 rounded-xl transition-colors
                 flex justify-center items-center gap-2"
          style="box-shadow: var(--glow-primary)"
        >
          <span class="material-symbols-outlined text-[18px]">add</span>
          Nuevo Horario
        </button>
      </div>

      <!-- Navigation -->
      <div class="flex-1 overflow-y-auto py-4 flex flex-col gap-0.5">
        <template v-for="item in navItems" :key="item.step">
          <button
            @click="goto(item.step)"
            :aria-current="state.step === item.step ? 'page' : undefined"
            :class="[
              'w-full rounded-xl mx-2 my-0.5 px-4 py-3 flex items-center gap-3 transition-colors text-left',
              state.step === item.step
                ? 'bg-primary-container text-on-primary-container relative'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            ]"
            style="width: calc(100% - 16px)"
          >
            <!-- Active indicator -->
            <div
              v-if="state.step === item.step"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
            ></div>
            <!-- FIX: 'filled' applied in both desktop and mobile consistently -->
            <span
              class="material-symbols-outlined text-[20px]"
              :class="state.step === item.step ? 'filled' : ''"
            >{{ item.icon }}</span>
            <span class="text-label-md font-mono flex-1">{{ item.label }}</span>
            <!-- Badge -->
            <span
              v-if="badgeFor(item.step)"
              :class="[
                'text-label-md font-mono px-1.5 py-0.5 rounded-full border min-w-[20px] text-center',
                state.step === item.step
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
              ]"
            >{{ badgeFor(item.step) }}</span>
            <!-- Lock for Calendario if no events — with tooltip for context -->
            <span
              v-if="item.step === 4 && !badges.eventos"
              class="material-symbols-outlined text-[14px] opacity-40"
              title="Genera un horario primero en el paso de Parámetros"
              aria-label="Bloqueado: genera un horario primero"
            >lock</span>
          </button>
        </template>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-outline-variant/50 space-y-1">
        <!-- Backend + DB status — FIX: role="status" + shape indicator, not color only -->
        <div
          role="status"
          :aria-label="backendOk ? 'API conectada' : backendOk === false ? 'API inaccesible' : 'Verificando API'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant"
        >
          <!-- Shape icon differentiates state beyond color alone -->
          <span
            :class="[
              'material-symbols-outlined text-[14px] flex-shrink-0',
              backendOk === true  ? 'text-primary'  :
              backendOk === false ? 'text-error'     : 'text-outline'
            ]"
          >{{ backendOk === true ? 'check_circle' : backendOk === false ? 'cancel' : 'pending' }}</span>
          <span class="text-label-md font-mono text-on-surface-variant truncate">
            {{ backendOk === true ? 'API conectada' : backendOk === false ? 'API inaccesible' : 'verificando...' }}
          </span>
          <span
            v-if="dbOk !== null"
            :class="['ml-auto text-label-md font-mono px-1.5 py-0.5 rounded-full border',
              dbOk
                ? 'text-primary border-primary/30 bg-primary/10'
                : 'text-on-surface-variant border-outline-variant bg-surface-container'
            ]"
            :title="dbOk ? 'Base de datos conectada' : 'Base de datos no disponible'"
          >DB</span>
        </div>
        <!-- Ayuda — connected to help modal -->
        <button
          @click="helpOpen = true"
          class="w-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface
                 rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors text-label-md font-mono"
          aria-label="Abrir ayuda"
        >
          <span class="material-symbols-outlined text-[20px]">help</span>
          Ayuda
        </button>
      </div>
    </nav>

    <!-- ─── Mobile TopBar ─── -->
    <header class="md:hidden fixed top-0 w-full z-30 bg-surface-container-lowest border-b border-outline-variant
                   px-4 py-3 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined filled text-primary">school</span>
        <span class="font-sans font-black text-primary text-headline-sm">GestorAulas</span>
      </div>
      <!-- FIX: aria-label added to hamburger -->
      <button
        @click="mobileMenuOpen = !mobileMenuOpen"
        class="text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
        :aria-label="mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'"
        :aria-expanded="mobileMenuOpen"
      >
        <span class="material-symbols-outlined">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
      </button>
    </header>

    <!-- Mobile Menu Overlay -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden fixed inset-0 z-20 bg-background/90 backdrop-blur-sm pt-16"
      @click.self="mobileMenuOpen = false"
      role="dialog"
      aria-label="Menú de navegación"
      aria-modal="true"
    >
      <nav
        aria-label="Menú móvil"
        class="bg-surface-container border-r border-outline-variant h-full w-64 flex flex-col py-4 gap-0.5"
      >
        <template v-for="item in navItems" :key="item.step">
          <button
            @click="goto(item.step)"
            :aria-current="state.step === item.step ? 'page' : undefined"
            :class="[
              'mx-2 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors text-left',
              state.step === item.step
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            ]"
          >
            <!-- FIX: filled class now matches desktop logic -->
            <span
              class="material-symbols-outlined text-[20px]"
              :class="state.step === item.step ? 'filled' : ''"
            >{{ item.icon }}</span>
            <span class="text-label-md font-mono">{{ item.label }}</span>
            <span
              v-if="badgeFor(item.step)"
              class="ml-auto text-label-md font-mono px-1.5 py-0.5 rounded-full border
                     bg-surface-container-highest text-on-surface-variant border-outline-variant"
            >{{ badgeFor(item.step) }}</span>
          </button>
        </template>
      </nav>
    </div>

    <!-- ─── Main Content ─── -->
    <main id="main-content" class="flex-1 md:ml-64 h-full overflow-y-auto pt-16 md:pt-0">
      <div class="fade-up" :key="state.step">
        <DashboardPage  v-if="state.step === 0" @toast="toast" @goto="goto" />
        <MateriasPage   v-if="state.step === 1" @toast="toast" @next="goto(2)" />
        <ProfesoresPage v-if="state.step === 2" @toast="toast" @prev="goto(1)" @next="goto(3)" />
        <ParametrosPage v-if="state.step === 3" @toast="toast" @prev="goto(2)" @next="goto(4)" />
        <CalendarioPage v-if="state.step === 4" @toast="toast" @prev="goto(3)" />
      </div>
    </main>

    <!-- Toast global -->
    <UiToast :on="toastOn" :msg="toastMsg" :type="toastType" />

    <!-- ─── Help Modal ─── -->
    <div
      v-if="helpOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      @click.self="helpOpen = false"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div class="bg-surface-container border border-outline-variant rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div class="flex items-center justify-between mb-5">
          <h2 id="help-title" class="text-headline-sm font-sans text-on-surface font-bold">Guía Rápida</h2>
          <button
            @click="helpOpen = false"
            class="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high
                   rounded-lg p-1.5 transition-colors"
            aria-label="Cerrar ayuda"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <ol class="space-y-3">
          <li class="flex items-start gap-3">
            <span class="w-6 h-6 rounded-full bg-primary/15 text-primary text-label-md font-mono flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <div>
              <p class="text-body-sm text-on-surface font-medium">Configurar Materias</p>
              <p class="text-label-md font-mono text-on-surface-variant mt-0.5">Nombre, créditos, grupos y categoría de cada materia.</p>
            </div>
          </li>
          <li class="flex items-start gap-3">
            <span class="w-6 h-6 rounded-full bg-primary/15 text-primary text-label-md font-mono flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <div>
              <p class="text-body-sm text-on-surface font-medium">Registrar Profesores</p>
              <p class="text-label-md font-mono text-on-surface-variant mt-0.5">Asigna una o varias materias a cada docente.</p>
            </div>
          </li>
          <li class="flex items-start gap-3">
            <span class="w-6 h-6 rounded-full bg-primary/15 text-primary text-label-md font-mono flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <div>
              <p class="text-body-sm text-on-surface font-medium">Ejecutar el Solver</p>
              <p class="text-label-md font-mono text-on-surface-variant mt-0.5">Configura el tiempo y ejecuta el algoritmo CP-SAT.</p>
            </div>
          </li>
          <li class="flex items-start gap-3">
            <span class="w-6 h-6 rounded-full bg-secondary/15 text-secondary text-label-md font-mono flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
            <div>
              <p class="text-body-sm text-on-surface font-medium">Revisar el Calendario</p>
              <p class="text-label-md font-mono text-on-surface-variant mt-0.5">Visualiza, edita y verifica conflictos en el horario.</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>
