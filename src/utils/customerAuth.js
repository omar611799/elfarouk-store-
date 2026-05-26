export const CUSTOMER_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeCustomerDigits(value) {
  return String(value || '').replace(/[\u0660-\u0669]/g, (digit) =>
    String(digit.charCodeAt(0) - 1632)
  )
}

export function normalizeCustomerPhone(value) {
  return normalizeCustomerDigits(value).replace(/\D/g, '').slice(0, 15)
}

export function toDateValue(value) {
  if (typeof value === 'number') return value
  if (value?.toDate) return value.toDate().getTime()
  if (value?.seconds) return value.seconds * 1000

  const parsed = Date.parse(String(value || ''))
  return Number.isNaN(parsed) ? Date.now() : parsed
}

export function normalizeCustomerEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function phoneToLegacyEmail(phone) {
  return `${normalizeCustomerPhone(phone)}@customer.elfarouk.local`
}

export function resolveCustomerLoginEmail(identifier) {
  const normalized = String(identifier || '').trim()
  if (!normalized) return ''
  return normalized.includes('@')
    ? normalizeCustomerEmail(normalized)
    : phoneToLegacyEmail(normalized)
}
