<script setup>
import { computed, onMounted, ref } from 'vue'
import { state, setStep } from './store/state'
import { getApiHealth } from './services/api'
import MateriasPage from './pages/MateriasPage.vue'
import ProfesoresPage from './pages/ProfesoresPage.vue'
import ParametrosPage from './pages/ParametrosPage.vue'
import CalendarioPage from './pages/CalendarioPage.vue'
import UiToast from './components/UiToast.vue'

const toastMsg = ref('')
const toastOn = ref(false)
const backendHealth = ref({ ok: null, message: 'verificando...' })

async function checkBackend() {
  try {
    const result = await getApiHealth()
    backendHealth.value.ok = !!result.ok
    backendHealth.value.message = result.ok ? 'backend disponible' : 'backend no disponible'
  } catch (err) {
    backendHealth.value.ok = false
    backendHealth.value.message = 'backend inaccesible'
  }
}

onMounted(() => {
  checkBackend()
})

function toast(msg) {
  toastMsg.value = msg
  toastOn.value = true
  window.clearTimeout(toast._t)
  toast._t = window.setTimeout(() => (toastOn.value = false), 3200)
}

const badges = computed(() => ({
  materias: state.materias.length,
  profesores: state.profesores.length,
  asignaciones: state.profesores.filter((p) => p.materiaId).length,
}))

function goto(n) {
  setStep(n)
}
</script>

<template>
  <aside class="sidebar">
    <div class="sb-logo">
      <div class="sb-logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 4v6M16 4v6" />
        </svg>
      </div>
      <div>
        <div class="sb-logo-text">SkedOpt</div>
        <div class="sb-logo-ver">Vue + Vite</div>
      </div>
    </div>

    <nav class="sb-nav">
      <div class="sb-label">Flujo</div>
      <div class="sb-item" :class="{ active: state.step === 1 }" role="button" tabindex="0" @click="goto(1)">
        Materias
        <span class="sb-badge">{{ badges.materias }}</span>
      </div>
      <div class="sb-item" :class="{ active: state.step === 2 }" role="button" tabindex="0" @click="goto(2)">
        Profesores
        <span class="sb-badge">{{ badges.profesores }}</span>
      </div>
      <div class="sb-item" :class="{ active: state.step === 3 }" role="button" tabindex="0" @click="goto(3)">
        Parámetros
        <span class="sb-badge">{{ badges.asignaciones || '—' }}</span>
      </div>
      <div class="sb-item" :class="{ active: state.step === 4 }" role="button" tabindex="0" @click="goto(4)">
        Calendario
        <span class="sb-badge">{{ state.calendario.eventos.length || '—' }}</span>
      </div>
    </nav>

    <div class="sb-footer">
      <div class="status-row">
        <div class="dot" :class="{ 'dot--ok': backendHealth.ok, 'dot--error': backendHealth.ok === false }"></div>
        <span>Interfaz lista — {{ backendHealth.message }}</span>
      </div>
    </div>
  </aside>

  <header class="topbar">
    <div class="topbar-title">Optimizador de Horarios</div>
    <div class="topbar-sub">INGENIERÍA DE SISTEMAS</div>
    <div class="steps">
      <div class="step" :class="{ active: state.step === 1, done: state.step > 1 }" @click="goto(1)">
        <div class="step-n">1</div><span class="step-label">Materias</span>
      </div>
      <div class="step-line" :class="{ done: state.step > 1 }"></div>
      <div class="step" :class="{ active: state.step === 2, done: state.step > 2 }" @click="goto(2)">
        <div class="step-n">2</div><span class="step-label">Profesores</span>
      </div>
      <div class="step-line" :class="{ done: state.step > 2 }"></div>
      <div class="step" :class="{ active: state.step === 3, done: state.step > 3 }" @click="goto(3)">
        <div class="step-n">3</div><span class="step-label">Parámetros</span>
      </div>
      <div class="step-line" :class="{ done: state.step > 3 }"></div>
      <div class="step" :class="{ active: state.step === 4 }" @click="goto(4)">
        <div class="step-n">4</div><span class="step-label">Calendario</span>
      </div>
    </div>
  </header>

  <main class="main">
    <section class="panel" :class="{ active: state.step === 1 }">
      <MateriasPage @toast="toast" @next="goto(2)" />
    </section>
    <section class="panel" :class="{ active: state.step === 2 }">
      <ProfesoresPage @toast="toast" @prev="goto(1)" @next="goto(3)" />
    </section>
    <section class="panel" :class="{ active: state.step === 3 }">
      <ParametrosPage @toast="toast" @prev="goto(2)" @next="goto(4)" />
    </section>
    <section class="panel" :class="{ active: state.step === 4 }">
      <CalendarioPage @toast="toast" @prev="goto(3)" />
    </section>
  </main>

  <UiToast :on="toastOn" :msg="toastMsg" />
</template>
