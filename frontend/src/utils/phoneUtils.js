// Phone number utility functions
// Supports Lebanese (961) and Syrian (963) country codes

export const COUNTRY_CODES = [
  { code: '961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '963', country: 'Syria', flag: '🇸🇾' }
]

export const DEFAULT_COUNTRY_CODE = '961' // Lebanese

/**
 * Parse phone number to extract country code and mobile number
 * Handles formats like: "9611234567", "+9611234567", "1234567" (assumes default country code)
 */
export const parsePhoneNumber = (phone) => {
  if (!phone) return { mobile: '', mobileCountryCode: DEFAULT_COUNTRY_CODE }
  
  // Remove all non-digit characters except leading +
  const phoneStr = phone.toString().trim().replace(/[^\d+]/g, '').replace(/^\+/, '')
  
  if (!phoneStr) return { mobile: '', mobileCountryCode: DEFAULT_COUNTRY_CODE }
  
  // Check for Lebanese code (961)
  if (phoneStr.startsWith('961') && phoneStr.length >= 10) {
    return {
      mobile: phoneStr.substring(3),
      mobileCountryCode: '961'
    }
  }
  
  // Check for Syrian code (963)
  if (phoneStr.startsWith('963') && phoneStr.length >= 10) {
    return {
      mobile: phoneStr.substring(3),
      mobileCountryCode: '963'
    }
  }
  
  // If no recognized country code, assume it's just the mobile number
  // Default to Lebanese country code
  return {
    mobile: phoneStr,
    mobileCountryCode: DEFAULT_COUNTRY_CODE
  }
}

/**
 * Format phone number for display
 * Returns format: +961 12 345 678
 */
export const formatPhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') return 'Not provided'
  
  const parsed = parsePhoneNumber(phone)
  if (!parsed.mobile || parsed.mobile.trim() === '') return 'Not provided'
  
  // Format mobile number with spaces for readability (if it's 7-8 digits)
  let formattedMobile = parsed.mobile
  if (parsed.mobile.length >= 7) {
    // Format as: 12 345 678 or 1 234 5678
    if (parsed.mobile.length === 7) {
      formattedMobile = parsed.mobile.replace(/(\d{1})(\d{3})(\d{3})/, '$1 $2 $3')
    } else if (parsed.mobile.length === 8) {
      formattedMobile = parsed.mobile.replace(/(\d{2})(\d{3})(\d{3})/, '$1 $2 $3')
    }
  }
  
  return `+${parsed.mobileCountryCode} ${formattedMobile}`
}

/**
 * Combine country code and mobile number into full phone string
 */
export const combinePhoneNumber = (countryCode, mobile) => {
  if (!mobile) return ''
  return `${countryCode || DEFAULT_COUNTRY_CODE}${mobile}`
}

