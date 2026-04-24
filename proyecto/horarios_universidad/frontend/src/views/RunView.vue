<script setup>
import { ref } from 'vue'
import { runScheduler } from '../services/api'

const loading = ref(false)
const error = ref('')
const result = ref(null)

const inputText = ref(`{
  "seed": 42,
  "num_profes": 20,
  "num_salones_comunes": 10,
  "num_salones_pc": 6,
  "use_ui_data": false,
  "materias": [],
  "profesores": []
}`)

async function executeRun() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const payload = JSON.parse(inputText.value)
    result.value = await runScheduler(payload)
  } catch (e) {
    error.value = e.message || 'No se pudo ejecutar /run'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="stack">
    <div class="card">
      <h2>Generación de Horario</h2>
      <p class="muted">Ejecuta el endpoint <code>/run</code> con parámetros personalizables.</p>

      <label class="label">Body /run (JSON)</label>
      <textarea v-model="inputText" rows="14" class="editor" />

      <div class="actions-row">
        <button class="btn-primary" :disabled="loading" @click="executeRun">
          {{ loading ? 'Ejecutando...' : 'Ejecutar /run' }}
        </button>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <pre v-if="result" class="response-box">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>
