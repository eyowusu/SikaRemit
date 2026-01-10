'use client'

import * as React from 'react'
import { Bell, BellDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationList } from '@/components/ui/notification-list'
import { useNotifications } from '@/lib/notifications/provider'
import { useAuth } from '@/lib/auth/context'
import { usePathname } from 'next/navigation'

export function NotificationBell() {
  const { isAuthenticated, logout } = useAuth()
  const pathname = usePathname()
  const { unreadCount } = useNotifications()
  
  // Hide notification bell on login/auth pages, homepage, or merchant routes (merchants have their own notification system)
  if (!isAuthenticated || pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/merchant')) {
    return null
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellDot className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 z-[10000] !z-[10000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-2 border-gray-300 dark:border-gray-600 shadow-2xl ring-2 ring-black/10" 
        align="end"
        sideOffset={8}
      >
        <NotificationList />
      </PopoverContent>
    </Popover>
  )
}
