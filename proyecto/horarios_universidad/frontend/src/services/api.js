const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const detail = typeof body === 'object' ? body?.detail : body
    throw new Error(detail || `HTTP ${response.status}`)
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
