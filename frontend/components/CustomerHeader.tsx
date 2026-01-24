'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session-provider'
import { useAuth } from '@/lib/auth/context'
import { Bell, User, Settings, LogOut, ChevronDown, CreditCard, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function CustomerHeader() {
  const session = useSession()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (!session || session.status !== 'authenticated') {
    return null
  }

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/customer/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SR</span>
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">SikaRemit</span>
            </Link>
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {user?.name?.slice(0, 1).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.name || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/customer/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/customer/payments" className="flex items-center cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment Methods
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/customer/transactions" className="flex items-center cursor-pointer">
                    <History className="mr-2 h-4 w-4" />
                    Transaction History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/customer/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
