/**
 * Utility for normalizing and validating Egyptian phone numbers
 */

// Convert Arabic-Indic numerals to standard Latin numerals (0-9)
export function normalizeArabicDigits(str = '') {
  if (!str) return ''
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return String(str).replace(/[٠-٩]/g, (d) => arabicDigits.indexOf(d))
}

/**
 * Normalizes an Egyptian phone number into standard local canonical format: 01XXXXXXXXX (11 digits)
 * Handles inputs like: +20 101 234 5678, 00201012345678, 201012345678, 010-1234-5678
 */
export function normalizeEgyptianPhone(phone = '') {
  if (!phone) return ''
  
  // 1. Convert Arabic numerals to ASCII
  let cleaned = normalizeArabicDigits(String(phone))
  
  // 2. Remove all non-digit characters
  cleaned = cleaned.replace(/\D/g, '')

  if (!cleaned) return ''

  // 3. Remove leading international prefixes for Egypt (20 or 0020)
  if (cleaned.startsWith('0020')) {
    cleaned = cleaned.slice(4)
  } else if (cleaned.startsWith('20') && cleaned.length >= 12) {
    cleaned = cleaned.slice(2)
  }

  // 4. Ensure it starts with 0
  if (!cleaned.startsWith('0') && cleaned.length === 10 && (cleaned.startsWith('10') || cleaned.startsWith('11') || cleaned.startsWith('12') || cleaned.startsWith('15'))) {
    cleaned = '0' + cleaned
  }

  return cleaned
}

/**
 * Format Egyptian phone for WhatsApp wa.me link (e.g. 201012345678)
 */
export function formatPhoneForWhatsApp(phone = '') {
  const norm = normalizeEgyptianPhone(phone)
  if (!norm) return ''
  if (norm.startsWith('0') && norm.length === 11) {
    return '2' + norm
  }
  return norm
}

/**
 * Validates if a phone is a valid Egyptian mobile number (11 digits starting with 010, 011, 012, 015)
 */
export function isValidEgyptianPhone(phone = '') {
  const norm = normalizeEgyptianPhone(phone)
  return /^01[0125][0-9]{8}$/.test(norm)
}
