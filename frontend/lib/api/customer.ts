import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return {
    Authorization: `Bearer ${token}`
  }
}

export interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  merchant: string
  description: string
  created_at: string
  payment_method: string
}

export interface Receipt {
  id: string
  payment_id: string
  amount: number
  currency: string
  merchant: string
  date: string
  receipt_number: string
  download_url: string
}

export interface AccountBalance {
  available: number
  pending: number
  currency: string
  last_updated: string
}

export async function getCustomerPayments(params?: any): Promise<Payment[]> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/customers/payments/`, {
    headers: getAuthHeaders(),
    params
  })
  return response.data.data || response.data.results || response.data || []
}

export async function getCustomerReceipts(): Promise<Receipt[]> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/customers/receipts/`, {
    headers: getAuthHeaders()
  })

  const data = response.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.receipts)) return data.receipts
  return []
}

export async function getAccountBalance(): Promise<AccountBalance> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/customers/balance/`, {
    headers: getAuthHeaders()
  })
  return response.data.data || response.data
}

export async function getCurrentCustomerProfile() {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/customers/profile/`, {
    headers: getAuthHeaders()
  })
  return response.data.data || response.data
}

export async function updateCustomerProfile(data: any) {
  const response = await axios.patch(`${API_BASE_URL}/api/v1/accounts/customers/profile/`, data, {
    headers: getAuthHeaders()
  })
  return response.data
}

// Support Ticket API functions
export async function getSupportTickets(): Promise<any[]> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/customers/support-tickets/`, {
    headers: getAuthHeaders()
  })
  return response.data.results || response.data
}

export async function getSupportTicket(ticketId: string): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/customers/support-tickets/${ticketId}/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function createSupportTicket(data: any): Promise<any> {
  const response = await axios.post(`${API_BASE_URL}/api/v1/accounts/customers/support-tickets/`, data, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function addSupportMessage(ticketId: string, message: string): Promise<any> {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/accounts/customers/support-tickets/${ticketId}/messages/`,
    { message },
    { headers: getAuthHeaders() }
  )
  return response.data
}

export interface CustomerStats {
  transactions_this_month: number;
  success_rate: number;
  total_transactions: number;
  completed_transactions: number;
  failed_transactions: number;
}

export async function getCustomerStats(): Promise<CustomerStats> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/accounts/customers/stats/`, {
    headers: getAuthHeaders()
  })
  return response.data.data || response.data
}
