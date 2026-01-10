import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return {
    Authorization: `Bearer ${token}`
  }
}

export interface AccountBalance {
  available: number
  pending: number
  currency: string
  last_updated: string
}

export async function getAccountBalance(): Promise<AccountBalance> {
  const response = await axios.get(`${API_BASE_URL}/api/accounts/balance/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function getAccountDetails() {
  const response = await axios.get(`${API_BASE_URL}/api/accounts/details/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function updateAccountSettings(settings: any) {
  const response = await axios.patch(`${API_BASE_URL}/api/accounts/settings/`, settings, {
    headers: getAuthHeaders()
  })
  return response.data
}
