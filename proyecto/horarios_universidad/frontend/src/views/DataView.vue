<script setup>
import { ref } from 'vue'
import { runScheduler } from '../services/api'

const materiasText = ref(`[
  { "id": 1, "nombre": "Lógica", "categoria": "Software", "horas": 3, "grupos": 2 },
  { "id": 2, "nombre": "Ética", "categoria": "Humanidades", "horas": 2, "grupos": 1 }
]`)

const profesoresText = ref(`[
  { "nombre": "Ana", "codigo": "P001", "materias": [1] },
  { "nombre": "Luis", "codigo": "P002", "materias": [2] }
]`)

const loading = ref(false)
const error = ref('')
const result = ref(null)

async function runWithUiData() {
  loading.value = true
  error.value = ''
  result.value = null

  try {
    const materias = JSON.parse(materiasText.value)
    const profesores = JSON.parse(profesoresText.value)

    const payload = {
      seed: 42,
      num_profes: 20,
      num_salones_comunes: 10,
      num_salones_pc: 6,
      use_ui_data: true,
      materias,
      profesores,
    }

    result.value = await runScheduler(payload)
  } catch (e) {
    error.value = e.message || 'Error procesando datos de UI'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="stack">
    <div class="card">
      <h2>Datos desde Interfaz</h2>
      <p class="muted">Prueba <code>build_data_from_ui</code> enviando materias/profesores desde el frontend.</p>

      <div class="split-grid">
        <div>
          <label class="label">Materias (JSON)</label>
          <textarea v-model="materiasText" rows="12" class="editor" />
        </div>
        <div>
          <label class="label">Profesores (JSON)</label>
          <textarea v-model="profesoresText" rows="12" class="editor" />
        </div>
      </div>

      <div class="actions-row">
        <button class="btn-primary" :disabled="loading" @click="runWithUiData">
          {{ loading ? 'Ejecutando...' : 'Ejecutar /run con use_ui_data=true' }}
        </button>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>
      <pre v-if="result" class="response-box">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>
