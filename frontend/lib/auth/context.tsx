'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import apiClient from '@/lib/api/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Helper function to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

interface User {
  id: string
  email: string
  name: string
  role: string
  firstName?: string
  lastName?: string
  is_verified?: boolean
}

interface UserTypeInfo {
  label: string
  color: string
  bgColor: string
  icon: string
  description: string
}

interface AuthContextType {
  user: User | null
  userTypeInfo: UserTypeInfo | null
  loading: boolean
  login: (email: string, password: string) => Promise<string>  // Return role
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  isAuthenticated: boolean
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  userType?: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userTypeInfo, setUserTypeInfo] = useState<UserTypeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from cookies, localStorage, or sessionStorage
        const token = getCookie('access_token') || localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
        const storedUserData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data')
        const storedUserTypeInfo = localStorage.getItem('user_type_info') || sessionStorage.getItem('user_type_info')

        if (!token || !storedUserData) {
          console.log('🔐 No stored auth data found')
          setUser(null)
          setUserTypeInfo(null)
          setLoading(false)
          return
        }

        console.log('🔐 Found stored auth data, authenticating...')
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`

        try {
          const userData = JSON.parse(storedUserData)
          console.log('✅ Auth successful for:', userData.role)
          setUser(userData)

          if (storedUserTypeInfo) {
            const userTypeData = JSON.parse(storedUserTypeInfo)
            setUserTypeInfo(userTypeData)
          }
        } catch (parseError) {
          console.error('❌ Failed to parse user data:', parseError)
          clearAuthData()
          setUser(null)
          setUserTypeInfo(null)
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error)
        clearAuthData()
        setUser(null)
      } finally {
        // Always set loading to false, no matter what
        setLoading(false)
      }
    }

    const clearAuthData = () => {
      // Clear cookies
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

      // Clear local storage and state
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      sessionStorage.removeItem('user_data')
      delete apiClient.defaults.headers.common['Authorization']
    }

    // Check auth status on initial load
    checkAuth()
    
    // Set up storage event listener to sync auth state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'user_data') {
        console.log('🔄 Storage change detected, rechecking auth...')
        checkAuth()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const login = async (email: string, password: string): Promise<string> => {
    console.log('🔐 Auth Context: login called with email:', email)
    setLoading(true)

    try {
      console.log('🔐 Auth Context: Making API call to login')
      const response = await apiClient.post('/api/v1/accounts/login/', {
        email,
        password
      })

      console.log('🔐 Auth Context: API response received:', response.data)

      const { access, refresh, user, user_type_info } = response.data
      console.log('🔐 Auth Context: Extracted tokens, user, and user_type_info:', { access: !!access, refresh: !!refresh, user, user_type_info })

      // 🔍 DEBUG: Log the raw user data from backend
      console.log('🔍 Auth Context: Raw user data from backend:', user)
      console.log('🔍 Auth Context: User role from backend:', user.role)
      console.log('🔍 Auth Context: User email:', user.email)
      console.log('🔍 Auth Context: User id:', user.id)
      console.log('🔍 Auth Context: User type info:', user_type_info)

      // Use role directly from backend response (already mapped)
      const userObj = {
        id: user.id,
        email: user.email,
        name: user.first_name || user.email, // Required name field
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        is_verified: user.is_verified || false,
        role: user.role // Use role directly from backend
      }

      console.log('🔐 Auth Context: Created user object:', userObj)
      console.log('🔐 Auth Context: Role determined as:', userObj.role)

      // Also store in localStorage/sessionStorage for client-side access
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user_data', JSON.stringify(userObj))
      sessionStorage.setItem('access_token', access)
      sessionStorage.setItem('refresh_token', refresh)
      sessionStorage.setItem('user_data', JSON.stringify(userObj))
      setUser(userObj)

      // Store user type info if available
      if (user_type_info) {
        localStorage.setItem('user_type_info', JSON.stringify(user_type_info))
        sessionStorage.setItem('user_type_info', JSON.stringify(user_type_info))
        setUserTypeInfo(user_type_info)
        console.log('🔐 Auth Context: Stored user type info:', user_type_info)
      }

      console.log('🔐 Auth Context: User state set, returning role:', userObj.role)

      // Set cookies for server-side access (proxy middleware)
      document.cookie = `access_token=${access}; path=/; max-age=86400; samesite=strict`
      document.cookie = `refresh_token=${refresh}; path=/; max-age=86400; samesite=strict`

      console.log('🔐 Auth Context: Cookies set for proxy middleware')
      return userObj.role
    } catch (error: any) {
      console.error('❌ Auth Context: Login failed:', error)
      console.error('❌ Auth Context: Login failed details:', {
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      })
      setLoading(false)

      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        throw new Error('Connection timeout. Please check your network and try again.')
      }

      throw error.response?.data || error
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        await apiClient.post('/api/v1/accounts/logout/', {})
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear cookies
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

      // Clear local storage and state
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user_type_info')
      setUser(null)
      setUserTypeInfo(null)
      // Use window.location for hard redirect to avoid hook issues
      window.location.href = '/auth'
    }
  }

  const register = async (data: RegisterData) => {
    setLoading(true)
    try {
      await apiClient.post('/api/v1/accounts/register/', {
        email: data.email,
        password: data.password,
        password2: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        user_type: data.userType || 3
      })
      setLoading(false)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    userTypeInfo,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
