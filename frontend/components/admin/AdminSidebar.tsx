'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Settings, Store, LogOut, X } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'
import { ADMIN_NAVIGATION } from '@/lib/constants/admin-ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
      <aside
        className={`fixed left-0 z-[60] w-64 bg-white dark:bg-slate-900 border-r border-border shadow-lg transition-transform duration-300 ease-in-out top-0 bottom-0 lg:top-14 lg:h-[calc(100vh-3.5rem)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl hover:bg-accent transition-colors duration-200 lg:hidden"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {ADMIN_NAVIGATION.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 shadow-lg shadow-blue-500/10 border border-blue-200/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-white/10 hover:to-blue-50/10'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md'
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-blue-100 group-hover:to-indigo-100'
                }`}>
                  <Icon className={`h-5 w-5 transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-slate-600 group-hover:text-blue-600'
                  }`} />
                </div>
                <span className={`font-medium transition-all duration-300 ${
                  isActive ? 'text-blue-700' : 'group-hover:text-foreground'
                }`}>
                  {item.title}
                </span>
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-white">
                  <span className="text-sm font-semibold text-white">
                    {user?.name?.slice(0, 1).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-700 transition-colors">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate group-hover:text-blue-600 transition-colors">
                    {user?.email || 'admin@sikaremit.com'}
                  </p>
                </div>
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-transform group-hover:rotate-180 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-blue-500/10 rounded-xl">
              <DropdownMenuLabel className="border-b border-blue-100/50 pb-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-slate-900">My Account</p>
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-medium">
                      <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full mr-2 animate-pulse"></div>
                      Admin
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-blue-100/50" />
              <DropdownMenuItem className="hover:bg-blue-50/50 focus:bg-blue-50/50 transition-colors duration-200 rounded-xl mx-1 my-1">
                <Settings className="mr-3 h-4 w-4 text-blue-600" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-blue-100/50" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50/50 focus:bg-red-50/50 hover:text-red-700 transition-colors duration-200 rounded-xl mx-1 my-1">
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  )
}
