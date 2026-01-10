import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface Payout {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  bank_account?: string
  created_at: string
  completed_at?: string
}

export interface Balance {
  available: number
  pending: number
  currency: string
}

export async function getBalance() {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/merchant/payouts/balance/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function getPayouts(params?: { status?: string; page?: number }) {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/merchant/payouts/`, {
    headers: getAuthHeaders(),
    params
  })
  return response.data
}

export async function requestPayout(amount: number, bank_account_id?: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/accounts/merchant/payouts/`,
    { amount, bank_account_id },
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}

export async function getPayout(id: string) {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/merchant/payouts/${id}/`, {
    headers: getAuthHeaders()
  })
  return response.data
}
