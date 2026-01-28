'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, LogOut, Settings, Globe } from 'lucide-react'
import Image from 'next/image'
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
import { useAuth } from '@/lib/auth/context'
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell'

interface AdminHeaderProps {
  onMenuClick?: () => void
  sidebarOpen?: boolean
}

export default function AdminHeader({ onMenuClick, sidebarOpen = false }: AdminHeaderProps) {
  const { user } = useAuth()

  return (
    <header className="bg-gradient-to-r from-white via-blue-50/30 to-white border-b border-blue-200/50 shadow-sm shadow-blue-500/5 sticky top-0 z-40 backdrop-blur-sm">
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
            <h1 className="text-lg font-semibold text-slate-900">Admin Portal</h1>
          </div>

          {/* Desktop Brand */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link href="/admin/overview" className="flex items-center space-x-3 hover:opacity-90 transition-all duration-300 group hover:scale-105">
              <div className="relative">
                <Image
                  src="/logos/SikaRemit.jpeg"
                  alt="SikaRemit Logo"
                  width={32}
                  height={32}
                  className="rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/30"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors duration-300">SikaRemit</span>
                <span className="text-xs text-slate-600 group-hover:text-blue-600 transition-colors duration-300">Admin Portal</span>
              </div>
            </Link>
          </div>

          {/* Desktop Spacer */}
          <div className="hidden lg:block flex-1"></div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Admin Notification Bell */}
            <AdminNotificationBell />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 group">
                  <Avatar className="h-12 w-12 ring-2 ring-blue-500/20 hover:ring-blue-500/40 transition-all duration-300 shadow-lg shadow-blue-500/10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 sm:w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 shadow-xl shadow-blue-500/10 rounded-xl" align="end">
                <DropdownMenuLabel className="border-b border-blue-100/50 pb-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-600">{user?.email}</p>
                    <div className="flex items-center mt-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-medium">
                        <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full mr-2 animate-pulse"></div>
                        Admin Account
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-blue-100/50" />
                <DropdownMenuItem className="hover:bg-blue-50/50 focus:bg-blue-50/50 transition-colors duration-200 rounded-xl mx-1 my-1">
                  <Settings className="mr-3 h-4 w-4 text-blue-600" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-blue-50/50 focus:bg-blue-50/50 transition-colors duration-200 rounded-xl mx-1 my-1">
                  <User className="mr-3 h-4 w-4 text-blue-600" />
                  <span className="font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-blue-100/50" />
                <DropdownMenuItem className="text-red-600 hover:bg-red-50/50 focus:bg-red-50/50 hover:text-red-700 transition-colors duration-200 rounded-xl mx-1 my-1">
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
