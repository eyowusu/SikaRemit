import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return {
    Authorization: `Bearer ${token}`
  }
}

export interface Session {
  id: string
  device: string
  browser: string
  os: string
  ip_address: string
  location: string
  is_current: boolean
  last_active: string
  created_at: string
}

export interface SessionAnalytics {
  total_sessions: number
  active_sessions: number
  devices: Array<{
    device: string
    count: number
  }>
  locations: Array<{
    location: string
    count: number
  }>
}

export async function getSessions(): Promise<Session[]> {
  const response = await axios.get(`${API_BASE_URL}/api/sessions/`, {
    headers: getAuthHeaders()
  })
  return response.data.results || response.data
}

export async function logoutSession(sessionId: string) {
  const response = await axios.delete(`${API_BASE_URL}/api/sessions/${sessionId}/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function logoutOtherSessions() {
  const response = await axios.post(`${API_BASE_URL}/api/sessions/logout-others/`, {}, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function getSessionAnalytics(): Promise<SessionAnalytics> {
  const response = await axios.get(`${API_BASE_URL}/api/sessions/analytics/`, {
    headers: getAuthHeaders()
  })
  return response.data
}
