import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return {
    Authorization: `Bearer ${token}`
  }
}

export interface FundsVerificationResult {
  success: boolean
  sufficient_funds: boolean
  available_balance: number
  required_amount: number
  shortfall?: number
  currency: string
  message: string
}

export async function verifyFunds(amount: number, currency: string): Promise<FundsVerificationResult> {
  const response = await axios.post(
    `${API_BASE_URL}/api/verification/funds/`,
    {
      amount,
      currency
    },
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}

export async function verifyIdentity(data: any) {
  const response = await axios.post(
    `${API_BASE_URL}/api/verification/identity/`,
    data,
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}

export async function verifyAddress(data: any) {
  const response = await axios.post(
    `${API_BASE_URL}/api/verification/address/`,
    data,
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}
