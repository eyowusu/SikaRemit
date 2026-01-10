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
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NAVIGATION_ITEMS } from '@/lib/constants/merchant-ui'

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

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full"
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

        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/merchant/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-revolut">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground">SikaRemit</span>
              <p className="text-xs text-muted-foreground">Merchant Portal</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`revolut-sidebar-link ${isActive ? 'revolut-sidebar-link-active' : ''}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">M</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Your Business</p>
              <p className="text-xs text-muted-foreground truncate">merchant@sikaremit.com</p>
            </div>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/merchant/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
