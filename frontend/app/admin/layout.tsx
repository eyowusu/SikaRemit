'use client'

import { redirect } from 'next/navigation'
import { Globe } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { useAuth } from '@/lib/auth/context'
import { useSession } from '@/lib/auth/session-provider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const session = useSession()

  // Show loading state while checking authentication
  if (loading || session.status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative z-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-revolut animate-pulse">
              <Globe className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">SikaRemit Admin</h1>
            <p className="text-muted-foreground">Verifying admin access...</p>
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

  // Check if user has admin role
  if (user.role !== 'admin') {
    const roleRedirects = {
      merchant: '/merchant/dashboard',
      customer: '/customer/dashboard',
      admin: '/admin/overview' // This shouldn't happen but just in case
    }
    const redirectPath = roleRedirects[user.role as keyof typeof roleRedirects] || '/customer/dashboard'
    redirect(redirectPath)
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="pl-64">
        <main className="min-h-screen">
          <div className="revolut-container py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
