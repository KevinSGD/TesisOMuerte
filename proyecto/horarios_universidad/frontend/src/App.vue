<script setup>
import { computed, onMounted, ref } from 'vue'
import { state, setStep } from './store/state'
import { getApiHealth, getDbHealth } from './services/api'
import DashboardPage from './pages/DashboardPage.vue'
import MateriasPage from './pages/MateriasPage.vue'
import ProfesoresPage from './pages/ProfesoresPage.vue'
import ParametrosPage from './pages/ParametrosPage.vue'
import CalendarioPage from './pages/CalendarioPage.vue'
import UiToast from './components/UiToast.vue'

const toastMsg  = ref('')
const toastType = ref('info')
const toastOn   = ref(false)
const backendOk = ref(null)
const dbOk      = ref(null)
const mobileMenuOpen = ref(false)

async function checkHealth() {
  try {
    const r = await getApiHealth()
    backendOk.value = !!r.ok
  } catch { backendOk.value = false }
  try {
    const r = await getDbHealth()
    dbOk.value = !!r.ok
  } catch { dbOk.value = false }
}

onMounted(checkHealth)

function toast(msg, type = 'info') {
  toastMsg.value  = msg
  toastType.value = type
  toastOn.value   = true
  window.clearTimeout(toast._t)
  toast._t = window.setTimeout(() => (toastOn.value = false), 3400)
}

function goto(n) {
  setStep(n)
  mobileMenuOpen.value = false
}

const navItems = [
  { step: 0, icon: 'dashboard',       label: 'Dashboard' },
  { step: 1, icon: 'book',            label: 'Materias' },
  { step: 2, icon: 'school',          label: 'Profesores' },
  { step: 3, icon: 'settings_suggest',label: 'Parámetros' },
  { step: 4, icon: 'calendar_month',  label: 'Calendario' },
]

const badges = computed(() => ({
  materias:   state.materias.length,
  profesores: state.profesores.length,
  asignados:  state.profesores.filter(p => p.materiaId).length,
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
  <div class="flex h-screen overflow-hidden bg-background text-on-background font-sans antialiased">

    <!-- ─── Sidebar Desktop ─── -->
    <nav
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
        <!-- CTA Nuevo Horario -->
        <button
          @click="goto(1)"
          class="mt-2 w-full bg-primary hover:bg-primary-container text-on-primary-container
                 text-label-md font-mono py-2.5 px-4 rounded-xl transition-colors
                 flex justify-center items-center gap-2
                 shadow-[0_0_15px_rgba(78,222,163,0.2)]"
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
            <span class="material-symbols-outlined text-[20px]" :class="state.step === item.step ? 'filled' : ''">
              {{ item.icon }}
            </span>
            <span class="text-label-md font-mono flex-1">{{ item.label }}</span>
            <!-- Badge -->
            <span
              v-if="badgeFor(item.step)"
              :class="[
                'text-[10px] font-mono px-1.5 py-0.5 rounded border min-w-[20px] text-center',
                state.step === item.step
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
              ]"
            >
              {{ badgeFor(item.step) }}
            </span>
            <!-- Lock for calendar if no events -->
            <span
              v-if="item.step === 4 && !badges.eventos"
              class="material-symbols-outlined text-[14px] opacity-40"
            >lock</span>
          </button>
        </template>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-outline-variant/50 space-y-1">
        <!-- Backend status -->
        <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant">
          <span
            :class="[
              'w-2 h-2 rounded-full flex-shrink-0',
              backendOk === true  ? 'bg-primary shadow-[0_0_6px_#4edea3]' :
              backendOk === false ? 'bg-error' : 'bg-outline animate-pulse'
            ]"
          ></span>
          <span class="text-label-md font-mono text-on-surface-variant truncate">
            {{ backendOk === true ? 'API conectada' : backendOk === false ? 'API inaccesible' : 'verificando...' }}
          </span>
          <span
            v-if="dbOk !== null"
            :class="['ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border',
              dbOk ? 'text-primary border-primary/30 bg-primary/10' : 'text-on-surface-variant border-outline-variant bg-surface-container'
            ]"
          >DB</span>
        </div>
        <!-- Help -->
        <button class="w-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface
                       rounded-xl px-4 py-2.5 flex items-center gap-3 transition-colors text-label-md font-mono">
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
      <button @click="mobileMenuOpen = !mobileMenuOpen" class="text-on-surface p-1">
        <span class="material-symbols-outlined">{{ mobileMenuOpen ? 'close' : 'menu' }}</span>
      </button>
    </header>

    <!-- Mobile Menu Overlay -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden fixed inset-0 z-20 bg-background/90 backdrop-blur-sm pt-16"
      @click.self="mobileMenuOpen = false"
    >
      <div class="bg-surface-container border-r border-outline-variant h-full w-64 flex flex-col py-4 gap-0.5">
        <template v-for="item in navItems" :key="item.step">
          <button
            @click="goto(item.step)"
            :class="[
              'mx-2 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors text-left',
              state.step === item.step
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            ]"
          >
            <span class="material-symbols-outlined text-[20px]">{{ item.icon }}</span>
            <span class="text-label-md font-mono">{{ item.label }}</span>
          </button>
        </template>
      </div>
    </div>

    <!-- ─── Main Content ─── -->
    <main class="flex-1 md:ml-64 h-full overflow-y-auto pt-16 md:pt-0">
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
  </div>
</template>
