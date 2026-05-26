import { describe, expect, it } from 'vitest'
import {
  normalizeCustomerEmail,
  normalizeCustomerPhone,
  resolveCustomerLoginEmail,
} from './customerAuth'

describe('customer login helpers', () => {
  it('normalizes phone input into digits only', () => {
    expect(normalizeCustomerPhone('٠١١2-79 30 685')).toBe('01127930685')
  })

  it('normalizes email before login', () => {
    expect(normalizeCustomerEmail('  TEST@Example.COM ')).toBe('test@example.com')
  })

  it('resolves phone login into legacy customer email', () => {
    expect(resolveCustomerLoginEmail('01127930685')).toBe(
      '01127930685@customer.elfarouk.local'
    )
  })

  it('keeps real email login intact after normalization', () => {
    expect(resolveCustomerLoginEmail('  TEST@Example.COM ')).toBe('test@example.com')
  })
})
