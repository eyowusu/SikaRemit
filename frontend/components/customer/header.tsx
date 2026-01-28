'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, BellDot, User, LogOut, Settings, Check, AlertTriangle, Info, CreditCard, Shield, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/lib/auth/context'
import { useNotifications } from '@/lib/notifications/provider'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

function getNotificationIcon(type: string, level: string) {
  if (type?.includes('payment') || type?.includes('transaction') || type?.includes('merchant')) {
    return <CreditCard className="h-4 w-4 text-green-500" />
  }
  if (type?.includes('security') || level === 'security') {
    return <Shield className="h-4 w-4 text-red-500" />
  }
  if (level === 'warning' || level === 'error') {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }
  return <Info className="h-4 w-4 text-purple-500" />
}

interface CustomerHeaderProps {
  // No props needed since sidebar is removed
}

export default function CustomerHeader() {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const router = useRouter()

  return (
    <header className="bg-gradient-to-r from-white via-emerald-50/30 to-white border-b border-emerald-200/50 shadow-sm shadow-emerald-500/5 sticky top-0 z-40 backdrop-blur-sm">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Brand - Always visible */}
          <div className="flex items-center space-x-3">
            <Link href="/customer/dashboard" className="flex items-center space-x-3 hover:opacity-90 transition-all duration-300 group hover:scale-105">
              <div className="relative">
                <Image
                  src="/logos/SikaRemit.jpeg"
                  alt="SikaRemit Logo"
                  width={32}
                  height={32}
                  className="rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-emerald-500/30"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors duration-300">SikaRemit</span>
                <span className="text-xs text-slate-600 group-hover:text-emerald-600 transition-colors duration-300">Customer Portal</span>
              </div>
            </Link>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Business Alerts */}
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-3 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-green-50/50 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 group">
                  {unreadCount > 0 ? (
                    <BellDot className="h-5 w-5 text-slate-600 group-hover:text-emerald-600 transition-colors duration-300" />
                  ) : (
                    <Bell className="h-5 w-5 text-slate-600 group-hover:text-emerald-600 transition-colors duration-300" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-500 text-xs text-white font-medium shadow-lg shadow-emerald-500/30 animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 sm:w-80 p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50 shadow-xl shadow-emerald-500/10 rounded-xl" align="end" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
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
                    <div className="p-6 text-center text-slate-600">
                      <Bell className="h-10 w-10 mx-auto mb-2 text-purple-300" />
                      <p className="text-sm font-medium">No notifications</p>
                      <p className="text-xs mt-1 text-slate-500">Transaction notifications will appear here</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 hover:bg-purple-50/50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-purple-50/30' : ''}`}
                          onClick={() => markAsRead(notif.id.toString())}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notif.notification_type || '', notif.level)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {!notif.is_read && <div className="w-2 h-2 rounded-full bg-purple-500 mt-1"></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Footer */}
                <div className="p-2 border-t">
                  <Link href="/customer/notifications" onClick={() => setNotifOpen(false)}>
                    <Button variant="ghost" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50" size="sm">
                      View all notifications
                    </Button>
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2 px-3 h-12 rounded-2xl hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-green-50/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 group">
                  <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20 hover:ring-emerald-500/40 transition-all duration-300 shadow-lg shadow-emerald-500/10">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-500 text-white font-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {user?.name || 'Customer'}
                    </p>
                    <p className="text-xs text-slate-600 group-hover:text-emerald-600 transition-colors">
                      {user?.email || ''}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 sm:w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50 shadow-xl shadow-emerald-500/10 rounded-xl" align="end">
                <DropdownMenuLabel className="border-b border-emerald-100/50 pb-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-600">{user?.email}</p>
                    <div className="flex items-center mt-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-xs font-medium">
                        <div className="w-2 h-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full mr-2 animate-pulse"></div>
                        Customer Account
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-emerald-100/50" />
                <DropdownMenuItem 
                  className="hover:bg-emerald-50/50 focus:bg-emerald-50/50 transition-colors duration-200 rounded-xl mx-1 my-1 cursor-pointer"
                  onClick={() => router.push('/customer/profile')}
                >
                  <User className="mr-3 h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-emerald-50/50 focus:bg-emerald-50/50 transition-colors duration-200 rounded-xl mx-1 my-1 cursor-pointer"
                  onClick={() => router.push('/customer/settings')}
                >
                  <Settings className="mr-3 h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-emerald-50/50 focus:bg-emerald-50/50 transition-colors duration-200 rounded-xl mx-1 my-1 cursor-pointer"
                  onClick={() => router.push('/customer/notifications')}
                >
                  <Bell className="mr-3 h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-emerald-50/50 focus:bg-emerald-50/50 transition-colors duration-200 rounded-xl mx-1 my-1 cursor-pointer"
                  onClick={() => router.push('/customer/faq')}
                >
                  <HelpCircle className="mr-3 h-4 w-4 text-emerald-600" />
                  <span className="font-medium">FAQ & Help</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-emerald-100/50" />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 hover:bg-red-50/50 focus:bg-red-50/50 hover:text-red-700 transition-colors duration-200 rounded-xl mx-1 my-1"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
