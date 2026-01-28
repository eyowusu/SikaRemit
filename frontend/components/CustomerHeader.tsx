'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session-provider'
import { useAuth } from '@/lib/auth/context'
import { Bell, BellDot, User, Settings, LogOut, ChevronDown, History, Check, AlertTriangle, Info, CreditCard, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/lib/notifications/provider'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function getNotificationIcon(type: string, level: string) {
  if (type?.includes('payment') || type?.includes('transaction') || type?.includes('withdrawal')) {
    return <CreditCard className="h-4 w-4 text-green-500" />
  }
  if (type?.includes('security') || level === 'security') {
    return <Shield className="h-4 w-4 text-red-500" />
  }
  if (level === 'warning' || level === 'error') {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }
  return <Info className="h-4 w-4 text-blue-500" />
}

export function CustomerHeader() {
  const session = useSession()
  const { user, logout } = useAuth()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)

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
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  {unreadCount > 0 ? (
                    <BellDot className="h-5 w-5 text-gray-600" />
                  ) : (
                    <Bell className="h-5 w-5 text-gray-600" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-white border shadow-xl" align="end" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
                      <Check className="h-4 w-4 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>
                {/* List */}
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                          onClick={() => markAsRead(notif.id.toString())}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notif.notification_type || '', notif.level)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Footer */}
                <div className="p-2 border-t">
                  <Link href="/customer/notifications" onClick={() => setNotifOpen(false)}>
                    <Button variant="ghost" className="w-full" size="sm">
                      View all notifications
                    </Button>
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

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
