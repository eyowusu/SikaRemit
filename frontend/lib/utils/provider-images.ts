// Utility function to get provider image based on name
export const getProviderImage = (providerName: string): string | null => {
  const normalizedName = providerName.toLowerCase().trim()
  console.log('getProviderImage called with:', providerName, 'normalized:', normalizedName)
  const mappings: Array<{ keys: string[], image: string }> = [
    { keys: ['mtn'], image: '/logos/mtn-momo.png' },
    { keys: ['airteltigo'], image: '/logos/AirtelTigo Money.jpg' },
    { keys: ['telecel'], image: '/logos/Telecel cash.jpg' },
    // Add more mappings as needed
  ]

  for (const mapping of mappings) {
    if (mapping.keys.some(key => normalizedName.includes(key))) {
      console.log('Match found for', providerName, 'returning', mapping.image)
      return mapping.image
    }
  }
  console.log('No match found for', providerName)
  return null
}
