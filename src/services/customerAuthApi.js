async function fetchJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body || {}),
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(payload?.error || 'تعذر إكمال الطلب')
  }

  return payload || {}
}

export function requestCustomerVerificationCode(payload) {
  return fetchJson('/api/customer-auth-request-code', payload)
}

export function verifyCustomerVerificationCode(payload) {
  return fetchJson('/api/customer-auth-verify-code', payload)
}
