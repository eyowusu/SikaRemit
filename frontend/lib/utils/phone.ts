// Countries array - loaded dynamically from API
// This is populated by the loadCountriesForPhone function
export let COUNTRIES: { code: string; name: string; dialCode: string; flag: string; currency: string }[] = []

// Fallback countries if API fails
const FALLBACK_COUNTRIES = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', currency: 'GBP' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', currency: 'CAD' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', currency: 'AUD' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', currency: 'EUR' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', currency: 'EUR' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', currency: 'EUR' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', currency: 'EUR' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', currency: 'EUR' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', currency: 'CHF' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', currency: 'EUR' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', currency: 'SEK' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', currency: 'NOK' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', currency: 'DKK' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', currency: 'EUR' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', currency: 'JPY' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', currency: 'KRW' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', currency: 'CNY' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', currency: 'INR' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', currency: 'SGD' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', currency: 'MYR' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', currency: 'THB' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', currency: 'IDR' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', currency: 'PHP' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', currency: 'VND' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', currency: 'HKD' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼', currency: 'TWD' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', currency: 'ZAR' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', currency: 'BRL' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', currency: 'MXN' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', currency: 'ARS' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', currency: 'CLP' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', currency: 'COP' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', currency: 'PEN' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪', currency: 'VES' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨', currency: 'USD' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾', currency: 'UYU' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾', currency: 'PYG' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴', currency: 'BOB' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', currency: 'GHS' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', currency: 'NGN' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', currency: 'KES' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿', currency: 'TZS' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬', currency: 'UGX' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼', currency: 'RWF' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲', currency: 'ZMW' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼', currency: 'ZWD' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼', currency: 'BWP' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿', currency: 'MZN' },
  { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴', currency: 'AOA' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦', currency: 'NAD' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', flag: '🇱🇸', currency: 'LSL' },
  { code: 'SZ', name: 'Eswatini', dialCode: '+268', flag: '🇸🇿', currency: 'SZL' }
]

// Load countries from API for phone utilities
let countriesLoaded = false

export async function loadCountriesForPhone(): Promise<void> {
  if (countriesLoaded && COUNTRIES.length > 0) return
  
  // Use fallback countries for now until backend API is ready
  COUNTRIES.length = 0
  COUNTRIES.push(...FALLBACK_COUNTRIES)
  countriesLoaded = true
  
  /*
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${API_URL}/api/payments/countries/`)
    if (response.ok) {
      const data = await response.json()
      const countryList = Array.isArray(data) ? data : (data.results || [])
      COUNTRIES.length = 0
      COUNTRIES.push(...countryList
        .filter((c: any) => c.is_active)
        .map((c: any) => ({
          code: c.code,
          name: c.name,
          dialCode: c.phone_code?.startsWith('+') ? c.phone_code : `+${c.phone_code || ''}`,
          flag: c.flag_emoji || '',
          currency: c.currency_code || c.currency?.code || ''
        }))
      )
      countriesLoaded = true
    } else {
      // Use fallback if API fails
      COUNTRIES.length = 0
      COUNTRIES.push(...FALLBACK_COUNTRIES)
      countriesLoaded = true
    }
  } catch (error) {
    console.error('Failed to load countries for phone utilities:', error)
    // Use fallback countries
    COUNTRIES.length = 0
    COUNTRIES.push(...FALLBACK_COUNTRIES)
    countriesLoaded = true
  }
  */
}

// Initialize on module load (async)
loadCountriesForPhone()

export function getCountryInfo(code: string) {
  return COUNTRIES.find(country => country.code === code)
}

export function formatPhoneNumber(phone: string, countryCode: string): string {
  const country = getCountryInfo(countryCode)
  if (!country) return phone
  
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Add country dial code if not present
  if (!cleaned.startsWith(country.dialCode.replace('+', ''))) {
    return `${country.dialCode}${cleaned}`
  }
  
  return `+${cleaned}`
}

export function validatePhoneNumber(phone: string, countryCode: string): boolean {
  const country = getCountryInfo(countryCode)
  if (!country) return false
  
  const cleaned = phone.replace(/\D/g, '')
  
  // Basic validation - check if it starts with the country code
  return cleaned.startsWith(country.dialCode.replace('+', ''))
}
