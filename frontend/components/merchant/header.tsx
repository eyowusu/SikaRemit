'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, BellDot, User, LogOut, Settings, Check, AlertTriangle, Info, CreditCard, Shield } from 'lucide-react'
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
import { useAuth } from '@/lib/auth'
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

interface MerchantHeaderProps {
  onMenuClick?: () => void
  sidebarOpen?: boolean
}

export default function MerchantHeader({ onMenuClick, sidebarOpen = false }: MerchantHeaderProps) {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-white via-purple-50/30 to-white border-b border-purple-200/50 shadow-sm shadow-purple-500/5 sticky top-0 z-40 backdrop-blur-sm">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Mobile Menu Button - Only visible on mobile */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="p-2 hover:bg-white/50 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>

          {/* Title - Mobile only */}
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold text-slate-900">Merchant Dashboard</h1>
          </div>

          {/* Desktop Brand */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link href="/merchant/dashboard" className="flex items-center space-x-3 hover:opacity-90 transition-all duration-300 group hover:scale-105">
              <div className="relative">
                <Image
                  src="/logos/SikaRemit.jpeg"
                  alt="SikaRemit Logo"
                  width={32}
                  height={32}
                  className="rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-purple-500/30"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors duration-300">SikaRemit</span>
                <span className="text-xs text-slate-600 group-hover:text-purple-600 transition-colors duration-300">Merchant Portal</span>
              </div>
            </Link>
          </div>

          {/* Desktop Spacer */}
          <div className="hidden lg:block flex-1"></div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Business Alerts */}
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-3 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 group">
                  {unreadCount > 0 ? (
                    <BellDot className="h-5 w-5 text-slate-600 group-hover:text-purple-600 transition-colors duration-300" />
                  ) : (
                    <Bell className="h-5 w-5 text-slate-600 group-hover:text-purple-600 transition-colors duration-300" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs text-white font-medium shadow-lg shadow-purple-500/30 animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 sm:w-80 p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 shadow-xl shadow-purple-500/10 rounded-xl" align="end" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold text-slate-900">Business Alerts</h3>
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
                      <p className="text-sm font-medium">No business alerts</p>
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
                  <Link href="/merchant/notifications" onClick={() => setNotifOpen(false)}>
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
                <Button variant="ghost" className="relative h-12 w-12 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 group">
                  <Avatar className="h-12 w-12 ring-2 ring-purple-500/20 hover:ring-purple-500/40 transition-all duration-300 shadow-lg shadow-purple-500/10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-500 text-white font-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'M'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 sm:w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 shadow-xl shadow-purple-500/10 rounded-xl" align="end">
                <DropdownMenuLabel className="border-b border-purple-100/50 pb-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-600">{user?.email}</p>
                    <div className="flex items-center mt-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium">
                        <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mr-2 animate-pulse"></div>
                        Merchant Account
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-purple-100/50" />
                <DropdownMenuItem className="hover:bg-purple-50/50 focus:bg-purple-50/50 transition-colors duration-200 rounded-xl mx-1 my-1">
                  <Settings className="mr-3 h-4 w-4 text-purple-600" />
                  <Link href="/merchant/settings" className="w-full">
                    <span className="font-medium">Business Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-purple-50/50 focus:bg-purple-50/50 transition-colors duration-200 rounded-xl mx-1 my-1">
                  <User className="mr-3 h-4 w-4 text-purple-600" />
                  <Link href="/merchant/settings" className="w-full">
                    <span className="font-medium">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-100/50" />
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
