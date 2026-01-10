import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return {
    Authorization: `Bearer ${token}`
  }
}

export interface Subscription {
  id: string
  plan_id: string
  plan_name: string
  status: 'active' | 'paused' | 'cancelled' | 'expired'
  amount: number
  currency: string
  billing_cycle: 'monthly' | 'yearly'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  amount: number
  currency: string
  billing_cycle: 'monthly' | 'yearly'
  features: string[]
  is_popular: boolean
}

export interface SubscriptionUsage {
  transactions: number
  transactions_limit: number
  api_calls: number
  api_calls_limit: number
  storage_used: number
  storage_limit: number
}

export interface SubscriptionInvoice {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed'
  date: string
  download_url: string
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/payments/subscriptions/`, {
    headers: getAuthHeaders()
  })
  return response.data.results || response.data
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/payments/subscriptions/plans/`, {
    headers: getAuthHeaders()
  })
  return response.data.results || response.data
}

export async function getSubscriptionUsage(): Promise<SubscriptionUsage> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/payments/subscriptions/usage/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function getSubscriptionInvoices(): Promise<SubscriptionInvoice[]> {
  const response = await axios.get(`${API_BASE_URL}/api/v1/payments/subscriptions/invoices/`, {
    headers: getAuthHeaders()
  })
  return response.data.results || response.data
}

export async function createSubscription(planId: string, paymentMethodId: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/subscriptions/`,
    {
      plan_id: planId,
      payment_method_id: paymentMethodId
    },
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}

export async function cancelSubscription(subscriptionId: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/subscriptions/${subscriptionId}/cancel/`,
    {},
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}

export async function pauseSubscription(subscriptionId: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/subscriptions/${subscriptionId}/pause/`,
    {},
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}

export async function resumeSubscription(subscriptionId: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/subscriptions/${subscriptionId}/resume/`,
    {},
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}

export async function upgradeSubscription(subscriptionId: string, newPlanId: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/subscriptions/${subscriptionId}/upgrade/`,
    { new_plan_id: newPlanId },
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}

export async function downgradeSubscription(subscriptionId: string, newPlanId: string) {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/payments/subscriptions/${subscriptionId}/downgrade/`,
    { new_plan_id: newPlanId },
    {
      headers: getAuthHeaders()
    }
  )
  return response.data
}

export async function downloadInvoice(invoiceId: string) {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/payments/subscriptions/invoices/${invoiceId}/download/`,
    {
      headers: getAuthHeaders(),
      responseType: 'blob'
    }
  )
  return response.data
}
