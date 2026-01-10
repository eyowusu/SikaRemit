// Countries array - loaded dynamically from API
// This is populated by the loadCountriesForPhone function
export let COUNTRIES: { code: string; name: string; dialCode: string; flag: string; currency: string }[] = []

// Load countries from API for phone utilities
let countriesLoaded = false

export async function loadCountriesForPhone(): Promise<void> {
  if (countriesLoaded && COUNTRIES.length > 0) return
  
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
    }
  } catch (error) {
    console.error('Failed to load countries for phone utilities:', error)
  }
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
