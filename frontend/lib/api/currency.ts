import api from './axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Dynamic currency type - we'll use string union from API
export type Currency = string

// Dynamic currencies array - loaded from API
export let CURRENCIES: Currency[] = []

export const CURRENCY_SYMBOLS: Record<string, string> = {
  'GHS': '₵',
  'USD': '$',
  'EUR': '€',
  'GBP': '£'
}

// WebSocket service for real-time exchange rates
export class CurrencyWebSocketService {
  private ws: WebSocket | null = null
  private listeners: Array<(data: any) => void> = []

  connect() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    this.ws = new WebSocket(`${wsUrl}/ws/exchange-rates/`)
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.listeners.forEach(listener => listener(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  subscribe(callback: (data: any) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }
}

// Initialize currencies on module load
let currenciesLoaded = false

async function initializeCurrencies() {
  if (currenciesLoaded) return
  
  try {
    const currenciesData = await getCurrencies()
    if (currenciesData && currenciesData.length > 0) {
      CURRENCIES = currenciesData.map((c: any) => c.code)
      // Update symbols map
      currenciesData.forEach((c: any) => {
        CURRENCY_SYMBOLS[c.code] = c.symbol || '$'
      })
      currenciesLoaded = true
    }
  } catch (error) {
    console.error('Failed to initialize currencies:', error)
  }
}

// Initialize on import
// initializeCurrencies() // Commented out to avoid build issues</parameter

export interface ExchangeRatesResponse {
  base: string;
  rates: Record<string, number>;
}

export async function getExchangeRates(options: { base?: string } = {}): Promise<ExchangeRatesResponse> {
  const base = options.base || 'GHS'  // GHS is the system's base currency
  try {
    const response = await api.get(`/api/v1/payments/exchange-rates/?base=${base}`)
    // Handle APIResponse format: {success: true, data: {...}}
    const data = response.data.data || response.data
    
    // Validate the response format
    if (data && typeof data === 'object' && 'base' in data && 'rates' in data) {
      return {
        base: data.base as string,
        rates: data.rates as Record<string, number>
      }
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
    throw new Error('Unable to fetch exchange rates')
  }
}

export async function getCurrencies() {
  try {
    const response = await api.get('/api/v1/payments/currencies/')
    const currencies = response.data.results || response.data
    
    // Update the global arrays
    if (currencies && currencies.length > 0) {
      CURRENCIES.length = 0 // Clear array
      CURRENCIES.push(...currencies.map((c: any) => c.code))
      
      // Update symbols
      currencies.forEach((c: any) => {
        CURRENCY_SYMBOLS[c.code] = c.symbol || '$'
      })
    }
    
    return currencies
  } catch (error) {
    console.error('Failed to fetch currencies:', error)
    throw new Error('Unable to fetch currencies')
  }
}

export async function getCurrencyPreferences() {
  try {
    const response = await api.get('/api/v1/payments/currency-preferences/')
    return response.data
  } catch (error) {
    console.error('Failed to fetch currency preferences:', error)
    return null
  }
}

export async function updateCurrencyPreferences(preferences: any) {
  const response = await api.patch('/api/v1/payments/currency-preferences/', preferences)
  return response.data
}

export async function setExchangeRates(rates: Record<string, number>) {
  const response = await api.post('/api/v1/payments/currencies/set-rates/', { rates })
  return response.data
}

