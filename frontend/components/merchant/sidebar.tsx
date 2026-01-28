'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Store,
  LayoutDashboard,
  Receipt,
  FileText,
  Wallet,
  BarChart3,
  Bell,
  Settings,
  Package,
  CreditCard,
  DollarSign,
  BarChart,
  Users,
  PieChart,
  TrendingUp,
  Building2,
  Activity,
  Target,
  Zap,
  LogOut,
  X
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { NAVIGATION_ITEMS } from '@/lib/constants/merchant-ui'
import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Premium Custom Icons
const PremiumDashboardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="7" y="11" width="4" height="2" rx="1" fill="currentColor"/>
    <rect x="13" y="11" width="4" height="2" rx="1" fill="currentColor"/>
    <rect x="7" y="14" width="4" height="2" rx="1" fill="currentColor"/>
    <rect x="13" y="14" width="4" height="2" rx="1" fill="currentColor"/>
  </svg>
)

const PremiumStoreIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H5M19 21H21M5 21H3M9 9H15M9 13H15M9 17H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PremiumAnalyticsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M9 19V13C9 11.8954 8.10457 11 7 11H5C3.89543 11 3 11.8954 3 13V19C3 20.1046 3.89543 21 5 21H7C8.10457 21 9 20.1046 9 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V19C15 20.1046 14.1046 21 13 21H11C9.89543 21 9 20.1046 9 19V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 9C21 7.89543 20.1046 7 19 7H17C15.8954 7 15 7.89543 15 9V19C15 20.1046 15.8954 21 17 21H19C20.1046 21 21 20.1046 21 19V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PremiumTransactionsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PremiumPayoutsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 1V23M17 5H9.5C8.57143 5 7.68131 5.36875 7.02513 6.02513C6.36875 6.68131 6 7.57143 6 8.5C6 9.42857 6.36875 10.3187 7.02513 10.9749C7.68131 11.6312 8.57143 12 9.5 12H14.5C15.4286 12 16.3187 12.3687 16.9749 13.0251C17.6312 13.6813 18 14.5714 18 15.5C18 16.4286 17.6312 17.3187 16.9749 17.9749C16.3187 18.6312 15.4286 19 14.5 19H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PremiumCustomersIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PremiumInvoicesIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const iconMap: Record<string, any> = {
  LayoutDashboard: PremiumDashboardIcon,
  Store: PremiumStoreIcon,
  Receipt: PremiumInvoicesIcon,
  FileText: PremiumInvoicesIcon,
  Wallet: Wallet,
  BarChart3: PremiumAnalyticsIcon,
  Bell: Bell,
  Settings: Settings,
  Package: Package,
  CreditCard: CreditCard,
  DollarSign: DollarSign,
  BarChart: PremiumAnalyticsIcon,
  Users: PremiumCustomersIcon,
  PieChart,
  Activity,
  Target,
  Zap
}

const navigation = NAVIGATION_ITEMS.map(item => ({
  ...item,
  name: item.title,
  icon: iconMap[item.icon] || LayoutDashboard,
  description: '',
  gradient: 'from-blue-500 to-purple-600',
  bgGradient: 'from-blue-500/10 to-purple-600/10'
}))

export default function MerchantSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <aside className={cn(
      "fixed left-0 z-[60] w-64 bg-white dark:bg-slate-900 border-r border-border transition-transform duration-300 ease-in-out",
      "top-0 bottom-0 lg:top-14 lg:h-[calc(100vh-3.5rem)]",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 shadow-lg shadow-purple-500/10 border border-purple-200/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-white/10 hover:to-purple-50/10'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-md'
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-purple-100 group-hover:to-pink-100'
                }`}>
                  <item.icon className={`h-5 w-5 transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-slate-600 group-hover:text-purple-600'
                  }`} />
                </div>
                <span className={`font-medium transition-all duration-300 ${
                  isActive ? 'text-purple-700' : 'group-hover:text-foreground'
                }`}>
                  {item.name}
                </span>
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-300 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25 ring-2 ring-white">
                  <span className="text-sm font-semibold text-white">
                    {user?.name?.slice(0, 1).toUpperCase() || 'M'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-purple-700 transition-colors">
                    {user?.name || 'Merchant'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate group-hover:text-purple-600 transition-colors">
                    {user?.email || 'merchant@sikaremit.com'}
                  </p>
                </div>
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-purple-600 transition-transform group-hover:rotate-180 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-purple-500/10 rounded-xl">
              <DropdownMenuLabel className="border-b border-purple-100/50 pb-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-slate-900">My Account</p>
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium">
                      <div className="w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mr-2 animate-pulse"></div>
                      Merchant
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-purple-100/50" />
              <DropdownMenuItem className="hover:bg-purple-50/50 focus:bg-purple-50/50 transition-colors duration-200 rounded-xl mx-1 my-1">
                <Settings className="mr-3 h-4 w-4 text-purple-600" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-purple-100/50" />
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
