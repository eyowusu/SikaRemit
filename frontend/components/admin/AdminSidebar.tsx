'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Settings, Store, LogOut, User } from 'lucide-react'

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

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
      <aside
        className="fixed top-0 bottom-0 left-0 z-50 w-64 bg-card border-r border-border shadow-lg"
      >
        <div className="flex flex-col h-full">
          {/* Logo header */}
          <div className="p-4 pt-5 border-b border-border">
            <Link href="/admin/overview" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-base font-bold text-foreground">SikaRemit</span>
                <p className="text-xs text-muted-foreground">Admin Portal</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ADMIN_NAVIGATION.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`revolut-sidebar-link ${isActive ? 'revolut-sidebar-link-active' : ''}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-foreground">
                    {user?.name?.slice(0, 1).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@sikaremit.com'}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="flex items-center cursor-pointer">
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
    </aside>
  )
}
