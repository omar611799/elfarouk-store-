export const ACTIVE_SERVICE_BOOKING_STATUSES = new Set(['new', 'confirmed'])
export const SERVICE_PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROOF_SUBMITTED: 'proof_submitted',
  PAID: 'paid',
  REJECTED: 'rejected',
  FAILED: 'failed',
}

export function isBookingStatusActive(status) {
  return ACTIVE_SERVICE_BOOKING_STATUSES.has(String(status || ''))
}

export function canCustomerSubmitPaymentProof(status) {
  return [
    SERVICE_PAYMENT_STATUSES.PENDING,
    SERVICE_PAYMENT_STATUSES.REJECTED,
  ].includes(String(status || ''))
}

export function getServicePaymentStatusLabel(status) {
  switch (status) {
    case SERVICE_PAYMENT_STATUSES.PROOF_SUBMITTED:
      return 'تم إرسال الإثبات'
    case SERVICE_PAYMENT_STATUSES.PAID:
      return 'تمت مراجعة التحويل'
    case SERVICE_PAYMENT_STATUSES.REJECTED:
      return 'مرفوض - أعد الإرسال'
    case SERVICE_PAYMENT_STATUSES.FAILED:
      return 'فشل الدفع'
    default:
      return 'بانتظار الدفع'
  }
}

export function buildPaymentReviewState(action, note = '') {
  const reviewNote = String(note || '').trim().slice(0, 240)

  switch (action) {
    case 'approve':
      return {
        paymentStatus: SERVICE_PAYMENT_STATUSES.PAID,
        paymentReviewNote: reviewNote,
      }
    case 'reject':
      return {
        paymentStatus: SERVICE_PAYMENT_STATUSES.REJECTED,
        paymentReviewNote: reviewNote,
      }
    default:
      throw new Error('إجراء مراجعة الدفع غير مدعوم')
  }
}
