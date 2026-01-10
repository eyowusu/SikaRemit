'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Store } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'
import { ADMIN_NAVIGATION } from '@/lib/constants/admin-ui'

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">
                {user?.name?.slice(0, 1).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@sikaremit.com'}</p>
            </div>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/admin/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
