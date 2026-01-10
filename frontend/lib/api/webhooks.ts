import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const AVAILABLE_EVENTS = [
  { value: 'payment.success', label: 'Payment Success' },
  { value: 'payment.failed', label: 'Payment Failed' },
  { value: 'user.created', label: 'User Created' },
  { value: 'transaction.completed', label: 'Transaction Completed' }
]

export interface Webhook {
  id: number
  url: string
  events: string[]
  is_active: boolean
  created_at: string
  success_count?: number
  failure_count?: number
  last_triggered?: string
  secret?: string
}

export interface WebhookEvent {
  id: number
  webhook_id: number
  event_type: string
  status: string
  created_at: string
  response_status?: number
  retry_count?: number
  delivered_at?: string
  error_message?: string
  payload?: any
}

export async function getWebhooks(): Promise<Webhook[]> {
  const token = localStorage.getItem('access_token')
  const response = await axios.get(`${API_URL}/api/v1/admin/webhooks/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data.results || response.data || []
}

export async function createWebhook(data: Partial<Webhook>): Promise<Webhook> {
  const token = localStorage.getItem('access_token')
  const response = await axios.post(`${API_URL}/api/v1/admin/webhooks/`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function updateWebhook(id: number, data: Partial<Webhook>): Promise<Webhook> {
  const token = localStorage.getItem('access_token')
  const response = await axios.patch(`${API_URL}/api/v1/admin/webhooks/${id}/`, data, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function deleteWebhook(id: number): Promise<void> {
  const token = localStorage.getItem('access_token')
  await axios.delete(`${API_URL}/api/v1/admin/webhooks/${id}/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function testWebhook(id: number): Promise<{ message: string }> {
  const token = localStorage.getItem('access_token')
  const response = await axios.post(`${API_URL}/api/v1/admin/webhooks/${id}/test/`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function getWebhookEvents(webhookId?: number): Promise<WebhookEvent[]> {
  const token = localStorage.getItem('access_token')
  const url = webhookId 
    ? `${API_URL}/api/v1/admin/webhooks/${webhookId}/events/`
    : `${API_URL}/api/v1/admin/webhook-events/`
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data.results || response.data || []
}

export async function getWebhookStats() {
  const token = localStorage.getItem('access_token')
  const response = await axios.get(`${API_URL}/api/v1/admin/webhooks/stats/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function retryWebhookEvent(eventId: number): Promise<void> {
  const token = localStorage.getItem('access_token')
  await axios.post(`${API_URL}/api/v1/admin/webhook-events/${eventId}/retry/`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  })
}
