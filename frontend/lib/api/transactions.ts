import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface Transaction {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  type: 'payment' | 'refund' | 'payout'
  description?: string
  customer_email?: string
  customer_name?: string
  payment_method?: string
  created_at: string
  updated_at?: string
  // Admin-specific fields
  dispute_id?: string
  dispute_status?: string
  dispute_reason?: string
  dispute_created_at?: string
}

// Admin transaction API functions
export async function getAdminTransactions(params?: {
  user_id?: string
  status?: string
  page?: number
  limit?: number
}) {
  const response = await axios.get(`${API_BASE_URL}/api/v1/payments/admin/transactions/`, {
    headers: getAuthHeaders(),
    params
  })
  return response.data
}

export async function getAdminTransaction(id: string) {
  const response = await axios.get(`${API_BASE_URL}/api/v1/payments/admin/transactions/${id}/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function overrideTransactionStatus(id: string, status: string, reason: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/admin/transactions/${id}/override_status/`,
    { status, reason },
    { headers: getAuthHeaders() }
  )
  return response.data
}

export async function processAdminRefund(id: string, refundAmount?: number, reason?: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/admin/transactions/${id}/process_refund/`,
    { refund_amount: refundAmount, reason },
    { headers: getAuthHeaders() }
  )
  return response.data
}

export async function createTransactionDispute(id: string, reason: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/admin/transactions/${id}/create_dispute/`,
    { reason },
    { headers: getAuthHeaders() }
  )
  return response.data
}

export async function resolveTransactionDispute(id: string, resolution: string, action?: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/admin/transactions/${id}/resolve_dispute/`,
    { resolution, action },
    { headers: getAuthHeaders() }
  )
  return response.data
}

export async function manualCompleteTransaction(id: string, reason: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/admin/transactions/${id}/manual_complete/`,
    { reason },
    { headers: getAuthHeaders() }
  )
  return response.data
}

export async function getTransactions(params?: {
  status?: string
  start_date?: string
  end_date?: string
  page?: number
}) {
  const response = await axios.get(`${API_BASE_URL}/api/v1/merchants/transactions/`, {
    headers: getAuthHeaders(),
    params
  })
  return response.data
}

export async function getTransaction(id: string) {
  const response = await axios.get(`${API_BASE_URL}/api/v1/merchants/transactions/${id}/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function exportTransactions(params?: {
  status?: string
  start_date?: string
  end_date?: string
  format?: 'csv' | 'pdf'
}) {
  const response = await axios.get(`${API_BASE_URL}/api/v1/merchants/transactions/export/`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob'
  })
  return response.data
}

export async function refundTransaction(id: string, amount?: number, reason?: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/transactions/${id}/refund/`,
    { amount, reason },
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}
