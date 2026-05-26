import { describe, expect, it } from 'vitest'
import {
  SERVICE_PAYMENT_STATUSES,
  buildPaymentReviewState,
  canCustomerSubmitPaymentProof,
  getServicePaymentStatusLabel,
  isBookingStatusActive,
} from './serviceBooking'

describe('service booking flow helpers', () => {
  it('marks only new and confirmed bookings as active', () => {
    expect(isBookingStatusActive('new')).toBe(true)
    expect(isBookingStatusActive('confirmed')).toBe(true)
    expect(isBookingStatusActive('completed')).toBe(false)
  })

  it('allows payment proof submission only before approval or after rejection', () => {
    expect(canCustomerSubmitPaymentProof(SERVICE_PAYMENT_STATUSES.PENDING)).toBe(true)
    expect(canCustomerSubmitPaymentProof(SERVICE_PAYMENT_STATUSES.REJECTED)).toBe(true)
    expect(canCustomerSubmitPaymentProof(SERVICE_PAYMENT_STATUSES.PROOF_SUBMITTED)).toBe(false)
    expect(canCustomerSubmitPaymentProof(SERVICE_PAYMENT_STATUSES.PAID)).toBe(false)
  })

  it('returns clear labels for manual payment states', () => {
    expect(getServicePaymentStatusLabel(SERVICE_PAYMENT_STATUSES.PROOF_SUBMITTED)).toBe(
      'تم إرسال الإثبات'
    )
    expect(getServicePaymentStatusLabel(SERVICE_PAYMENT_STATUSES.REJECTED)).toBe(
      'مرفوض - أعد الإرسال'
    )
  })

  it('builds approve and reject review payloads', () => {
    expect(buildPaymentReviewState('approve', 'تم التأكد من التطبيق')).toEqual({
      paymentStatus: SERVICE_PAYMENT_STATUSES.PAID,
      paymentReviewNote: 'تم التأكد من التطبيق',
    })

    expect(buildPaymentReviewState('reject', 'الصورة غير واضحة')).toEqual({
      paymentStatus: SERVICE_PAYMENT_STATUSES.REJECTED,
      paymentReviewNote: 'الصورة غير واضحة',
    })
  })
})
