'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Home, ChevronRight } from 'lucide-react'

type BreadcrumbItemType = {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  isLast?: boolean
}

const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'account': 'Account',
  'payments': 'Payments',
  'send': 'Send Money',
  'receive': 'Receive Money',
  'top-up': 'Top Up Account',
  'bills': 'Pay Bills',
  'cross-border': 'Remittance',
  'methods': 'Payment Methods',
  'settings': 'Settings',
  'kyc': 'KYC Verification',
  'invoices': 'Invoices',
  'faq': 'FAQ',
  'admin': 'Admin',
  'merchant': 'Business'
}

export function BreadcrumbNav() {
  const pathname = usePathname()

  // Don't show breadcrumbs on home page or auth pages
  if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/api')) {
    return null
  }

  const pathSegments = pathname.split('/').filter(Boolean)

  const breadcrumbs: BreadcrumbItemType[] = [
    { href: '/', label: 'Home', icon: Home }
  ]

  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

    breadcrumbs.push({
      href: currentPath,
      label,
      isLast: index === pathSegments.length - 1
    })
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center">
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage className="flex items-center gap-1">
                  {crumb.icon && <crumb.icon className="h-3 w-3" />}
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href} className="flex items-center gap-1 hover:text-primary transition-colors">
                    {crumb.icon && <crumb.icon className="h-3 w-3" />}
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
