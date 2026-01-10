'use client'

import { Bell, User, LogOut, Settings } from 'lucide-react'
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

interface MerchantHeaderProps {
  onMenuClick?: () => void
  sidebarOpen?: boolean
}

export default function MerchantHeader({ onMenuClick, sidebarOpen = false }: MerchantHeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-purple-500/5 sticky top-0 z-40">
      <div className="px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Sidebar Toggle Button - Works on all screen sizes */}
          <div className="">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="p-2 hover:bg-white/50 rounded-xl transition-all duration-300 hover:scale-105"
            >
              {sidebarOpen ? (
                // Close/Hide icon
                <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Menu/Open icon
                <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </Button>
          </div>

          {/* Title */}
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold text-slate-900">Merchant Dashboard</h1>
          </div>

          {/* Desktop Spacer */}
          <div className="hidden lg:block flex-1"></div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Business Alerts */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2 hover:bg-white/50 rounded-xl transition-all duration-300 hover:scale-105">
                  <Bell className="h-5 w-5 text-slate-600 hover:text-purple-600" />
                  {/* Notification dot */}
                  <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-0 animate-pulse"></div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-white/90 backdrop-blur-xl border-white/30 shadow-2xl shadow-purple-500/10" align="end">
                <div className="text-center text-slate-600">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50 text-purple-600" />
                  <p className="text-sm font-medium">No new business alerts</p>
                  <p className="text-xs mt-1">Transaction notifications will appear here</p>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/50 transition-all duration-300 hover:scale-105">
                  <Avatar className="h-10 w-10 ring-2 ring-purple-500/20 hover:ring-purple-500/40 transition-all duration-300">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-500 text-white font-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'M'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-white/90 backdrop-blur-xl border-white/30 shadow-2xl shadow-purple-500/10" align="end">
                <DropdownMenuLabel className="border-b border-purple-100/50 pb-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-600">{user?.email}</p>
                    <div className="flex items-center mt-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium">
                        <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mr-2"></div>
                        Merchant Account
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-purple-50/50 focus:bg-purple-50/50 transition-colors duration-200">
                  <Settings className="mr-3 h-4 w-4 text-purple-600" />
                  <span className="font-medium">Business Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-purple-50/50 focus:bg-purple-50/50 transition-colors duration-200">
                  <User className="mr-3 h-4 w-4 text-purple-600" />
                  <span className="font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 hover:bg-red-50/50 focus:bg-red-50/50 hover:text-red-700 transition-colors duration-200"
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
