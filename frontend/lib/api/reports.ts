import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const REPORT_TYPES = [
  { value: 'transactions', label: 'Transactions', description: 'Transaction history report' },
  { value: 'users', label: 'Users', description: 'User activity report' },
  { value: 'revenue', label: 'Revenue', description: 'Revenue analysis report' },
  { value: 'payments', label: 'Payments', description: 'Payment transactions report' }
]

export const REPORT_FORMATS = [
  { value: 'csv', label: 'CSV', icon: '📄' },
  { value: 'pdf', label: 'PDF', icon: '📕' },
  { value: 'excel', label: 'Excel', icon: '📊' }
]

export interface Report {
  id: number
  type: string
  report_type: string
  format: string
  status: string
  created_at: string
  date_from?: string
  date_to?: string
  file_url?: string
  total_records?: number
  file_size?: number
  created_by?: string
}

export interface ReportParams {
  report_type: string
  format: string
  date_from?: string
  date_to?: string
}

export async function generateReport(params: ReportParams): Promise<Report> {
  const token = localStorage.getItem('access_token')
  const response = await axios.post(`${API_URL}/api/admin/reports/generate/`, params, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export async function getReports(): Promise<Report[]> {
  const token = localStorage.getItem('access_token')
  const response = await axios.get(`${API_URL}/api/admin/reports/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data.results || response.data || []
}

export async function downloadReport(id: number): Promise<Blob> {
  const token = localStorage.getItem('access_token')
  const response = await axios.get(`${API_URL}/api/admin/reports/${id}/download/`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob'
  })
  return new Blob([response.data])
}

export async function deleteReport(id: number): Promise<void> {
  const token = localStorage.getItem('access_token')
  await axios.delete(`${API_URL}/api/admin/reports/${id}/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function getReportStats(params?: {
  report_type?: string
  date_from?: string
  date_to?: string
}): Promise<any> {
  const token = localStorage.getItem('access_token')
  const response = await axios.get(`${API_URL}/api/admin/reports/stats/`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  })
  return response.data
}
