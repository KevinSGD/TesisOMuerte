import { onMounted, ref } from 'vue'
import { getApiHealth, getDbHealth } from '../services/api'

/**
 * Shared composable for API + DB health status.
 * Import here instead of calling in each page component.
 */
export function useHealthCheck() {
  const backendOk = ref(null)
  const dbOk      = ref(null)

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

  return { backendOk, dbOk, checkHealth }
}
