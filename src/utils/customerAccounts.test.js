import { describe, expect, it } from 'vitest'
import {
  CUSTOMER_ACCOUNT_STATUSES,
  CUSTOMER_PHONE_VERIFICATION_STATUSES,
  buildCustomerAccountReviewState,
  getCustomerAccountStatusLabel,
  isCustomerAccountRestricted,
  isCustomerPhoneVerified,
} from './customerAccounts'

describe('customer account review helpers', () => {
  it('treats verified user or active account as allowed into customer flow', () => {
    expect(
      isCustomerPhoneVerified(
        CUSTOMER_PHONE_VERIFICATION_STATUSES.VERIFIED,
        null
      )
    ).toBe(true)
    expect(
      isCustomerPhoneVerified('pending', CUSTOMER_ACCOUNT_STATUSES.ACTIVE)
    ).toBe(true)
    expect(
      isCustomerPhoneVerified('pending', CUSTOMER_ACCOUNT_STATUSES.PENDING)
    ).toBe(false)
  })

  it('builds approve state for customer activation', () => {
    expect(buildCustomerAccountReviewState('approve')).toEqual({
      accountStatus: CUSTOMER_ACCOUNT_STATUSES.ACTIVE,
      phoneVerificationStatus: CUSTOMER_PHONE_VERIFICATION_STATUSES.VERIFIED,
      reviewReason: '',
    })
  })

  it('builds reject and suspend states with saved reason', () => {
    expect(buildCustomerAccountReviewState('reject', 'الرقم لا يخص صاحب الحساب')).toEqual({
      accountStatus: CUSTOMER_ACCOUNT_STATUSES.REJECTED,
      phoneVerificationStatus: CUSTOMER_PHONE_VERIFICATION_STATUSES.REJECTED,
      reviewReason: 'الرقم لا يخص صاحب الحساب',
    })

    expect(buildCustomerAccountReviewState('suspend', 'مراجعة داخلية')).toEqual({
      accountStatus: CUSTOMER_ACCOUNT_STATUSES.SUSPENDED,
      phoneVerificationStatus: CUSTOMER_PHONE_VERIFICATION_STATUSES.SUSPENDED,
      reviewReason: 'مراجعة داخلية',
    })
  })

  it('returns readable labels for account states', () => {
    expect(getCustomerAccountStatusLabel(CUSTOMER_ACCOUNT_STATUSES.PENDING)).toBe(
      'قيد المراجعة'
    )
    expect(getCustomerAccountStatusLabel(CUSTOMER_ACCOUNT_STATUSES.REJECTED)).toBe('مرفوض')
  })

  it('only restricts rejected and suspended accounts', () => {
    expect(
      isCustomerAccountRestricted(
        CUSTOMER_PHONE_VERIFICATION_STATUSES.PENDING,
        CUSTOMER_ACCOUNT_STATUSES.PENDING
      )
    ).toBe(false)

    expect(
      isCustomerAccountRestricted(
        CUSTOMER_PHONE_VERIFICATION_STATUSES.REJECTED,
        CUSTOMER_ACCOUNT_STATUSES.PENDING
      )
    ).toBe(true)

    expect(
      isCustomerAccountRestricted(
        CUSTOMER_PHONE_VERIFICATION_STATUSES.VERIFIED,
        CUSTOMER_ACCOUNT_STATUSES.SUSPENDED
      )

    ).toBe(true)
  })
})
