import { auth } from '../firebase/config'

async function buildHeaders(requireAuth = false) {
  const headers = {
    Accept: 'application/json',
  }

  if (!requireAuth) {
    return headers
  }

  const user = auth.currentUser
  if (!user) {
    throw new Error('Authentication required')
  }

  headers.Authorization = `Bearer ${await user.getIdToken()}`
  return headers
}

async function fetchJson(url, { requireAuth = false } = {}) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: await buildHeaders(requireAuth),
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load public data')
  }

  if (!payload) {
    throw new Error('Public data endpoint is unavailable in this environment')
  }

  return payload
}

export async function fetchPublicInvoice(id) {
  const params = new URLSearchParams({ id: String(id || '') })
  const payload = await fetchJson(`/api/public-invoice?${params.toString()}`)
  return payload.invoice || null
}

export async function fetchPublicQuote(id) {
  const params = new URLSearchParams({ id: String(id || '') })
  const payload = await fetchJson(`/api/public-quote?${params.toString()}`)
  return payload.quote || null
}
