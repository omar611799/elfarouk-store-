export const CUSTOMER_ACCOUNT_STATUSES = {
  PENDING: 'pending_phone_verification',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
}

export const CUSTOMER_PHONE_VERIFICATION_STATUSES = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
}

export function isCustomerAccountActive(status) {
  return status === CUSTOMER_ACCOUNT_STATUSES.ACTIVE
}

export function isCustomerPhoneVerified(phoneVerificationStatus, accountStatus) {
  return (
    phoneVerificationStatus === CUSTOMER_PHONE_VERIFICATION_STATUSES.VERIFIED ||
    accountStatus === CUSTOMER_ACCOUNT_STATUSES.ACTIVE
  )
}

export function isCustomerAccountRestricted(phoneVerificationStatus, accountStatus) {
  return (
    phoneVerificationStatus === CUSTOMER_PHONE_VERIFICATION_STATUSES.REJECTED ||
    phoneVerificationStatus === CUSTOMER_PHONE_VERIFICATION_STATUSES.SUSPENDED ||
    accountStatus === CUSTOMER_ACCOUNT_STATUSES.REJECTED ||
    accountStatus === CUSTOMER_ACCOUNT_STATUSES.SUSPENDED
  )
}

export function normalizeReviewReason(value) {
  return String(value || '').trim().slice(0, 240)
}

export function getCustomerAccountStatusLabel(status) {
  switch (status) {
    case CUSTOMER_ACCOUNT_STATUSES.ACTIVE:
      return 'مفعل'
    case CUSTOMER_ACCOUNT_STATUSES.REJECTED:
      return 'مرفوض'
    case CUSTOMER_ACCOUNT_STATUSES.SUSPENDED:
      return 'موقوف'
    default:
      return 'قيد المراجعة'
  }
}

export function buildCustomerAccountReviewState(action, reason = '') {
  const normalizedReason = normalizeReviewReason(reason)

  switch (action) {
    case 'approve':
      return {
        accountStatus: CUSTOMER_ACCOUNT_STATUSES.ACTIVE,
        phoneVerificationStatus: CUSTOMER_PHONE_VERIFICATION_STATUSES.VERIFIED,
        reviewReason: '',
      }
    case 'reject':
      return {
        accountStatus: CUSTOMER_ACCOUNT_STATUSES.REJECTED,
        phoneVerificationStatus: CUSTOMER_PHONE_VERIFICATION_STATUSES.REJECTED,
        reviewReason: normalizedReason,
      }
    case 'suspend':
      return {
        accountStatus: CUSTOMER_ACCOUNT_STATUSES.SUSPENDED,
        phoneVerificationStatus: CUSTOMER_PHONE_VERIFICATION_STATUSES.SUSPENDED,
        reviewReason: normalizedReason,
      }
    default:
      throw new Error('إجراء المراجعة غير مدعوم')
  }
}
