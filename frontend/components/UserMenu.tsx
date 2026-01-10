'use client'

import { useSession } from '@/lib/auth/session-provider'
import { useAuth } from '@/lib/auth/context'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Settings,
  CreditCard,
  Bell,
  LogOut,
  Shield,
  HelpCircle,
  ChevronDown,
  BarChart3,
  FileText
} from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const session = useSession()
  const { logout } = useAuth()
  const pathname = usePathname()

  if (session.status !== 'authenticated' || !session?.user || pathname === '/' || pathname.startsWith('/auth')) return null

  const user = session.user as any

  const userInitials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email ? user.email[0].toUpperCase() : 'U'

  const userRoleBadge = () => {
    switch (user.role) {
      case 'admin':
        return <Badge variant="destructive" className="text-xs">Admin</Badge>
      case 'merchant':
        return <Badge variant="secondary" className="text-xs">Business</Badge>
      case 'customer':
        return <Badge variant="outline" className="text-xs">Customer</Badge>
      default:
        return null
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-auto px-3 flex items-center gap-2 hover:bg-accent/50 focus:bg-accent/50 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user.image || undefined} alt={user.firstName || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-medium leading-tight truncate">
              {user.firstName || user.email?.split('@')[0]}
            </span>
            {userRoleBadge()}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-64 z-50 bg-white border border-border shadow-xl rounded-lg p-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent" 
        align="start" 
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={user.role === 'customer' ? '/customer/profile' : '/profile'} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Profile</span>
          </Link>
        </DropdownMenuItem>

        {user && user.role === 'customer' && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/customer/settings" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/customer/notifications" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Notifications</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {user && user.role === 'merchant' && (
          <DropdownMenuItem asChild>
            <Link href="/merchant/dashboard" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Business Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}

        {user && user.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Admin Panel</span>
            </Link>
          </DropdownMenuItem>
        )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={user.role === 'customer' ? '/customer/faq' : '/faq'} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Help & FAQ</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive flex items-center gap-3 px-2 py-2 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
