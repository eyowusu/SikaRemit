import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface Store {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface CreateStoreData {
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
}

export async function getStores() {
  const response = await axios.get(`${API_BASE_URL}/api/v1/merchants/stores/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function getStore(id: string) {
  const response = await axios.get(`${API_BASE_URL}/api/v1/merchants/stores/${id}/`, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function createStore(data: CreateStoreData) {
  const response = await axios.post(`${API_BASE_URL}/api/v1/merchants/stores/`, data, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function updateStore(id: string, data: Partial<CreateStoreData>) {
  const response = await axios.patch(`${API_BASE_URL}/api/v1/merchants/stores/${id}/`, data, {
    headers: getAuthHeaders()
  })
  return response.data
}

export async function deleteStore(id: string) {
  const response = await axios.delete(`${API_BASE_URL}/api/v1/merchants/stores/${id}/`, {
    headers: getAuthHeaders()
  })
  return response.data
}
