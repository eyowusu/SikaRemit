export function getCardType(cardNumber: string): string | null {
  if (!cardNumber) return null
  
  // Remove spaces and non-numeric characters
  const cleanNumber = cardNumber.replace(/\D/g, '')
  
  // Visa: starts with 4
  if (/^4/.test(cleanNumber)) return 'visa'
  
  // Mastercard: starts with 5[1-5] or 2[2-7]
  if (/^(5[1-5]|2[2-7])/.test(cleanNumber)) return 'mastercard'
  
  // American Express: starts with 34 or 37
  if (/^3[47]/.test(cleanNumber)) return 'amex'
  
  // Discover: starts with 6011, 622126-622925, 644-649, or 65
  if (/^(6011|622(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5]))|64[4-9]|65)/.test(cleanNumber)) {
    return 'discover'
  }
  
  // JCB: starts with 35
  if (/^35/.test(cleanNumber)) return 'jcb'
  
  // Diners Club: starts with 30[0-5], 36, or 38
  if (/^3[068]/.test(cleanNumber)) return 'diners'
  
  return null
}

export function getMobileProvider(phoneNumber: string): string | null {
  if (!phoneNumber) return null

  // Remove spaces and non-numeric characters except +
  const cleanNumber = phoneNumber.replace(/[^+\d]/g, '')

  // Extract the last 10 digits (Ghanaian mobile numbers are 10 digits)
  const last10Digits = cleanNumber.replace(/^\+?233/, '').slice(-10)

  if (last10Digits.length < 3) return null

  // Get the first 3 digits after removing country code
  const prefix = last10Digits.substring(0, 3)

  // MTN prefixes: 024, 054, 055, 059, 025, 053, 056, 057
  if (['024', '054', '055', '059', '025', '053', '056', '057'].includes(prefix)) {
    return 'mtn_momo'
  }

  // AirtelTigo prefixes: 026, 056, 027, 057, 058
  // Note: 056 is shared between MTN and AirtelTigo, but we'll prioritize MTN for now
  if (['026', '027', '057', '058'].includes(prefix)) {
    return 'airtel_tigo'
  }

  // Telecel prefixes: 020, 023, 050, 053, 054
  // Note: 053 and 054 are shared but we'll check Telecel after MTN
  if (['020', '023', '050'].includes(prefix) || (['053', '054'].includes(prefix) && !['024', '054', '055', '059', '025', '053', '056', '057'].includes(prefix))) {
    return 'telecel'
  }

  return null
}
