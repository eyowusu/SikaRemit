'use client'

import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { DollarSign } from 'lucide-react'
import CustomerHeader from '@/components/customer/header'
import { useAuth } from '@/lib/auth/context'
import { useSession } from '@/lib/auth/session-provider'

interface CustomerLayoutProps {
  children: ReactNode
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const { user, loading } = useAuth()
  const session = useSession()

  // Show loading state while checking authentication
  if (loading || session.status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-revolut mx-auto animate-pulse">
            <DollarSign className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">SikaRemit Customer</h1>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
          <div className="w-48 mx-auto">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (session.status === 'unauthenticated' || !user) {
    redirect('/auth')
    return null
  }

  // Check if user has customer role
  if (user.role !== 'customer') {
    const roleRedirects = {
      admin: '/admin/overview',
      merchant: '/merchant/dashboard',
      customer: '/customer/dashboard'
    }
    const redirectPath = roleRedirects[user.role as keyof typeof roleRedirects] || '/customer/dashboard'
    redirect(redirectPath)
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />

      <main className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
        <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
