'use client'

import { useSession } from '@/lib/auth/session-provider'
import { Bell, User, Settings } from 'lucide-react'

export function CustomerHeader() {
  const session = useSession()

  if (!session || session.status !== 'authenticated') {
    return null
  }

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - could add logo/branding */}
          <div className="flex items-center">
            {/* Logo/branding removed */}
          </div>

          {/* Right side - notifications */}
        </div>
      </div>
    </header>
  )
}
