<script setup>
import { ref } from 'vue'

const apiBase = import.meta.env.VITE_API_BASE_URL
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

async function runHealth() {
  error.value = ''
  result.value = null
  try {
    const r = await fetch(`${apiBase}/health`)
    const data = await r.json()
    result.value = data
  } catch (e) {
    error.value = e.message || 'Error en /health'
  }
}

async function runAlgorithm() {
  error.value = ''
  result.value = null
  loading.value = true
  try {
    const payload = JSON.parse(inputText.value)
    const r = await fetch(`${apiBase}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data?.detail || `HTTP ${r.status}`)
    result.value = data
  } catch (e) {
    error.value = e.message || 'Error en /run'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main style="max-width: 900px; margin: 2rem auto; font-family: Arial, sans-serif;">
    <h1>Horarios Universidad - Tester API</h1>
    <p><b>API:</b> {{ apiBase }}</p>

    <div style="display:flex; gap:.5rem; margin: 1rem 0;">
      <button @click="runHealth">Probar /health</button>
      <button @click="runAlgorithm" :disabled="loading">
        {{ loading ? 'Ejecutando...' : 'Ejecutar /run' }}
      </button>
    </div>

    <label><b>Body /run (JSON):</b></label>
    <textarea
      v-model="inputText"
      rows="14"
      style="width:100%; font-family:Consolas, monospace; margin-top:.5rem;"
    />

    <p v-if="error" style="color:#ff4d4f; margin-top:1rem;"><b>Error:</b> {{ error }}</p>

    <pre v-if="result" style="margin-top:1rem; background:#111; color:#ddd; padding:1rem; border-radius:8px;">
{{ JSON.stringify(result, null, 2) }}
    </pre>
  </main>
</template>