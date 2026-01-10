import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Customer Invoice Types
export interface CustomerInvoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  customer_address?: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  created_at: string
  paid_at?: string
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
  tax_rate?: number
  payment_terms?: string
  notes?: string
}

export interface CreateCustomerInvoiceData {
  customer_name: string
  customer_email: string
  customer_phone?: string
  customer_address?: string
  due_date: string
  items: Array<{
    description: string
    quantity: number
    unit_price: number
  }>
  tax_rate?: number
  payment_terms?: string
  notes?: string
}

export interface CustomerInvoiceStats {
  total_invoices: number
  total_amount: number
  paid_amount: number
  pending_amount: number
  overdue_amount: number
}

// Merchant Invoice Types
export interface MerchantInvoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  created_at: string
  paid_at?: string
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
  notes?: string
}

export interface CreateMerchantInvoiceData {
  customer_name: string
  customer_email: string
  due_date: string
  items: Array<{
    description: string
    quantity: number
    unit_price: number
  }>
  notes?: string
}

// Union type for backwards compatibility
export type Invoice = CustomerInvoice | MerchantInvoice
export type CreateInvoiceData = CreateCustomerInvoiceData | CreateMerchantInvoiceData

// Constants
export const PAYMENT_TERMS = [
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_60', label: 'Net 60' },
  { value: 'due_on_receipt', label: 'Due on Receipt' },
]

export const INVOICE_STATUS_COLORS = {
  draft: 'gray',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'gray',
}

// ============================================================================
// CUSTOMER INVOICE OPERATIONS (General customers)
// ============================================================================

export async function getCustomerInvoices(params?: any): Promise<CustomerInvoice[]> {
  const response = await axios.get(`${API_BASE_URL}/api/invoices/`, {
    headers: getAuthHeaders(),
    params
  })
  return response.data.results || response.data
}

export async function createCustomerInvoice(data: CreateCustomerInvoiceData): Promise<CustomerInvoice> {
  const response = await axios.post(`${API_BASE_URL}/api/invoices/`, data, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function sendCustomerInvoice(invoiceId: string) {
  const response = await axios.post(`${API_BASE_URL}/api/invoices/${invoiceId}/send/`, {}, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function markCustomerInvoiceAsPaid(invoiceId: string) {
  const response = await axios.post(`${API_BASE_URL}/api/invoices/${invoiceId}/mark-paid/`, {}, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function downloadCustomerInvoice(invoiceId: string) {
  const response = await axios.get(`${API_BASE_URL}/api/invoices/${invoiceId}/download/`, {
    headers: getAuthHeaders(),
    responseType: 'blob'
  })
  return response.data
}

export async function getCustomerInvoiceStats(): Promise<CustomerInvoiceStats> {
  const response = await axios.get(`${API_BASE_URL}/api/invoices/stats/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

// ============================================================================
// MERCHANT INVOICE OPERATIONS (Merchant-specific)
// ============================================================================

export async function getMerchantInvoices(params?: { status?: string; page?: number }): Promise<MerchantInvoice[]> {
  const response = await axios.get(`${API_BASE_URL}/api/merchants/invoices/`, {
    headers: getAuthHeaders(),
    params
  })
  return response.data
}

export async function getMerchantInvoice(id: string): Promise<MerchantInvoice> {
  const response = await axios.get(`${API_BASE_URL}/api/merchants/invoices/${id}/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function createMerchantInvoice(data: CreateMerchantInvoiceData): Promise<MerchantInvoice> {
  const response = await axios.post(`${API_BASE_URL}/api/merchants/invoices/`, data, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function updateMerchantInvoice(id: string, data: Partial<CreateMerchantInvoiceData>): Promise<MerchantInvoice> {
  const response = await axios.patch(`${API_BASE_URL}/api/merchants/invoices/${id}/`, data, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function sendMerchantInvoice(id: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/merchants/invoices/${id}/send/`,
    {},
    { headers: getAuthHeaders() }
  )
  return response.data
}

export async function markMerchantInvoiceAsPaid(id: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/merchants/invoices/${id}/mark-paid/`,
    {},
    { headers: getAuthHeaders() }
  )
  return response.data
}

export async function deleteMerchantInvoice(id: string) {
  const response = await axios.delete(`${API_BASE_URL}/api/merchants/invoices/${id}/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

// ============================================================================
// BACKWARDS COMPATIBILITY ALIASES (for existing code)
// ============================================================================

/**
 * @deprecated Use getCustomerInvoices() or getMerchantInvoices() instead
 */
export const getInvoices = getCustomerInvoices

/**
 * @deprecated Use createCustomerInvoice() or createMerchantInvoice() instead
 */
export const createInvoice = createCustomerInvoice

/**
 * @deprecated Use sendCustomerInvoice() or sendMerchantInvoice() instead
 */
export const sendInvoice = sendCustomerInvoice

/**
 * @deprecated Use markCustomerInvoiceAsPaid() or markMerchantInvoiceAsPaid() instead
 */
export const markInvoiceAsPaid = markCustomerInvoiceAsPaid

/**
 * @deprecated Use getCustomerInvoiceStats() instead
 */
export const getInvoiceStats = getCustomerInvoiceStats

/**
 * @deprecated Use downloadCustomerInvoice() instead
 */
export const downloadInvoice = downloadCustomerInvoice

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function isCustomerInvoice(invoice: Invoice): invoice is CustomerInvoice {
  return 'tax_rate' in invoice || 'payment_terms' in invoice
}

export function isMerchantInvoice(invoice: Invoice): invoice is MerchantInvoice {
  return !isCustomerInvoice(invoice)
}

export function formatInvoiceAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

export function getInvoiceStatusColor(status: string): string {
  return INVOICE_STATUS_COLORS[status as keyof typeof INVOICE_STATUS_COLORS] || 'gray'
}

export function calculateInvoiceTotal(items: Array<{quantity: number, unit_price: number}>, taxRate: number = 0): number {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const tax = subtotal * (taxRate / 100)
  return subtotal + tax
}
