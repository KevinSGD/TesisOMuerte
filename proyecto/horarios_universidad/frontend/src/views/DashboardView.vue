<script setup>
import { onMounted, ref } from 'vue'
import StatusCard from '../components/StatusCard.vue'
import { getApiHealth, getDbHealth } from '../services/api'

const apiBase = 'Proxy configurado (/api)'
const apiStatus = ref({ state: 'unknown', value: 'Sin verificar' })
const dbStatus = ref({ state: 'unknown', value: 'Sin verificar' })
const loading = ref(false)
const lastCheck = ref('-')
const error = ref('')

async function checkServices() {
  loading.value = true
  error.value = ''
  try {
    const [api, db] = await Promise.all([getApiHealth(), getDbHealth()])

    apiStatus.value = {
      state: api?.ok ? 'success' : 'error',
      value: api?.ok ? 'API Online' : 'API Offline',
    }

    dbStatus.value = {
      state: db?.ok ? 'success' : 'error',
      value: db?.ok ? 'DB Conectada' : 'DB Sin conexión',
    }
  } catch (e) {
    error.value = e.message || 'Error al verificar servicios'
    apiStatus.value = { state: 'error', value: 'Error de conexión' }
    dbStatus.value = { state: 'error', value: 'Error de conexión' }
  } finally {
    lastCheck.value = new Date().toLocaleString()
    loading.value = false
  }
}

onMounted(checkServices)
</script>

<template>
  <div class="stack">
    <div class="card">
      <h2>Estado del Sistema</h2>
      <p class="muted">Base API: {{ apiBase }}</p>

      <div class="status-grid">
        <StatusCard label="Servicio API" :value="apiStatus.value" :state="apiStatus.state" />
        <StatusCard label="PostgreSQL (Supabase)" :value="dbStatus.value" :state="dbStatus.state" />
      </div>

      <div class="actions-row">
        <button class="btn-primary" :disabled="loading" @click="checkServices">
          {{ loading ? 'Verificando...' : 'Verificar API + DB' }}
        </button>
        <span class="muted">Última verificación: {{ lastCheck }}</span>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>
    </div>
  </div>
</template>
