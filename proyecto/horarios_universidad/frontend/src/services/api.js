const API_BASE_URL = '/api'

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`

  let response
  try {
    response = await fetch(url, options)
  } catch (error) {
    throw new Error(`No se pudo conectar con la API en ${url}. Verifica que esté levantada.`)
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json().catch(() => ({})) : await response.text().catch(() => '')

  if (!response.ok) {
    const detail = typeof body === 'object' ? body?.detail : body
    throw new Error(detail || `HTTP ${response.status} al llamar ${path}`)
  }

  return body
}

export function getApiHealth() {
  return request('/health')
}

export function getDbHealth() {
  return request('/db/health')
}

export function runScheduler(payload) {
  return request('/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
