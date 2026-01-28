import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  Shield,
  Users,
  Webhook,
} from 'lucide-react'

export const ADMIN_NAVIGATION_ITEMS = [
  {
    title: 'Dashboard',
    href: '/admin/overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Fees',
    href: '/admin/fees',
    icon: DollarSign,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Merchants',
    href: '/admin/merchants',
    icon: Building2,
  },
  {
    title: 'KYC Review',
    href: '/admin/kyc',
    icon: Shield,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: FileText,
  },
  {
    title: 'Verification',
    href: '/admin/verification',
    icon: Shield,
  },
  {
    title: 'Webhooks',
    href: '/admin/webhooks',
    icon: Webhook,
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    title: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: ScrollText,
  },
  {
    title: 'Transactions',
    href: '/admin/transactions',
    icon: CreditCard,
  },
  {
    title: 'Disputes',
    href: '/admin/disputes',
    icon: AlertTriangle,
  },
  {
    title: 'USSD',
    href: '/admin/ussd',
    icon: MessageSquare,
  },
]

export const ADMIN_NAVIGATION = ADMIN_NAVIGATION_ITEMS
