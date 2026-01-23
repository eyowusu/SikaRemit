'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from './context'

export interface Session {
  user: {
    id: string
    email: string
    name: string
    role: string
  } | null
  status: 'authenticated' | 'unauthenticated' | 'loading'
}

const SessionContext = createContext<Session | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  const session: Session = {
    user,
    status: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated'
  }

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    // Return default session if used outside provider
    return {
      user: null,
      status: 'unauthenticated' as const
    }
  }
  return context
}
