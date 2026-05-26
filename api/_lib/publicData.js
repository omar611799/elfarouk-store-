function sanitizeText(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength)
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toInteger(value) {
  return Math.max(0, Math.trunc(toNumber(value)))
}

export function normalizePhone(value) {
  return String(value || '')
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/\D/g, '')
    .slice(0, 15)
}

export function serializeTimestamp(value) {
  if (!value) return null
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value._seconds === 'number') {
    return value._seconds * 1000 + Math.round((value._nanoseconds || 0) / 1e6)
  }
  if (value instanceof Date) return value.getTime()

  const parsed = Date.parse(String(value))
  return Number.isNaN(parsed) ? null : parsed
}

function serializeCustomerData(data = {}, fallbackPhone = '') {
  return {
    name: sanitizeText(data.name, 120),
    phone: normalizePhone(data.phone || fallbackPhone),
    carModel: sanitizeText(data.carModel, 120),
    licensePlate: sanitizeText(data.licensePlate, 40),
    nationalId: sanitizeText(data.nationalId, 40),
  }
}

function serializeLineItem(item = {}) {
  return {
    id: sanitizeText(item.id, 80),
    name: sanitizeText(item.name, 240),
    qty: toNumber(item.qty),
    price: toNumber(item.price),
    cost: toNumber(item.cost),
    returnedQty: toNumber(item.returnedQty),
    reminderMonths: toInteger(item.reminderMonths),
  }
}

function serializePayments(payments = {}) {
  return {
    cash: toNumber(payments.cash),
    visa: toNumber(payments.visa),
    instapay: toNumber(payments.instapay),
  }
}

export function serializeInvoiceSnapshot(snapshot) {
  const data = snapshot.data() || {}

  return {
    id: snapshot.id,
    number: sanitizeText(data.number, 40),
    items: Array.isArray(data.items) ? data.items.map(serializeLineItem) : [],
    total: toNumber(data.total),
    paidAmount: toNumber(data.paidAmount),
    dueAmount: toNumber(data.dueAmount),
    paymentStatus: sanitizeText(data.paymentStatus, 20),
    payments: serializePayments(data.payments),
    customerData: serializeCustomerData(data.customerData),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  }
}

export function serializeQuoteSnapshot(snapshot) {
  const data = snapshot.data() || {}

  return {
    id: snapshot.id,
    number: sanitizeText(data.number, 40),
    items: Array.isArray(data.items) ? data.items.map(serializeLineItem) : [],
    total: toNumber(data.total),
    customerData: serializeCustomerData(data.customerData),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  }
}

export function serializeCustomerRecord(data = {}, fallbackPhone = '') {
  return {
    name: sanitizeText(data.name, 120),
    phone: normalizePhone(data.phone || fallbackPhone),
    carModel: sanitizeText(data.carModel, 120),
    totalSpent: toNumber(data.totalSpent),
    invoiceCount: toInteger(data.invoiceCount),
    debtTotal: toNumber(data.debtTotal),
    paidTotal: toNumber(data.paidTotal),
  }
}

export function getPublicApiErrorStatus(error) {
  const message = String(error?.message || '')
  if (message.includes('Missing Firebase Admin credentials')) {
    return 503
  }
  return 500
}
