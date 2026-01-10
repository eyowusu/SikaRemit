'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useSession } from '@/lib/auth'
import { Store } from 'lucide-react'
import MerchantSidebar from '@/components/merchant/sidebar'
import MerchantHeader from '@/components/merchant/header'

interface MerchantLayoutClientProps {
  children: ReactNode
}

export default function MerchantLayoutClient({ children }: MerchantLayoutClientProps) {
  const session = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setSidebarOpen(window.innerWidth >= 1024)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  if (session.status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-revolut mx-auto animate-pulse">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">SikaRemit Merchant</h1>
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

  if (!session.user || session.user.role !== 'merchant') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
            <p className="text-muted-foreground">Redirecting to appropriate page...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-all duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <MerchantSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:pl-64' : ''}`}>
        <MerchantHeader 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen} 
        />

        <main className="min-h-[calc(100vh-4rem)]">
          <div className="revolut-container py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
